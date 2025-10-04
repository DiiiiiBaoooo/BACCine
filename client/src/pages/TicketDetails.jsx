import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getMyTickets } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

// TicketDetails.jsx
const TicketDetails = () => {
  const { orderId } = useParams(); // orderId is a string (e.g., "5")
  const { isLoading: isAuthLoading, authUser } = useAuthUser();

  const {
    data: ticketData,
    isLoading: isTicketsLoading,
    error,
  } = useQuery({
    queryKey: ['myTickets', authUser?.id],
    queryFn: getMyTickets,
    enabled: !!authUser?.id,
    retry: false,
  });

  // Debugging logs
  console.log('orderId:', orderId, typeof orderId);
  console.log('ticketData:', ticketData);

  if (isAuthLoading || isTicketsLoading) {
    return <div className="text-center py-8 text-white">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Lỗi: {error.message || 'Không thể tải chi tiết vé'}
      </div>
    );
  }

  if (!ticketData?.success || ticketData?.count === 0) {
    return <div className="text-center py-8 text-white">Không tìm thấy vé.</div>;
  }

  // Find order with type-safe comparison
  const order = ticketData.tickets.find((t) => String(t.order_id) === orderId); // Convert t.order_id to string

  if (!order) {
    return (
      <div className="text-center py-8 text-white">
        Vé không tồn tại. Kiểm tra orderId: {orderId}, tickets: {JSON.stringify(ticketData.tickets.map(t => t.order_id))}
      </div>
    );
  }

  // QR code is already in the response
  const qrData = order.qrCode;

  return (
    <div className="container mx-auto p-6 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-red-500">Chi tiết vé</h1>
      <div className="bg-gray-900 p-6 rounded-lg border border-red-500 shadow-lg">
        {/* Movie Section */}
        <div className="border-b border-red-500 pb-4 mb-4">
          <h2 className="text-2xl font-semibold">{order.movie_title}</h2>
          <img
            src={
              order.poster_path.startsWith('http')
                ? order.poster_path
                : `https://image.tmdb.org/t/p/w200${order.poster_path}`
            }
            alt={order.movie_title}
            className="w-48 h-72 object-cover rounded-md mt-4 shadow-lg shadow-red-700/40"
            onError={(e) => (e.target.src = '/placeholder.png')}
          />
        </div>

        {/* Cinema and Showtime Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-700 p-2 rounded">
            <p className="text-gray-400">Rạp</p>
            <p className="text-white">{order.RapChieu}</p>
          </div>
          <div className="border border-gray-700 p-2 rounded">
            <p className="text-gray-400">Phòng</p>
            <p className="text-white">{order.PhongChieu}</p>
          </div>
          <div className="border border-gray-700 p-2 rounded">
            <p className="text-gray-400">Suất chiếu</p>
            <p className="text-white">
              {format(parseISO(order.GioBatDau), 'HH:mm dd/MM/yyyy', { locale: vi })} -{' '}
              {format(parseISO(order.GioKetThuc), 'HH:mm', { locale: vi })}
            </p>
          </div>
        </div>

        {/* Seats Section */}
        <div className="border border-gray-700 p-2 rounded mb-4">
          <p className="text-gray-400">Ghế</p>
          <div className="text-white">
            {order.seats.map((seat, index) => (
              <span key={seat.ticket_id}>
                {seat.seat_number} (ID: {seat.ticket_id}, {seat.ticket_price.toLocaleString('vi-VN')} VND)
                {index < order.seats.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-700 p-2 rounded">
            <p className="text-gray-400">Tổng tiền</p>
            <p className="text-red-400 font-semibold">{order.total_amount.toLocaleString('vi-VN')} VND</p>
          </div>
          <div className="border border-gray-700 p-2 rounded">
            <p className="text-gray-400">Trạng thái</p>
            <p
              className={`font-semibold ${
                order.order_status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {order.order_status === 'confirmed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
            </p>
          </div>
        </div>

        {/* Order Date Section */}
        <div className="border border-gray-700 p-2 rounded">
          <p className="text-gray-400">Ngày đặt</p>
          <p className="text-white">
            {format(parseISO(order.order_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="border border-gray-700 p-4 rounded mt-6">
          <p className="text-gray-400 mb-4">QR Code (Scan để check-in)</p>
          {qrData ? (
            <div className="flex justify-center">
              <img src={qrData} alt="QR Code" className="w-64 h-64 object-contain" />
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">Không thể tạo QR</div>
          )}
          <p className="text-sm text-gray-500 mt-2 text-center">Scan tại cửa rạp để check-in</p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;