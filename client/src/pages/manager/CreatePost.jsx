import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import { FileText, Image, Save, ArrowLeft, Loader2 } from "lucide-react";

const CreatePost = ({ cinemaId }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Vui lòng nhập tiêu đề và nội dung!");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("content", content);
    formData.append("status", status);
    if (image) formData.append("image", image);

    try {
      await axios.post(`/api/posts/${cinemaId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/manager/qlbv");
    } catch (err) {
      setError(err.response?.data?.error || "Không thể tạo bài viết");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-8 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Viết Bài Mới
              </h1>
              <p className="text-gray-400">Tạo bài viết tin tức, sự kiện cho rạp</p>
            </div>
          </div>

          <Link
            to="/manager/qlbv"
            className="flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-all shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-5 bg-red-900/50 border border-red-700 rounded-2xl text-red-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Tiêu đề */}
          <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Tiêu đề bài viết *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Nhập tiêu đề hấp dẫn..."
              className="w-full px-6 py-4 bg-gray-800/70 border border-gray-700 rounded-xl text-xl font-bold focus:border-purple-500 focus:outline-none transition placeholder-gray-500"
            />
          </div>

          {/* Mô tả ngắn */}
          <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Mô tả ngắn (SEO)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt nội dung bài viết..."
              className="w-full px-6 py-4 bg-gray-800/70 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition placeholder-gray-500"
            />
          </div>

          {/* Ảnh đại diện */}
          <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" /> Ảnh đại diện (thumbnail)
            </label>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-5 py-4 bg-gray-800/70 border border-gray-700 rounded-xl file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition cursor-pointer"
                />
              </div>
              {imagePreview && (
                <div className="flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover rounded-xl border border-gray-700 shadow-2xl" />
                </div>
              )}
            </div>
          </div>

          {/* Nội dung */}
          <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-300 mb-4">Nội dung bài viết *</label>
            <div className="rounded-xl overflow-hidden border border-gray-700">
              <Editor
                apiKey="f01lyjph5xum8q3e8ixtizy1mj32ptu4nuzq6p23j0ndi4kl"
                value={content}
                onEditorChange={setContent}
                init={{
                  height: 500,
                  menubar: true,
                  plugins: "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste help wordcount",
                  toolbar: "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image media | code | help",
                  content_style: `
                    body { font-family: 'Inter', sans-serif; font-size: 16px; color: #e5e7eb; background-color: #1f2937; padding: 20px; }
                    h1,h2,h3,h4,h5,h6 { color: #c084fc; }
                    a { color: #a78bfa; }
                    img { max-width: 100%; height: auto; border-radius: 12px; }
                  `,
                  branding: false,
                  statusbar: true,
                  resize: true,
                }}
              />
            </div>
          </div>

          {/* Trạng thái */}
          <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Trạng thái bài viết</label>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <label className="flex items-center gap-3 p-4 bg-gray-800/70 rounded-xl cursor-pointer hover:bg-gray-700/70 transition">
                <input type="radio" name="status" value="draft" checked={status === "draft"} onChange={(e) => setStatus(e.target.value)} className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Nháp</span>
              </label>
              <label className="flex items-center gap-3 p-4 bg-gray-800/70 rounded-xl cursor-pointer hover:bg-gray-700/70 transition">
                <input type="radio" name="status" value="published" checked={status === "published"} onChange={(e) => setStatus(e.target.value)} className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-400">Xuất bản ngay</span>
              </label>
            </div>
          </div>

          {/* Nút submit */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl font-bold text-xl shadow-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  Đang đăng bài...
                </>
              ) : (
                <>
                  <Save className="w-8 h-8" />
                  {status === "published" ? "Đăng bài ngay" : "Lưu nháp"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;