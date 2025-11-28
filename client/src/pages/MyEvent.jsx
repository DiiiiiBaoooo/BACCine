import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { initiateEventPayment, cancelEventRequest, getMyEventRequests } from "../lib/api";

const MyEvent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["myEvents", filterStatus],
    queryFn: () =>
      getMyEventRequests({
        status: filterStatus === "all" ? undefined : filterStatus,
      }),
  });

  const requests = data?.data || [];

  // ✅ SỬA: Mutation với đúng cấu trúc
  const initiatePaymentMutation = useMutation({
    mutationFn: initiateEventPayment,
    onSuccess: (data, variables) => {
      // variables chứa {eventId, quotedPrice}
      const { eventId, quotedPrice } = variables;
      toast.success("Đang chuyển đến trang thanh toán...");
      
      // ✅ Navigate với URL params đúng format
      navigate(`/event-payment/${eventId}/${quotedPrice}`);
    },
    onError: (err) => toast.error(err.message || "Khởi tạo thanh toán thất bại"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelEventRequest,
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu");
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
    },
    onError: () => toast.error("Hủy thất bại"),
  });

  // ✅ SỬA: Xử lý thanh toán với đúng cấu trúc tham số
  const handlePayment = (id, quoted_price) => {
    const quotedPrice = Number(quoted_price);
    if (confirm("Bạn chắc chắn muốn tiến hành thanh toán?")) {
      // Truyền object có cả eventId và quotedPrice
      initiatePaymentMutation.mutate({ 
        eventId: id, 
        quotedPrice: quotedPrice 
      });
    }
  };

  const handleCancel = (id) => {
    if (confirm("Bạn có chắc muốn hủy yêu cầu này?")) {
      cancelMutation.mutate(id);
    }
  };

  const statusConfig = {
    pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
    quoted: { label: "Đã báo giá", color: "bg-blue-100 text-blue-800" },
    payment_pending: { label: "Chờ thanh toán", color: "bg-purple-100 text-purple-800" },
    accepted: { label: "Đã chấp nhận", color: "bg-green-100 text-green-800" },
    rejected: { label: "Bị từ chối", color: "bg-red-100 text-red-800" },
    cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-800" },
  };

  const formatDateForURL = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    return date.toISOString().split("T")[0];
  };

  if (isLoading) return <div className="p-8 text-center text-gray-600">Đang tải yêu cầu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Yêu cầu đặt suất chiếu riêng của tôi
          </h1>
          <p className="text-gray-600">Theo dõi và quản lý các yêu cầu bạn đã gửi</p>
        </div>

        {/* Bộ lọc trạng thái */}
        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-6 py-3 rounded-full font-medium transition ${
              filterStatus === "all"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-100"
            }`}
          >
            Tất cả ({requests.length})
          </button>
          {["pending", "quoted", "payment_pending", "accepted", "rejected", "cancelled"].map((status) => {
            const count = requests.filter((r) => r.status === status).length;
            if (count === 0) return null;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-3 rounded-full font-medium transition ${
                  filterStatus === status
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border hover:bg-gray-100"
                }`}
              >
                {statusConfig[status].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Danh sách yêu cầu */}
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <p className="text-6xl mb-4">🎬</p>
            <p className="text-xl text-gray-500 mb-8">Bạn chưa gửi yêu cầu nào</p>
            <Link
              to="/event"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition shadow-lg"
            >
              Đặt suất chiếu riêng ngay
            </Link>
          </div>
        ) : (
          <div className="grid gap-8">
            {requests.map((req) => {
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold">{req.movie_title}</h3>
                        <p className="mt-2 text-red-100">
                          {req.cinema_name} • {req.guest_count} khách
                        </p>
                      </div>
                      <span
                        className={`px-5 py-2 rounded-full text-sm font-bold ${
                          statusConfig[req.status]?.color || "bg-gray-300"
                        }`}
                      >
                        {statusConfig[req.status]?.label || req.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 mb-6">
                      <div className="space-y-3">
                        <p>
                          <strong>Ngày chiếu:</strong>{" "}
                          {format(new Date(req.event_date), "EEEE, dd 'tháng' MM, yyyy", {
                            locale: vi,
                          })}
                        </p>
                        <p>
                          <strong>Giờ:</strong> {req.start_time} → {req.end_time || "Đang xử lý"}
                        </p>
                        <p>
                          <strong>Liên hệ:</strong> {req.contact_name} • {req.contact_phone}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p>
                          <strong>Email:</strong> {req.contact_email}
                        </p>
                        {req.special_requirements && (
                          <p className="italic text-gray-600">
                            <strong>Yêu cầu:</strong> {req.special_requirements}
                          </p>
                        )}
                        {req.quoted_price && (
                          <div className="bg-green-50 border border-green-300 rounded-xl p-5">
                            <p className="text-2xl font-bold text-green-700">
                              {Number(req.quoted_price).toLocaleString("vi-VN")} ₫
                            </p>
                            {req.quote_note && (
                              <p className="text-sm text-gray-600 mt-2 italic">"{req.quote_note}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex flex-wrap gap-4 justify-end items-center">
                      {/* ✅ Nút thanh toán khi trạng thái quoted */}
                      {req.status === "quoted" && (
                        <>
                          <button
                            onClick={() => handlePayment(req.id, req.quoted_price)}
                            disabled={initiatePaymentMutation.isPending}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-lg disabled:opacity-70 flex items-center gap-2"
                          >
                            {initiatePaymentMutation.isPending ? (
                              "Đang xử lý..."
                            ) : (
                              <>
                                💳 Thanh toán ngay
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleCancel(req.id)}
                            disabled={cancelMutation.isPending}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition disabled:opacity-70"
                          >
                            Hủy yêu cầu
                          </button>
                        </>
                      )}

                      {/* Nút hủy cho trạng thái pending */}
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          disabled={cancelMutation.isPending}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition disabled:opacity-70"
                        >
                          Hủy yêu cầu
                        </button>
                      )}

                      {/* ✅ Tiếp tục thanh toán với URL params đúng + Nút hủy */}
                      {req.status === "payment_pending" && req.quoted_price && (
                        <>
                          <button
                            onClick={() => navigate(`/event-payment/${req.id}/${req.quoted_price}`)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 shadow-xl hover:shadow-2xl transition"
                          >
                            ⏱️ Tiếp tục thanh toán
                          </button>
                          <button
                            onClick={() => handleCancel(req.id)}
                            disabled={cancelMutation.isPending}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition disabled:opacity-70"
                          >
                            Hủy yêu cầu
                          </button>
                        </>
                      )}

                      {/* Xem vé sau khi accepted */}
                      {req.status === "accepted" && req.showtime_id && (
                        <Link
                          to={`/movies/${req.movie_id}/${req.cinema_id}/${formatDateForURL(req.event_date)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 shadow-xl hover:shadow-2xl transition"
                        >
                          🎟️ Xem vé suất chiếu riêng
                        </Link>
                      )}
                    </div>

                    <div className="mt-6 text-right text-sm text-gray-500">
                      Gửi lúc: {format(new Date(req.created_at), "HH:mm - dd/MM/yyyy", { locale: vi })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvent;