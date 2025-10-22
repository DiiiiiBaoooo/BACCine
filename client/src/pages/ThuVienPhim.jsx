import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ThuVienPhim = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/api/video");
        setMovies(response.data);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách phim:", err);
        setError("Không thể tải danh sách phim. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải danh sách phim...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-lg transition"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🎬 Thư Viện Phim
          </h1>
          <p className="text-gray-400">
            {movies.length} {movies.length === 1 ? "phim" : "phim"}
          </p>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">📽️</div>
            <p className="text-gray-400 text-lg">Chưa có phim nào trong thư viện</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <Link
                key={movie.video_id}
                to={`/xem-phim/${movie.s3_folder_name}`}
                className="bg-gray-800 rounded-lg shadow-lg hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 group overflow-hidden"
              >
                <div className="relative aspect-[2/3] bg-gray-700 overflow-hidden">
                  <img
                    src={movie.poster_image_url || "https://via.placeholder.com/300x450?text=No+Image"}
                    alt={movie.video_title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-3">
                  <h2 className="text-sm font-semibold line-clamp-2 group-hover:text-cyan-400 transition-colors">
                    {movie.video_title}
                  </h2>
                  {movie.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(movie.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThuVienPhim;