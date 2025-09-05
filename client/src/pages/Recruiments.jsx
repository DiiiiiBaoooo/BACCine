import React, { useEffect, useState } from "react";
import axios from "axios";
import { FilmIcon } from "lucide-react"; // Assuming you have this icon library

const Recruiment = () => {
  const [clusters, setClusters] = useState([]);
  const [activeCinema, setActiveCinema] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cinema clusters
  useEffect(() => {
    axios
      .get("/api/cinemas/")
      .then((res) => {
        const cinemas = res.data.cinemas || [];
        setClusters(cinemas);
        if (cinemas.length > 0) {
          setActiveCinema(cinemas[0].id); // Default to first cinema
        }
      })
      .catch((err) => {
        console.error("Error fetching clusters:", err);
        setError("Không thể tải danh sách rạp.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch jobs for the active cinema
  useEffect(() => {
    if (activeCinema) {
      setLoading(true);
      setError(null); // Reset error state before new request
      setSelectedJob(null); // Reset selected job when cinema changes
      axios
        .get(`/api/recruitments/job/${activeCinema}`) // Corrected path
        .then((res) => {
          if (res.data.success) {
            setJobs(res.data.jobs || []);
            if (res.data.jobs.length > 0) {
              setSelectedJob(res.data.jobs[0]); // Default to first job
            } else if (res.data.message) {
              setError(res.data.message); // Set specific message if provided
            }
          } else {
            setJobs([]);
            setError("Không tìm thấy công việc cho rạp này."); // Fallback if success is false
          }
        })
        .catch((err) => {
          console.error("Error fetching jobs:", err);
          setError("Lỗi khi tải thông tin công việc."); // General error for network/server issues
        })
        .finally(() => setLoading(false));
    }
  }, [activeCinema]);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <FilmIcon className="text-red-600 size-8" />
        <span className="text-3xl font-bold tracking-tight text-red-600">
          BAC Cinema Tuyển Dụng
        </span>
      </div>

      {/* Tabs Section */}
      <div className="w-full mb-6">
        <div className="flex flex-wrap gap-3 justify-center">
          {loading && !clusters.length ? (
            <p className="text-gray-400">Đang tải danh sách rạp...</p>
          ) : clusters.length > 0 ? (
            clusters.map((cluster) => (
              <button
                key={cluster.id}
                onClick={() => setActiveCinema(cluster.id)}
                className={`px-5 py-2 rounded-lg font-medium border transition-all duration-200 ${
                  activeCinema === cluster.id
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-black border-gray-400 hover:bg-red-100 hover:text-red-600"
                }`}
              >
                {cluster.cinema_name}
              </button>
            ))
          ) : (
            <p className="text-red-600">Không có rạp nào để hiển thị.</p>
          )}
        </div>
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
            </div>
          ) : (
            <p className="text-gray-500 text-center">Vui lòng chọn một công việc.</p>
          )}
        </div>
      </div>

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