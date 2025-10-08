import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeftIcon } from 'lucide-react';
import { format } from 'date-fns';
import { assets } from '../assets/assets';
import axios from 'axios';
const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

const PaymentSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Static payment methods
  const paymentMethods = [
    { id: 1, name: 'MOMO', icon: assets.momo },
    { id: 2, name: 'Stripe', icon: assets.stripe },
    { id: 3, name: 'VNPay', icon: assets.vnpay },
    { id: 4, name: 'QR Code', icon: assets.qr },
  ];

  // Validate booking data
  useEffect(() => {
    if (!bookingData) {
      toast.error('Thông tin đặt vé không hợp lệ');
      navigate('/');
    }
  }, [bookingData, navigate]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPaymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán');
      return;
    }

    setSubmitting(true);
    try {
      // Chuẩn bị dữ liệu cho API createBooking
      const payload = {
        cinema_id: bookingData.cinema_id,
        user_id: bookingData.user_id,
        showtime_id: bookingData.showtime_id,
          status:'pending',
        tickets: bookingData.tickets,
        services: bookingData.services,
        payment_method: paymentMethods.find((pm) => pm.id === selectedPaymentMethod).name.toLowerCase(),
        promotion_id: bookingData.promotion_id
      };
console.log(payload);
// nếu method = qr thì gọi api create-booking sau đó chuyển sang trang QRPayMEnt với data trả Về
if (paymentMethods.find((pm) => pm.id === selectedPaymentMethod).name.toLowerCase() === 'qr code') {
  const response = await axios.post('/api/bookings/create-booking', payload);
  if (response.data.success) {
    navigate('/qr-payment', {
      state: {
        bookingData: response.data.data
      }
    });
  }
  else{
    toast.error(response.data.message);
  }}

      // Gọi API createBooking
      // const response = await axios.post('/api/bookings', payload);
      // if (response.data.success) {
      //   toast.success('Đặt vé thành công!');
      //   navigate('/confirmation', {
      //     state: {
      //       bookingData: {
      //         ...bookingData,
      //         order_id: response.data.data.order_id,
      //         payment_method: payload.payment_method
      //       }
      //     }
      //   });
      // } else {
      //   throw new Error(response.data.message || 'Không thể tạo đơn hàng');
      // }
    } catch (error) {
      console.error('Error booking:', error);
      toast.error('Lỗi khi đặt vé: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Thông tin đặt vé không hợp lệ</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mr-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold">Chọn phương thức thanh toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-700 hover:border-primary/60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white text-xl">
                        <img src={method.icon} alt={method.name} className="w-8 h-8 object-contain" />
                      </div>
                      <span className="font-medium">{method.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl text-center font-semibold mb-4 text-primary">Tóm tắt đơn hàng</h2>
              
              {/* Movie Poster */}
              <div className="mb-4 flex justify-center">
                <img
                  src={image_base_url + bookingData.movieimg}
                  alt={bookingData.movieName || 'Poster phim'}
                  className="h-80 w-56 object-cover rounded-lg shadow-lg"
                />
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3 ml-12">
                  <div>
                    <span className="text-gray-400 text-sm">Tên phim:</span>
                    <p className="font-medium text-white text-lg">{bookingData.movieName || 'Tên phim'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Rạp chiếu:</span>
                    <p className="font-medium text-white">{bookingData.cinemaName || 'Tên rạp'}</p>
                  </div>
                </div>
                <div className="space-y-3 ml-8">
                  <div>
                    <span className="text-gray-400 text-sm">Ngày chiếu:</span>
                    <p className="font-medium text-white">{bookingData.date}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Giờ chiếu:</span>
                    <p className="font-medium text-white">
                      {bookingData.selectedTime?.start_time
                        ? (() => {
                            try {
                              return format(new Date(bookingData.selectedTime.start_time), 'HH:mm');
                            } catch (error) {
                              console.error('Error formatting time:', error);
                              return 'N/A';
                            }
                          })()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-6 space-y-3">
                <div>
                  <span className="text-gray-400">Ghế đã chọn:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {bookingData.tickets.map((ticket) => (
                      <span key={ticket.seat_id} className="px-2 py-1 bg-primary text-white rounded text-sm">
                        {ticket.seat_id}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Số vé:</span>
                  <span className="font-medium">{bookingData.tickets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiền vé:</span>
                  <span className="font-medium">{bookingData.ticket_total.toLocaleString()} VND</span>
                </div>
                {bookingData.service_total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dịch vụ:</span>
                    <span className="font-medium">{bookingData.service_total.toLocaleString()} VND</span>
                  </div>
                )}
                {bookingData.discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Giảm giá áp dụng:</span>
                    <span>-{bookingData.discount_amount.toLocaleString()} VND</span>
                  </div>
                )}
                <hr className="border-gray-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{bookingData.grand_total.toLocaleString()} VND</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePaymentSubmit}
                disabled={submitting || !selectedPaymentMethod}
                className="w-full mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelection;