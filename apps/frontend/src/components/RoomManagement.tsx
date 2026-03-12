import React, { useState, useEffect, useCallback } from "react";
import Layout from "./Layout";
import { api } from "../api/client";

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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("全部");
  const [formData, setFormData] = useState<RoomFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch rooms from API ──
  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.getRooms();
      setRooms(res.data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      showToast("加载房间失败", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ── Helpers ──
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof RoomFormData, string>> = {};
    if (!formData.number.trim()) errors.number = "请输入房间号";
    else if (!/^\d{3,4}$/.test(formData.number.trim())) errors.number = "房间号应为3-4位数字";
    if (formData.floor < 1 || formData.floor > 30) errors.floor = "楼层应在 1–30 之间";
    if (formData.price < 50) errors.price = "价格不能低于 50 元";
    if (formData.capacity < 1 || formData.capacity > 20) errors.capacity = "容纳人数应在 1–20 之间";

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

  const handleTypeChange = (type: RoomType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      price: ROOM_TYPE_PRICES[type],
      capacity: type === "标准间" || type === "豪华间" ? 2 : type === "套房" ? 4 : 6,
    }));
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingRoom) {
        await api.updateRoom(editingRoom.id, {
          number: formData.number,
          floor: formData.floor,
          status: formData.status,
        });
        showToast(`房间 ${formData.number} 已更新`);
      } else {
        await api.createRoom({
          number: formData.number,
          type: formData.type,
          floor: formData.floor,
          status: formData.status,
          price: formData.price,
          capacity: formData.capacity,
          amenities: ROOM_TYPE_AMENITIES[formData.type],
        });
        showToast(`房间 ${formData.number} 已添加`);
      }
      fetchRooms();
      closeModal();
    } catch (error: any) {
      showToast(error.response?.data?.error || "操作失败", "error");
    }
  };

  const handleDelete = async (room: Room) => {
    if (!window.confirm(`确定要删除房间 ${room.number}？此操作不可撤销。`)) return;
    try {
      await api.deleteRoom(room.id);
      showToast(`房间 ${room.number} 已删除`);
      fetchRooms();
    } catch (error) {
      showToast("删除失败", "error");
    }
  };

  const handleStatusChange = async (room: Room, status: RoomStatus) => {
    try {
      await api.updateRoom(room.id, { status });
      showToast(`房间 ${room.number} 状态已更新为「${status}」`);
      fetchRooms();
    } catch (error) {
      showToast("状态更新失败", "error");
    }
  };

  const exportCSV = useCallback(() => {
    const header = "房间号,类型,楼层,状态,价格,容纳人数";
    const rows = rooms.map(
      (r) => `${r.number},${r.type},${r.floor},${r.status},${r.price},${r.capacity}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
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
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">房间管理</h2>
          <p className="text-sm text-slate-500 mt-1">管理酒店所有房间信息及状态</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出 CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加房间
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: "总房间", value: stats.total, color: "text-slate-700", bg: "bg-slate-50", icon: "🏠" },
          { label: "可用", value: stats.available, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✓" },
          { label: "已入住", value: stats.occupied, color: "text-blue-600", bg: "bg-blue-50", icon: "👤" },
          { label: "已预订", value: stats.reserved, color: "text-amber-600", bg: "bg-amber-50", icon: "📅" },
          { label: "清洁中", value: stats.cleaning, color: "text-violet-600", bg: "bg-violet-50", icon: "🧹" },
          { label: "维修中", value: stats.maintenance, color: "text-red-600", bg: "bg-red-50", icon: "🔧" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-slate-100 shadow-sm`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜索房间号、类型或状态..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterStatus === s
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">房间号</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">楼层</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">设施</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">价格/晚</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">没有找到匹配的房间</td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 text-sm">{room.number}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{room.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{room.floor} 层</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((a) => (
                          <span key={a} className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{a}</span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-xs">+{room.amenities.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">¥{room.price}</td>
                    <td className="px-6 py-4">
                      <select
                        value={room.status}
                        onChange={(e) => handleStatusChange(room, e.target.value as RoomStatus)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[room.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button onClick={() => openEdit(room)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">编辑</button>
                      <button onClick={() => handleDelete(room)} className="text-red-500 hover:text-red-700 font-medium transition-colors">删除</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-400">
          显示 {filteredRooms.length} / {rooms.length} 条记录
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{editingRoom ? "编辑房间" : "添加房间"}</h3>
              <p className="text-blue-100 text-sm">{editingRoom ? "修改房间信息" : "创建新房间"}</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">房间号 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData((p) => ({ ...p, number: e.target.value }))}
                  placeholder="如：101"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.number ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                {formErrors.number && <p className="text-xs text-red-500 mt-1">{formErrors.number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">房间类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as RoomType)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.keys(ROOM_TYPE_PRICES) as RoomType[]).map((t) => (
                    <option key={t} value={t}>{t} - ¥{ROOM_TYPE_PRICES[t]}/晚</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">楼层 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData((p) => ({ ...p, floor: parseInt(e.target.value) || 1 }))}
                    min={1} max={30}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.floor ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  {formErrors.floor && <p className="text-xs text-red-500 mt-1">{formErrors.floor}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">容纳人数 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                    min={1} max={20}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.capacity ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  {formErrors.capacity && <p className="text-xs text-red-500 mt-1">{formErrors.capacity}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as RoomStatus }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">价格（元/晚）<span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                    min={50}
                    className={`w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.price ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                </div>
                {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">取消</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md">
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