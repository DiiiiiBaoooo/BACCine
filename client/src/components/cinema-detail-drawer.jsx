"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { X, Edit2, Save, MapPin, Phone, Mail, Building2 } from "lucide-react"
import { toast } from "react-toastify"

export default function CinemaDetailDrawer({ open, cinema, onClose, onUpdateSuccess, onOpenPlanModal }) {
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState({})
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [managers, setManagers] = useState([])
  const [plans, setPlans] = useState([])

  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/v1/p/").then(res => setProvinces(res.data))
    axios.get("/api/cinemas/managers").then(res => setManagers(res.data.managers || []))
  }, [])

  useEffect(() => {
    const code = isEdit ? form.province_code : cinema?.province_code
    if (code) {
      axios.get("https://provinces.open-api.vn/api/v1/d/").then(res => {
        setDistricts(res.data.filter(d => d.province_code === Number(code)))
      })
    } else {
      setDistricts([])
    }
  }, [cinema?.province_code, form.province_code, isEdit])

  useEffect(() => {
    if (open && cinema?.id) {
      {
      axios.get(`/api/cinemas/getPlanMovie/${cinema.id}`)
        .then(res => setPlans(res.data.plans || []))
        .catch(() => setPlans([]))
    }
}
  }, [open, cinema?.id])

  useEffect(() => {
    if (isEdit && cinema) {
      setForm({
        name: cinema.cinema_name || "",
        description: cinema.description || "",
        province_code: cinema.province_code || "",
        district_code: cinema.district_code || "",
        address_details: cinema.address || "",
        rooms: cinema.rooms || 1,
        manager_id: cinema.manager_id || "",
        phone: cinema.phone || "",
        email: cinema.email || "",
      })
    }
  }, [isEdit, cinema])

  const handleSave = async () => {
    try {
      await axios.put(`/api/cinemas/update/${cinema.id}`, {
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
      setIsEdit(false)
      onUpdateSuccess()
      toast.success("Cập nhật rạp phim thành công!")
    } catch (err) {
      console.error("Lỗi cập nhật rạp:", err)
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Cập nhật rạp phim thất bại, vui lòng thử lại."
      toast.error(errorMessage)
    }
  }

  if (!open || !cinema) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      {/* Drawer gọn hơn, max-w-xl thay vì max-w-2xl */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-black border-l border-red-900/60 shadow-2xl overflow-y-auto">
        
        {/* Header nhỏ gọn */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-red-900/40 bg-black/95 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? "Chỉnh sửa rạp" : cinema.cinema_name}
            </h2>
            <p className="text-red-400 text-sm mt-1">{cinema.province_name}, {cinema.district_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-900/30 rounded-lg">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isEdit ? (
            /* === CHẾ ĐỘ CHỈNH SỬA - GỌN GÀNG === */
            <div className="space-y-4">
              <input
                type="text" placeholder="Tên rạp" required
                value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white focus:border-red-500"
              />

              <textarea
                rows="2" placeholder="Mô tả"
                value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white placeholder-gray-500 resize-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Hotline" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white" />
                <input type="email" placeholder="Email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white" />
              </div>

              <select value={form.province_code || ""} onChange={e => setForm({ ...form, province_code: e.target.value, district_code: "" })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white">
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>

              <select value={form.district_code || ""} onChange={e => setForm({ ...form, district_code: e.target.value })} disabled={!form.province_code}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white disabled:opacity-50">
                <option value="">Chọn quận/huyện</option>
                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>

              <input type="text" placeholder="Địa chỉ chi tiết" value={form.address_details || ""} onChange={e => setForm({ ...form, address_details: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white" />

              <select value={form.manager_id || ""} onChange={e => setForm({ ...form, manager_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white">
                <option value="">Chọn quản lý</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <input type="number" placeholder="Số phòng" value={form.rooms || ""} onChange={e => setForm({ ...form, rooms: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white" />

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsEdit(false)} className="flex-1 py-2.5 border border-gray-700 hover:bg-gray-900 rounded-lg text-white font-medium">
                  Hủy
                </button>
                <button onClick={handleSave} className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-bold shadow-lg">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            /* === CHẾ ĐỘ XEM CHI TIẾT - SIÊU GỌN === */
            <>
              {/* Ảnh nhỏ hơn */}
              <div className="rounded-xl overflow-hidden border border-red-900/30">
                <img src="/rapphim.jpg" alt={cinema.cinema_name} className="w-full h-56 object-cover" />
              </div>

              {/* Thông tin nhanh - 2 cột gọn */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-red-900/20">
                  <MapPin className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-gray-500">Địa chỉ</p>
                    <p className="text-white font-medium">{cinema.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-red-900/20">
                  <Phone className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-gray-500">Hotline</p>
                    <a href={`tel:${cinema.phone}`} className="text-red-400 font-medium">{cinema.phone}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-red-900/20">
                  <Mail className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-gray-500">Email</p>
                    <a href={`mailto:${cinema.email}`} className="text-red-400 font-medium">{cinema.email}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-red-900/20">
                  <Building2 className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-gray-500">Quản lý</p>
                    <p className="text-white font-medium">{cinema.manager_name || "Chưa có"}</p>
                  </div>
                </div>
              </div>

              {/* Kế hoạch - bảng nhỏ gọn */}
              <div className="mt-6">
                <h3 className="text-lg font-bold text-red-500 mb-3">
                  Kế hoạch đã gửi ({plans.length})
                </h3>
                {plans.length > 0 ? (
                  <div className="bg-gray-900/50 border border-red-900/30 rounded-lg overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-red-900/20">
                        <tr>
                          <th className="px-4 py-2 text-left text-red-400">Mô tả</th>
                          <th className="px-4 py-2 text-red-400">Ngày</th>
                          <th className="px-4 py-2 text-red-400">Phim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.slice(0, 4).map(plan => (
                          <tr key={plan.plan_id} className="border-t border-red-900/20">
                            <td className="px-4 py-2 text-gray-300 text-xs">{plan.description}</td>
                            <td className="px-4 py-2 text-gray-300 text-xs">{plan.start_date} → {plan.end_date.slice(5)}</td>
                            <td className="px-4 py-2 text-red-400 font-bold">{plan.total_movies}</td>
                          </tr>
                        ))}
                        {plans.length > 4 && (
                          <tr>
                            <td colSpan="3" className="text-center py-2 text-gray-500 text-xs">
                              + {plans.length - 4} kế hoạch khác
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Chưa có kế hoạch nào</p>
                )}
              </div>

              {/* Nút nhỏ gọn */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEdit(true)}
                  className="flex-1 py-3 bg-gray-900 border border-red-800 hover:bg-red-900/20 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition"
                >
                  <Edit2 className="w-4 h-4" /> Chỉnh sửa
                </button>
                <button
                  onClick={() => onOpenPlanModal(cinema.id)}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg font-bold text-white shadow-lg transition"
                >
                  Gửi kế hoạch mới
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}