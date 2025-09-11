import React, { useEffect, useState } from "react";
import axios from "axios";
import { FilmIcon } from "lucide-react";

const QuanLyUngTuyen = ({ cinemaId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cinema name and applications for the given cinemaId
  useEffect(() => {
    if (cinemaId) {
      setLoading(true);
      setError(null);

      // Fetch cinema name
    

      // Fetch applications
      axios
        .get(`/api/applications/${cinemaId}`)
        .then((res) => {
          if (res.data.success) {
            setApplications(res.data.applications || []);
          } else {
            setApplications([]);
            setError(res.data.message || "Không tìm thấy ứng viên cho rạp này.");
          }
        })
        .catch((err) => {
          console.error("Error fetching applications:", err);
          setError("Lỗi khi tải danh sách ứng viên.");
        })
        .finally(() => setLoading(false));
    } else {
      setError("Không có thông tin rạp được cung cấp.");
      setLoading(false);
    }
  }, [cinemaId]);

  // Group applications by job_title
  const groupedApplications = applications.reduce((acc, app) => {
    const jobTitle = app.job_title || "Không xác định";
    if (!acc[jobTitle]) {
      acc[jobTitle] = [];
    }
    acc[jobTitle].push(app);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <FilmIcon className="text-red-600 size-8" />
        <span className="text-3xl font-bold tracking-tight text-red-600">
          Quản Lý Ứng Viên 
        </span>
      </div>

      {/* Applications Section */}
      <div className="bg-gray-900 p-6 border border-gray-700 rounded-xl">
        {loading ? (
          <p className="text-gray-400 text-center">Đang tải danh sách ứng viên...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : Object.keys(groupedApplications).length > 0 ? (
          Object.entries(groupedApplications).map(([jobTitle, apps]) => (
            <div key={jobTitle} className="mb-8">
              <h2 className="text-xl font-bold text-red-600 mb-4">
                Vị trí: {jobTitle}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="p-3 text-gray-300 font-semibold">Họ và Tên</th>
                      <th className="p-3 text-gray-300 font-semibold">Email</th>
                      <th className="p-3 text-gray-300 font-semibold">Số điện thoại</th>
                      <th className="p-3 text-gray-300 font-semibold">CV</th>
                      <th className="p-3 text-gray-300 font-semibold">Ngày nộp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr
                        key={app.id}
                        className="border-t border-gray-700 hover:bg-gray-800 transition-all duration-200"
                      >
                        <td className="p-3 text-gray-400">{app.applicant_name}</td>
                        <td className="p-3 text-gray-400">{app.applicant_email}</td>
                        <td className="p-3 text-gray-400">{app.applicant_phone}</td>
                        <td className="p-3">
                          <a
                            href={app.resume_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:underline"
                          >
                            Xem CV
                          </a>
                        </td>
                        <td className="p-3 text-gray-400">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">Không có ứng viên nào cho rạp này.</p>
        )}
      </div>
    </div>
  );
};

export default QuanLyUngTuyen;