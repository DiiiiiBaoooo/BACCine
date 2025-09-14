import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Editor } from "@tinymce/tinymce-react";

const EditBlog = ({ cinemaId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    status: "draft",
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu bài viết hiện tại
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/api/posts/${cinemaId}/${id}`);
        setFormData({
          title: res.data.post.title,
          description: res.data.post.description,
          content: res.data.post.content,
          status: res.data.post.status,
          image: null,
        });
        setPreview(res.data.post.image_url);
      } catch (err) {
        alert("Không thể tải dữ liệu bài viết");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, cinemaId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData({ ...formData, image: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleEditorChange = (content) => {
    setFormData({ ...formData, content });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    try {
      await axios.put(`/api/posts/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Cập nhật thành công!");
      navigate(-1);
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật bài viết");
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sửa bài viết</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tiêu đề */}
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Tiêu đề"
          className="w-full border p-2 rounded"
          required
        />

        {/* Mô tả */}
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả ngắn"
          className="w-full border p-2 rounded"
        />

        {/* TinyMCE Editor */}
        <Editor
          apiKey="f01lyjph5xum8q3e8ixtizy1mj32ptu4nuzq6p23j0ndi4kl" // 👉 đăng ký miễn phí tại https://www.tiny.cloud
          value={formData.content}
          init={{
            height: 400,
            menubar: true,
            plugins: [
                "advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor",
                "searchreplace", "visualblocks", "code", "fullscreen",
                "insertdatetime", "media", "table", "code", "help", "wordcount"
              ],
              toolbar:
                "undo redo | formatselect | bold italic backcolor | \
                 alignleft aligncenter alignright alignjustify | \
                 bullist numlist outdent indent | removeformat | help",
          }}
          onEditorChange={handleEditorChange}
        />

        {/* Trạng thái */}
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="draft">Nháp</option>
          <option value="published">Xuất bản</option>
        </select>

        {/* Ảnh đại diện */}
        <div>
          <label className="block mb-1">Ảnh đại diện:</label>
          {preview && <img src={preview} alt="Preview" className="w-40 mb-2 rounded" />}
          <input type="file" name="image" accept="image/*" onChange={handleChange} />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
};

export default EditBlog;
