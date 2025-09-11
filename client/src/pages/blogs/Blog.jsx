import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useCinema } from "../../context/CinemaContext";

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
        setCinemas(res.data.cinemas || []);
      } catch (err) {
        setError("Không thể tải danh sách rạp: " + (err.response?.data?.error || err.message));
        console.error("Error fetching cinemas:", err);
      }
    };
    fetchCinemas();
  }, []);

  // Fetch blog posts based on selected cinema
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

  if (isLoading) return <div className="p-6 text-white">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="p-6  max-w-6xl mx-auto bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>

      {/* Dropdown chọn rạp */}
     

      {/* Danh sách bài viết */}
      {selectedCinema ? (
        <>
          {posts.length === 0 ? (
            <p className="text-gray-400">Không có bài viết nào cho rạp này.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <Link to={`/posts/${selectedCinema}/${post.id}`}>
                    {post.image_url && (
                      <img
                        className="rounded-t-lg w-full h-48 object-cover"
                        src={post.image_url}
                        alt={post.title}
                      />
                    )}
                  </Link>
                  <div className="p-5">
                    <Link to={`/posts/${selectedCinema}/${post.id}`}>
                      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {post.title}
                      </h5>
                    </Link>
                    <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 line-clamp-3">
                      {post.description?.slice(0, 120) || "Không có mô tả..."}
                    </p>
                    <Link
                      to={`/posts/${selectedCinema}/${post.id}`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Xem chi tiết
                      <svg
                        className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 10"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M1 5h12m0 0L9 1m4 4L9 9"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400">Vui lòng chọn một rạp để xem bài viết.</p>
      )}
    </div>
  );
};

export default Blog;