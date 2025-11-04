"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { FilmIcon, X, MapPin, ChevronDown } from "lucide-react";
import emailjs from "@emailjs/browser";
import { useCinema } from "../context/CinemaContext";

const Recruiment = () => {
  const { selectedCinema, setSelectedCinema } = useCinema();
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

        // Gửi email xác nhận
        emailjs
          .send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            {
              to_email: formData.email,
              applicant_email: formData.email,
              name: formData.name,
              time: new Date().toLocaleString("vi-VN"),
              job_title: selectedJob.job_title,
              cinema_name: activeCinemaName,
              applicant_phone: formData.phone,
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          )
          .then(() => console.log("Email xác nhận đã được gửi!"))
          .catch((err) => console.error("Lỗi gửi email:", err));
      } else {
        alert(res.data.message || "Ứng tuyển thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi gửi ứng tuyển:", err);
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  // Close modal
  const handleCloseModal = (e) => {
    if (e.target.id === "modal-backdrop") {
      setShowForm(false);
    }
  };

  // Fetch cinemas
  useEffect(() => {
    axios
      .get("/api/cinemas/")
      .then((res) => {
        const cinemas = res.data.cinemas || [];
        setClusters(cinemas);
        if (cinemas.length > 0 && !selectedCinema) {
          setSelectedCinema(cinemas[0].id);
        }
      })
      .catch((err) => {
        console.error("Error fetching cinemas:", err);
        setError("Không thể tải danh sách rạp.");
      })
      .finally(() => setLoading(false));
  }, [setSelectedCinema]);

  // Fetch jobs for selected cinema
  useEffect(() => {
    if (selectedCinema) {
      setLoading(true);
      setError(null);
      setSelectedJob(null);
      axios
        .get(`/api/recruitments/job/${selectedCinema}`)
        .then((res) => {
          if (res.data.success) {
            const jobList = res.data.jobs || [];
            setJobs(jobList);
            if (jobList.length > 0) {
              setSelectedJob(jobList[0]);
            } else {
              setError(res.data.message || "Không có công việc nào.");
            }
          } else {
            setJobs([]);
            setError("Không tìm thấy công việc.");
          }
        })
        .catch((err) => {
          console.error("Error fetching jobs:", err);
          setError("Lỗi khi tải công việc.");
        })
        .finally(() => setLoading(false));
    }
  }, [selectedCinema]);

  // Get active cinema name
  const activeCinemaName = clusters.find((c) => c.id === selectedCinema)?.cinema_name || "N/A";

  return (
    <div className="min-h-screen    bg-gradient-to-b from-black via-gray-900 to-black text-white p-6 md:p-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FilmIcon className="w-10 h-10 text-red-600" />
          <h1 className="text-4xl md:text-5xl font-bold text-red-600 tracking-tight">
            BAC Cinema Tuyển Dụng
          </h1>
        </div>
        <p className="text-gray-400 text-lg">Tham gia cùng chúng tôi để mang phim đến mọi nhà!</p>
      </div>

      {/* Glassmorphism Cinema Selector */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition duration-300"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-red-500" />
                <div className="text-left">
                  <p className="text-sm text-gray-400">Rạp đang chọn</p>
                  <p className="text-xl font-semibold text-white">{activeCinemaName}</p>
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedCinema || ""}
                  onChange={(e) => setSelectedCinema(parseInt(e.target.value))}
                  className="w-full sm:w-64 appearance-none bg-gray-700/50 backdrop-blur-md border border-white/20 text-white px-5 py-3 pr-10 rounded-lg font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                >
                  <option value="" disabled>Chọn rạp...</option>
                  {clusters.map((cinema) => (
                    <option key={cinema.id} value={cinema.id} className="bg-gray-800 text-white">
                      {cinema.cinema_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Job List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-xl h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
              <FilmIcon className="w-5 h-5" />
              Danh sách công việc
            </h3>
            {loading && !jobs.length ? (
              <p className="text-gray-400 text-center py-8">Đang tải...</p>
            ) : error ? (
              <p className="text-red-400 text-center py-8">{error}</p>
            ) : jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job)=> (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 backdrop-blur-sm border ${
                      selectedJob?.id === job.id
                        ? "bg-red-600/30 border-red-500/50 text-white shadow-lg shadow-red-500/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-red-500/30"
                    }`}
                  >
                    <h4 className="font-semibold text-sm">{job.job_title}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(job.deadline).toLocaleDateString("vi-VN")} • {job.location}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Không có công việc nào.</p>
            )}
          </div>
        </div>

        {/* Right: Job Details */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-xl h-full min-h-[60vh] flex flex-col justify-between">
            {loading && !selectedJob ? (
              <p className="text-gray-400 text-center py-12">Đang tải chi tiết...</p>
            ) : selectedJob ? (
              <div>
                <h2 className="text-2xl font-bold text-red-500 mb-5">{selectedJob.job_title}</h2>
                <div className="space-y-3 text-gray-300 text-sm">
                  <p><strong>Bộ phận:</strong> {selectedJob.department}</p>
                  <p><strong>Địa điểm:</strong> {selectedJob.location}</p>
                  <p><strong>Báo cáo:</strong> {selectedJob.report_to}</p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Mô tả:</strong> {selectedJob.job_description}</p>
                    <p><strong>Yêu cầu:</strong> {selectedJob.requirements}</p>
                    <p><strong>Lợi ích:</strong> {selectedJob.benefits}</p>
                    <p><strong>Lương:</strong> {selectedJob.salary_range}</p>
                    <p><strong>Hạn nộp:</strong> {new Date(selectedJob.deadline).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  Ứng Tuyển Ngay
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">Vui lòng chọn một công việc để xem chi tiết.</p>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showForm && (
        <div
          id="modal-backdrop"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div className="bg-gray-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-bold text-red-500">Ứng Tuyển</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedJob?.job_title} • {activeCinemaName}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Họ và tên *"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-gray-700/50 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              />
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-gray-700/50 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Số điện thoại *"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-gray-700/50 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1">CV (PDF)</label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf"
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700/50 backdrop-blur border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
              >
                Gửi Ứng Tuyển
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Objective Section */}
      <div className="mt-10 max-w-4xl mx-auto p-6 bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold text-red-600 mb-4">Mục tiêu của vị trí công việc</h2>
        <p className="text-gray-400 leading-relaxed">
          Chú trọng nâng cao kỹ năng chuyên môn, đảm bảo chất lượng công việc tại rạp chiếu phim, đồng thời đóng góp vào việc phát triển hình ảnh, thương hiệu của công ty.
        </p>
      </div>
    </div>
  );
};

export default Recruiment;