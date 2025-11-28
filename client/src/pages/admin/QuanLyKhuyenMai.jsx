import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Building, Film, CalendarClock, Users, UserCheck, DollarSign } from 'lucide-react'
import { Card, CardContent } from "../../components/ui/Card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { io } from "socket.io-client";

function Badge({ status }) {
  const colors = {
    active: "bg-emerald-900 text-emerald-300 border-emerald-700",
    upcoming: "bg-blue-900 text-blue-300 border-blue-700",
    expired: "bg-red-900 text-red-300 border-red-700",
    inactive: "bg-gray-700 text-gray-300 border-gray-600",
    'outofstock':"bg-white text-black border-white"
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${colors[status]}`}
    >
      {status}
    </span>
  );
}

export default function QuanLyKhuyenMai() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [selected, setSelected] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [stats, setStats] = useState(null);

  const [form, setForm] = useState(initForm());

  const statuses = ["Tất cả", "active", "upcoming", "expired", "inactive","outofstock"];
  useEffect(() => {
    // Kết nối tới server socket
    const socket = io("https://bac-cine.vercel.app", {
      transports: ["websocket"], // đảm bảo dùng websocket
    });

    // Lắng nghe sự kiện server emit
    socket.on("promotions_update", (data) => {
      console.log("📢 Promotions update:", data);
      setPromotions(data.promotions);
      setStats(data.stats);
    });

    // Cleanup khi rời component
    return () => {
      socket.disconnect();
    };
  }, []);
  // Hàm khởi tạo form rỗng
  function initForm() {
    return {
      code: "",
      name: "",
      description: "",
      discount_type: "percent",
      discount_value: 0,
      min_order: 0,
      max_discount: null,
      start_date: "",
      end_date: "",
      quantity: 0,
      status: "active",
    };
  }
  const fetchStatistics = async () => {
    try {
      const { data } = await axios.get("/api/promotions/statistics");
      if (data.success) {
        setStats(data.statistics);
      }
    } catch (err) {
      toast.error("Lỗi API thống kê: " + err.message);
    }
  };
  
  useEffect(() => {
    fetchPromotions();
    fetchStatistics();
  }, []);
  // 📌 Gọi API lấy danh sách khuyến mãi
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/promotions");
      if (data.success) {
        setPromotions(data.promotions);
      } else {
        toast.error("Không load được khuyến mãi: " + data.message);
      }
    } catch (err) {
      toast.error("Lỗi API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // 📌 Lọc dữ liệu theo tên + trạng thái
  const filtered = useMemo(() => {
    return promotions.filter((p) => {
      const matchText =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase());
      const matchStatus = status === "Tất cả" || p.status === status;
      return matchText && matchStatus;
    });
  }, [query, status, promotions]);

  // 📌 Submit thêm khuyến mãi
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/promotions/add", form);
      if (data.success) {
        setShowAdd(false);
        setForm(initForm());
        fetchPromotions();
        fetchStatistics()
        toast.success("Thêm khuyến mãi thành công");
      } else {
        toast.error("Thêm thất bại: " + data.message);
      }
    } catch (err) {
      toast.error("Lỗi API: " + err.message);
    }
  };

  // 📌 Submit cập nhật khuyến mãi
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`/api/promotions/update/${selected.id}`, form);
      if (data.success) {
        toast.success("Cập nhật khuyến mãi thành công");
        setShowEdit(false);
        setSelected(null);
        setForm(initForm());
        fetchPromotions();
      } else {
        toast.error("Cập nhật thất bại: " + data.message);
      }
    } catch (err) {
      toast.error("Lỗi API: " + err.message);
    }
  };

  // 📌 Xoá khuyến mãi
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá khuyến mãi này?")) return;
    try {
      const { data } = await axios.delete(`/api/promotions/delete/${id}`);
      if (data.success) {
        toast.success("Xoá khuyến mãi thành công");
        fetchPromotions();
      } else {
        toast.error("Xoá thất bại: " + data.message);
      }
    } catch (err) {
      toast.error("Lỗi API: " + err.message);
    }
  };

  // 📌 Mở modal edit
  const openEditModal = (promo) => {
    setSelected(promo);
    setForm({
      code: promo.code,
      name: promo.name,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order: promo.min_order,
      max_discount: promo.max_discount,
      start_date: promo.start_date.slice(0, 16),
      end_date: promo.end_date.slice(0, 16),
      quantity: promo.quantity,
      status: promo.status,
    });
    setShowEdit(true);
  };

  return (
    <div className="min-h-screen p-6 text-gray-100">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Khuyến mãi</h1>
            <p className="text-sm text-gray-400">
              Theo dõi và thiết lập các chương trình ưu đãi cho khách hàng.
            </p>
          </div>
  
          <div className="flex gap-2">
            <button
              onClick={() => {
                setForm(initForm());
                setShowAdd(true);
              }}
              className="rounded-xl bg-gray-700 px-4 py-2 hover:bg-gray-600 cursor-pointer"
            >
              + Thêm khuyến mãi
            </button>
          </div>
        </div>
        {stats && (
  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
    <Card 
     value={stats}
      onClick={() => setStatus("Tất cả")}
      className={`bg-gray-900 text-white shadow-lg  cursor-pointer justify-between hover:bg-gray-800 ${status==="Tất cả" ? "ring-2 ring-emerald-400" : ""}`}
    >
      <CardContent className="p-4 flex flex-col items-center">
        <span className="text-gray-400 text-sm">Tổng KM</span>
        <span className="text-2xl font-bold mt-1">{stats.total}</span>
      </CardContent>
    </Card>

    <Card 
     value={stats}
      onClick={() => setStatus("active")}
      className={`bg-gray-900 text-white shadow-lg cursor-pointer  hover:bg-gray-800  ${status==="active" ? "ring-2 ring-emerald-400" : ""}`}
    >
      <CardContent className="p-4 flex flex-col items-center">
        <span className="text-gray-400 text-sm">Đang hoạt động</span>
        <span className="text-2xl font-bold mt-1 text-emerald-400">{stats.active}</span>
      </CardContent>
    </Card>

    <Card 
    value={status}
      onClick={() => setStatus("upcoming")}
      className={`bg-gray-900 text-white shadow-lg cursor-pointer hover:bg-gray-800 ${status==="upcoming" ? "ring-2 ring-emerald-400" : ""}`}
    >
      <CardContent className="p-4 flex flex-col items-center">
        <span className="text-gray-400 text-sm">Sắp diễn ra</span>
        <span className="text-2xl font-bold mt-1 text-blue-400">{stats.upcoming}</span>
      </CardContent>
    </Card>

    <Card 
     value={status}
      onClick={() => setStatus("expired")}
      className={`bg-gray-900 text-white shadow-lg cursor-pointer hover:bg-gray-800 ${status==="expired" ? "ring-2 ring-emerald-400" : ""}`}
    >
      <CardContent className="p-4 flex flex-col items-center">
        <span className="text-gray-400 text-sm">Hết hạn</span>
        <span className="text-2xl font-bold mt-1 text-red-400">{stats.expired}</span>
      </CardContent>
    </Card>

    <Card 
     value={status}
      onClick={() => setStatus("out_of_stock")}
      className={`bg-gray-900 text-white shadow-lg cursor-pointer hover:bg-gray-800 ${status==="out_of_stock" ? "ring-2 ring-emerald-400" : ""}`}
    >
      <CardContent className="p-4 flex flex-col items-center">
        <span className="text-gray-400 text-sm">Hết số lượng</span>
        <span className="text-2xl font-bold mt-1 text-yellow-400">{stats.out_of_stock}</span>
      </CardContent>
    </Card>
  </div>
)}



        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Tìm theo tên, code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Grid of promos */}
        {loading ? (
          <div className="mt-12 text-center text-gray-400">⏳ Đang tải...</div>
        ) : filtered.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-sm hover:shadow-lg"
              >
                <img
                  src="../../../public/promotion.jpg"
                  alt={p.name}
                  className="h-32 w-full object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="text-base font-semibold">{p.name}</h3>
                  <p className="text-sm text-gray-400">{p.code}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.start_date).toLocaleDateString()} →{" "}
                    {new Date(p.end_date).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between">
                    {p.discount_type === "percent" ? (
                      <span className="text-xs">🔥 Giảm {p.discount_value}%</span>
                    ) : (
                      <span className="text-xs">
                        💸 -{p.discount_value.toLocaleString()}đ
                      </span>
                    )}
                    <Badge status={p.status} />
                  </div>
                  {/* Nút hành động */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs hover:bg-blue-500"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-500"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-gray-700 bg-gray-800 p-8 text-center text-sm text-gray-400">
            Không tìm thấy chương trình phù hợp.
          </div>
        )}
      </div>

      {/* Modal Add */}
      {showAdd && (
        <PromotionForm
          title="Thêm khuyến mãi"
          form={form}
          setForm={setForm}
          onClose={() => setShowAdd(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Modal Edit */}
      {showEdit && (
        <PromotionForm
          title="Cập nhật khuyến mãi"
          form={form}
          setForm={setForm}
          onClose={() => setShowEdit(false)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}

// 🔹 Tách form dùng lại cho Add & Edit
function PromotionForm({ title, form, setForm, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-xl bg-gray-900 p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
          {/* Mã khuyến mãi */}
          <div>
            <label className="block text-sm mb-1">Mã khuyến mãi</label>
            <input
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>

          {/* Tên khuyến mãi */}
          <div>
            <label className="block text-sm mb-1">Tên khuyến mãi</label>
            <input
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Mô tả */}
          <div className="col-span-2">
            <label className="block text-sm mb-1">Mô tả</label>
            <textarea
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Loại giảm */}
          <div>
            <label className="block text-sm mb-1">Loại giảm giá</label>
            <select
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.discount_type}
              onChange={(e) =>
                setForm({ ...form, discount_type: e.target.value })
              }
            >
              <option value="percent">%</option>
              <option value="fixed">Số tiền</option>
            </select>
          </div>

          {/* Giá trị giảm */}
          <div>
            <label className="block text-sm mb-1">Giá trị giảm</label>
            <input
              type="number"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.discount_value}
              onChange={(e) =>
                setForm({ ...form, discount_value: Number(e.target.value) })
              }
            />
          </div>

          {/* Min order */}
          <div>
            <label className="block text-sm mb-1">Đơn tối thiểu</label>
            <input
              type="number"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.min_order}
              onChange={(e) =>
                setForm({ ...form, min_order: Number(e.target.value) })
              }
            />
          </div>

          {/* Max discount */}
          <div>
            <label className="block text-sm mb-1">Giảm tối đa</label>
            <input
              type="number"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.max_discount || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_discount: Number(e.target.value) || null,
                })
              }
            />
          </div>

          {/* Start */}
          <div>
            <label className="block text-sm mb-1">Ngày bắt đầu</label>
            <input
              type="datetime-local"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
              required
            />
          </div>

          {/* End */}
          <div>
            <label className="block text-sm mb-1">Ngày kết thúc</label>
            <input
              type="datetime-local"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm mb-1">Số lượng</label>
            <input
              type="number"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
            />
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-600 px-4 py-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-500"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
