"use client";

import { useEffect, useMemo, useRef } from "react";
import { AreaSeries, ColorType, createChart, type AreaData, type UTCTimestamp } from "lightweight-charts";
import type { MarketSnapshot } from "@/lib/hyperliquid/types";

type ProbabilityChartProps = {
  snapshots: MarketSnapshot[];
};

function chartDataFromSnapshots(snapshots: MarketSnapshot[]): AreaData<UTCTimestamp>[] {
  const pointsBySecond = new Map<number, number>();

  for (const snapshot of snapshots) {
    if (snapshot.primaryMid == null) continue;
    pointsBySecond.set(
      Math.floor(snapshot.timestamp / 1000),
      Number((snapshot.primaryMid * 100).toFixed(2))
    );
  }

  return [...pointsBySecond.entries()]
    .sort(([leftTime], [rightTime]) => leftTime - rightTime)
    .map(([time, value]) => ({
      time: time as UTCTimestamp,
      value
    }));
}

export function ProbabilityChart({ snapshots }: ProbabilityChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const data = useMemo(() => chartDataFromSnapshots(snapshots), [snapshots]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) return;

    const chart = createChart(container, {
      height: 260,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0b0f15" },
        textColor: "#8f9bad",
        fontFamily: "Inter, -apple-system, system-ui, sans-serif"
      },
      grid: {
        horzLines: { color: "#1c2633" },
        vertLines: { color: "#1c2633" }
      },
      rightPriceScale: {
        borderColor: "#131e28",
        scaleMargins: { top: 0.12, bottom: 0.1 }
      },
      timeScale: {
        borderColor: "#131e28",
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        horzLine: { color: "#3d4a5d" },
        vertLine: { color: "#3d4a5d" }
      }
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#41d98b",
      topColor: "rgba(65, 217, 139, 0.32)",
      bottomColor: "rgba(65, 217, 139, 0.02)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (value: number) => `${value.toFixed(1)}%`
      }
    });

    series.setData(data);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="grid min-h-[188px] content-center gap-1 px-[18px] py-[18px] text-muted-foreground">
        <p className="m-0 text-[13px] font-black text-foreground">No probability history</p>
        <span className="text-xs">Snapshots have not published a primary mid yet.</span>
        <small className="text-xs">Charts by TradingView</small>
      </div>
    );
  }

  return (
    <div className="px-3 pb-2 pt-3">
      <div
        ref={containerRef}
        className="min-h-[260px] overflow-hidden rounded-md border border-border bg-[#0b0f15]"
        aria-label="Primary-side probability history"
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-[#778397]">
        <span>{data.length} snapshots</span>
        <span>Charts by TradingView</span>
      </div>
    </div>
  );
}
