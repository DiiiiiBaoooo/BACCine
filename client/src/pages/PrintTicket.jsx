// client/src/pages/TicketDetails.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getTicketByOrderId } from '../lib/api'; // Import hàm mới
import useAuthUser from '../hooks/useAuthUser';

const PrintTicket = () => {
  const { order_id } = useParams();
  const { isLoading: isAuthLoading, authUser } = useAuthUser();

  // Sử dụng API mới - lấy vé theo order_id thay vì lấy tất cả vé
  const {
    data: ticketResponse,
    isLoading: isTicketLoading,
    error,
  } = useQuery({
    queryKey: ['ticketDetail', order_id],
    queryFn: () => getTicketByOrderId(order_id),
    enabled: !!authUser?.id && !!order_id,
    retry: false,
  });
  console.log('🎫 TicketDetails mounted');
  console.log('- orderId from params:', order_id);
  console.log('- authUser:', authUser);
  if (isAuthLoading || isTicketLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center py-8">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Không thể tải chi tiết vé';
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-red-500 mb-4">Lỗi</h1>
          <p className="text-gray-400 mb-8">{errorMessage}</p>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách vé
          </Link>
        </div>
      </div>
    );
  }

  if (!ticketResponse?.success || !ticketResponse?.ticket) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Không tìm thấy vé</h2>
          <p className="text-gray-400 mb-8">Vé bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const order = ticketResponse.ticket;

  // Kiểm tra trạng thái vé
  if (order.order_status !== 'confirmed') {
    if (order.order_status === 'cancelled') {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-6xl font-bold text-red-500 mb-4">Hủy vé</h1>
            <h2 className="text-2xl font-semibold mb-4">Vé đã bị hủy</h2>
            <p className="text-gray-400 mb-8">
              Vé với mã đơn hàng <span className="font-mono text-white">#{order.order_id}</span> đã bị hủy và không thể sử dụng.
            </p>
            <Link
              to="/tickets"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách vé
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-yellow-500 mb-4">Chưa sẵn sàng</h1>
          <h2 className="text-2xl font-semibold mb-4">Vé chưa được xác nhận</h2>
          <p className="text-gray-400 mb-8">
            Vé đang ở trạng thái <span className="capitalize text-yellow-400">{order.order_status}</span>. 
            Vui lòng chờ thanh toán thành công để xem chi tiết.
          </p>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
          >
            Quay lại danh sách vé
          </Link>
        </div>
      </div>
    );
  }

  const qrData = order.qrCode;

  const formatDateTime = (dateString, formatType) => {
    const date = parseISO(dateString);
    if (formatType === "time") {
      return format(date, "HH:mm", { locale: vi });
    }
    if (formatType === "date") {
      return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
    }
    return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            to={authUser.role === 'user' ? '/tickets' : '/employee'}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 hover:bg-red-500 border border-gray-700 hover:border-red-500 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {authUser.role === 'user' ? 'Vé của bạn' : 'Chi tiết vé khách hàng'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Mã đơn hàng: {order.order_id}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl shadow-red-500/20 border border-red-500/30">
          <div className="grid md:grid-cols-[1fr_auto_400px] gap-0">
            {/* Left Section - Main Ticket Info */}
            <div className="p-8 space-y-6">
              {/* Movie Title and Poster */}
              <div className="flex gap-6">
                <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-lg shadow-red-700/40 flex-shrink-0">
                  <img
                    src={
                      order.poster_path.startsWith('http')
                        ? order.poster_path
                        : `https://image.tmdb.org/t/p/w200${order.poster_path}`
                    }
                    alt={order.movie_title}
                    className="object-cover w-full h-full"
                    onError={(e) => (e.target.src = '/placeholder.svg')}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{order.movie_title}</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.order_status === "confirmed"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {order.order_status === "confirmed" ? "Đã thanh toán" : "Chờ thanh toán"}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
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
                    <div
                      key={seat.ticket_id}
                      className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2 hover:bg-red-500/20 transition-colors"
                    >
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

              {/* Order Date */}
              <div className="text-xs text-gray-500">Đặt vé lúc: {formatDateTime(order.order_date, "date")}</div>
            </div>

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

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Vui lòng đến rạp trước giờ chiếu 15 phút để làm thủ tục check-in</p>
        </div>
      </div>
    </div>
  );
};

export default PrintTicket;