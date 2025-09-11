import React, { useEffect, useState } from "react";
import axios from "axios";
import { FilmIcon, PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "react-toastify";

const QuanLyTuyenDung = ({ cinemaId }) => {
  const [jobs, setJobs] = useState([]);
  const [cinemaName, setCinemaName] = useState("N/A");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [formData, setFormData] = useState({
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

  // Fetch cinema name and jobs
  useEffect(() => {
    if (cinemaId) {
      setLoading(true);
      setError(null);

      // Fetch cinema name

       

      // Fetch jobs
      axios
        .get(`/api/recruitments/jobs/${cinemaId}`)
        .then((res) => {
          if (res.data.success) {
            setJobs(res.data.jobs || []);
          } else {
            setJobs([]);
            setError(res.data.message || "Không tìm thấy công việc nào.");
          }
        })
        .catch((err) => {
          console.error("Error fetching jobs:", err);
          setError("Lỗi khi tải danh sách công việc.");
        })
        .finally(() => setLoading(false));
    } else {
      setError("Không có thông tin rạp được cung cấp.");
      setLoading(false);
    }
  }, [cinemaId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for adding or editing
  const openModal = (job = null) => {
    setSelectedJob(job);
    setFormData(
      job
        ? { ...job, deadline: job.deadline.split("T")[0] } // Format date for input
        : {
            job_title: "",
            department: "",
            location: "",
            report_to: "",
            job_description: "",
            requirements: "",
            benefits: "",
            salary_range: "",
            deadline: "",
          }
    );
    setIsModalOpen(true);
  };

  // Submit form for add or edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, cinema_id: cinemaId };
      if (selectedJob) {
        // Update job
        await axios.put(`/api/recruitments/job/${selectedJob.id}`, payload);
        toast.success("Cập nhật công việc thành công!", { position: "top-right", theme: "dark" });
        setJobs((prev) =>
          prev.map((job) => (job.id === selectedJob.id ? { ...job, ...formData } : job))
        );
      } else {
        // Create job
        const res = await axios.post(`/api/recruitments/job`, payload);
        toast.success("Tạo công việc thành công!", { position: "top-right", theme: "dark" });
        setJobs((prev) => [
          ...prev,
          { ...formData, id: res.data.job_id, application_count: 0, cinema_name: cinemaName },
        ]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting job:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu công việc.", {
        position: "top-right",
        theme: "dark",
      });
    }
  };

  // Open delete confirmation
  const confirmDelete = (jobId) => {
    setDeleteJobId(jobId);
    setIsDeleteConfirmOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/recruitments/job/${deleteJobId}`);
      toast.success("Xóa công việc thành công!", { position: "top-right", theme: "dark" });
      setJobs((prev) => prev.filter((job) => job.id !== deleteJobId));
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa công việc.", {
        position: "top-right",
        theme: "dark",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <FilmIcon className="text-red-600 size-8" />
        <span className="text-3xl font-bold tracking-tight text-red-600">
          Quản Lý Tuyển Dụng
        </span>
      </div>

      {/* Add Job Button */}
      <div className="mb-6">
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
        >
          <PlusIcon className="size-5" />
          Thêm Công Việc
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-gray-900 p-6 border border-gray-700 rounded-xl">
        {loading ? (
          <p className="text-gray-400 text-center">Đang tải danh sách công việc...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-3 text-gray-300 font-semibold">Tiêu đề</th>
                  <th className="p-3 text-gray-300 font-semibold">Bộ phận</th>
                  <th className="p-3 text-gray-300 font-semibold">Địa điểm</th>
                  <th className="p-3 text-gray-300 font-semibold">Mức lương</th>
                  <th className="p-3 text-gray-300 font-semibold">Hạn nộp</th>
                  <th className="p-3 text-gray-300 font-semibold">Số ứng viên</th>
                  <th className="p-3 text-gray-300 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t border-gray-700 hover:bg-gray-800 transition-all duration-200"
                  >
                    <td className="p-3 text-gray-400">{job.job_title}</td>
                    <td className="p-3 text-gray-400">{job.department}</td>
                    <td className="p-3 text-gray-400">{job.location}</td>
                    <td className="p-3 text-gray-400">{job.salary_range}</td>
                    <td className="p-3 text-gray-400">
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-400">{job.application_count}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openModal(job)}
                        className="text-red-600 hover:text-red-400"
                        title="Sửa"
                      >
                        <PencilIcon className="size-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(job.id)}
                        className="text-red-600 hover:text-red-400"
                        title="Xóa"
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center">Không có công việc nào cho rạp này.</p>
        )}
      </div>

      {/* Modal for Add/Edit Job */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              {selectedJob ? "Sửa Công Việc" : "Thêm Công Việc"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Bộ phận</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Địa điểm</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Báo cáo cho</label>
                <input
                  type="text"
                  name="report_to"
                  value={formData.report_to}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Mô tả công việc</label>
                <textarea
                  name="job_description"
                  value={formData.job_description}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Yêu cầu</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Quyền lợi</label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Mức lương</label>
                <input
                  type="text"
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Hạn nộp</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  required
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {selectedJob ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-full max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Xác nhận xóa</h2>
            <p className="text-gray-300 mb-4">
              Bạn có chắc chắn muốn xóa công việc này? Tất cả ứng viên liên quan sẽ bị xóa.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyTuyenDung;