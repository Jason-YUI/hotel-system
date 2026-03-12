import React, { useState, useEffect, useCallback } from "react";
import Layout from "./Layout";
import { api } from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  idCard: string;
  gender: "男" | "女" | "其他";
  address: string;
  memberLevel: "普通" | "银卡" | "金卡" | "钻石";
  totalStays: number;
  totalSpent: number;
  createdAt: string;
  lastStayDate: string;
}

interface GuestFormData {
  name: string;
  phone: string;
  email: string;
  idCard: string;
  gender: "男" | "女" | "其他";
  address: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMBER_COLORS: Record<Guest["memberLevel"], string> = {
  普通: "bg-slate-100 text-slate-600",
  银卡: "bg-gray-200 text-gray-700",
  金卡: "bg-amber-100 text-amber-700",
  钻石: "bg-cyan-100 text-cyan-700",
};

const DEFAULT_FORM: GuestFormData = {
  name: "",
  phone: "",
  email: "",
  idCard: "",
  gender: "男",
  address: "",
};

// ─── Main Component ───────────────────────────────────────────────────────────

const GuestManagement: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [viewGuest, setViewGuest] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<"全部" | Guest["memberLevel"]>("全部");
  const [formData, setFormData] = useState<GuestFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GuestFormData, string>>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch guests from API ──
  const fetchGuests = useCallback(async () => {
    try {
      const res = await api.getGuests();
      setGuests(res.data);
    } catch (error) {
      console.error("Failed to fetch guests:", error);
      showToast("加载客人失败", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof GuestFormData, string>> = {};
    if (!formData.name.trim()) errors.name = "请输入姓名";
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = "手机号格式不正确";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "邮箱格式不正确";
    }
    if (formData.idCard && !/^\d{17}[\dX]$/.test(formData.idCard)) {
      errors.idCard = "身份证格式不正确（18位）";
    }
    const duplicate = guests.find(
      (g) => g.idCard && g.idCard === formData.idCard && g.id !== editingGuest?.id,
    );
    if (duplicate) errors.idCard = "该身份证号已存在";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setEditingGuest(null);
    setShowModal(true);
  };

  const openEdit = (guest: Guest) => {
    setFormData({
      name: guest.name,
      phone: guest.phone,
      email: guest.email,
      idCard: guest.idCard,
      gender: guest.gender,
      address: guest.address,
    });
    setFormErrors({});
    setEditingGuest(guest);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGuest(null);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editingGuest) {
        await api.updateGuest(editingGuest.id, formData);
        showToast(`客人 ${formData.name} 信息已更新`);
      } else {
        await api.createGuest(formData);
        showToast(`客人 ${formData.name} 已添加`);
      }
      fetchGuests();
      closeModal();
    } catch (error: any) {
      showToast(error.response?.data?.error || "操作失败", "error");
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (!window.confirm(`确认删除客人 ${guest.name} 的档案？`)) return;
    try {
      await api.deleteGuest(guest.id);
      showToast(`已删除 ${guest.name}`);
      fetchGuests();
    } catch (error) {
      showToast("删除失败", "error");
    }
  };

  const exportCSV = useCallback(() => {
    const header = "客人号,姓名,手机,邮箱,身份证,性别,地址,会员等级,入住次数,累计消费";
    const rows = guests.map(
      (g) => `${g.id},${g.name},${g.phone},${g.email},${g.idCard},${g.gender},${g.address},${g.memberLevel},${g.totalStays},${g.totalSpent}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `客人档案_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [guests]);

  const filteredGuests = guests.filter((g) => {
    const matchSearch =
      g.name.includes(searchTerm) ||
      g.phone.includes(searchTerm) ||
      (g.idCard && g.idCard.includes(searchTerm)) ||
      g.id.includes(searchTerm);
    const matchLevel = filterLevel === "全部" || g.memberLevel === filterLevel;
    return matchSearch && matchLevel;
  });

  const stats = {
    total: guests.length,
    diamond: guests.filter((g) => g.memberLevel === "钻石").length,
    gold: guests.filter((g) => g.memberLevel === "金卡").length,
    silver: guests.filter((g) => g.memberLevel === "银卡").length,
  };

  const FieldError: React.FC<{ error?: string }> = ({ error }) =>
    error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null;

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
          <h2 className="text-2xl font-bold text-slate-800">客人管理</h2>
          <p className="text-sm text-slate-500 mt-1">管理所有客人档案及会员信息</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            添加客人
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "总客人数", value: stats.total, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "银卡会员", value: stats.silver, color: "text-gray-600", bg: "bg-gray-50" },
          { label: "金卡会员", value: stats.gold, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "钻石会员", value: stats.diamond, color: "text-cyan-600", bg: "bg-cyan-50" },
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
            placeholder="搜索姓名、手机或身份证..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
        <div className="flex gap-2">
          {(["全部", "普通", "银卡", "金卡", "钻石"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setFilterLevel(l)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterLevel === l
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">客人</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">联系方式</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">身份证</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">会员等级</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">入住次数</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">累计消费</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">最近入住</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">没有找到匹配的客人记录</td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-white">{guest.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{guest.name}</p>
                          <p className="text-xs text-slate-400">{guest.gender} · {guest.id.slice(-4)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">{guest.phone}</p>
                      <p className="text-xs text-slate-400">{guest.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 font-mono text-xs">
                      {guest.idCard ? `${guest.idCard.slice(0, 6)}****${guest.idCard.slice(-4)}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${MEMBER_COLORS[guest.memberLevel]}`}>
                        {guest.memberLevel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{guest.totalStays} 次</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">¥{guest.totalSpent.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{guest.lastStayDate}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        <button onClick={() => setViewGuest(guest)} className="text-slate-500 hover:text-slate-700 font-medium">详情</button>
                        <button onClick={() => openEdit(guest)} className="text-blue-600 hover:text-blue-800 font-medium">编辑</button>
                        <button onClick={() => handleDelete(guest)} className="text-red-500 hover:text-red-700 font-medium">删除</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-400">
          显示 {filteredGuests.length} / {guests.length} 条记录
        </div>
      </div>

      {viewGuest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">客人详情</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{viewGuest.name[0]}</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{viewGuest.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${MEMBER_COLORS[viewGuest.memberLevel]}`}>
                    {viewGuest.memberLevel}
                  </span>
                </div>
              </div>
              {[
                { label: "客人编号", value: viewGuest.id },
                { label: "性别", value: viewGuest.gender },
                { label: "手机号", value: viewGuest.phone },
                { label: "邮箱", value: viewGuest.email || "—" },
                { label: "身份证", value: viewGuest.idCard || "—" },
                { label: "地址", value: viewGuest.address || "—" },
                { label: "注册时间", value: viewGuest.createdAt },
                { label: "入住次数", value: `${viewGuest.totalStays} 次` },
                { label: "累计消费", value: `¥${viewGuest.totalSpent.toLocaleString()}` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className="text-slate-800 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-slate-50">
              <button onClick={() => { setViewGuest(null); openEdit(viewGuest); }} className="flex-1 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700">
                编辑信息
              </button>
              <button onClick={() => setViewGuest(null)} className="flex-1 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{editingGuest ? "编辑客人信息" : "添加客人"}</h3>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="请输入姓名"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.name ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  <FieldError error={formErrors.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value as "男" | "女" | "其他" }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option>男</option>
                    <option>女</option>
                    <option>其他</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="1XXXXXXXXXX"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.phone ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                <FieldError error={formErrors.phone} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="example@email.com"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${formErrors.email ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                <FieldError error={formErrors.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">身份证号</label>
                <input
                  type="text"
                  value={formData.idCard}
                  onChange={(e) => setFormData((p) => ({ ...p, idCard: e.target.value }))}
                  placeholder="18 位身份证号"
                  maxLength={18}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 ${formErrors.idCard ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                <FieldError error={formErrors.idCard} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="详细地址"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100">取消</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium">
                {editingGuest ? "保存修改" : "添加客人"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GuestManagement;