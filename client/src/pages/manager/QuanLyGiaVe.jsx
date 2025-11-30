import React, { useEffect, useState } from "react";
import axios from "axios";
import { DollarSign, Save, Loader2, Ticket, Star, CalendarDays } from "lucide-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const QuanLyGiaVe = ({ cinemaId }) => {
  const [prices, setPrices] = useState([
    { seat_type: "Standard", base_price: "", weekend_price: "", special_price: "" },
    { seat_type: "VIP",       base_price: "", weekend_price: "", special_price: "" },
    { seat_type: "Couple",    base_price: "", weekend_price: "", special_price: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load dữ liệu
  useEffect(() => {
    if (!cinemaId) return;
    setLoading(true);
    axios.get(`/api/ticketprice/${cinemaId}`)
      .then(res => {
        const fetched = res.data.ticket_price || [];
        setPrices(prev => prev.map(p => {
          const found = fetched.find(f => f.seat_type === p.seat_type);
          return found ? { ...p, ...found } : p;
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cinemaId]);

  const handleChange = (type, field, value) => {
    setPrices(prev => prev.map(p => p.seat_type === type ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    const invalid = prices.some(p => !p.base_price || !p.weekend_price || !p.special_price);
    if (invalid) return alert("Vui lòng nhập đầy đủ giá vé!");

    setSaving(true);
    axios.put(`/api/ticketprice/updateprice/${cinemaId}`, { cinema_id: cinemaId, prices })
      .then(() => alert("Lưu giá vé thành công!"))
      .catch(() => alert("Lỗi khi lưu!"))
      .finally(() => setSaving(false));
  };

  const format = (v) => v ? Number(v).toLocaleString("vi-VN") : "";

  const types = {
    Standard: { label: "Ghế Thường",   icon: Ticket,      color: "border-gray-500",   bg: "bg-gray-800/70" },
    VIP:      { label: "Ghế VIP",      icon: Star,        color: "border-purple-500", bg: "bg-purple-900/50" },
    Couple:   { label: "Ghế Đôi",      icon: CalendarDays,color: "border-cyan-500",   bg: "bg-cyan-900/50" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-purple-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Quản Lý Giá Vé
          </h1>
          <p className="text-gray-400 mt-2">Cập nhật giá vé cho từng loại ghế</p>
        </div>

        {/* Cards */}
        <div className="space-y-8">
          {prices.map(p => {
            const cfg = types[p.seat_type];
            const Icon = cfg.icon;

            return (
              <div
                key={p.seat_type}
                className={`rounded-2xl border-2 ${cfg.color} ${cfg.bg} backdrop-blur-sm p-6 shadow-xl`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-xl ${cfg.bg}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{cfg.label}</h3>
                    <p className="text-sm text-gray-400">{p.seat_type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {["base_price", "weekend_price", "special_price"].map((key, i) => {
                    const labels = ["Giá thường (T2–T5)", "Giá cuối tuần", "Giá đặc biệt"];
                    const colors = ["text-gray-300", "text-orange-300", "text-yellow-300"];
                    return (
                      <div key={key}>
                        <label className={`block text-sm font-medium mb-2 ${colors[i]}`}>
                          {labels[i]}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={p[key]}
                            onChange={(e) => handleChange(p.seat_type, key, e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-xl text-lg focus:outline-none focus:border-purple-500 transition"
                            placeholder="0"
                            min="0"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold">₫</span>
                        </div>
                        {p[key] && (
                          <p className="text-right text-sm text-gray-400 mt-1">
                            {format(p[key])} VNĐ
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Nút lưu */}
        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-full font-bold text-xl shadow-lg disabled:opacity-60 transition"
          >
            {saving ? (
              <>Đang lưu... <Loader2 className="w-6 h-6 animate-spin" /></>
            ) : (
              <>Lưu tất cả giá vé <Save className="w-6 h-6" /></>
            )}
          </button>
        </div>

        {/* Ghi chú */}
        <div className="mt-10 p-6 bg-gray-900/50 border border-gray-700 rounded-2xl text-sm text-gray-400">
          <strong className="text-white block mb-2">Lưu ý:</strong>
          <ul className="space-y-1">
            <li>• Giá thường: Thứ 2 → Thứ 5</li>
            <li>• Giá cuối tuần: Thứ 6, 7, CN và ngày lễ</li>
            <li>• Giá đặc biệt: Suất chiếu sớm, 3D, IMAX, v.v.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuanLyGiaVe;