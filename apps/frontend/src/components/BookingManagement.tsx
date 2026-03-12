import React, { useState, useEffect, useCallback } from "react";
import Layout from "./Layout";
import { api } from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "待确认" | "已确认" | "已入住" | "已退房" | "已取消";
type RoomType = "标准间" | "豪华间" | "套房" | "总统套房";

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: BookingStatus;
  totalPrice: number;
  specialRequests: string;
  createdAt: string;
}

interface BookingFormData {
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: BookingStatus;
  specialRequests: string;
}

type FilterStatus = "全部" | BookingStatus;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_PRICES: Record<RoomType, number> = {
  标准间: 280,
  豪华间: 480,
  套房: 680,
  总统套房: 1280,
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  待确认: "bg-yellow-100 text-yellow-700 border-yellow-200",
  已确认: "bg-emerald-100 text-emerald-700 border-emerald-200",
  已入住: "bg-blue-100 text-blue-700 border-blue-200",
  已退房: "bg-slate-100 text-slate-600 border-slate-200",
  已取消: "bg-red-100 text-red-700 border-red-200",
};

const TODAY = new Date().toISOString().split("T")[0];
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split("T")[0];

const DEFAULT_FORM: BookingFormData = {
  guestName: "",
  guestPhone: "",
  roomNumber: "",
  roomType: "标准间",
  checkInDate: TODAY,
  checkOutDate: TOMORROW,
  adults: 1,
  children: 0,
  status: "待确认",
  specialRequests: "",
};

const BOOKING_STATUSES: BookingStatus[] = [
  "待确认",
  "已确认",
  "已入住",
  "已退房",
  "已取消",
];
const FILTER_OPTIONS: FilterStatus[] = [
  "全部",
  "待确认",
  "已确认",
  "已入住",
  "已退房",
  "已取消",
];

// ─── Utility helpers ──────────────────────────────────────────────────────────

const calcNights = (checkIn: string, checkOut: string): number => {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const calcPrice = (form: Pick<BookingFormData, "roomType" | "checkInDate" | "checkOutDate">): number => {
  const nights = calcNights(form.checkInDate, form.checkOutDate);
  return ROOM_PRICES[form.roomType] * nights;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("全部");
  const [formData, setFormData] = useState<BookingFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  // ── Fetch bookings from API ──
  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.getBookings();
      setBookings(res.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      showToast("加载预订失败", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Recalculate total price
  useEffect(() => {
    setTotalPrice(calcPrice({ roomType: formData.roomType, checkInDate: formData.checkInDate, checkOutDate: formData.checkOutDate }));
  }, [formData.roomType, formData.checkInDate, formData.checkOutDate]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof BookingFormData, string>> = {};
    if (!formData.guestName.trim()) errors.guestName = "请输入客人姓名";
    if (formData.guestPhone && !/^1[3-9]\d{9}$/.test(formData.guestPhone)) {
      errors.guestPhone = "手机号格式不正确";
    }
    if (!formData.roomNumber.trim()) errors.roomNumber = "请输入房间号";
    const nights = calcNights(formData.checkInDate, formData.checkOutDate);
    if (nights <= 0) errors.checkOutDate = "退房日期必须晚于入住日期";
    if (formData.adults < 1) errors.adults = "成人数至少为 1";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setEditingBooking(null);
    setShowModal(true);
  };

  const openEdit = (booking: Booking) => {
    setFormData({
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomNumber: booking.roomNumber,
      roomType: booking.roomType,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      adults: booking.adults,
      children: booking.children,
      status: booking.status,
      specialRequests: booking.specialRequests,
    });
    setFormErrors({});
    setEditingBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBooking(null);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const data = {
        ...formData,
        totalPrice,
      };
      if (editingBooking) {
        await api.updateBooking(editingBooking.id, data);
        showToast(`预订 ${editingBooking.id} 已更新`);
      } else {
        await api.createBooking(data);
        showToast("新预订已创建");
      }
      fetchBookings();
      closeModal();
    } catch (error: any) {
      showToast(error.response?.data?.error || "操作失败", "error");
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm(`确认取消预订 ${booking.id}（${booking.guestName}）？`)) return;
    try {
      await api.cancelBooking(booking.id);
      showToast(`预订 ${booking.id} 已取消`);
      fetchBookings();
    } catch (error) {
      showToast("取消失败", "error");
    }
  };

  const exportCSV = useCallback(() => {
    const header = "预订号,客人,手机,房间,类型,入住,退房,成人,儿童,状态,总价";
    const rows = bookings.map(
      (b) => `${b.id},${b.guestName},${b.guestPhone},${b.roomNumber},${b.roomType},${b.checkInDate},${b.checkOutDate},${b.adults},${b.children},${b.status},${b.totalPrice}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `预订记录_${TODAY}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bookings]);

  const filteredBookings = bookings.filter((b) => {
    const matchSearch =
      b.guestName.includes(searchTerm) ||
      b.roomNumber.includes(searchTerm) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "全部" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "待确认").length,
    confirmed: bookings.filter((b) => b.status === "已确认").length,
    checkedIn: bookings.filter((b) => b.status === "已入住").length,
    revenue: bookings.filter((b) => b.status !== "已取消").reduce((s, b) => s + b.totalPrice, 0),
  };

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
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">预订管理</h2>
          <p className="text-sm text-slate-500 mt-1">管理所有客人预订记录</p>
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
            新建预订
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "总预订", value: stats.total, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "待确认", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "已确认", value: stats.confirmed, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "累计收入", value: `¥${stats.revenue.toLocaleString()}`, color: "text-blue-600", bg: "bg-blue-50" },
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
            placeholder="搜索客人姓名、房间号或预订号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50"
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">预订号</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">客人</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">房间</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">入住 / 退房</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">晚数</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">人数</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">状态</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">总价</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">没有找到匹配的预订记录</td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-slate-500">{booking.id.slice(-6)}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-900">{booking.guestName}</p>
                        <p className="text-xs text-slate-400">{booking.guestPhone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">{booking.roomNumber || "—"}</p>
                        <p className="text-xs text-slate-400">{booking.roomType}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">{booking.checkInDate}</p>
                        <p className="text-xs text-slate-400">{booking.checkOutDate}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{nights} 晚</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {booking.adults} 成人{booking.children > 0 && ` / ${booking.children} 儿童`}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-800">¥{booking.totalPrice.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <button onClick={() => openEdit(booking)} className="text-blue-600 hover:text-blue-800 font-medium">编辑</button>
                          {(booking.status === "待确认" || booking.status === "已确认") && (
                            <button onClick={() => handleCancel(booking)} className="text-red-500 hover:text-red-700 font-medium">取消</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-400">
          显示 {filteredBookings.length} / {bookings.length} 条记录
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{editingBooking ? "编辑预订" : "新建预订"}</h3>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">客人姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => setFormData((p) => ({ ...p, guestName: e.target.value }))}
                    placeholder="请输入姓名"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.guestName ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  {formErrors.guestName && <p className="text-xs text-red-500 mt-1">{formErrors.guestName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
                  <input
                    type="tel"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, guestPhone: e.target.value }))}
                    placeholder="1XXXXXXXXXX"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.guestPhone ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  {formErrors.guestPhone && <p className="text-xs text-red-500 mt-1">{formErrors.guestPhone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">房间号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, roomNumber: e.target.value }))}
                    placeholder="如：101"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.roomNumber ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  {formErrors.roomNumber && <p className="text-xs text-red-500 mt-1">{formErrors.roomNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">房间类型</label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData((p) => ({ ...p, roomType: e.target.value as RoomType }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.keys(ROOM_PRICES) as RoomType[]).map((t) => (
                      <option key={t} value={t}>{t} - ¥{ROOM_PRICES[t]}/晚</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">入住日期</label>
                  <input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData((p) => ({ ...p, checkInDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">退房日期</label>
                  <input
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData((p) => ({ ...p, checkOutDate: e.target.value }))}
                    min={formData.checkInDate}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.checkOutDate ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  {formErrors.checkOutDate && <p className="text-xs text-red-500 mt-1">{formErrors.checkOutDate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">成人数 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.adults}
                    onChange={(e) => setFormData((p) => ({ ...p, adults: parseInt(e.target.value) || 1 }))}
                    min={1} max={10}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.adults ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">儿童数</label>
                  <input
                    type="number"
                    value={formData.children}
                    onChange={(e) => setFormData((p) => ({ ...p, children: parseInt(e.target.value) || 0 }))}
                    min={0} max={6}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as BookingStatus }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {BOOKING_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">特殊要求</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData((p) => ({ ...p, specialRequests: e.target.value }))}
                  rows={2}
                  placeholder="如需婴儿床、无烟房等，请在此填写"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {totalPrice > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4 py-3 flex items-center justify-between border border-blue-100">
                  <div>
                    <p className="text-xs text-blue-600">
                      {calcNights(formData.checkInDate, formData.checkOutDate)} 晚 × ¥{ROOM_PRICES[formData.roomType]}
                    </p>
                    <p className="text-blue-500 text-xs mt-0.5">{formData.roomType}</p>
                  </div>
                  <p className="text-xl font-bold text-blue-700">¥{totalPrice.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100">取消</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium">
                {editingBooking ? "保存修改" : "创建预订"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BookingManagement;