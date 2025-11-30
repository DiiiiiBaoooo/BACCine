import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { getManagerEventRequests, quoteEventRequest, rejectEventRequest } from "../../lib/api";
import { X, Calendar, Clock, Users, Mail, Phone, FileText, DollarSign } from "lucide-react";

const EventRequest = ({ cinemaId }) => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNote, setQuoteNote] = useState("");

  const queryKey = ["managerEvents", cinemaId, filterStatus];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getManagerEventRequests({
        status: filterStatus === "all" ? undefined : filterStatus,
        cinema_id: cinemaId ? Number(cinemaId) : undefined,
      }),
    enabled: true,
  });

  const requests = data?.data || [];

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
        room_id: null,
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
    pending: { label: "Chờ duyệt", color: "bg-gray-100 text-gray-800", badge: "bg-gray-600" },
    quoted: { label: "Đã báo giá", color: "bg-blue-50 text-blue-900", badge: "bg-blue-600" },
    accepted: { label: "Đã chấp nhận", color: "bg-green-50 text-green-900", badge: "bg-green-600" },
    rejected: { label: "Đã từ chối", color: "bg-red-50 text-red-900", badge: "bg-red-600" },
    cancelled: { label: "Đã hủy", color: "bg-gray-50 text-gray-600", badge: "bg-gray-400" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 text-sm">Đang tải yêu cầu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                YÊU CẦU <span className="text-red-600">SUẤT CHIẾU RIÊNG</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="quoted">Đã báo giá</option>
                <option value="accepted">Đã chấp nhận</option>
                <option value="rejected">Từ chối</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              <div className="px-3 py-1.5 bg-red-50 rounded-lg">
                <span className="text-xs font-bold text-red-600">{requests.length} yêu cầu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <div className="text-gray-400 text-sm">
              {cinemaId
                ? "Rạp này chưa có yêu cầu đặt suất chiếu riêng nào"
                : "Không có yêu cầu nào phù hợp"}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{req.movie_title}</h3>
                    <p className="text-xs text-gray-600">{req.cinema_name}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white ${
                        statusConfig[req.status]?.badge || "bg-gray-400"
                      }`}
                    >
                      {statusConfig[req.status]?.label || req.status}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {format(new Date(req.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-medium">Ngày:</span>
                      <span>{format(new Date(req.event_date), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-medium">Giờ:</span>
                      <span>
                        {req.start_time} → {req.end_time || "Chưa xác định"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-medium">Số khách:</span>
                      <span className="font-bold text-red-600">{req.guest_count} người</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-medium">{req.contact_name}</span>
                      <span className="text-gray-600">• {req.contact_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                      <span className="truncate">{req.contact_email}</span>
                    </div>
                    {req.quoted_price && (
                      <div className="flex items-center gap-2 text-green-700 font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Báo giá: {Number(req.quoted_price).toLocaleString("vi-VN")} ₫</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Requirements */}
                {req.special_requirements && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-start gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">Yêu cầu đặc biệt:</span>
                        <p className="text-gray-700 mt-1">{req.special_requirements}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Báo giá
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                {req.status === "accepted" && req.showtime_id && (
                  <div className="mt-3 text-right">
                    <a
                      href={`/showtime/${req.showtime_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-green-600 hover:text-green-700 font-medium underline"
                    >
                      Xem suất chiếu đã tạo →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal báo giá */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                BÁO GIÁ #{selectedRequest.id}
              </h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setQuotePrice("");
                  setQuoteNote("");
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Info Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-5 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Phim:</span>
                <span className="text-gray-900 font-bold">{selectedRequest.movie_title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Rạp:</span>
                <span className="text-gray-900">{selectedRequest.cinema_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Khách hàng:</span>
                <span className="text-gray-900">{selectedRequest.contact_name}</span>
                <span className="text-red-600 font-bold">• {selectedRequest.guest_count} người</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">
                  GIÁ BÁO (VNĐ) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="100000"
                  step="10000"
                  className="w-full border border-gray-300 rounded-lg text-black px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="Ví dụ: 8500000"
                />
                {quotePrice && (
                  <p className="mt-1 text-xs text-gray-600">
                    = {Number(quotePrice).toLocaleString("vi-VN")} ₫
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">
                  GHI CHÚ CHO KHÁCH (tùy chọn)
                </label>
                <textarea
                  rows="4"
                  className="w-full border text-black border-gray-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="Ví dụ: Đã bao gồm nước + bắp rang, trang trí sinh nhật cơ bản..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setQuotePrice("");
                  setQuoteNote("");
                }}
                className="px-5 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleQuote}
                disabled={quoteMutation.isPending || !quotePrice}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
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