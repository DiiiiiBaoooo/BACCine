import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const QRPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Get query parameters
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrError, setQrError] = useState(null);

  // Get bookingData from location.state or query parameters
  const { bookingData } = location.state || {};
  const order_id = searchParams.get('order_id') || bookingData?.order_id;
  const grand_total = parseFloat(searchParams.get('grand_total')) || bookingData?.grand_total;

  // Construct bookingData object
  const effectiveBookingData = {
    order_id: order_id || '',
    grand_total: grand_total || 0,
  };

  // Log for debugging
  console.log('QRPayment bookingData:', {
    fromState: bookingData,
    fromQuery: { order_id, grand_total },
    effectiveBookingData,
  });

  // Generate QR code URL
  const placeholderQRCode = effectiveBookingData.order_id && effectiveBookingData.grand_total
    ? `https://qr.sepay.vn/img?acc=VQRQAENDB9712&bank=MBBank&amount=${effectiveBookingData.grand_total}&des=${effectiveBookingData.order_id}`
    : null;

  // Check if bookingData is valid
  useEffect(() => {
    if (!effectiveBookingData.order_id || !effectiveBookingData.grand_total) {
      toast.error('Thông tin đặt vé không hợp lệ');
      navigate('/');
    }
  }, [effectiveBookingData, navigate]);

  // Polling order status
  useEffect(() => {
    if (!effectiveBookingData.order_id) return;

    const handleGetDetailOrder = async () => {
      try {
        const res = await axios.get(`/api/bookings/getoderdetail/${effectiveBookingData.order_id}`);
        if (!res.data.success) {
          throw new Error(res.data.message || 'Lỗi khi lấy chi tiết đơn hàng');
        }
        const { status } = res.data.data;

        if (status !== 'pending') {
          if (status === 'confirmed') {
            setIsSuccess(true);
            toast.success('Thanh toán thành công!');
            navigate(`/ticket-details/${effectiveBookingData.order_id}`, {
              state: { order_id: effectiveBookingData.order_id },
            });
          } else if (status === 'cancelled') {
            setIsSuccess(false);
            toast.error('Thanh toán thất bại');
            navigate('/payment-failed');
          }
        }
      } catch (error) {
        console.error('Error checking order status:', error);
        if (error.response?.status === 404) {
          toast.error('Đơn hàng không tồn tại');
          navigate('/payment-failed');
        } else {
          toast.error('Lỗi khi kiểm tra trạng thái đơn hàng');
        }
      }
    };

    const interval = setInterval(handleGetDetailOrder, 10000); // Poll every 10 seconds

    return () => clearInterval(interval); // Cleanup interval
  }, [effectiveBookingData.order_id, navigate]);

  // Check QR code loading
  useEffect(() => {
    if (placeholderQRCode) {
      const img = new Image();
      img.src = placeholderQRCode;
      img.onload = () => setLoading(false);
      img.onerror = () => {
        setLoading(false);
        setQrError('Không thể tải mã QR');
        toast.error('Lỗi khi tải mã QR');
      };
    } else {
      setLoading(false);
      setQrError('Không thể tạo mã QR do thông tin không hợp lệ');
      toast.error('Lỗi khi tạo mã QR');
    }
  }, [placeholderQRCode]);

  if (!effectiveBookingData.order_id || !effectiveBookingData.grand_total) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">Thông tin đặt vé không hợp lệ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-orange-500 mb-8 text-center">Thanh toán bằng mã QR</h2>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
        {/* QR Code Section */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg flex-1">
          <h4 className="text-lg font-semibold text-orange-500 mb-4">Quét mã để thanh toán</h4>
          {loading ? (
            <p className="text-gray-400 text-center">Đang tải mã QR...</p>
          ) : qrError ? (
            <p className="text-red-400 text-center">{qrError}</p>
          ) : (
            <img
              src={placeholderQRCode}
              alt="QR Code"
              className="w-48 h-48 md:w-64 md:h-64 object-contain mx-auto bg-white p-2 rounded-md"
            />
          )}
          <p className="text-gray-400 text-center mt-4">Sử dụng ứng dụng ngân hàng của bạn để quét mã thanh toán</p>
        </div>

        {/* Payment Details Section */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg flex-1">
          <h3 className="text-xl font-semibold text-orange-500 mb-4">Chi tiết thanh toán</h3>
          <div className="flex items-center gap-4 mb-6">
            <img src="/logomb.jpg" alt="MB Bank Logo" className="w-16 h-16 object-contain rounded-md" />
            <div>
              <p className="text-lg font-medium text-white">MB Bank</p>
              <p className="text-sm text-gray-400">Chuyển khoản ngân hàng</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Chủ tài khoản:</span>
              <span className="text-white font-medium">Nguyen Duy Bao</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Số tài khoản:</span>
              <span className="text-white font-medium">0822191159</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Số tiền:</span>
              <span className="text-white font-medium">{effectiveBookingData.grand_total.toLocaleString()} VND</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Nội dung chuyển khoản:</span>
              <span className="text-white font-medium">{effectiveBookingData.order_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPayment;