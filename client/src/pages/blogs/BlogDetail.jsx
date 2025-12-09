import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Calendar, Clock } from "lucide-react"; // Thêm icon đẹp (cần cài lucide-react)

const BlogDetail = () => {
  const { cinema_id, post_id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/api/posts/${cinema_id}/${post_id}`);
        setPost(res.data.post || null);
      } catch (err) {
        setError("Không thể tải bài viết. Vui lòng thử lại sau.");
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [cinema_id, post_id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-white mb-2">Bài viết không tồn tại</h2>
          <p className="text-gray-400 mb-6">{error || "Chúng tôi không tìm thấy bài viết bạn đang tìm."}</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-full transition"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const readingTime = post.content
    ? Math.max(1, Math.ceil(post.content.split(" ").length / 200))
    : 1;

  return (
    <article className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {/* Hero Section với hình ảnh lớn */}
      <div className="relative h-screen max-h-screen overflow-hidden">
        {post.image_url ? (
          <>
            <img
              src={post.image_url}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/30 via-black to-zinc-900"></div>
        )}

        {/* Nội dung overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-5xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-8 transition-colors duration-300 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại tin tức</span>
          </Link>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 drop-shadow-2xl">
            {post.title}
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 max-w-4xl leading-relaxed opacity-95">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-8 text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{formatDate(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>{readingTime} phút đọc</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="max-w-4xl mx-auto px-6 py-16 -mt-32 relative z-10">
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-zinc-800">
          <div
            className="prose prose-invert prose-lg max-w-none
                       prose-headings:text-yellow-400 prose-headings:font-bold
                       prose-p:text-gray-200 prose-p:leading-relaxed
                       prose-blockquote:border-l-yellow-500 prose-blockquote:bg-zinc-800/50
                       prose-a:text-yellow-400 hover:prose-a:text-yellow-300
                       prose-strong:text-white
                       prose-ul:text-gray-200 prose-li:marker:text-yellow-500"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Nút quay lại cuối bài */}
        <div className="text-center mt-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-xl"
          >
            <ArrowLeft size={22} />
            Xem thêm tin tức khác
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogDetail;