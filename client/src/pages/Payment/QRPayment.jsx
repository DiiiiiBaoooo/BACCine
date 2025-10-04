import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const QRPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingData } = location.state || {};
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrError, setQrError] = useState(null);

  // Mã QR từ Sepay
  console.log(bookingData);
  
  const placeholderQRCode = 
     `https://qr.sepay.vn/img?acc=VQRQAENDB9712&bank=MBBank&amount=${bookingData.grand_total}&des=${bookingData.order_id}`

  // Kiểm tra nếu không có bookingData hoặc order_id
  useEffect(() => {
    if (!bookingData || !bookingData.order_id || !bookingData.grand_total) {
      toast.error('Thông tin đặt vé không hợp lệ');
      navigate('/');
    }
  }, [bookingData, navigate]);

  // Polling trạng thái đơn hàng
  useEffect(() => {
    if (!bookingData?.order_id) return;

    const handleGetDetailOrder = async () => {
      try {
        const res = await axios.get(`/api/bookings/getoderdetail/${bookingData.order_id}`);
        if (!res.data.success) {
          throw new Error(res.data.message || 'Lỗi khi lấy chi tiết đơn hàng');
        }
        const { status } = res.data.data;

        if (status !== 'pending') {
          if (status === 'confirmed') {
            setIsSuccess(true);
            toast.success('Thanh toán thành công!');
            navigate('/confirmation', { state: { bookingData: res.data.data } });
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

    const interval = setInterval(handleGetDetailOrder, 10000); // Tăng lên 10s để giảm tải

    return () => clearInterval(interval); // Dọn dẹp interval
  }, [bookingData, navigate]);

  // Kiểm tra tải QR code
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

  if (!bookingData || !bookingData.order_id || !bookingData.grand_total) {
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
        {/* Phần mã QR */}
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

        {/* Phần chi tiết thanh toán */}
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
              <span className="text-white font-medium">{bookingData.grand_total.toLocaleString()} VND</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Nội dung chuyển khoản:</span>
              <span className="text-white font-medium">{bookingData.order_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPayment;