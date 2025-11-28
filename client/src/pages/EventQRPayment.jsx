import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios"; // hoặc dùng fetch

const EventQRPayment = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending | success | failed
  const [loading, setLoading] = useState(true);
  const [qrError, setQrError] = useState(null);
  const [hasAutoCancelled, setHasAutoCancelled] = useState(false);

  const { id: purchase_id, amount: amountStr } = useParams();
  const amount = parseFloat(amountStr);
  const navigate = useNavigate();
  const intervalRef = useRef(null); // để clear khi unmount

  // Tạo QR
  useEffect(() => {
    if (purchase_id && amount && !isNaN(amount) && amount > 0) {
      const qrUrl = `https://qr.sepay.vn/img?acc=VQRQAFOHR2810&bank=MBBank&amount=${amount}&des=${purchase_id}`;
      setQrCodeUrl(qrUrl);
    } else {
      setQrError("Thông tin thanh toán không hợp lệ");
      setLoading(false);
    }
  }, [purchase_id, amount]);

  // Countdown + Auto cancel khi hết giờ
  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus("failed");
      if (!hasAutoCancelled && purchase_id) {
        setHasAutoCancelled(true);
        // Gọi API hủy
        axios.delete(`/api/event-requests/${purchase_id}/cancel`)
          .then(() => toast.warning("Đã hết thời gian! Yêu cầu đã hủy tự động"))
          .catch(() => toast.error("Không thể hủy tự động"));
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, purchase_id, hasAutoCancelled]);

  // POLLING: Kiểm tra trạng thái thanh toán mỗi 5 giây
  useEffect(() => {
    if (!purchase_id || paymentStatus !== "pending") return;

    const checkPaymentStatus = async () => {
      try {
        const res = await axios.get(`/api/events/payment-status/${purchase_id}`);
        
        if (res.data.success && res.data.data.isPaid) {
          setPaymentStatus("success");
          toast.success("Thanh toán thành công! Đang chuyển hướng...");
          
          // Dừng polling
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        console.log("Polling error (bỏ qua):", err.message);
        // Không toast lỗi để tránh làm phiền người dùng
      }
    };

    // Kiểm tra ngay lần đầu
    checkPaymentStatus();

    // Sau đó cứ 5 giây kiểm tra 1 lần
    intervalRef.current = setInterval(checkPaymentStatus, 5000);

    // Cleanup khi rời trang hoặc thành công/hết giờ
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [purchase_id, paymentStatus]);
  // POLLING: Bắt đầu sau đúng 5 giây, lặp lại mỗi 5 giây
  useEffect(() => {
    if (!purchase_id || paymentStatus !== "pending") return;

    const checkPaymentStatus = async () => {
      try {
        const res = await axios.get(`/api/event-requests/payment-status/${purchase_id}`);
        if (res.data.success && res.data.data.isPaid) {
          setPaymentStatus("success");
          toast.success("Thanh toán thành công!");
        }
      } catch (err) {
        console.log("Check payment status error:", err.message);
      }
    };

    // Chờ 5 giây rồi bắt đầu polling
    const timer = setTimeout(() => {
      checkPaymentStatus(); // lần 1
      intervalRef.current = setInterval(checkPaymentStatus, 5000); // từ lần 2 trở đi
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [purchase_id, paymentStatus]);
  // Load QR image
  useEffect(() => {
    if (!qrCodeUrl) return;
    const img = new Image();
    img.src = qrCodeUrl;
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setQrError("Không thể tải mã QR");
      setLoading(false);
    };
  }, [qrCodeUrl]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // MÀN HÌNH THÀNH CÔNG
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div class="text-8xl mb-6">Checkmark</div>
          <h2 class="text-4xl font-bold text-green-600 mb-4">Thanh toán thành công!</h2>
          <p class="text-gray-600 mb-8">
            Suất chiếu riêng đã được xác nhận thành công.<br />
            Vé đã được gửi qua email và có trong danh sách yêu cầu của bạn.
          </p>
          <div class="space-y-4">
            <button
              onClick={() => navigate("/my-events")}
              class="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-full text-lg font-bold"
            >
              Xem danh sách yêu cầu
            </button>
            <button
              onClick={() => navigate(`/ticket/${purchase_id}`)} // hoặc link xem vé
              class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-full text-lg font-bold"
            >
              Xem vé suất chiếu riêng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH HẾT GIỜ
  if (paymentStatus === "failed" || timeLeft <= 0) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div class="text-8xl mb-6">Clock</div>
          <h2 class="text-4xl font-bold text-red-600 mb-4">Hết thời gian thanh toán</h2>
          <p class="text-gray-600 mb-8">
            Mã QR đã hết hiệu lực và yêu cầu <strong>đã được hủy tự động</strong>.
          </p>
          <div class="space-y-4">
            <button
              onClick={() => navigate("/my-events")}
              class="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-full font-bold"
            >
              Quay lại danh sách
            </button>
            <button
              onClick={() => navigate("/event")}
              class="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-full font-bold"
            >
              Đặt suất chiếu mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH ĐANG CHỜ THANH TOÁN
  return (
    <div class="min-h-screen bg-black text-white py-8 px-4">
      <div class="text-center mb-8">
        <h2 class="text-4xl font-bold text-orange-500 mb-3">Thanh toán suất chiếu riêng</h2>
        <div class={`text-3xl font-bold ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          Thời gian còn lại: {formatTime(timeLeft)}
        </div>
        {timeLeft <= 120 && timeLeft > 0 && (
          <p class="mt-4 text-yellow-400 text-xl animate-pulse">
            Sắp hết thời gian! Vui lòng thanh toán nhanh
          </p>
        )}
      </div>

      <div class="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">

        {/* QR Code */}
        <div class="bg-gray-900 rounded-2xl p-8 flex-1 text-center">
          <h3 class="text-2xl text-orange-400 mb-6">Quét mã để thanh toán</h3>
          {loading ? (
            <div class="h-64 flex items-center justify-center">
              <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500"></div>
            </div>
          ) : (
            <img src={qrCodeUrl} alt="QR" class="mx-auto w-80 h-80 bg-white p-4 rounded-xl" />
          )}
          <p class="mt-6 text-gray-300">Dùng app ngân hàng quét mã VietQR</p>
        </div>

        {/* Thông tin chuyển khoản */}
        <div class="bg-gray-900 rounded-2xl p-8 flex-1">
          <h3 class="text-2xl text-orange-400 mb-6">Thông tin chuyển khoản</h3>
          <div class="space-y-5 text-lg">
            <div class="flex justify-between"><span class="text-gray-400">Ngân hàng:</span> <strong>MB Bank</strong></div>
            <div class="flex justify-between"><span class="text-gray-400">Chủ TK:</span> <strong>Nguyen Duy Bao</strong></div>
            <div class="flex justify-between"><span class="text-gray-400">Số TK:</span> <strong>0822191159</strong></div>
            <div class="flex justify-between"><span class="text-gray-400">Số tiền:</span> <strong class="text-2xl text-green-400">{amount.toLocaleString('vi-VN')} ₫</strong></div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Nội dung:</span>
              <div class="bg-gray-800 px-4 py-2 rounded-lg font-mono text-yellow-300">
                {purchase_id}
              </div>
            </div>
          </div>

          <div class="mt-8 p-5 bg-yellow-900 bg-opacity-40 border border-yellow-600 rounded-xl">
            <p class="text-yellow-300 text-center text-lg">
              Lưu ý: Chuyển đúng <strong>số tiền</strong> và <strong>nội dung</strong> để hệ thống xác nhận tự động trong vòng 30 giây!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventQRPayment;