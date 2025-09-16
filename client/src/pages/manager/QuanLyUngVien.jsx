import React, { useEffect, useState } from "react";
import axios from "axios";
import { FilmIcon } from "lucide-react";
import emailjs from "@emailjs/browser";

const QuanLyUngTuyen = ({ cinemaId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cinema name and applications for the given cinemaId
  useEffect(() => {
    if (cinemaId) {
      setLoading(true);
      setError(null);

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

  // Handle approve
  const handleApprove = (id, app) => {
    axios
      .post(`/api/applications/${id}/accept`)
      .then(() => {
        alert("Ứng viên đã được phê duyệt!");
        setApplications((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: "accepted" } : a
          )
        );

        // Send approval email
        emailjs
          .send(
            "service_uin936k",
            "template_rz5wi6r",
            {
              name: app.applicant_name,
              job_title: app.job_title,
              applicant_email: app.applicant_email,
              from_name: "HR Team",
              message: `Xin chúc mừng ${app.applicant_name}, hồ sơ của bạn đã được chấp nhận cho vị trí ${app.job_title}. Chúng tôi sẽ liên hệ sớm!`,
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          )
          .then(() => {
            console.log("✅ Email đã gửi thành công");
            alert("Email chấp nhận đã được gửi cho ứng viên!");
          })
          .catch((err) => {
            console.error("❌ Lỗi gửi email:", err);
            alert("Không thể gửi email cho ứng viên.");
          });
      })
      .catch(() => alert("Lỗi khi phê duyệt ứng viên."));
  };

  // Handle reject
  const handleReject = (id,app) => {
    axios
      .post(`/api/applications/${id}/reject`)
      .then(() => {
        alert("Ứng viên đã bị từ chối!");
        setApplications((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: "rejected" } : a
          )
        );
        emailjs
          .send(
            import.meta.env.VITE_EMAILJS_2SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_REJECT_ID,
            {
              name: app.applicant_name,
              job_title: app.job_title,
              applicant_email: app.applicant_email,
             
            },
            import.meta.env.VITE_EMAILJS2_PUBLIC_KEY
          )
          .then(() => {
            console.log("✅ Email từ chối đã gửi thành công");
            alert("Email từ chối đã được gửi cho ứng viên!");
          })
      })
      .catch(() => alert("Lỗi khi từ chối ứng viên."));
      
  };

  // Function to get status text and styling
  const getStatusDisplay = (status) => {
    switch (status) {
      case "accepted":
        return <span className="text-green-600 font-semibold">Đã phê duyệt</span>;
      case "rejected":
        return <span className="text-red-600 font-semibold">Đã từ chối</span>;
      case "pending":
        return <span className="text-yellow-600 font-semibold">Đang chờ</span>;
      default:
        return <span className="text-gray-400">Không xác định</span>;
    }
  };

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
                      <th className="p-3 text-gray-300 font-semibold">Trạng thái</th>
                      <th className="p-3 text-gray-300 font-semibold">Hành động</th>
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
                        <td className="p-3">{getStatusDisplay(app.status)}</td>
                        <td className="p-3 space-x-2">
                          {app.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleApprove(app.id, app)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Phê duyệt
                              </button>
                              <button
                                onClick={() => handleReject(app.id,app)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Từ chối
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-500">Không có hành động</span>
                          )}
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