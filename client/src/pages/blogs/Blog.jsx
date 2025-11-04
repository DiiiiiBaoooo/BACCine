"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useCinema } from "../../context/CinemaContext";
import { MapPin, ChevronDown, Film } from "lucide-react";

const Blog = () => {
  const { selectedCinema, setSelectedCinema } = useCinema();
  const [cinemas, setCinemas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cinemas
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await axios.get("/api/cinemas");
        const cinemaList = res.data.cinemas || [];
        setCinemas(cinemaList);

        if (cinemaList.length > 0 && !selectedCinema) {
          setSelectedCinema(cinemaList[0].id);
        }
      } catch (err) {
        setError("Không thể tải danh sách rạp: " + (err.response?.data?.error || err.message));
        console.error("Error fetching cinemas:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCinemas();
  }, [setSelectedCinema]);

  // Fetch blog posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!selectedCinema) {
        setPosts([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/posts/${selectedCinema}`);
        setPosts(res.data.posts || []);
      } catch (err) {
        setError("Không thể tải bài viết: " + (err.response?.data?.error || err.message));
        console.error("Error fetching posts:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [selectedCinema]);

  const activeCinemaName = cinemas.find(c => c.id === selectedCinema)?.cinema_name || "Chọn rạp";

  return (
    <div className="min-h-screen    bg-gradient-to-b from-black via-gray-900 to-black text-white py-10 px-6 md:px-12 lg:px-20">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Film className="w-10 h-10 text-red-600" />
          <h1 className="text-4xl md:text-5xl font-bold text-red-600 tracking-tight">
            Blog BAC Cinema
          </h1>
        </div>
        <p className="text-gray-400 text-lg">Cập nhật tin tức, sự kiện, phim mới tại rạp</ p>
      </div>

      {/* Glassmorphism Selector: Tiêu đề bên TRÁI – Dropdown bên PHẢI */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition duration-300"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* TIÊU ĐỀ BÊN TRÁI */}
              <div className="flex items-center gap-3 text-left">
                <MapPin className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-sm text-gray-400">Đang xem bài viết của</p>
                  <p className="text-xl font-bold text-white">{activeCinemaName}</p>
                </div>
              </div>

              {/* DROPDOWN BÊN PHẢI */}
              <div className="relative w-full md:w-64">
                <select
                  value={selectedCinema || ""}
                  onChange={(e) => setSelectedCinema(parseInt(e.target.value))}
                  className="w-full appearance-none bg-gray-700/50 backdrop-blur-md border border-white/20 text-white px-5 py-3 pr-10 rounded-lg font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                >
                  <option value="" disabled>Chọn rạp...</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema.id} value={cinema.id} className="bg-gray-800 text-white">
                      {cinema.cinema_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-600/30 transition"
          >
            Thử lại
          </button>
        </div>
      ) : !selectedCinema ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Vui lòng chọn một rạp để xem bài viết.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Không có bài viết nào cho rạp này.</p>
        </div>
      ) : (
        /* Blog Grid */
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02]"
            >
              <Link to={`/blogs/${selectedCinema}/${post.id}`} className="block">
                {post.image_url ? (
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <Film className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                    {post.description?.slice(0, 120) || "Không có mô tả..."}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="inline-flex items-center text-xs font-medium text-red-400 group-hover:text-red-300">
                      Xem chi tiết
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blog;  