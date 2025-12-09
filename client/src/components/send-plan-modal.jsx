"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { X } from "lucide-react"

export default function SendPlanModal({ open, onClose, cinemaId, onSuccess }) {
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [movies, setMovies] = useState([])
  const [selectedMovies, setSelectedMovies] = useState([])

  useEffect(() => {
    if (open) {
      axios.get("/api/movies").then(res => setMovies(res.data.movies || []))
    }
  }, [open])

  const toggleMovie = (id) => {
    setSelectedMovies(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedMovies.length === 0) {
      alert("Vui lòng chọn ít nhất 1 phim!")
      return
    }
    try {
      await axios.post(`/api/cinemas/sendPlan/${cinemaId}`, {
        description,
        start_date: startDate,
        end_date: endDate,
        movie_id: selectedMovies,
      })
      onSuccess()
      onClose()
    } catch (err) {
      alert("Gửi kế hoạch thất bại!")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
      {/* Modal nhỏ gọn, vừa đủ dùng */}
      <div className="w-full max-w-lg bg-black border border-red-900/60 rounded-xl shadow-2xl shadow-red-900/50 overflow-hidden">

        {/* Header nhỏ gọn */}
        <div className="flex items-center justify-between p-5 border-b border-red-900/40">
          <h2 className="text-xl font-bold text-white">
            Gửi kế hoạch chiếu phim
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-900/30 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form gọn gàng */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Mô tả */}
          <div>
            <label className="block text-red-400 text-sm mb-1.5">Mô tả kế hoạch</label>
            <textarea
              rows="2"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Lịch chiếu tuần này..."
              className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/40 outline-none resize-none text-sm"
            />
          </div>

          {/* Ngày */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-red-400 text-sm mb-1.5">Từ ngày</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white focus:border-red-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-red-400 text-sm mb-1.5">Đến ngày</label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-red-800 rounded-lg text-white focus:border-red-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Danh sách phim */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-red-400 text-sm">Chọn phim ({selectedMovies.length})</label>
              {selectedMovies.length > 0 && (
                <span className="text-gray-400 text-xs">{selectedMovies.length} phim</span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto bg-gray-900 border border-red-800 rounded-lg p-3 space-y-1.5">
              {movies.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-6">Đang tải phim...</p>
              ) : (
                movies.map(movie => (
                  <label
                    key={movie.id}
                    className="flex items-center gap-3 p-2 hover:bg-red-900/20 rounded transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMovies.includes(movie.id)}
                      onChange={() => toggleMovie(movie.id)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-white text-sm">{movie.title}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Nút */}
          <div className="flex gap-3 pt-4 border-t border-red-900/30">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-700 hover:bg-gray-900 rounded-lg text-white text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={selectedMovies.length === 0}
              className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-800 disabled:to-gray-900 disabled:cursor-not-allowed rounded-lg text-white text-sm font-bold transition shadow-md"
            >
              Gửi kế hoạch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}