import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLiveData } from "@/lib/hooks/use-live-data";

type Payload = { value: number };

const interval = 3000;

function mockFetchOk(payload: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(payload)
  });
}

describe("useLiveData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("returns the seeded initial data before any fetch happens", () => {
    const fetchMock = mockFetchOk({ value: 99 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLiveData<Payload>("/api/x", { value: 1 }, interval));

    expect(result.current).toEqual({ value: 1 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("polls the url with no-store and updates with the fetched data", async () => {
    const fetchMock = mockFetchOk({ value: 42 });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLiveData<Payload>("/api/x", { value: 1 }, interval));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/x", { cache: "no-store" });
    expect(result.current).toEqual({ value: 42 });
  });

  test("retains the last good data when a fetch rejects", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ value: 7 }) })
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLiveData<Payload>("/api/x", { value: 1 }, interval));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval);
    });
    expect(result.current).toEqual({ value: 7 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval);
    });
    // Rejected fetch must not clear the last good data.
    expect(result.current).toEqual({ value: 7 });
  });

  test("retains the last good data when a payload fails the isValid predicate", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ value: 7 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ value: -1 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ value: 9 }) });
    vi.stubGlobal("fetch", fetchMock);

    const isValid = (payload: Payload) => payload.value >= 0;
    const { result } = renderHook(() =>
      useLiveData<Payload>("/api/x", { value: 1 }, interval, isValid)
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval);
    });
    expect(result.current).toEqual({ value: 7 });

    // Invalid payload must not replace the current data.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval);
    });
    expect(result.current).toEqual({ value: 7 });

    // A subsequent valid payload does update.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval);
    });
    expect(result.current).toEqual({ value: 9 });
  });

  test("stops polling after unmount", async () => {
    const fetchMock = mockFetchOk({ value: 42 });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useLiveData<Payload>("/api/x", { value: 1 }, interval));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval);
    });
    const callsBeforeUnmount = fetchMock.mock.calls.length;
    expect(callsBeforeUnmount).toBeGreaterThan(0);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval * 3);
    });

    expect(fetchMock.mock.calls.length).toBe(callsBeforeUnmount);
  });
});
