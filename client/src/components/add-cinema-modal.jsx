"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { X } from "lucide-react"
import { toast } from "react-toastify"

export default function AddCinemaModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    province_code: "",
    district_code: "",
    address_details: "",
    rooms: 1,
    manager_id: "",
    phone: "",
    email: "",
  })

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [managers, setManagers] = useState([])

  // Load tỉnh thành + quản lý
  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/v1/p/").then(res => setProvinces(res.data))
    axios.get("/api/cinemas/managers").then(res => setManagers(res.data.managers || []))
  }, [])

  // Load quận/huyện khi chọn tỉnh
  useEffect(() => {
    if (form.province_code) {
      axios.get("https://provinces.open-api.vn/api/v1/d/").then(res => {
        setDistricts(res.data.filter(d => d.province_code === Number(form.province_code)))
      })
    } else {
      setDistricts([])
    }
  }, [form.province_code])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post("/api/cinemas/add", {
        name: form.name,
        description: form.description,
        manager_id: form.manager_id,
        phone: form.phone,
        email: form.email,
        province_code: form.province_code,
        district_code: form.district_code,
        address_details: form.address_details,
        rooms: form.rooms,
      })
      onSuccess()
      onClose()
        toast.success("Thêm rạp phim thành công!");
    } catch (err) {

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Thêm rạp phim thất bại, vui lòng thử lại.";
        toast.error(errorMessage)
  }
  }
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-4xl bg-black border border-red-900/40 rounded-2xl shadow-2xl shadow-red-900/30 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-900/30 bg-gradient-to-r from-red-950/30 to-transparent">
          <h2 className="text-2xl font-bold text-white">Thêm Rạp Phim Mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-900/30 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form - Bố cục 2 cột giống hệt bản TypeScript bạn thích */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Cột trái */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-red-400 mb-2">
                  Tên rạp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Galaxy Cinema Hà Nội"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-red-400 mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả chi tiết về rạp phim"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white placeholder-gray-500 focus:border-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">
                    Hotline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-400 mb-2">
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.address_details}
                  onChange={e => setForm({ ...form, address_details: e.target.value })}
                  placeholder="Ví dụ: 123 Đường Lê Thánh Tông"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white focus:border-red-500"
                />
              </div>
            </div>

            {/* Cột phải */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.province_code}
                    onChange={e => setForm({ ...form, province_code: e.target.value, district_code: "" })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white"
                  >
                    <option value="">Chọn tỉnh</option>
                    {provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">
                    Quận/Huyện <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!form.province_code}
                    value={form.district_code}
                    onChange={e => setForm({ ...form, district_code: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white disabled:opacity-50"
                  >
                    <option value="">Chọn huyện</option>
                    {districts.map(d => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-400 mb-2">
                  Quản lý <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.manager_id}
                  onChange={e => setForm({ ...form, manager_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white"
                >
                  <option value="">Chọn quản lý</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">
                    Phòng chiếu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.rooms}
                    onChange={e => setForm({ ...form, rooms: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value="Active"
                    disabled
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-red-800 text-white opacity-70"
                  >
                    <option>Active</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Nút */}
          <div className="flex gap-4 pt-6 border-t border-red-900/30">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-700 hover:bg-gray-900 text-white font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
            >
              Thêm Rạp
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}