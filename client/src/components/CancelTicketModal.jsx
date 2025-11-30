import React from 'react';
import { AlertTriangle, X, Clock, Ticket, Gift } from 'lucide-react';

const CancelTicketModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  cancelInfo,
  isLoading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-999 bg-gradient-to-br from-gray-900 to-black rounded-2xl w-full max-w-md border border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 p-6 border-b border-red-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Xác nhận hủy vé</h2>
                <p className="text-sm text-gray-400 mt-1">Vui lòng xem lại thông tin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Movie Info */}
          {cancelInfo?.movieTitle && (
            <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-red-400" />
                <p className="text-sm text-gray-400">Phim</p>
              </div>
              <p className="text-white font-semibold">{cancelInfo.movieTitle}</p>
            </div>
          )}

          {/* Time Remaining */}
          {cancelInfo?.hoursRemaining && (
            <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <p className="text-sm text-gray-400">Thời gian còn lại</p>
              </div>
              <p className="text-white font-semibold">
                {parseFloat(cancelInfo.hoursRemaining).toFixed(1)} giờ đến suất chiếu
              </p>
            </div>
          )}

          {/* Refund Info */}
          {cancelInfo?.refundAmount && (
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-300">Voucher hoàn tiền</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {cancelInfo.refundAmount.toLocaleString('vi-VN')} VND
              </p>
              <p className="text-xs text-green-300/70 mt-1">
                Voucher sẽ có hiệu lực trong 30 ngày
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-200 leading-relaxed">
              <strong>Lưu ý:</strong> Sau khi hủy vé, bạn sẽ nhận được voucher giảm giá có giá trị bằng tổng tiền vé. 
              Voucher có thể sử dụng cho các lần đặt vé tiếp theo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Quay lại
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận hủy vé'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelTicketModal;