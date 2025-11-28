import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { getManagerEventRequests, quoteEventRequest, rejectEventRequest } from "../../lib/api";


const EventRequest = ({ cinemaId }) => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNote, setQuoteNote] = useState("");

  // Tạo queryKey động theo cinemaId và filterStatus
  const queryKey = ["managerEvents", cinemaId, filterStatus];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getManagerEventRequests({
        status: filterStatus === "all" ? undefined : filterStatus,
        cinema_id: cinemaId ? Number(cinemaId) : undefined, // Lọc theo rạp nếu có
      }),
    enabled: true, // Luôn chạy
  });

  const requests = data?.data || [];

  // Mutation báo giá
  const quoteMutation = useMutation({
    mutationFn: ({ id, data }) => quoteEventRequest(id, data),
    onSuccess: () => {
      toast.success("Báo giá thành công!");
      setSelectedRequest(null);
      setQuotePrice("");
      setQuoteNote("");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => toast.error(err.message || "Báo giá thất bại"),
  });

  // Mutation từ chối
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectEventRequest(id, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối yêu cầu");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error("Từ chối thất bại"),
  });

  const handleQuote = () => {
    if (!quotePrice || quotePrice <= 0) return toast.error("Vui lòng nhập giá hợp lệ");
    quoteMutation.mutate({
      id: selectedRequest.id,
      data: {
        quoted_price: Number(quotePrice),
        quote_note: quoteNote,
        room_id: null, // Có thể thêm chọn phòng sau
      },
    });
  };

  const handleReject = (id) => {
    const reason = prompt("Lý do từ chối?");
    if (reason === null) return;
    if (!reason.trim()) return toast.error("Vui lòng nhập lý do");
    rejectMutation.mutate({ id, reason });
  };

  const statusConfig = {
    pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
    quoted: { label: "Đã báo giá", color: "bg-blue-100 text-blue-800" },
    accepted: { label: "Đã chấp nhận", color: "bg-green-100 text-green-800" },
    rejected: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
    cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-800" },
  };

  if (isLoading) return <div className="p-8 text-center">Đang tải yêu cầu...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Quản lý yêu cầu đặt suất chiếu riêng
          {cinemaId && <span className="text-xl text-gray-600 ml-3">(Rạp ID: {cinemaId})</span>}
        </h1>
        <div className="mt-4 flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-gray-600">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="quoted">Đã báo giá</option>
              <option value="accepted">Đã chấp nhận</option>
              <option value="rejected">Từ chối</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <span className="ml-auto text-lg font-semibold text-gray-700">
            Tổng: <span className="text-red-600">{requests.length}</span> yêu cầu
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
          {cinemaId
            ? "Rạp này chưa có yêu cầu đặt suất chiếu riêng nào"
            : "Không có yêu cầu nào phù hợp"}
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{req.movie_title}</h3>
                  <p className="text-gray-600">
                    {req.cinema_name} • {req.contact_name} ({req.contact_phone})
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      statusConfig[req.status]?.color || "bg-gray-100"
                    }`}
                  >
                    {statusConfig[req.status]?.label || req.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(req.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>Ngày chiếu:</strong>{" "}
                    {format(new Date(req.event_date), "dd/MM/yyyy")}
                  </p>
                  <p>
                    <strong>Giờ:</strong> {req.start_time} → {req.end_time || "Chưa xác định"}
                  </p>
                  <p>
                    <strong>Số khách:</strong> {req.guest_count} người
                  </p>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Email:</strong> {req.contact_email}
                  </p>
                  {req.special_requirements && (
                    <p className="text-gray-700">
                      <strong>Yêu cầu đặc biệt:</strong> {req.special_requirements}
                    </p>
                  )}
                  {req.quoted_price && (
                    <p className="text-lg font-bold text-green-600">
                      Báo giá: {Number(req.quoted_price).toLocaleString("vi-VN")} ₫
                    </p>
                  )}
                </div>
              </div>

              {/* Nút hành động */}
              {req.status === "pending" && (
                <div className="mt-6 flex gap-4 justify-end">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
                  >
                    Báo giá
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
                  >
                    Từ chối
                  </button>
                </div>
              )}

              {req.status === "accepted" && req.showtime_id && (
                <div className="mt-4 text-right">
                  <a
                    href={`/showtime/${req.showtime_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium underline"
                  >
                    Xem suất chiếu đã tạo
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal báo giá */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in">
            <h3 className="text-2xl font-bold mb-4">
              Báo giá yêu cầu #{selectedRequest.id}
            </h3>
            <div className="text-gray-700 mb-6 space-y-1">
              <p>
                <strong>Phim:</strong> {selectedRequest.movie_title}
              </p>
              <p>
                <strong>Rạp:</strong> {selectedRequest.cinema_name}
              </p>
              <p>
                <strong>Khách:</strong> {selectedRequest.contact_name} • {selectedRequest.guest_count} người
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá báo (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="100000"
                  step="10000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="Ví dụ: 8500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú cho khách (tùy chọn)
                </label>
                <textarea
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 transition resize-none"
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="Ví dụ: Đã bao gồm nước + bắp rang, trang trí sinh nhật cơ bản..."
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-end">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setQuotePrice("");
                  setQuoteNote("");
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleQuote}
                disabled={quoteMutation.isPending || !quotePrice}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition shadow-md"
              >
                {quoteMutation.isPending ? "Đang gửi..." : "Gửi báo giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRequest;