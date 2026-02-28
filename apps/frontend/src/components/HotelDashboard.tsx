import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Layout from "./Layout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  todayBookings: number;
  todayRevenue: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

interface RecentActivity {
  id: string;
  type: "checkin" | "checkout" | "booking" | "cancel";
  guestName: string;
  roomNumber: string;
  time: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  totalRooms: 120,
  occupiedRooms: 98,
  availableRooms: 15,
  cleaningRooms: 4,
  maintenanceRooms: 3,
  todayCheckIns: 12,
  todayCheckOuts: 8,
  todayBookings: 15,
  todayRevenue: 45280,
  monthlyRevenue: 1358400,
  occupancyRate: 82,
};

const MOCK_ACTIVITIES: RecentActivity[] = [
  {
    id: "1",
    type: "checkin",
    guestName: "张三",
    roomNumber: "302",
    time: "10:30",
  },
  {
    id: "2",
    type: "booking",
    guestName: "李四",
    roomNumber: "205",
    time: "11:15",
  },
  {
    id: "3",
    type: "checkout",
    guestName: "王五",
    roomNumber: "108",
    time: "11:40",
  },
  {
    id: "4",
    type: "checkin",
    guestName: "赵六",
    roomNumber: "401",
    time: "12:00",
  },
  {
    id: "5",
    type: "cancel",
    guestName: "陈七",
    roomNumber: "210",
    time: "12:30",
  },
];

const ACTIVITY_CONFIG: Record<
  RecentActivity["type"],
  { label: string; dotColor: string }
> = {
  checkin: { label: "入住", dotColor: "bg-green-500" },
  checkout: { label: "退房", dotColor: "bg-blue-500" },
  booking: { label: "新预订", dotColor: "bg-indigo-500" },
  cancel: { label: "取消", dotColor: "bg-red-500" },
};

// ─── StatCard sub-component ───────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  color,
  bgColor,
  icon,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div
        className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const HotelDashboard: React.FC = () => {
  const [stats] = useState<DashboardStats>(MOCK_STATS);
  const [activities] = useState<RecentActivity[]>(MOCK_ACTIVITIES);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  const checkBackend = useCallback(async () => {
    try {
      await api.health();
      setBackendStatus("online");
    } catch {
      setBackendStatus("offline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const roomStatusItems = [
    {
      label: "可用",
      value: stats.availableRooms,
      color: "text-green-600",
      bar: "bg-green-500",
    },
    {
      label: "已入住",
      value: stats.occupiedRooms,
      color: "text-blue-600",
      bar: "bg-blue-500",
    },
    {
      label: "清洁中",
      value: stats.cleaningRooms,
      color: "text-yellow-600",
      bar: "bg-yellow-500",
    },
    {
      label: "维修中",
      value: stats.maintenanceRooms,
      color: "text-red-600",
      bar: "bg-red-500",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500 text-sm">正在加载数据...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Backend offline banner */}
      {backendStatus === "offline" && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-amber-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-sm text-amber-700">
            后端服务离线，当前显示演示数据。请运行{" "}
            <code className="font-mono bg-amber-100 px-1 rounded">
              npm run dev
            </code>{" "}
            启动后端服务。
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="总房间数"
          value={stats.totalRooms}
          sub={`入住率 ${stats.occupancyRate}%`}
          color="text-gray-800"
          bgColor="bg-blue-100"
          icon={
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />
        <StatCard
          label="今日预订"
          value={stats.todayBookings}
          sub={`入住 ${stats.todayCheckIns} · 退房 ${stats.todayCheckOuts}`}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
          icon={
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <StatCard
          label="今日收入"
          value={`¥${stats.todayRevenue.toLocaleString()}`}
          sub="较昨日 +12%"
          color="text-green-600"
          bgColor="bg-green-100"
          icon={
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="本月收入"
          value={`¥${(stats.monthlyRevenue / 10000).toFixed(1)}万`}
          sub="目标完成 91%"
          color="text-purple-600"
          bgColor="bg-purple-100"
          icon={
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Room status chart + quick actions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              房间状态总览
            </h2>
            <span className="text-sm text-gray-400">
              共 {stats.totalRooms} 间
            </span>
          </div>
          <div className="space-y-4">
            {roomStatusItems.map((item) => {
              const pct = Math.round((item.value / stats.totalRooms) * 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className={`text-sm font-semibold ${item.color}`}>
                      {item.value} 间（{pct}%）
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`${item.bar} h-2.5 rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 gap-3">
            <Link
              to="/rooms"
              className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <svg
                className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="text-xs text-blue-700 font-medium mt-1">
                房间管理
              </span>
            </Link>
            <Link
              to="/bookings"
              className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <svg
                className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs text-green-700 font-medium mt-1">
                预订管理
              </span>
            </Link>
            <Link
              to="/guests"
              className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
            >
              <svg
                className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="text-xs text-indigo-700 font-medium mt-1">
                客人管理
              </span>
            </Link>
          </div>
        </div>

        {/* Recent activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">近期动态</h2>
          <div className="space-y-4">
            {activities.map((activity) => {
              const cfg = ACTIVITY_CONFIG[activity.type];
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`w-2.5 h-2.5 ${cfg.dotColor} rounded-full mt-1.5 flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{activity.guestName}</span>
                      <span className="text-gray-400 mx-1">·</span>
                      {cfg.label} {activity.roomNumber} 号房
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">系统状态</h2>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              backendStatus === "online"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {backendStatus === "online" ? "全部正常" : "后端离线"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "后端 API",
              ok: backendStatus === "online",
              sub: "localhost:3001",
            },
            {
              label: "数据库",
              ok: backendStatus === "online",
              sub: "PostgreSQL",
            },
            { label: "前端服务", ok: true, sub: "localhost:3000" },
            { label: "缓存服务", ok: true, sub: "Redis（演示）" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border p-4 ${item.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${item.ok ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 pl-4">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default HotelDashboard;
