import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const QuanLyBaiViet = ({ cinemaId }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = cinemaId ? `/api/posts/${cinemaId}` : "/api/posts";
        const res = await axios.get(url);
        setPosts(res.data.posts || []);
      } catch (err) {
        setError("Không thể tải danh sách bài viết");
        console.error("Lỗi khi lấy bài viết:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [cinemaId]);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      const originalPosts = [...posts];
      setPosts(posts.filter((p) => p.id !== id));
      try {
        await axios.delete(`/api/posts/${id}`);
      } catch (err) {
        setPosts(originalPosts);
        console.error("Lỗi khi xóa bài viết:", err);
        alert("Không thể xóa bài viết");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý bài viết</h2>
        <Link to="new" className="px-4 py-2 bg-blue-600 text-white rounded">
          + Thêm bài viết
        </Link>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div className="text-center py-4">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">Tiêu đề</th>
                <th className="px-4 py-2">Ngày đăng</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Link</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{p.title}</td>
                  <td className="px-4 py-2">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2">
                    {p.status === "published" ? (
                      <span className="text-green-600 font-semibold">Xuất bản</span>
                    ) : (
                      <span className="text-gray-500">Nháp</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-blue-600">
                    <a href={`/bai-viet/${p.id}`} target="_blank" rel="noopener noreferrer">
                      Xem
                    </a>
                  </td>
                  <td className="px-4 py-2 space-x-3">
                    <Link to={`/posts/edit/${p.id}`} className="text-blue-600 hover:underline">
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    Chưa có bài viết nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuanLyBaiViet;