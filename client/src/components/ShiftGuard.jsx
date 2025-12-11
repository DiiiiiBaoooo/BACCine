import React from 'react';
import { Clock, AlertCircle, Moon, Coffee } from 'lucide-react';
import useCheckShift from '../hooks/useCheckShift';
import { useNavigate } from 'react-router-dom';

const ShiftGuard = ({ employeeId, cinemaClusterId, children }) => {
  const { 
    loading, 
    hasShift, 
    isClosed, 
    message, 
    currentShift, 
    currentTime,
    closedPeriod,
    reopenTime 
  } = useCheckShift(employeeId, cinemaClusterId);
  
  const navigate = useNavigate();
  
  // ⭐ FORMAT THỜI GIAN HIỆN TẠI THEO MÚI GIỜ VIỆT NAM
  const getVietnamTime = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = String(vietnamTime.getUTCHours()).padStart(2, '0');
    const minute = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
    const second = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
    return `${hour}:${minute}:${second}`;
  };

  const currentTimeFormatted = getVietnamTime();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra ca làm việc...</p>
        </div>
      </div>
    );
  }

  // ⭐ TRƯỜNG HỢP 1: RẠP ĐÓNG CỬA (0h-6h)
  if (isClosed) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Icon Đêm */}
            <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Moon className="w-10 h-10 text-indigo-600" />
            </div>

            {/* Tiêu đề */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Rạp Phim Ngoài Giờ Phục Vụ
            </h2>

            {/* Thời gian hiện tại */}
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Thời gian hiện tại:</span>
              </div>
              {/* ⭐ SỬ DỤNG currentTime TỪ API HOẶC FORMATTED TIME */}
              <p className="text-3xl font-bold text-indigo-600">
                {currentTime || currentTimeFormatted}
              </p>
            </div>

            {/* Thông tin đóng cửa */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Moon className="w-5 h-5 text-gray-600" />
                <p className="text-sm font-semibold text-gray-700">Giờ nghỉ:</p>
              </div>
              <p className="text-xl font-bold text-gray-800 mb-3">{closedPeriod}</p>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coffee className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-700">Mở cửa lại lúc:</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{reopenTime}</p>
              </div>
            </div>

            {/* Thông báo */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 text-left">
                Rạp phim đang trong giờ nghỉ. Vui lòng quay lại vào {reopenTime} sáng.
                Chúc bạn nghỉ ngơi thật tốt! 😴
              </p>
            </div>

            {/* Nút hành động */}
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Kiểm Tra Lại
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Trở Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ⭐ TRƯỜNG HỢP 2: CHƯA TỚI CA LÀM
  if (!hasShift) {
    const shiftNames = {
      morning: 'Ca Sáng (6h-12h)',
      afternoon: 'Ca Chiều (12h-18h)',
      evening: 'Ca Tối (18h-24h)',
    };

    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-red-600" />
            </div>

            {/* Tiêu đề */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Chưa Tới Ca Làm Việc
            </h2>

            {/* Thông tin hiện tại */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Thời gian hiện tại:</span>
              </div>
              {/* ⭐ SỬ DỤNG currentTime TỪ API HOẶC FORMATTED TIME */}
              <p className="text-3xl font-bold text-red-600">
                {currentTime || currentTimeFormatted}
              </p>
              
              {currentShift && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Ca hiện tại:</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {shiftNames[currentShift] || currentShift}
                  </p>
                </div>
              )}
            </div>

            {/* Thông báo */}
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 text-left">
                Bạn chưa có ca làm việc vào thời điểm này. Vui lòng kiểm tra lịch làm việc 
                hoặc liên hệ quản lý để biết thêm chi tiết.
              </p>
            </div>

            {/* Nút hành động */}
            <div className="space-y-2">
              <button
                onClick={() => navigate('/employee/llv')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Xem Lịch Làm Việc
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Kiểm Tra Lại
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Trở Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ⭐ TRƯỜNG HỢP 3: CÓ CA LÀM VIỆC → Hiển thị nội dung bình thường
  return <>{children}</>;
};

export default ShiftGuard;