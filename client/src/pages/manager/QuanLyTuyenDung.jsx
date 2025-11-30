import React, { useEffect, useState } from "react";
import axios from "axios";
import { Film, Plus, Edit2, Trash2, Calendar, Users, DollarSign, Building } from "lucide-react";
import { toast } from "react-toastify";

const QuanLyTuyenDung = ({ cinemaId }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    job_title: "",
    department: "",
    location: "",
    report_to: "",
    job_description: "",
    requirements: "",
    benefits: "",
    salary_range: "",
    deadline: "",
  });

  useEffect(() => {
    if (!cinemaId) {
      setError("Không có thông tin rạp.");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios.get(`/api/recruitments/jobs/${cinemaId}`)
      .then(res => {
        if (res.data.success) setJobs(res.data.jobs || []);
        else setError("Không tải được danh sách tuyển dụng.");
      })
      .catch(() => setError("Lỗi kết nối server."))
      .finally(() => setLoading(false));
  }, [cinemaId]);

  const openModal = (job = null) => {
    setEditingJob(job);
    setForm(job ? {
      ...job,
      deadline: job.deadline.split("T")[0]
    } : {
      job_title: "", department: "", location: "", report_to: "",
      job_description: "", requirements: "", benefits: "", salary_range: "", deadline: ""
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, cinema_id: cinemaId };
      if (editingJob) {
        await axios.put(`/api/recruitments/job/${editingJob.id}`, payload);
        toast.success("Cập nhật thành công!");
        setJobs(prev => prev.map(j => j.id === editingJob.id ? { ...j, ...form } : j));
      } else {
        const res = await axios.post("/api/recruitments/job", payload);
        toast.success("Tạo tin tuyển dụng thành công!");
        setJobs(prev => [...prev, { ...form, id: res.data.job_id, application_count: 0 }]);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu!");
    }
  };

  const confirmDelete = (id) => {
    setDeletingId(id);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/recruitments/job/${deletingId}`);
      toast.success("Đã xóa tin tuyển dụng!");
      setJobs(prev => prev.filter(j => j.id !== deletingId));
      setDeleteConfirm(false);
    } catch {
      toast.error("Lỗi khi xóa!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl">
              <Film className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Quản Lý Tuyển Dụng
              </h1>
              <p className="text-gray-400">Tạo và quản lý tin tuyển dụng</p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition-all shadow-lg"
          >
            <Plus className="w-6 h-6" />
            Thêm tin tuyển dụng
          </button>
        </div>

        {error ? (
          <div className="text-center py-20 text-red-400 text-xl">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
            <Users className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <p className="text-2xl text-gray-400">Chưa có tin tuyển dụng nào</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map(job => (
              <div
                key={job.id}
                className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-purple-300">{job.job_title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(job)}
                      className="p-2 bg-gray-800 hover:bg-purple-600 rounded-lg transition"
                      title="Sửa"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => confirmDelete(job.id)}
                      className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-400" />
                    {job.department}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-400" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    {job.salary_range || "Thoả thuận"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-yellow-400" />
                    Hạn nộp: {new Date(job.deadline).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">{job.application_count || 0}</span> ứng viên
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-purple-300">
                  {editingJob ? "Sửa Tin Tuyển Dụng" : "Thêm Tin Tuyển Dụng"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <input type="text" name="job_title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder="Tiêu đề công việc" required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                  <input type="text" name="department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Bộ phận" required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                  <input type="text" name="location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Địa điểm làm việc" required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                  <input type="text" name="salary_range" value={form.salary_range} onChange={e => setForm({ ...form, salary_range: e.target.value })} placeholder="Mức lương (VD: 10-15 triệu)" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                  <input type="date" name="deadline" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                  <input type="text" name="report_to" value={form.report_to} onChange={e => setForm({ ...form, report_to: e.target.value })} placeholder="Báo cáo cho ai?" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                </div>

                <textarea name="job_description" value={form.job_description} onChange={e => setForm({ ...form, job_description: e.target.value })} placeholder="Mô tả công việc" rows="4" required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                <textarea name="requirements" value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="Yêu cầu ứng viên" rows="4" required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />
                <textarea name="benefits" value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} placeholder="Quyền lợi" rows="4" required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none transition" />

                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition">
                    Hủy
                  </button>
                  <button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition shadow-lg">
                    {editingJob ? "Cập nhật" : "Tạo tin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Xóa xác nhận */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-sm">
              <h3 className="text-xl font-bold text-red-400 mb-4">Xác nhận xóa</h3>
              <p className="text-gray-300 mb-6">Bạn có chắc chắn muốn xóa tin tuyển dụng này?</p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setDeleteConfirm(false)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition">
                  Hủy
                </button>
                <button onClick={handleDelete} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuanLyTuyenDung;