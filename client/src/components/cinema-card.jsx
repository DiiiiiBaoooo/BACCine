import { MapPin, Users, Film, ChevronRight } from "lucide-react"
import { toast } from "react-toastify"
export default function CinemaCard({ cinema, onClick }) {
  const statusStyle = {
    Active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    Maintenance: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    Inactive: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  }[cinema.status] || "bg-gray-100 text-gray-700"

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className="h-48 bg-gradient-to-br from-gray-400 to-gray-950-600 relative">
        <img src="/rapphim.jpg" alt="" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-black/40" />
        <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${statusStyle}`}>
          {cinema.status === "active" ? "Hoạt động" : cinema.status === "maintenance" ? "Bảo trì" : "Ngừng"}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition">
          {cinema.cinema_name}
        </h3>
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-2">
          <MapPin className="w-4 h-4" />
          {cinema.province_name}, {cinema.district_name}
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-slate-500">Phòng</p>
              <p className="font-bold">{cinema.rooms}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-slate-500">NV</p>
              <p className="font-bold">{cinema.staffCount || 0}</p>
            </div>
          </div>
        </div>

        <button className="w-full mt-5 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-500 to-black-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-700">
          Xem chi tiết <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}