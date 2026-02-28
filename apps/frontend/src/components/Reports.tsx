import React, { useState } from "react";
import Layout from "./Layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d" | "365d";

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
  occupancyRate: number;
}

interface RoomTypeData {
  type: string;
  revenue: number;
  bookings: number;
  pct: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MONTHLY_DATA: MonthlyData[] = [
  { month: "9月", revenue: 1082000, bookings: 328, occupancyRate: 75 },
  { month: "10月", revenue: 1345000, bookings: 412, occupancyRate: 86 },
  { month: "11月", revenue: 1156000, bookings: 354, occupancyRate: 79 },
  { month: "12月", revenue: 1489000, bookings: 468, occupancyRate: 91 },
  { month: "1月", revenue: 1298000, bookings: 396, occupancyRate: 84 },
  { month: "2月", revenue: 1358000, bookings: 422, occupancyRate: 82 },
];

const ROOM_TYPE_DATA: RoomTypeData[] = [
  { type: "标准间", revenue: 384000, bookings: 186, pct: 44 },
  { type: "豪华间", revenue: 512000, bookings: 136, pct: 32 },
  { type: "套房", revenue: 326400, bookings: 62, pct: 18 },
  { type: "总统套房", revenue: 135600, bookings: 15, pct: 6 },
];

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "7d": "最近 7 天",
  "30d": "最近 30 天",
  "90d": "最近 90 天",
  "365d": "全年",
};

// ─── Sub components ───────────────────────────────────────────────────────────

interface BarProps {
  value: number;
  max: number;
  color: string;
  label: string;
}

const Bar: React.FC<BarProps> = ({ value, max, color, label }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-8 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className={`${color} h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
          style={{ width: `${pct}%` }}
        >
          {pct >= 20 && (
            <span className="text-white text-xs font-medium">{pct}%</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // Simple range-based multipliers for mock data
  const multiplier: Record<DateRange, number> = {
    "7d": 0.25,
    "30d": 1,
    "90d": 3,
    "365d": 12,
  };
  const m = multiplier[dateRange];

  const summary = {
    totalRevenue: Math.round(1358400 * m),
    totalBookings: Math.round(422 * m),
    avgOccupancy: 82,
    avgDailyRate: 388,
    cancelRate: 4.2,
    repeatGuestPct: 38,
  };

  const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">报表统计</h2>
          <p className="text-sm text-gray-500 mt-1">酒店经营数据概览</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === r
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {DATE_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: "总收入",
            value: `¥${(summary.totalRevenue / 10000).toFixed(1)}万`,
            color: "text-blue-600",
          },
          {
            label: "总预订数",
            value: summary.totalBookings,
            color: "text-indigo-600",
          },
          {
            label: "平均入住率",
            value: `${summary.avgOccupancy}%`,
            color: "text-green-600",
          },
          {
            label: "平均房价",
            value: `¥${summary.avgDailyRate}`,
            color: "text-purple-600",
          },
          {
            label: "取消率",
            value: `${summary.cancelRate}%`,
            color: "text-red-500",
          },
          {
            label: "回头客率",
            value: `${summary.repeatGuestPct}%`,
            color: "text-orange-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly revenue bar chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            近半年月收入
          </h3>
          <p className="text-xs text-gray-400 mb-5">单位：元</p>
          <div className="space-y-3">
            {MONTHLY_DATA.map((d) => (
              <Bar
                key={d.month}
                label={d.month}
                value={d.revenue}
                max={maxRevenue}
                color="bg-blue-500"
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <span>
              最低：¥
              {(
                Math.min(...MONTHLY_DATA.map((d) => d.revenue)) / 10000
              ).toFixed(1)}
              万
            </span>
            <span>最高：¥{(maxRevenue / 10000).toFixed(1)}万</span>
          </div>
        </div>

        {/* Monthly occupancy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            近半年入住率
          </h3>
          <p className="text-xs text-gray-400 mb-5">目标线：85%</p>
          <div className="space-y-3">
            {MONTHLY_DATA.map((d) => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8 text-right">
                  {d.month}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
                  <div
                    className={`h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700 ${
                      d.occupancyRate >= 85 ? "bg-green-500" : "bg-yellow-400"
                    }`}
                    style={{ width: `${d.occupancyRate}%` }}
                  >
                    {d.occupancyRate >= 20 && (
                      <span className="text-white text-xs font-medium">
                        {d.occupancyRate}%
                      </span>
                    )}
                  </div>
                  {/* Target line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-60"
                    style={{ left: "85%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />{" "}
              达标（≥85%）
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-400 rounded-full inline-block" />{" "}
              未达标
            </span>
            <span className="flex items-center gap-1">
              <span className="w-0.5 h-3 bg-red-400 inline-block" /> 目标线
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room type breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-5">
            房型收入占比
          </h3>
          <div className="space-y-4">
            {ROOM_TYPE_DATA.map((item) => (
              <div key={item.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{item.type}</span>
                  <span className="text-gray-500">
                    ¥{(item.revenue / 10000).toFixed(1)}万 · {item.bookings}{" "}
                    间夜
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5 text-right">
                  {item.pct}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly detail table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-5">
            月度明细
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500">
                    月份
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500">
                    收入
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500">
                    预订
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500">
                    入住率
                  </th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_DATA.map((d, i) => (
                  <tr
                    key={d.month}
                    className={`border-b border-gray-50 ${i === MONTHLY_DATA.length - 1 ? "font-semibold bg-blue-50" : ""}`}
                  >
                    <td className="py-2.5 text-gray-700">{d.month}</td>
                    <td className="py-2.5 text-right text-gray-800">
                      ¥{(d.revenue / 10000).toFixed(1)}万
                    </td>
                    <td className="py-2.5 text-right text-gray-600">
                      {d.bookings}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`font-medium ${d.occupancyRate >= 85 ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {d.occupancyRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
