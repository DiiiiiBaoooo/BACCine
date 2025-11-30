import React, { useEffect, useState } from "react";
import axios from "axios";
import { Film, Mail, Phone, Calendar, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import emailjs from "@emailjs/browser";

const QuanLyUngTuyen = ({ cinemaId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cinemaId) {
      setError("Không có thông tin rạp.");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios.get(`/api/applications/${cinemaId}`)
      .then(res => {
        if (res.data.success) {
          setApplications(res.data.applications || []);
        } else {
          setError(res.data.message || "Không có dữ liệu ứng viên.");
        }
      })
      .catch(() => setError("Lỗi kết nối server."))
      .finally(() => setLoading(false));
  }, [cinemaId]);

  // Nhóm theo vị trí
  const grouped = applications.reduce((acc, app) => {
    const title = app.job_title || "Chưa xác định";
    acc[title] = acc[title] || [];
    acc[title].push(app);
    return acc;
  }, {});

  // Phê duyệt
  const handleApprove = (id, app) => {
    if (!confirm(`Phê duyệt ứng viên ${app.applicant_name}?`)) return;

    axios.post(`/api/applications/${id}/accept`)
      .then(() => {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "accepted" } : a));
        alert("Đã phê duyệt ứng viên!");

        // Gửi email chấp nhận
        emailjs.send(
          "service_uin936k",
          "template_rz5wi6r",
          {
            name: app.applicant_name,
            job_title: app.job_title,
            applicant_email: app.applicant_email,
            from_name: "HR Team",
            message: `Xin chúc mừng ${app.applicant_name}! Hồ sơ ứng tuyển vị trí ${app.job_title} đã được chấp nhận. Chúng tôi sẽ liên hệ sớm nhất!`,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        ).then(() => alert("Email thông báo đã được gửi!"))
         .catch(() => alert("Phê duyệt thành công nhưng gửi email thất bại."));
      })
      .catch(() => alert("Lỗi khi phê duyệt!"));
  };

  // Từ chối
  const handleReject = (id, app) => {
    if (!confirm(`Từ chối ứng viên ${app.applicant_name}?`)) return;

    axios.post(`/api/applications/${id}/reject`)
      .then(() => {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" } : a));
        alert("Đã từ chối ứng viên!");

        emailjs.send(
          import.meta.env.VITE_EMAILJS_2SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_REJECT_ID,
          {
            name: app.applicant_name,
            job_title: app.job_title,
            applicant_email: app.applicant_email,
          },
          import.meta.env.VITE_EMAILJS2_PUBLIC_KEY
        ).then(() => alert("Email từ chối đã được gửi!"))
         .catch(() => alert("Từ chối thành công nhưng gửi email thất bại."));
      })
      .catch(() => alert("Lỗi khi từ chối!"));
  };

  const statusBadge = (status) => {
    const config = {
      accepted: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-900/40" },
      rejected: { icon: XCircle,     color: "text-red-400",    bg: "bg-red-900/40" },
      pending:  { icon: Clock,       color: "text-yellow-400", bg: "bg-yellow-900/40" },
    }[status] || { icon: Clock, color: "text-gray-400", bg: "bg-gray-800/50" };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-4 h-4" />
        {status === "accepted" ? "Đã duyệt" :
         status === "rejected" ? "Đã từ chối" :
         status === "pending" ? "Chờ duyệt" : "Không xác định"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải ứng viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
            <Film className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Quản Lý Ứng Tuyển
            </h1>
            <p className="text-gray-400">Xem và xử lý hồ sơ ứng viên</p>
          </div>
        </div>

        {error ? (
          <div className="text-center py-20">
            <p className="text-xl text-red-400">{error}</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
            <div className="text-6xl mb-4">No applications yet</div>
            <p className="text-2xl text-gray-500">Chưa có hồ sơ ứng tuyển nào</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([jobTitle, apps]) => (
              <div key={jobTitle} className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600/50 to-pink-600/50 px-6 py-4 border-b border-gray-800">
                  <h2 className="text-2xl font-bold text-white">
                    {jobTitle} ({apps.length} ứng viên)
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/70">
                      <tr>
                        <th className="px-5 py-4 text-left text-gray-300 font-medium">Họ tên</th>
                        <th className="px-5 py-4 text-left text-gray-300 font-medium">Liên hệ</th>
                        <th className="px-5 py-4 text-left text-gray-300 font-medium">CV</th>
                        <th className="px-5 py-4 text-left text-gray-300 font-medium">Ngày nộp</th>
                        <th className="px-5 py-4 text-left text-gray-300 font-medium">Trạng thái</th>
                        <th className="px-5 py-4 text-center text-gray-300 font-medium">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {apps.map(app => (
                        <tr key={app.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-5 font-medium">{app.applicant_name}</td>
                          <td className="px-5 py-5">
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Mail className="w-4 h-4" /> {app.applicant_email}
                              </div>
                              <div className="flex items-center gap-2 text-gray-400">
                                <Phone className="w-4 h-4" /> {app.applicant_phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5">
                            <a
                              href={app.resume_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
                            >
                              <Download className="w-4 h-4" />
                              Xem CV
                            </a>
                          </td>
                          <td className="px-5 py-5 text-gray-400">
                            {new Date(app.applied_at).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-5 py-5">
                            {statusBadge(app.status)}
                          </td>
                          <td className="px-5 py-5 text-center">
                            {app.status === "pending" ? (
                              <div className="flex justify-center gap-3">
                                <button
                                  onClick={() => handleApprove(app.id, app)}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition"
                                >
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => handleReject(app.id, app)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition"
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Đã xử lý</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuanLyUngTuyen;