import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";

const CreatePost = ({ cinemaId }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [content, setContent] = useState("");

  const [status, setStatus] = useState("draft");
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    formData.append("content", content);
    formData.append("status", status);
    if (image) formData.append("image", image);

    try {
      const res = await axios.post(`/api/posts/${cinemaId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Post created:", res.data.post);
      navigate(`/posts`);
    } catch (err) {
      setError("Không thể tạo bài viết: " + (err.response?.data?.error || err.message));
      console.error("Error creating post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6 bg-blue-900 p-4 rounded-lg">
        <h2 className="text-2xl font-bold">Tạo bài viết mới</h2>
        <Link to="/manager/qlbv" className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
          Quay lại
        </Link>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-200">
            Tiêu đề
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập tiêu đề bài viết"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-200">
           Mô tả
          </label>
          <input
            type="text"
            id="title"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập tiêu đề bài viết"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-200">
            Nội dung
          </label>
          <Editor
            apiKey="f01lyjph5xum8q3e8ixtizy1mj32ptu4nuzq6p23j0ndi4kl"
            value={content}
            onEditorChange={(newContent) => setContent(newContent)}
            init={{
              height: 400,
              menubar: true,
              plugins: [
                "advlist", "autolink", "lists", "link", "image", "charmap", "print", "preview", "anchor",
                "searchreplace", "visualblocks", "code", "fullscreen", "insertdatetime", "media", "table",
                "paste", "help", "wordcount",
              ],
              toolbar: "undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
              content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; color: #ffffff; background-color: #1f2937; }",
            }}
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-200">
            Trạng thái
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Nháp</option>
            <option value="published">Xuất bản</option>
          </select>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-200">
            Hình ảnh
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Đang tạo..." : "Tạo bài viết"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;