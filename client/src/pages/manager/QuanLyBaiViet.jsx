import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FileText, Plus, Edit2, Trash2, Eye, Calendar, Clock, CheckCircle } from "lucide-react";

const QuanLyBaiViet = ({ cinemaId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const url = cinemaId ? `/api/posts/${cinemaId}` : "/api/posts";
        const res = await axios.get(url);
        setPosts(res.data.posts || []);
      } catch (err) {
        setError("Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [cinemaId]);

  const handleDelete = async (id) => {
    if (!confirm("Xóa bài viết này?")) return;
    const backup = [...posts];
    setPosts(posts.filter(p => p.id !== id));
    try {
      await axios.delete(`/api/posts/${id}`);
    } catch {
      setPosts(backup);
      alert("Xóa thất bại!");
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) : "—";
  };

  const statusBadge = (status) => {
    return status === "published" ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-900/60 text-green-300">
        <CheckCircle className="w-3 h-3" /> Đã đăng
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-800/70 text-gray-400">
        <Clock className="w-3 h-3" /> Nháp
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-8 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Quản Lý Bài Viết
              </h1>
              <p className="text-gray-400">Tạo và quản lý tin tức, sự kiện</p>
            </div>
          </div>

          <Link
            to="new"
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold transition-all shadow-lg"
          >
            <Plus className="w-6 h-6" />
            Viết bài mới
          </Link>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-900/50 border border-red-700 rounded-2xl text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Danh sách bài viết */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
            <FileText className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <p className="text-2xl text-gray-400">Chưa có bài viết nào</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <div
                key={post.id}
                className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all group"
              >
                {/* Thumbnail */}
                {post.thumbnail && (
                  <div className="relative overflow-hidden">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-purple-300 line-clamp-2">
                      {post.title}
                    </h3>
                    {statusBadge(post.status)}
                  </div>

                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                    {post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 120) + "..."}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <a
                      href={`/blogs/${cinemaId}/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-blue-600 rounded-xl transition"
                    >
                      <Eye className="w-5 h-5" /> Xem
                    </a>
                    <Link
                      to={`/posts/edit/${post.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-purple-600 rounded-xl transition"
                    >
                      <Edit2 className="w-5 h-5" /> Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-red-600 rounded-xl transition"
                    >
                      <Trash2 className="w-5 h-5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuanLyBaiViet;