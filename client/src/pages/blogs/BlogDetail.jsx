import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const BlogDetail = () => {
  const { cinema_id, post_id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch blog detail
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/api/posts/${cinema_id}/${post_id}`);
        setPost(res.data.post || null);
      } catch (err) {
        setError("Không thể tải chi tiết bài viết: " + (err.response?.data?.error || err.message));
        console.error("Error fetching blog detail:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [cinema_id, post_id]);

  if (isLoading) return <div className="p-6 text-white">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!post) return <div className="p-6 text-gray-400">Bài viết không tồn tại.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-black text-white min-h-screen">
      <Link
        to={`/blog`}
        className="text-blue-400 hover:underline mb-4 inline-block"
      >
        ← Quay lại danh sách
      </Link>

      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-400 mb-6 text-left ">
        {post.description}
      </p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.title}
          className="w-full h-96 object-cover rounded-lg mb-6"
        />
      )}

      <p className="text-gray-400 mb-6">
        {post.created_at
          ? new Date(post.created_at).toLocaleDateString("vi-VN")
          : ""}
      </p>
    
      <div className="prose prose-invert max-w-none">
        {/* Nội dung chi tiết, nếu backend trả về HTML thì dùng dangerouslySetInnerHTML */}
        {post.content ? (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <p>Không có nội dung chi tiết.</p>
        )}
      </div>
    </div>
  );
};

export default BlogDetail;
