"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Plus, Search, Calendar, Tag, Edit2, Trash2, X } from "lucide-react"
import { io } from "socket.io-client"

const socket = io("https://bac-cine.vercel.app", { transports: ["polling", "websocket"] })

const StatusBadge = ({ status }) => {
  const config = {
    active: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-700", label: "Đang hoạt động" },
    upcoming: { color: "bg-blue-500/20 text-blue-400 border-blue-700", label: "Sắp diễn ra" },
    expired: { color: "bg-red-500/20 text-red-400 border-red-700", label: "Hết hạn" },
    inactive: { color: "bg-gray-600 text-gray-400 border-gray-600", label: "Tạm dừng" },
    outofstock: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-700", label: "Hết lượt" },
  }[status] || { color: "bg-gray-700 text-gray-400", label: "Không xác định" }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  )
}

export default function QuanLyKhuyenMai() {
  const [promotions, setPromotions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("Tất cả")

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percent",
    discount_value: "",
    min_order: 0,
    max_discount: null,
    start_date: "",
    end_date: "",
    quantity: 0,
    status: "active",
  })

  useEffect(() => {
    fetchPromotions()
    fetchStats()

    socket.on("promotions_update", (data) => {
      setPromotions(data.promotions || [])
      setStats(data.stats)
      toast.info("Danh sách khuyến mãi vừa được cập nhật")
    })

    return () => socket.off("promotions_update")
  }, [])

  const fetchPromotions = async () => {
    try {
      const { data } = await axios.get("/api/promotions")
      if (data.success) setPromotions(data.promotions)
    } catch (err) {
      toast.error("Không thể tải khuyến mãi")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("/api/promotions/statistics")
      if (data.success) setStats(data.statistics)
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = useMemo(() => {
    return promotions.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.code.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === "Tất cả" || p.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [promotions, search, filterStatus])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (showEdit) {
        await axios.put(`/api/promotions/update/${editingPromo.id}`, form)
        toast.success("Cập nhật thành công!")
      } else {
        await axios.post("/api/promotions/add", form)
        toast.success("Thêm khuyến mãi thành công!")
      }
      setShowAdd(false)
      setShowEdit(false)
      setForm({
        code: "", name: "", description: "", discount_type: "percent",
        discount_value: 0, min_order: 0, max_discount: null,
        start_date: "", end_date: "", quantity: 0, status: "active"
      })
      fetchPromotions()
      fetchStats()
    } catch (err) {
      toast.error("Lỗi: " + (err.response?.data?.message || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Xóa khuyến mãi này?")) return
    try {
      await axios.delete(`/api/promotions/delete/${id}`)
      toast.success("Đã xóa thành công")
      fetchPromotions()
    } catch (err) {
      toast.error("Xóa thất bại")
    }
  }

  const openEdit = (p) => {
    setEditingPromo(p)
    setForm({
      code: p.code,
      name: p.name,
      description: p.description || "",
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      min_order: p.min_order || 0,
      max_discount: p.max_discount || "",
      start_date: p.start_date.slice(0, 16),
      end_date: p.end_date.slice(0, 16),
      quantity: p.quantity || 0,
      status: p.status,
    })
    setShowEdit(true)
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-white">QUẢN LÝ</span>{" "}
                <span className="text-red-600">KHUYẾN MÃI</span>
              </h1>
              <p className="text-gray-400 mt-1">Thiết lập ưu đãi, tăng doanh thu</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-medium shadow-lg hover:shadow-red-600/50 transition"
            >
              <Plus className="w-5 h-5" /> Thêm khuyến mãi
            </button>
          </div>

          {/* Thống kê */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Tổng", value: stats.total, color: "text-white" },
                { label: "Đang chạy", value: stats.active, color: "text-emerald-400" },
                { label: "Sắp tới", value: stats.upcoming, color: "text-blue-400" },
                { label: "Hết hạn", value: stats.expired, color: "text-red-400" },
                { label: "Hết lượt", value: stats.out_of_stock || 0, color: "text-yellow-400" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-900/60 backdrop-blur border border-red-900/30 rounded-xl p-5 text-center hover:bg-gray-900 transition cursor-pointer"
                  onClick={() => setFilterStatus(i === 0 ? "Tất cả" : ["active","upcoming","expired","outofstock"][i-1])}
                >
                  <p className="text-gray-400 text-sm">{item.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tìm kiếm + lọc */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã khuyến mãi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-red-800 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500/40 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-5 py-3 bg-gray-900 border border-red-800 rounded-xl"
            >
              {["Tất cả", "active", "upcoming", "expired", "inactive", "outofstock"].map(s => (
                <option key={s} value={s}>{s === "Tất cả" ? s : <StatusBadge status={s} />}</option>
              ))}
            </select>
          </div>

          {/* Danh sách */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent"></div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(promo => (
                <div
                  key={promo.id}
                  className="group bg-gray-900/70 backdrop-blur border border-red-900/30 rounded-2xl overflow-hidden hover:border-red-600 transition-all hover:-translate-y-1"
                >
                  <div className="h-40 bg-gradient-to-br from-red-900/30 to-black relative overflow-hidden">
                    <img src="/promotion.jpg" alt="" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70" />
                    <div className="absolute bottom-3 left-4">
                      <StatusBadge status={promo.status} />
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg text-white">{promo.name}</h3>
                    <p className="text-red-400 text-sm font-mono mt-1">{promo.code}</p>
                    <p className="text-gray-400 text-xs mt-2 line-clamp-2">{promo.description || "Không có mô tả"}</p>

                    <div className="mt-flex items-center gap-2 mt-4 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">
                        {new Date(promo.start_date).toLocaleDateString("vi")} → {new Date(promo.end_date).toLocaleDateString("vi")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {promo.discount_type === "percent" ? (
                        <span className="text-2xl font-bold text-emerald-400">-{promo.discount_value}%</span>
                      ) : (
                        <span className="text-2xl font-bold text-emerald-400">-{promo.discount_value.toLocaleString()}đ</span>
                      )}
                      <span className="text-gray-500 text-sm">Còn {promo.quantity} lượt</span>
                    </div>

                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => openEdit(promo)}
                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="flex-1 py-2 bg-red-900/50 hover:bg-red-900/70 rounded-lg text-sm font-medium text-red-400 transition flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-900/40 rounded-2xl border border-red-900/20">
              <Tag className="w-20 h-20 mx-auto text-red-800 mb-4" />
              <p className="text-xl text-gray-400">Không tìm thấy khuyến mãi nào</p>
            </div>
          )}

          {/* Modal Add/Edit */}
          {(showAdd || showEdit) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur px-4">
              <div className="w-full max-w-2xl bg-black border border-red-900/60 rounded-2xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {showEdit ? "Chỉnh sửa" : "Thêm mới"} khuyến mãi
                  </h2>
                  <button onClick={() => { setShowAdd(false); setShowEdit(false) ;setForm({ ...emptyForm })}} className="p-2 hover:bg-red-900/30 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Mã KM *" required value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                      className="px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />
                    <input placeholder="Tên khuyến mãi *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />
                  </div>

                  <textarea placeholder="Mô tả" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />

                  <div className="grid grid-cols-3 gap-4">
                    <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}
                      className="px-4 py-3 bg-gray-900 border border-red-800 rounded-lg">
                      <option value="percent">%</option>
                      <option value="fixed">Số tiền</option>
                    </select>
                    <input type="number" placeholder="Giá trị giảm *" required value={form.discount_value} onChange={e => setForm({...form, discount_value: +e.target.value})}
                      className="px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />
                    <input type="number" placeholder="Đơn tối thiểu" value={form.min_order || ""} onChange={e => setForm({...form, min_order: +e.target.value || 0})}
                      className="px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input type="datetime-local" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                      className="px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />
                    <input type="datetime-local" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                      className="px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />
                  </div>

                  <input type="number" placeholder="Số lượt sử dụng (0 = vô hạn)" value={form.quantity || ""} onChange={e => setForm({...form, quantity: +e.target.value || 0})}
                    className="w-full px-4 py-3 bg-gray-900 border border-red-800 rounded-lg" />

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => { setShowAdd(false); setShowEdit(false) }}
                      className="flex-1 py-3 border border-gray-700 hover:bg-gray-900 rounded-lg font-medium">
                      Hủy
                    </button>
                    <button type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg font-bold">
                      {showEdit ? "Cập nhật" : "Thêm mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <ToastContainer position="top-right" theme="dark" autoClose={3000} className="mt-16" />
        </div>
      </div>
    </>
  )
}