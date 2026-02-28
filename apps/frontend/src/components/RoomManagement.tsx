import React, { useState, useCallback } from "react";
import Layout from "./Layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoomStatus = "可用" | "已入住" | "已预订" | "清洁中" | "维修中";
type RoomType = "标准间" | "豪华间" | "套房" | "总统套房";

interface Room {
  id: string;
  number: string;
  type: RoomType;
  floor: number;
  status: RoomStatus;
  price: number;
  capacity: number;
  amenities: string[];
}

interface RoomFormData {
  number: string;
  type: RoomType;
  floor: number;
  status: RoomStatus;
  price: number;
  capacity: number;
}

type FilterStatus = "全部" | RoomStatus;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPE_PRICES: Record<RoomType, number> = {
  标准间: 280,
  豪华间: 480,
  套房: 680,
  总统套房: 1280,
};

const ROOM_TYPE_AMENITIES: Record<RoomType, string[]> = {
  标准间: ["WiFi", "空调", "电视"],
  豪华间: ["WiFi", "空调", "电视", "浴缸"],
  套房: ["WiFi", "空调", "电视", "浴缸", "客厅", "迷你吧"],
  总统套房: ["WiFi", "空调", "电视", "浴缸", "客厅", "迷你吧", "私人管家"],
};

const STATUS_COLORS: Record<RoomStatus, string> = {
  可用: "bg-green-100 text-green-800 border-green-200",
  已入住: "bg-blue-100 text-blue-800 border-blue-200",
  已预订: "bg-yellow-100 text-yellow-800 border-yellow-200",
  清洁中: "bg-purple-100 text-purple-800 border-purple-200",
  维修中: "bg-red-100 text-red-800 border-red-200",
};

const INITIAL_ROOMS: Room[] = [
  {
    id: "1",
    number: "101",
    type: "标准间",
    floor: 1,
    status: "可用",
    price: 280,
    capacity: 2,
    amenities: ["WiFi", "空调", "电视"],
  },
  {
    id: "2",
    number: "102",
    type: "标准间",
    floor: 1,
    status: "已入住",
    price: 280,
    capacity: 2,
    amenities: ["WiFi", "空调", "电视"],
  },
  {
    id: "3",
    number: "201",
    type: "豪华间",
    floor: 2,
    status: "清洁中",
    price: 480,
    capacity: 2,
    amenities: ["WiFi", "空调", "电视", "浴缸"],
  },
  {
    id: "4",
    number: "202",
    type: "豪华间",
    floor: 2,
    status: "可用",
    price: 480,
    capacity: 2,
    amenities: ["WiFi", "空调", "电视", "浴缸"],
  },
  {
    id: "5",
    number: "301",
    type: "套房",
    floor: 3,
    status: "维修中",
    price: 680,
    capacity: 4,
    amenities: ["WiFi", "空调", "电视", "浴缸", "客厅", "迷你吧"],
  },
  {
    id: "6",
    number: "302",
    type: "套房",
    floor: 3,
    status: "已预订",
    price: 680,
    capacity: 4,
    amenities: ["WiFi", "空调", "电视", "浴缸", "客厅", "迷你吧"],
  },
  {
    id: "7",
    number: "401",
    type: "总统套房",
    floor: 4,
    status: "可用",
    price: 1280,
    capacity: 6,
    amenities: ["WiFi", "空调", "电视", "浴缸", "客厅", "迷你吧", "私人管家"],
  },
];

const STATUS_OPTIONS: RoomStatus[] = [
  "可用",
  "已入住",
  "已预订",
  "清洁中",
  "维修中",
];
const FILTER_OPTIONS: FilterStatus[] = [
  "全部",
  "可用",
  "已入住",
  "已预订",
  "清洁中",
  "维修中",
];

const DEFAULT_FORM: RoomFormData = {
  number: "",
  type: "标准间",
  floor: 1,
  status: "可用",
  price: 280,
  capacity: 2,
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("全部");
  const [formData, setFormData] = useState<RoomFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof RoomFormData, string>>
  >({});
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // ── Helpers ──

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof RoomFormData, string>> = {};
    if (!formData.number.trim()) errors.number = "请输入房间号";
    else if (!/^\d{3,4}$/.test(formData.number.trim()))
      errors.number = "房间号应为3-4位数字";
    if (formData.floor < 1 || formData.floor > 30)
      errors.floor = "楼层应在 1–30 之间";
    if (formData.price < 50) errors.price = "价格不能低于 50 元";
    if (formData.capacity < 1 || formData.capacity > 20)
      errors.capacity = "容纳人数应在 1–20 之间";

    // Duplicate number check (excluding self when editing)
    const duplicate = rooms.find(
      (r) => r.number === formData.number.trim() && r.id !== editingRoom?.id,
    );
    if (duplicate) errors.number = `房间号 ${formData.number} 已存在`;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setEditingRoom(null);
    setShowModal(true);
  };

  const openEdit = (room: Room) => {
    setFormData({
      number: room.number,
      type: room.type,
      floor: room.floor,
      status: room.status,
      price: room.price,
      capacity: room.capacity,
    });
    setFormErrors({});
    setEditingRoom(room);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormErrors({});
  };

  // Auto-fill price when type changes
  const handleTypeChange = (type: RoomType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      price: ROOM_TYPE_PRICES[type],
      amenities: ROOM_TYPE_AMENITIES[type],
    }));
  };

  const handleSave = () => {
    if (!validate()) return;

    if (editingRoom) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === editingRoom.id
            ? {
                ...r,
                ...formData,
                amenities: ROOM_TYPE_AMENITIES[formData.type],
              }
            : r,
        ),
      );
      showToast(`房间 ${formData.number} 已更新`);
    } else {
      const newRoom: Room = {
        id: Date.now().toString(),
        amenities: ROOM_TYPE_AMENITIES[formData.type],
        ...formData,
      };
      setRooms((prev) => [...prev, newRoom]);
      showToast(`房间 ${formData.number} 已添加`);
    }
    closeModal();
  };

  const handleDelete = (room: Room) => {
    if (!window.confirm(`确定要删除房间 ${room.number}？此操作不可撤销。`))
      return;
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    showToast(`房间 ${room.number} 已删除`);
  };

  const handleStatusChange = (room: Room, status: RoomStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, status } : r)),
    );
    showToast(`房间 ${room.number} 状态已更新为「${status}」`);
  };

  const exportCSV = useCallback(() => {
    const header = "房间号,类型,楼层,状态,价格,容纳人数";
    const rows = rooms.map(
      (r) =>
        `${r.number},${r.type},${r.floor},${r.status},${r.price},${r.capacity}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `房间列表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rooms]);

  // ── Derived data ──

  const filteredRooms = rooms.filter((room) => {
    const matchSearch =
      room.number.includes(searchTerm) ||
      room.type.includes(searchTerm) ||
      room.status.includes(searchTerm);
    const matchStatus = filterStatus === "全部" || room.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "可用").length,
    occupied: rooms.filter((r) => r.status === "已入住").length,
    reserved: rooms.filter((r) => r.status === "已预订").length,
    cleaning: rooms.filter((r) => r.status === "清洁中").length,
    maintenance: rooms.filter((r) => r.status === "维修中").length,
  };

  // ── Render ──

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">房间管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            管理酒店所有房间信息及状态
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            导出 CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            添加房间
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          {
            label: "总房间",
            value: stats.total,
            color: "text-gray-700",
            bg: "bg-gray-50",
          },
          {
            label: "可用",
            value: stats.available,
            color: "text-green-700",
            bg: "bg-green-50",
          },
          {
            label: "已入住",
            value: stats.occupied,
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            label: "已预订",
            value: stats.reserved,
            color: "text-yellow-700",
            bg: "bg-yellow-50",
          },
          {
            label: "清洁中",
            value: stats.cleaning,
            color: "text-purple-700",
            bg: "bg-purple-50",
          },
          {
            label: "维修中",
            value: stats.maintenance,
            color: "text-red-700",
            bg: "bg-red-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-xl p-4 text-center border border-gray-100`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="搜索房间号、类型或状态..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Room table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  房间号
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  楼层
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  设施
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  价格/晚
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400 text-sm"
                  >
                    没有找到匹配的房间
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 text-sm">
                      {room.number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {room.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {room.floor} 层
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((a) => (
                          <span
                            key={a}
                            className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {a}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                            +{room.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ¥{room.price}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={room.status}
                        onChange={(e) =>
                          handleStatusChange(room, e.target.value as RoomStatus)
                        }
                        className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${STATUS_COLORS[room.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button
                        onClick={() => openEdit(room)}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(room)}
                        className="text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-400">
          显示 {filteredRooms.length} / {rooms.length} 条记录
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingRoom ? "编辑房间" : "添加房间"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  房间号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, number: e.target.value }))
                  }
                  placeholder="如：101"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.number
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.number && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.number}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  房间类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as RoomType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.keys(ROOM_TYPE_PRICES) as RoomType[]).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor + Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    楼层 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setFormData((p) => ({ ...p, floor: isNaN(v) ? 1 : v }));
                    }}
                    min={1}
                    max={30}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                      formErrors.floor
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.floor && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.floor}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    容纳人数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setFormData((p) => ({
                        ...p,
                        capacity: isNaN(v) ? 1 : v,
                      }));
                    }}
                    min={1}
                    max={20}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                      formErrors.capacity
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.capacity && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.capacity}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      status: e.target.value as RoomStatus,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格（元/晚）<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ¥
                  </span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setFormData((p) => ({ ...p, price: isNaN(v) ? 0 : v }));
                    }}
                    min={50}
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                      formErrors.price
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {formErrors.price && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.price}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingRoom ? "保存修改" : "添加房间"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RoomManagement;
