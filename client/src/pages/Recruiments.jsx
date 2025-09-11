import React, { useEffect, useState } from "react";
import axios from "axios";
import { FilmIcon, X } from "lucide-react";
import emailjs from "@emailjs/browser";
import { useCinema } from "../context/CinemaContext"; // Import useCinema

const Recruiment = () => {
  const { selectedCinema, setSelectedCinema } = useCinema(); // Use context
  const [clusters, setClusters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedJob) {
      alert("Vui lòng chọn công việc để ứng tuyển.");
      return;
    }

    try {
      const form = new FormData();
      form.append("applicant_name", formData.name);
      form.append("applicant_email", formData.email);
      form.append("applicant_phone", formData.phone);
      if (formData.resume) {
        form.append("resume", formData.resume);
      }

      const res = await axios.post(`/api/recruitments/apply/${selectedJob.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("Ứng tuyển thành công!");
        setShowForm(false);
        setFormData({ name: "", email: "", phone: "", resume: null });
        emailjs
          .send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            {
              to_email: formData.email,
              applicant_email: formData.email, // Send to applicant
              name: formData.name,
              time: new Date().toLocaleString("vi-VN"),
              job_title: selectedJob.job_title,
              cinema_name: activeCinemaName,
              applicant_phone: formData.phone,
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          )
          .then(() => {
            console.log("✅ Email đã được gửi thành công!");
          })
          .catch((err) => {
            console.error("❌ Lỗi gửi email:", err);
          });
      } else {
        alert(res.data.message || "Ứng tuyển thất bại.");
      }
    } catch (err) {
      console.error("❌ Lỗi khi gửi ứng tuyển:", err);
      alert("Có lỗi xảy ra khi gửi ứng tuyển. Vui lòng thử lại sau.");
    }
  };

  // Close modal when clicking outside
  const handleCloseModal = (e) => {
    if (e.target.id === "modal-backdrop") {
      setShowForm(false);
    }
  };

  // Fetch cinema clusters
  useEffect(() => {
    axios
      .get("/api/cinemas/")
      .then((res) => {
        const cinemas = res.data.cinemas || [];
        setClusters(cinemas);
        if (cinemas.length > 0 && !selectedCinema) {
          setSelectedCinema(cinemas[0].id); // Set initial cinema if none selected
        }
      })
      .catch((err) => {
        console.error("Error fetching clusters:", err);
        setError("Không thể tải danh sách rạp.");
      })
      .finally(() => setLoading(false));
  }, [selectedCinema, setSelectedCinema]);

  // Fetch jobs for the selected cinema
  useEffect(() => {
    if (selectedCinema) {
      setLoading(true);
      setError(null);
      setSelectedJob(null);
      axios
        .get(`/api/recruitments/job/${selectedCinema}`)
        .then((res) => {
          if (res.data.success) {
            setJobs(res.data.jobs || []);
            if (res.data.jobs.length > 0) {
              setSelectedJob(res.data.jobs[0]);
            } else if (res.data.message) {
              setError(res.data.message);
            }
          } else {
            setJobs([]);
            setError("Không tìm thấy công việc cho rạp này.");
          }
        })
        .catch((err) => {
          console.error("Error fetching jobs:", err);
          setError("Lỗi khi tải thông tin công việc.");
        })
        .finally(() => setLoading(false));
    }
  }, [selectedCinema]);

  // Get cinema name from selectedCinema id
  const activeCinemaName = clusters.find((cluster) => cluster.id === selectedCinema)?.cinema_name || "N/A";

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <FilmIcon className="text-red-600 size-8" />
        <span className="text-3xl font-bold tracking-tight text-red-600">
          BAC Cinema Tuyển Dụng
        </span>
      </div>

      {/* Display Selected Cinema */}
      <div className="mb-6 text-center">
        <p className="text-gray-400">Rạp đang chọn: {activeCinemaName}</p>
      </div>

      {/* Main Content - Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Job List */}
        <div className="w-full lg:w-1/3 bg-gray-900 p-4 border border-gray-700 rounded-xl overflow-y-auto max-h-[60vh]">
          {loading && !jobs.length ? (
            <p className="text-gray-400 text-center">Đang tải danh sách công việc...</p>
          ) : error ? (
            <p className="text-red-600 text-center">{error}</p>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedJob?.id === job.id
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-red-700 hover:text-white"
                }`}
              >
                <h3 className="text-md font-semibold">{job.job_title}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(job.deadline).toLocaleDateString()} - {job.location}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">Không có công việc nào.</p>
          )}
        </div>

        {/* Right Panel - Job Details */}
        <div className="w-full lg:w-2/3 bg-gray-900 p-6 border border-gray-700 rounded-xl">
          {loading && !selectedJob ? (
            <p className="text-gray-400 text-center">Đang tải chi tiết công việc...</p>
          ) : error ? (
            <p className="text-red-600 text-center">{error}</p>
          ) : selectedJob ? (
            <div>
              <h2 className="text-xl font-bold text-red-600 mb-4">
                Chi tiết công việc: {selectedJob.job_title}
              </h2>
              <p className="text-gray-400">
                <strong>Bộ phận/Phòng ban:</strong> {selectedJob.department}
              </p>
              <p className="text-gray-400">
                <strong>Địa điểm làm việc:</strong> {selectedJob.location}
              </p>
              <p className="text-gray-400">
                <strong>Báo cáo:</strong> {selectedJob.report_to}
              </p>
              <p className="text-gray-400 mt-2">
                <strong>Mô tả công việc:</strong> {selectedJob.job_description}
              </p>
              <p className="text-gray-400">
                <strong>Yêu cầu:</strong> {selectedJob.requirements}
              </p>
              <p className="text-gray-400">
                <strong>Lợi ích:</strong> {selectedJob.benefits}
              </p>
              <p className="text-gray-400">
                <strong>Mức lương:</strong> {selectedJob.salary_range}
              </p>
              <p className="text-gray-400">
                <strong>Hạn chót:</strong> {new Date(selectedJob.deadline).toLocaleDateString()}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
              >
                Ứng Tuyển Ngay
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-center">Vui lòng chọn một công việc.</p>
          )}
        </div>
      </div>

      {/* Modal for Application Form */}
      {showForm && (
        <div
          id="modal-backdrop"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-red-600">Form Ứng Tuyển</h3>
                {selectedJob && (
                  <p className="text-sm text-gray-400">
                    Vị trí: {selectedJob.job_title} - Rạp: {activeCinemaName}
                  </p>
                )}
              </div>
              <button onClick={() => setShowForm(false)}>
                <X className="text-gray-400 hover:text-red-600 size-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Họ và Tên</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-red-600"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-red-600"
                  placeholder="Nhập email"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-red-600"
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Tệp CV (PDF)</label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf"
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-red-600"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
              >
                Gửi Ứng Tuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Objective Section */}
      <div className="mt-6 p-6 border border-gray-700 rounded-xl bg-gray-800">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Mục tiêu của vị trí công việc
        </h2>
        <p className="text-gray-400">
          - Chú trọng nâng cao kỹ năng chuyên môn, đảm bảo chất lượng công việc tại rạp
          chiếu phim, đồng thời đóng góp vào việc phát triển hình ảnh, thương hiệu của
          công ty.
        </p>
      </div>
    </div>
  );
};

export default Recruiment;