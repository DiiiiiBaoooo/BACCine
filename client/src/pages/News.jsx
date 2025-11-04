"use client";

import React, { useState, useEffect } from "react";
import { CalendarIcon, ClockIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import BlurCircle from "../components/BlurCircle";

const News = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const res = await axios.get("/api/posts");
        const latestPosts = res.data.posts
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 4);
        setPosts(latestPosts);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi tải tin tức:", err);
        setError("Không thể tải tin tức. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };
    fetchLatestPosts();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Skeleton Loading
  if (loading) {
    return (
      <section className="py-16 px-6 md:px-16 lg:px-36 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Tin Tức Mới Nhất</h2>
            <p className="mt-3 text-gray-400">Cập nhật phim mới, ưu đãi, sự kiện rạp</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-700"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-600 rounded w-full"></div>
                  <div className="h-4 bg-gray-600 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-6 md:px-16 lg:px-36 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 md:px-16 lg:px-36 ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-xs md:text-lg font-bold text-white tracking-tight">
              Tin Tức Mới Nhất
            </h2>
            <p className="mt-2 text-gray-400 text-xs">Cập nhật phim mới, ưu đãi, sự kiện rạp</p>
          </div>
          <Link
            to="/blog"
            className="group hidden text-xs md:flex items-center gap-2 text-white hover:text-red-400 font-medium transition-all duration-300"
          >
            Xem tất cả
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <BlurCircle right="0" />
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              to={`/blogs/${post.cinema_id}/${post.id}`}
              className="group block bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 hover:border-red-500/30"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={post.image_url || "/placeholder-news.jpg"}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90"></div>
                <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  MỚI
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors duration-300">
                  {post.title}
                </h3>

                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                  {post.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>2 phút đọc</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-2 flex items-center text-red-500 text-sm font-medium group-hover:text-red-400 transition-colors">
                  Xem chi tiết
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden text-center mt-12">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
          >
            Xem tất cả tin tức
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default News;