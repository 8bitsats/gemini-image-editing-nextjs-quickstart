"use client";

import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OHLCV } from "@/lib/birdeye/client";

interface TokenChartProps {
  data: OHLCV[];
}

export function TokenChart({ data }: TokenChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      time: new Date(item.unixTime * 1000).toLocaleTimeString(),
      price: item.c, // Close price
      volume: item.v,
      high: item.h,
      low: item.l,
      open: item.o,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        No chart data available
      </div>
    );
  }

  const formatPrice = (value: number) => {
    if (value < 0.01) {
      return value.toExponential(2);
    }
    return value.toFixed(value < 1 ? 4 : 2);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-3">
          <p className="text-green-200 text-sm mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center gap-4">
              <span className="text-white">Price:</span>
              <span className="text-green-400 font-mono">${formatPrice(data.price)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-white">High:</span>
              <span className="text-green-300 font-mono">${formatPrice(data.high)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-white">Low:</span>
              <span className="text-red-300 font-mono">${formatPrice(data.low)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-white">Volume:</span>
              <span className="text-blue-300 font-mono">{data.volume.toFixed(0)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate price change color
  const firstPrice = chartData[0]?.price || 0;
  const lastPrice = chartData[chartData.length - 1]?.price || 0;
  const isPositive = lastPrice >= firstPrice;
  const strokeColor = isPositive ? "#10b981" : "#ef4444"; // green-500 or red-500

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#a3e635", fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#a3e635", fontSize: 12 }}
          tickFormatter={(value) => `$${formatPrice(value)}`}
          domain={["dataMin * 0.995", "dataMax * 1.005"]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={strokeColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: strokeColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}