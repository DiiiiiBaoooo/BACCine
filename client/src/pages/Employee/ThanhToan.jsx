import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Banknote, QrCode } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ThanhToan = () => {
  const { state } = useLocation();
  const { bookingData, cinemaId } = state || {};
  const navigate = useNavigate();
  const [contactInfo, setContactInfo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');

  const validateContactInfo = () => {
    if (!contactInfo) return true; // Contact info is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,11}$/;
    return emailRegex.test(contactInfo) || phoneRegex.test(contactInfo);
  };

  const handleConfirmPayment = async () => {
    if (!validateContactInfo()) {
      setError('Vui lòng nhập email hoặc số điện thoại hợp lệ');
      return;
    }

    try {
      // Prepare API payload
      const payload = {
        cinema_id: cinemaId,
        user_id: null, // Set to null or retrieve from auth context if available
        showtime_id: bookingData.showtimeId,
        tickets: bookingData.seats.map((seat, index) => ({
          seat_id: seat, // Assuming seat is the seat_id (e.g., "A1")
          ticket_price: bookingData.seatTotal / bookingData.seats.length, // Distribute seatTotal evenly
        })),
        services: bookingData.services.map((service) => ({
          service_id: service.id,
          quantity: service.quantity,
        })),
        payment_method: paymentMethod,
        promotion_id: null, // Add logic for promotions if available
        phone: /^[0-9]{10,11}$/.test(contactInfo) ? contactInfo : null,
      };

      // Call createBooking API
      const response = await axios.post('/api/bookings/create-booking', {
        ...payload,
        status: paymentMethod === 'cash' ? 'confirmed' : 'pending',
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Lỗi khi tạo đơn hàng');
      }

      const finalBooking = {
        ...bookingData,
        order_id: response.data.data.order_id,
        contactInfo,
        payment_method: paymentMethod,
        ticket_total: response.data.data.ticket_total,
        service_total: response.data.data.service_total,
        discount_amount: response.data.data.discount_amount,
        grand_total: response.data.data.grand_total,
        timestamp: new Date().toISOString(),
      };

      toast.success('Đặt vé thành công!');

      if (paymentMethod === 'cash') {
        navigate('/booking-confirmation', { state: { bookingData: finalBooking } });
      } else {
        navigate('/qr-payment', { state: { bookingData: finalBooking } });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Lỗi khi tạo đơn hàng');
    }
  };

  const goBackToServiceSelection = () => {
    navigate('/chon-dich-vu', { state: { bookingData, cinemaId } });
  };

  if (!bookingData || !cinemaId) {
    return <div className="text-center text-red-500">Dữ liệu không hợp lệ</div>;
  }

  const serviceTotal = bookingData.services.reduce(
    (sum, s) => sum + Number(s.price || 0) * s.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goBackToServiceSelection}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <h1 className="text-lg font-semibold text-white">Cinema Booking</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Page Title */}
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white text-balance">
                Hoàn tất đặt vé của bạn
              </h2>
              <p className="text-gray-400 text-lg">
                Vui lòng xác nhận thông tin và chọn phương thức thanh toán
              </p>
            </div>

            {/* Step 1: Contact Information */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-semibold text-sm">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white">Thông tin tích điểm</h3>
              </div>
              <p className="text-sm text-gray-400 pl-11">
                Nhập email hoặc số điện thoại để tích điểm (không bắt buộc)
              </p>
              <div className="pl-11 space-y-2">
                <label className="block text-sm font-medium text-white">
                  Email hoặc Số điện thoại
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => {
                    setContactInfo(e.target.value);
                    setError('');
                  }}
                  placeholder="example@email.com hoặc 0123456789"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-semibold text-sm">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white">Chọn phương thức thanh toán</h3>
              </div>
              <div className="pl-11 space-y-3">
                {/* Cash Option */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-red-600 bg-red-600/5'
                      : 'border-gray-800 hover:border-red-600/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="w-5 h-5 text-red-600 focus:ring-red-600"
                  />
                  <Banknote className="w-6 h-6 text-white" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">Tiền mặt</p>
                    <p className="text-sm text-gray-400">Thanh toán tại quầy khi nhận vé</p>
                  </div>
                  {paymentMethod === 'cash' && <Check className="w-5 h-5 text-red-600" />}
                </label>

                {/* QR Code Option */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'qr'
                      ? 'border-red-600 bg-red-600/5'
                      : 'border-gray-800 hover:border-red-600/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="qr code"
                    checked={paymentMethod === 'qr code'}
                    onChange={() => setPaymentMethod('qr code')}
                    className="w-5 h-5 text-red-600 focus:ring-red-600"
                  />
                  <QrCode className="w-6 h-6 text-white" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">QR Code</p>
                    <p className="text-sm text-gray-400">Quét mã QR để thanh toán ngay</p>
                  </div>
                  {paymentMethod === 'qr code' && <Check className="w-5 h-5 text-red-600" />}
                </label>

               
              </div>
            </div>

            {/* Mobile Summary - Show only on mobile */}
            <div className="lg:hidden bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Tóm tắt đơn hàng</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiền vé ({bookingData.seats.length} ghế)</span>
                  <span className="font-medium text-white">
                    {bookingData.seatTotal.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dịch vụ</span>
                  <span className="font-medium text-white">
                    {serviceTotal.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="border-t border-gray-800 pt-3 flex justify-between text-lg">
                  <span className="font-semibold text-white">Tổng cộng</span>
                  <span className="font-bold text-red-600">
                    {bookingData.total.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
              <button
                onClick={handleConfirmPayment}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-8 bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
              <h3 className="text-xl font-semibold text-white">Thông tin đặt vé</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Phim</p>
                  <p className="font-semibold text-white">{bookingData.movieTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Thời gian</p>
                    <p className="font-medium text-white">
                      {new Date(bookingData.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Phòng</p>
                    <p className="font-medium text-white">{bookingData.roomName}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Ghế đã chọn</p>
                  <p className="font-medium text-white">{bookingData.seats.join(', ')}</p>
                </div>
              </div>
              {bookingData.services.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Combo đã chọn</p>
                  {bookingData.services.map((service) => (
                    <div key={service.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-white">{service.name}</p>
                        <p className="text-gray-400">
                          {Number(service.price || 0).toLocaleString('vi-VN')} VND × {service.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-white">
                        {(Number(service.price || 0) * service.quantity).toLocaleString('vi-VN')} VND
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 pt-4 border-t border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tiền vé</span>
                  <span className="font-medium text-white">
                    {bookingData.seatTotal.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Dịch vụ</span>
                  <span className="font-medium text-white">
                    {serviceTotal.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-800">
                  <span className="font-semibold text-white">Tổng cộng</span>
                  <span className="text-2xl font-bold text-red-600">
                    {bookingData.total.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
              <button
                onClick={handleConfirmPayment}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                Xác nhận thanh toán
              </button>
              <p className="text-xs text-center text-gray-400">
                Bằng việc tiếp tục, bạn đồng ý với{' '}
                <a href="#" className="text-red-600 hover:underline">
                  Điều khoản dịch vụ
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThanhToan;