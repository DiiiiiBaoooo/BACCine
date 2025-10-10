// PrintTicket.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Film, MapPin, Clock, Armchair, CreditCard, CheckCircle2, Printer } from 'lucide-react';
import { getMyTickets } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

const PrintTicket = () => {
  const navigate = useNavigate();
  const { order_id } = useParams();
  

  const { isLoading: isAuthLoading, authUser } = useAuthUser();

  const {
    data: ticketData,
    isLoading: isTicketsLoading,
    error,
  } = useQuery({
    queryKey: ['myTickets'],
    queryFn: () => getMyTickets(),
    enabled: !!authUser?.id,
    retry: false,
  });

  useEffect(() => {
    if (!order_id) {
      navigate('/');
    }
  }, [order_id, navigate]);

  if (isAuthLoading || isTicketsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Đang tải vé...</p>
        </div>
      </div>
    );
  }

  if (error || !ticketData?.success || ticketData?.count === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-destructive text-lg font-medium">
            Lỗi: {error?.message || 'Không thể tải vé để in'}
          </div>
        </div>
      </div>
    );
  }

  const order = ticketData.tickets.find((t) => String(t.order_id) === order_id);

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          Vé không tồn tại. Mã đơn: {order_id}
        </div>
      </div>
    );
  }

  const qrData = order.qrCode;

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden fixed top-6 right-6 z-50">
        <button
          onClick={() => window.print()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg gap-2 flex items-center px-4 py-2 rounded-lg transition-colors"
        >
          <Printer className="h-5 w-5" />
          In Vé
        </button>
      </div>

      {/* Ticket Container */}
      <div className="container mx-auto px-4 py-12 print:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Ticket Card */}
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:border-black">
            {/* Header Section */}
            <div className="bg-primary text-primary-foreground px-8 py-6 print:bg-black print:text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="h-6 w-6" />
                    <span className="text-sm font-medium uppercase tracking-wider opacity-90">Vé Xem Phim</span>
                  </div>
                  <h1 className="text-3xl font-bold text-balance leading-tight">{order.movie_title}</h1>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-75 mb-1">Mã Đơn</div>
                  <div className="text-lg font-mono font-bold">#{order.order_id}</div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8 print:p-6">
              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Location */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg print:bg-gray-50">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 print:text-black" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1 print:text-gray-600">Rạp Chiếu</div>
                      <div className="font-semibold text-foreground print:text-black">{order.RapChieu}</div>
                      <div className="text-sm text-muted-foreground mt-1 print:text-gray-700">
                        Phòng {order.PhongChieu}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg print:bg-gray-50">
                    <Clock className="h-5 w-5 text-primary mt-0.5 print:text-black" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1 print:text-gray-600">Thời Gian Chiếu</div>
                      <div className="font-semibold text-foreground print:text-black">
                        {format(parseISO(order.GioBatDau), 'HH:mm', { locale: vi })} -{' '}
                        {format(parseISO(order.GioKetThuc), 'HH:mm', { locale: vi })}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 print:text-gray-700">
                        {format(parseISO(order.GioBatDau), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seats & Payment */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg print:bg-gray-50">
                    <Armchair className="h-5 w-5 text-primary mt-0.5 print:text-black" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1 print:text-gray-600">Ghế Ngồi</div>
                      <div className="font-semibold text-foreground print:text-black">
                        {order.seats.map((seat) => seat.seat_number).join(', ')}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 print:text-gray-700">
                        {order.seats.length} ghế
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg print:bg-gray-50">
                    <CreditCard className="h-5 w-5 text-primary mt-0.5 print:text-black" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1 print:text-gray-600">Tổng Thanh Toán</div>
                      <div className="text-2xl font-bold text-foreground print:text-black">
                        {order.total_amount.toLocaleString('vi-VN')} ₫
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            order.order_status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                          } print:text-green-700`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            order.order_status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                          } print:text-green-700`}
                        >
                          {order.order_status === 'confirmed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-border print:border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card  px-4 text-lg mt-10 text-muted-foreground uppercase tracking-wider print:bg-white print:text-gray-600">
                    Mã Check-in
                  </span>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="text-center">
                <div className="inline-block p-6 bg-white rounded-2xl border-2 border-border print:border-gray-300">
                  {qrData ? (
                    <img
                      src={qrData || '/placeholder.svg'}
                      alt="QR Code Check-in"
                      className="w-48 h-48 mx-auto print:w-56 print:h-56"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-muted-foreground print:w-56 print:h-56 print:text-gray-600">
                      Không có mã QR
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground print:text-gray-600">
                  Vui lòng xuất trình mã QR này tại quầy để check-in
                </p>
              </div>

              {/* Footer Note */}
              <div className="mt-8 pt-6 border-t border-border print:border-gray-300">
                <p className="text-xs text-center text-muted-foreground print:text-gray-600">
                  Vé chỉ có giá trị cho suất chiếu đã ghi. Vui lòng đến trước giờ chiếu 15 phút.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTicket;