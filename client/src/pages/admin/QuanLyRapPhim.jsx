"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { Plus, Search, Film } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import CinemaCard from "../../components/cinema-card"
import SendPlanModal from "../../components/send-plan-modal"
import AddCinemaModal from "../../components/add-cinema-modal"
import CinemaDetailDrawer from "../../components/cinema-detail-drawer"

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000"
const socket = io("https://bac-cine.vercel.app", { transports: ["polling", "websocket"] })

export default function QuanLyRapPhim() {
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("")
  const [districtFilter, setDistrictFilter] = useState("")
  const [selectedCinema, setSelectedCinema] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [cinemaIdForPlan, setCinemaIdForPlan] = useState(null)

  const [provinces, setProvinces] = useState([])
  const [allDistricts, setAllDistricts] = useState([])

  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/v1/p/").then(res => setProvinces(res.data))
    axios.get("https://provinces.open-api.vn/api/v1/d/").then(res => setAllDistricts(res.data))
  }, [])

  const fetchCinemas = async () => {
    try {
      const res = await axios.get("/api/cinemas")
      const data = res.data.cinemas.map(cinema => ({
        ...cinema,
        province_name: provinces.find(p => p.code === Number(cinema.province_code))?.name || "Chưa xác định",
        district_name: allDistricts.find(d => d.code === Number(cinema.district_code))?.name || "Chưa xác định",
      }))
      setCinemas(data)
    } catch (err) {
      toast.error("Không thể tải danh sách rạp!")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (provinces.length && allDistricts.length) fetchCinemas()
  }, [provinces, allDistricts])

  useEffect(() => {
    socket.on("cinemaAdded", (newCinema) => {
      setCinemas(prev => [...prev, {
        ...newCinema,
        province_name: provinces.find(p => p.code === Number(newCinema.province_code))?.name || "",
        district_name: allDistricts.find(d => d.code === Number(newCinema.district_code))?.name || "",
      }])
      toast.success(`Thêm rạp: ${newCinema.cinema_name}`)
    })

    socket.on("cinemaUpdated", (updated) => {
      setCinemas(prev => prev.map(c => c.id === updated.id ? {
        ...updated,
        province_name: provinces.find(p => p.code === Number(updated.province_code))?.name || "",
        district_name: allDistricts.find(d => d.code === Number(updated.district_code))?.name || "",
      } : c))

      if (selectedCinema?.id === updated.id) {
        setSelectedCinema(prev => ({
          ...updated,
          province_name: provinces.find(p => p.code === Number(updated.province_code))?.name || "",
          district_name: allDistricts.find(d => d.code === Number(updated.district_code))?.name || "",
        }))
      }
      toast.info(`Cập nhật: ${updated.cinema_name}`)
    })

    return () => {
      socket.off("cinemaAdded")
      socket.off("cinemaUpdated")
    }
  }, [selectedCinema, provinces, allDistricts])

  const filteredCinemas = useMemo(() => {
    return cinemas.filter(cinema => {
      const matchSearch = cinema.cinema_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cinema.address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchProvince = !provinceFilter || cinema.province_code == provinceFilter
      const matchDistrict = !districtFilter || cinema.district_code == districtFilter
      return matchSearch && matchProvince && matchDistrict
    })
  }, [cinemas, searchQuery, provinceFilter, districtFilter])

  const districtsInSelectedProvince = allDistricts.filter(d => d.province_code == provinceFilter)

  const openPlanModal = (id) => {
    setCinemaIdForPlan(id)
    setShowPlanModal(true)
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Header nhỏ gọn, đẹp */}
        <header className="sticky top-0 z-40 border-b border-red-900/40 bg-black/95 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl">
                <Film className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="text-white">CINEMA</span>
                  <span className="text-red-600">MANAGER</span>
                </h1>
                <p className="text-red-400 text-xs font-light">Quản lý rạp phim</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium rounded-lg shadow-lg hover:shadow-red-600/50 transition"
            >
              <Plus className="w-5 h-5" />
              Thêm rạp
            </button>
          </div>
        </header>

        {/* Main - gọn gàng */}
        <div className="max-w-7xl mx-auto px-5 py-8">
          {/* Bộ lọc nhỏ gọn */}
          <div className="bg-gray-900/60 backdrop-blur border border-red-900/30 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                <input
                  type="text"
                  placeholder="Tìm rạp..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black/80 border border-red-800 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500/40 text-white outline-none transition"
                />
              </div>

              <select
                value={provinceFilter}
                onChange={e => { setProvinceFilter(e.target.value); setDistrictFilter("") }}
                className="px-4 py-3 bg-black/80 border border-red-800 rounded-lg text-white">
                <option value="">Tất cả tỉnh</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>

              <select
                value={districtFilter}
                onChange={e => setDistrictFilter(e.target.value)}
                disabled={!provinceFilter}
                className="px-4 py-3 bg-black/80 border border-red-800 rounded-lg text-white disabled:opacity-40">
                <option value="">Tất cả huyện</option>
                {districtsInSelectedProvince.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <p>
                <span className="text-red-500 font-bold text-lg">{filteredCinemas.length}</span> rạp
              </p>
              <p className="text-gray-500">{new Date().toLocaleTimeString("vi-VN")}</p>
            </div>
          </div>

          {/* Danh sách rạp */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-14 w-14 border-3 border-red-600 border-t-transparent"></div>
              <p className="mt-4 text-red-500">Đang tải...</p>
            </div>
          ) : filteredCinemas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCinemas.map(cinema => (
                <CinemaCard
                  key={cinema.id}
                  cinema={cinema}
                  onClick={() => setSelectedCinema(cinema)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-900/40 rounded-2xl border border-red-900/20">
              <Film className="w-20 h-20 mx-auto text-red-800 mb-4" />
              <h3 className="text-xl font-bold text-gray-300">Không tìm thấy rạp</h3>
              <p className="text-gray-500 mt-2">Thử thay đổi tìm kiếm</p>
            </div>
          )}
        </div>

        {/* Modal & Drawer */}
        {selectedCinema && (
          <CinemaDetailDrawer
            open={true}
            cinema={selectedCinema}
            onClose={() => setSelectedCinema(null)}
            onUpdateSuccess={() => {
              fetchCinemas()
              toast.success("Cập nhật thành công!")
            }}
            onOpenPlanModal={openPlanModal}
          />
        )}

        <AddCinemaModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchCinemas()
            toast.success("Thêm rạp thành công!")
          }}
        />

        <SendPlanModal
          open={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          cinemaId={cinemaIdForPlan}
          onSuccess={() => {
            fetchCinemas()
            toast.success("Gửi kế hoạch thành công!")
          }}
        />

        {/* Toast đẹp */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
          toastClassName="bg-gray-900 border border-red-900/60 rounded-lg shadow-xl"
          bodyClassName="text-white font-medium"
          progressClassName="bg-red-600"
        />
      </div>
    </>
  )
}