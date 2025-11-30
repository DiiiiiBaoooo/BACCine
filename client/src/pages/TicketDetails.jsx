import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Star, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { 
  getMyTickets, 
  checkReviewEligibility, 
  submitReview, 
  getUserReview,
  updateReview,
  checkCancelTicket,
  cancelTicket
} from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';
import ReviewModal from '../components/ReviewModal';
import CancelTicketModal from '../components/CancelTicketModal';
const TicketDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isLoading: isAuthLoading, authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: ticketData, isLoading: isTicketsLoading, error } = useQuery({
    queryKey: ['myTickets', authUser?.id],
    queryFn: getMyTickets,
    enabled: !!authUser?.id,
    retry: false,
  });

  // Check cancel eligibility
  const { data: cancelInfo } = useQuery({
    queryKey: ['cancelEligibility', orderId],
    queryFn: () => checkCancelTicket(orderId),
    enabled: !!orderId && !!authUser?.id,
  });

  // Check review eligibility
  const { data: eligibilityData } = useQuery({
    queryKey: ['reviewEligibility', orderId],
    queryFn: () => checkReviewEligibility(orderId),
    enabled: !!orderId && !!authUser?.id,
  });

  // Get existing review
  const { data: userReviewData } = useQuery({
    queryKey: ['userReview', orderId],
    queryFn: () => getUserReview(orderId),
    enabled: !!orderId && !!authUser?.id,
  });

  const order = React.useMemo(() => {
    if (!ticketData?.tickets?.length) return null;
    return ticketData.tickets.find(t => String(t.order_id) === String(orderId)) || null;
  }, [ticketData?.tickets, orderId]);

  // Cancel ticket mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelTicket(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      setShowCancelModal(false);
      
      // Show success message with voucher code
      alert(`Hủy vé thành công!\n\nMã voucher: ${data.data.voucherCode}\nGiá trị: ${data.data.refundAmount.toLocaleString('vi-VN')} VND\nHết hạn: ${format(parseISO(data.data.expiryDate), 'dd/MM/yyyy', { locale: vi })}\n\nVoucher đã được lưu vào tài khoản của bạn.`);
      
      navigate('/tickets');
    },
    onError: (error) => {
      alert(error.message || 'Hủy vé thất bại. Vui lòng thử lại.');
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      if (!order) throw new Error("Không tìm thấy thông tin vé. Vui lòng tải lại trang.");

      const existingReview = userReviewData?.review;

      if (existingReview) {
        return updateReview(existingReview.review_id, reviewData);
      }

      return submitReview({
        orderId: order.order_id,
        movieId: order.movie_id,
        showtimeId: order.showtime_id,
        rating: reviewData.rating,
        comment: reviewData.comment || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReview', orderId] });
      queryClient.invalidateQueries({ queryKey: ['reviewEligibility', orderId] });
      setShowReviewModal(false);
      alert('Đánh giá đã được gửi thành công!');
    },
    onError: (error) => {
      alert(error.message || 'Gửi đánh giá thất bại');
    },
  });

  if (isAuthLoading || isTicketsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center py-8">Đang tải...</div>
      </div>
    );
  }

  if (error || !ticketData?.success || ticketData?.count === 0 || !order) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Không tìm thấy vé</h2>
          <Link to="/tickets" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (order.order_status !== 'confirmed') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-yellow-500 mb-4">
            {order.order_status === 'cancelled' ? 'Đã hủy' : 'Chưa sẵn sàng'}
          </h1>
          <h2 className="text-2xl font-semibold mb-4">
            {order.order_status === 'cancelled' ? 'Vé đã bị hủy' : 'Vé chưa được xác nhận'}
          </h2>
          <Link to="/tickets" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg">
            Quay lại danh sách vé
          </Link>
        </div>
      </div>
    );
  }

  const qrData = order.qrCode;
  const canReview = eligibilityData?.canReview;
  const existingReview = userReviewData?.review;
  const canCancel = cancelInfo?.canCancel;

  // Check if ticket is used (showtime ended)
  const startTime = new Date(order.GioBatDau);
  const runtimeMinutes = order.runtime || 0;
  const endTime = new Date(startTime.getTime() + runtimeMinutes * 60000);
  const now = new Date();
  const isUsed = now > endTime;

  const formatDateTime = (dateString, formatType) => {
    const date = parseISO(dateString);
    if (formatType === "time") {
      return format(date, "HH:mm", { locale: vi });
    }
    return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white py-8 px-4">
        <div className="container mx-auto max-w-6xl">
       <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <div className="flex items-center gap-4">
    <Link
      to="/tickets"
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 hover:bg-red-500 border border-gray-700 hover:border-red-500 transition-all"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </Link>
    <div>
      <h1 className="text-3xl font-bold text-white">Vé của bạn</h1>
      <p className="text-gray-400 text-sm mt-1">Mã đơn hàng: {order.order_id}</p>
    </div>
  </div>

  {/* Nút Hủy vé - chỉ hiện khi được phép hủy và chưa sử dụng */}
  {canCancel && !isUsed && (
    <button
      onClick={() => setShowCancelModal(true)}
      className="px-6 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30 flex items-center gap-2 whitespace-nowrap"
    >
      <XCircle className="w-5 h-5" />
      Hủy vé này
    </button>
  )}
</div>

          {/* Cancel Button - Only show if can cancel
          {canCancel && !isUsed && (
            <div className="mb-6">
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full px-4 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Hủy vé này
              </button>
            </div>
          )} */}

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl shadow-red-500/20 border border-red-500/30 mb-6">
            <div className="grid md:grid-cols-[1fr_auto_400px] gap-0">
              {/* Left Section */}
              <div className="p-8 space-y-6">
                {/* Movie Info */}
                <div className="flex gap-6">
                  <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-lg shadow-red-700/40 flex-shrink-0">
                    <img
                      src={order.poster_path.startsWith('http') ? order.poster_path : `https://image.tmdb.org/t/p/w200${order.poster_path}`}
                      alt={order.movie_title}
                      className="object-cover w-full h-full"
                      onError={(e) => (e.target.src = '/placeholder.svg')}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">{order.movie_title}</h2>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                        Đã thanh toán
                      </div>
                      {isUsed && (
                        <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300 border border-gray-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Đã sử dụng
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <div>
                          <p className="text-gray-400">Rạp chiếu</p>
                          <p className="text-white font-medium">{order.RapChieu}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Showtime Details */}
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Ngày chiếu</p>
                      <p className="text-white font-semibold">
                        {format(parseISO(order.GioBatDau), 'dd/MM/yyyy', { locale: vi })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Giờ chiếu</p>
                      <p className="text-white font-semibold">
                        {formatDateTime(order.GioBatDau, "time")} - {formatDateTime(order.GioKetThuc, "time")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Phòng</p>
                      <p className="text-white font-semibold">{order.PhongChieu}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Số ghế</p>
                      <p className="text-white font-semibold">{order.seats.length} ghế</p>
                    </div>
                  </div>
                </div>

                {/* Seats */}
                <div>
                  <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    Ghế đã chọn
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.seats.map((seat) => (
                      <div key={seat.ticket_id} className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2 hover:bg-red-500/20 transition-colors">
                        <span className="text-red-400 font-bold text-lg">{seat.seat_number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800 space-y-2">
                  {order.seats.map((seat) => (
                    <div key={seat.ticket_id} className="flex justify-between text-sm">
                      <span className="text-gray-400">Ghế {seat.seat_number}</span>
                      <span className="text-white">{seat.ticket_price.toLocaleString("vi-VN")} VND</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Tổng cộng</span>
                      <span className="text-red-400 font-bold text-xl">
                        {order.total_amount.toLocaleString("vi-VN")} VND
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">Đặt vé lúc: {formatDateTime(order.order_date, "date")}</div>
              </div>

              {/* Divider */}
              <div className="relative w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent hidden md:block">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col justify-around py-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-black border border-gray-700"></div>
                  ))}
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-gradient-to-br from-red-950/30 to-black p-8 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-red-500/30">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Check-in</h3>
                  <p className="text-gray-400 text-sm">Quét mã để vào rạp</p>
                </div>

                {qrData ? (
                  <div className="relative w-64 h-64 bg-white rounded-xl p-4 shadow-2xl shadow-red-500/20">
                    <img src={qrData} alt="QR Code" className="object-contain w-full h-full" />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-600">
                    <p className="text-gray-500 text-sm">Không có mã QR</p>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 mb-2">Mã đơn hàng</p>
                  <p className="text-white font-mono font-bold text-lg tracking-wider">{order.order_id}</p>
                </div>

                <div className="mt-6 w-full">
                  <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Vui lòng xuất trình mã này tại quầy vé hoặc cổng check-in tự động
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Review Section - Only show if ticket is used */}
          {isUsed && (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-bold text-white">Đánh giá phim</h3>
                </div>
              </div>

              {existingReview ? (
                <div className="space-y-4">
                  <div className="bg-black/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < existingReview.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    {existingReview.comment && (
                      <p className="text-gray-300 text-sm">{existingReview.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Đánh giá lúc: {format(parseISO(existingReview.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Chỉnh sửa đánh giá
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  {canReview ? (
                    <>
                      <p className="text-gray-400 mb-4">
                        Bạn đã xem phim này. Hãy chia sẻ cảm nhận của bạn!
                      </p>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                      >
                        <Star className="w-5 h-5" />
                        Viết đánh giá
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-500">
                      {eligibilityData?.message || 'Không thể đánh giá phim này'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Vui lòng đến rạp trước giờ chiếu 15 phút để làm thủ tục check-in</p>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={(reviewData) => reviewMutation.mutate(reviewData)}
        existingReview={existingReview}
        movieTitle={order.movie_title}
      />

      {/* Cancel Ticket Modal */}
      <CancelTicketModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => cancelMutation.mutate()}
        cancelInfo={cancelInfo}
        isLoading={cancelMutation.isPending}
      />
    </>
  );
};

export default TicketDetails;