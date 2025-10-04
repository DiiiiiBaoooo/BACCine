import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { getMyTickets } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

const MyTicket = () => {
  const { isLoading: isAuthLoading, authUser } = useAuthUser();
  const navigate = useNavigate();

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

  if (isAuthLoading || isTicketsLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Lỗi: {error.message || 'Không thể tải danh sách vé'}
      </div>
    );
  }

  if (!ticketData?.success || ticketData?.count === 0) {
    return <div className="text-center py-8">Bạn chưa có vé nào.</div>;
  }

  // Group tickets by order_id
  const ticketsByOrder = ticketData.tickets.reduce((acc, ticket) => {
    if (!acc[ticket.order_id]) {
      acc[ticket.order_id] = {
        ...ticket,
        seats: [{ seat_number: ticket.seat_number, ticket_id: ticket.ticket_id, ticket_price: ticket.ticket_price }],
      };
    } else {
      acc[ticket.order_id].seats.push({
        seat_number: ticket.seat_number,
        ticket_id: ticket.ticket_id,
        ticket_price: ticket.ticket_price,
      });
    }
    return acc;
  }, {});

  const handleCardClick = (orderId) => {
    navigate(`/ticket-details/${orderId}`);
  };

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-red-500">🎟 Vé của tôi</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {Object.values(ticketsByOrder).map((order) => (
          <div
            key={order.order_id}
            className="border border-red-500 rounded-lg shadow-lg bg-gray-900 overflow-hidden"
            style={{ position: 'relative' }}
            onClick={() => handleCardClick(order.order_id)}
          >
            {/* Logo Placeholder */}
            <div
              className="absolute left-0 top-0 w-12 h-full bg-red-600 flex items-center justify-center"
              style={{ transform: 'translateX(-100%)' }}
            >
              <span className="text-white font-semibold">BETA</span>
            </div>

            <div className="flex items-center p-4 cursor-pointer hover:bg-gray-800 transition">
              <img
                src={
                  order.poster_path.startsWith('http')
                    ? order.poster_path
                    : `https://image.tmdb.org/t/p/w200${order.poster_path}`
                }
                alt={order.movie_title}
                className="w-24 h-36 object-cover rounded-md mr-4 shadow-lg shadow-red-700/40"
                onError={(e) => (e.target.src = '/placeholder.png')}
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">{order.movie_title}</h2>
                <p className="text-gray-400">{order.RapChieu}</p>
                <p className="text-gray-400">
                  {format(parseISO(order.GioBatDau), 'HH:mm', { locale: vi })} -{' '}
                  {format(parseISO(order.GioKetThuc), 'dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
              {order.order_status === 'pending' && (
                <div className="ml-auto text-sm font-semibold bg-yellow-400 text-white px-2 py-1 rounded">
                  Chưa thanh toán
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyTicket;