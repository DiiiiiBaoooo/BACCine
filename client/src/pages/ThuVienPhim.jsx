import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

const ThuVienPhim = () => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/api/video")
        setMovies(response.data)
        setError(null)
      } catch (err) {
        console.error("Lỗi khi lấy danh sách phim:", err)
        setError("Không thể tải danh sách phim. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  // === HÀM XỬ LÝ NHÃN GIÁ ===
  const getPriceLabel = (movie) => {
    if (movie.is_free === 1) {
      return (
        <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg animate-pulse">
          MIỄN PHÍ
        </span>
      )
    }

    if (movie.price > 0) {
      const isRental = movie.rental_duration !== null
      return (
        <span
          className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full shadow-lg flex items-center gap-1 ${
            isRental
              ? 'bg-gradient-to-r from-orange-500 to-red-600'
              : 'bg-gradient-to-r from-purple-600 to-pink-600'
          }`}
        >
          {isRental ? 'THUÊ' : 'MUA'}
          <span className="text-xs">
            {Number(movie.price).toLocaleString()}đ
          </span>
          {isRental && (
            <span className="text-xs opacity-80">
              /{movie.rental_duration}d
            </span>
          )}
        </span>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-300 animate-spin"></div>
            <div
              className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <p className="text-emerald-200 text-lg font-light tracking-wide">Đang tải danh sách phim...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-300 text-xl mb-6">Lỗi: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
          >
            Tải lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-emerald-400 text-sm font-light tracking-widest uppercase mb-2">Thư Viện Phim</p>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-300 via-emerald-200 to-purple-300 bg-clip-text text-transparent">
                Khám Phá
              </h1>
            </div>
            <div className="text-right">
              <p className="text-emerald-300 text-sm font-light">
                <span className="text-2xl font-bold">{movies.length}</span>
              </p>
              <p className="text-slate-400 text-xs tracking-wide">Phim trong thư viện</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm font-light">Khám phá bộ sưu tập phim tuyệt vời của chúng tôi</p>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pb-20">
        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="text-8xl mb-6 opacity-50">Phim</div>
            <p className="text-slate-400 text-xl font-light">Chưa có phim nào trong thư viện</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <Link
                key={movie.video_id}
                to={`/xem-phim/${movie.video_id}`}
                className="group relative block"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/30">
                  {/* Poster */}
                  <img
                    src={movie.poster_image_url || "https://via.placeholder.com/300x450?text=No+Image"}
                    alt={movie.video_title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x450?text=No+Image"
                    }}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-xl border border-emerald-400/0 group-hover:border-emerald-400/50 transition-all duration-300"></div>

                  {/* NHÃN GIÁ / MIỄN PHÍ */}
                  {getPriceLabel(movie)}

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h2 className="text-sm font-semibold line-clamp-2 text-white group-hover:text-emerald-200 transition-colors duration-300 mb-2">
                      {movie.video_title}
                    </h2>
                    {movie.created_at && (
                      <p className="text-xs text-slate-400 group-hover:text-emerald-300/70 transition-colors duration-300">
                        {new Date(movie.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>

                  {/* Play button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
                    <div className="w-16 h-16 rounded-full bg-red-400/90 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                      <div className="w-0 h-0 border-l-8 border-l-white border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ThuVienPhim