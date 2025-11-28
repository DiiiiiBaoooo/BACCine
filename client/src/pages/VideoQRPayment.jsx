import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const VideoQRPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [qrError, setQrError] = useState(null);

  const purchase_id = searchParams.get('purchase_id');
  const amount = parseFloat(searchParams.get('amount'));

  // Generate QR code URL (giống QRPayment.jsx)
  const qrCodeUrl = purchase_id && amount
    ? `https://qr.sepay.vn/img?acc=VQRQAENDB9712&bank=MBBank&amount=${amount}&des=${purchase_id}`
    : null;

  // Validate params
  useEffect(() => {
    if (!purchase_id || !amount) {
      toast.error('Thông tin thanh toán không hợp lệ');
      navigate('/video');
    }
  }, [purchase_id, amount, navigate]);

  // Polling purchase status (giống QRPayment.jsx)
  useEffect(() => {
    if (!purchase_id) return;

    const checkPurchaseStatus = async () => {
      try {
        const res = await axios.get(`/api/video-purchase/check-status/${purchase_id}`);
        if (!res.data.success) return;

        const { status } = res.data;

        if (status === 'completed') {
          toast.success('Thanh toán thành công!');
          navigate(`/xem-phim/${res.data.video_id}`);
        } else if (status === 'failed') {
          toast.error('Thanh toán thất bại');
          navigate('/video');
        }
      } catch (error) {
        console.error('Error checking purchase status:', error);
      }
    };

    const interval = setInterval(checkPurchaseStatus, 10000); // Poll mỗi 10s
    return () => clearInterval(interval);
  }, [purchase_id, navigate]);

  // Check QR loading
  useEffect(() => {
    if (qrCodeUrl) {
      const img = new Image();
      img.src = qrCodeUrl;
      img.onload = () => setLoading(false);
      img.onerror = () => {
        setLoading(false);
        setQrError('Không thể tải mã QR');
        toast.error('Lỗi khi tải mã QR');
      };
    } else {
      setLoading(false);
      setQrError('Không thể tạo mã QR');
    }
  }, [qrCodeUrl]);

  if (!purchase_id || !amount) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">Thông tin thanh toán không hợp lệ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-orange-500 mb-8 text-center">
        Thanh toán mua video
      </h2>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
        {/* QR Code Section */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg flex-1">
          <h4 className="text-lg font-semibold text-orange-500 mb-4">
            Quét mã để thanh toán
          </h4>
          {loading ? (
            <p className="text-gray-400 text-center">Đang tải mã QR...</p>
          ) : qrError ? (
            <p className="text-red-400 text-center">{qrError}</p>
          ) : (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-48 h-48 md:w-64 md:h-64 object-contain mx-auto bg-white p-2 rounded-md"
            />
          )}
          <p className="text-gray-400 text-center mt-4">
            Sử dụng ứng dụng ngân hàng để quét mã
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg flex-1">
          <h3 className="text-xl font-semibold text-orange-500 mb-4">
            Chi tiết thanh toán
          </h3>

          <div className="flex items-center gap-4 mb-6">
            <img src="/logomb.jpg" alt="MB Bank" className="w-16 h-16 rounded-md" />
            <div>
              <p className="text-lg font-medium">MB Bank</p>
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
              <span className="text-white font-medium">
                {amount.toLocaleString()} VND
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Nội dung:</span>
              <span className="text-white font-medium">{purchase_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoQRPayment;