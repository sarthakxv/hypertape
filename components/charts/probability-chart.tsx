"use client";

import { useEffect, useMemo, useRef } from "react";
import { AreaSeries, ColorType, createChart, type AreaData, type UTCTimestamp } from "lightweight-charts";
import type { MarketSnapshot } from "@/lib/hyperliquid/types";

type ProbabilityChartProps = {
  snapshots: MarketSnapshot[];
};

export function ProbabilityChart({ snapshots }: ProbabilityChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const data = useMemo<AreaData<UTCTimestamp>[]>(
    () =>
      snapshots
        .filter((snapshot) => snapshot.primaryMid != null)
        .sort((left, right) => left.timestamp - right.timestamp)
        .map((snapshot) => ({
          time: Math.floor(snapshot.timestamp / 1000) as UTCTimestamp,
          value: Number(((snapshot.primaryMid ?? 0) * 100).toFixed(2))
        })),
    [snapshots]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) return;

    const chart = createChart(container, {
      height: 260,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0b0f15" },
        textColor: "#8f9bad",
        fontFamily: "Arial, Helvetica, sans-serif"
      },
      grid: {
        horzLines: { color: "#1c2633" },
        vertLines: { color: "#1c2633" }
      },
      rightPriceScale: {
        borderColor: "#263140",
        scaleMargins: {
          top: 0.12,
          bottom: 0.1
        }
      },
      timeScale: {
        borderColor: "#263140",
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
      <div className="chart-empty">
        <p>No probability history</p>
        <span>Snapshots have not published a primary mid yet.</span>
        <small>Charts by TradingView</small>
      </div>
    );
  }

  return (
    <div className="probability-chart">
      <div ref={containerRef} className="probability-chart-canvas" aria-label="Primary-side probability history" />
      <div className="chart-footer">
        <span>{data.length} snapshots</span>
        <span>Charts by TradingView</span>
      </div>
    </div>
  );
}
