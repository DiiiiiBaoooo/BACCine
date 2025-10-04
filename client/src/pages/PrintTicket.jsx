// PrintTicket.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getMyTickets } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

const PrintTicket = () => {

  const navigate = useNavigate();
  const { order_id, user_id } = useParams();

  const { isLoading: isAuthLoading, authUser } = useAuthUser();

  const {
    data: ticketData,
    isLoading: isTicketsLoading,
    error,
  } = useQuery({
    queryKey: ['myTickets', user_id], // Use userId from query for specific user
    queryFn: () => getMyTickets({ user_id }), // Pass userId if getMyTickets accepts it
    enabled: !!user_id && !!authUser?.id,
    retry: false,
  });

  useEffect(() => {
    if (!order_id || !user_id) {
      navigate('/'); // Redirect to home if params are missing
    }
  }, [order_id, user_id, navigate]);

  if (isAuthLoading || isTicketsLoading) {
    return <div className="text-center py-8 text-white">Đang tải...</div>;
  }

  if (error || !ticketData?.success || ticketData?.count === 0) {
    return (
      <div className="text-center py-8 text-red-500">
        Lỗi: {error?.message || 'Không thể tải vé để in'}
      </div>
    );
  }

  const order = ticketData.tickets.find((t) => String(t.order_id) === order_id);

  if (!order) {
    return (
      <div className="text-center py-8 text-white">
        Vé không tồn tại. Order ID: {order_id}
      </div>
    );
  }

  const qrData = order.qrCode;

  // Printable ticket layout
  return (
    <div className="container mx-auto p-6 bg-black min-h-screen text-white print:bg-white print:text-black">
      <h1 className="text-3xl font-bold mb-6 text-red-500 print:text-black">Vé Xem Phim</h1>
      <div className="bg-gray-900 p-6 rounded-lg border border-red-500 shadow-lg print:bg-white print:border-black print:shadow-none max-w-2xl mx-auto">
        {/* Ticket Header */}
        <div className="text-center mb-4 border-b border-red-500 print:border-black pb-2">
          <h2 className="text-2xl font-semibold">{order.movie_title}</h2>
          <p className="text-gray-400 print:text-black">Mã Đơn: {order.order_id}</p>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-700 p-2 rounded print:border-black">
            <p className="text-gray-400 print:text-black">Rạp</p>
            <p className="text-white print:text-black">{order.RapChieu}</p>
          </div>
          <div className="border border-gray-700 p-2 rounded print:border-black">
            <p className="text-gray-400 print:text-black">Phòng</p>
            <p className="text-white print:text-black">{order.PhongChieu}</p>
          </div>
          <div className="border border-gray-700 p-2 rounded print:border-black">
            <p className="text-gray-400 print:text-black">Thời Gian</p>
            <p className="text-white print:text-black">
              {format(parseISO(order.GioBatDau), 'HH:mm dd/MM/yyyy', { locale: vi })} -{' '}
              {format(parseISO(order.GioKetThuc), 'HH:mm', { locale: vi })}
            </p>
          </div>
          <div className="border border-gray-700 p-2 rounded print:border-black">
            <p className="text-gray-400 print:text-black">Ghế</p>
            <p className="text-white print:text-black">
              {order.seats.map((seat) => seat.seat_number).join(', ')}
            </p>
          </div>
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-700 p-2 rounded print:border-black">
            <p className="text-gray-400 print:text-black">Tổng Tiền</p>
            <p className="text-red-400 font-semibold print:text-black">
              {order.total_amount.toLocaleString('vi-VN')} VND
            </p>
          </div>
          <div className="border border-gray-700 p-2 rounded print:border-black">
            <p className="text-gray-400 print:text-black">Trạng Thái</p>
            <p
              className={`font-semibold ${
                order.order_status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
              } print:text-black`}
            >
              {order.order_status === 'confirmed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
            </p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="border border-gray-700 p-4 rounded mt-6 text-center print:border-black">
          <p className="text-gray-400 mb-4 print:text-black">Mã QR (Check-in)</p>
          {qrData ? (
            <img src={qrData} alt="QR Code" className="w-48 h-48 mx-auto print:w-64 print:h-64" />
          ) : (
            <div className="text-gray-500 print:text-black">Không có QR</div>
          )}
        </div>

        {/* Print Button */}
        <div className="text-center mt-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            In Vé
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintTicket;