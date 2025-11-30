import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Gift, 
  Copy, 
  Check, 
  Percent, 
  Tag, 
  Calendar,
  Clock,
  X
} from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import { getMyVouchers } from '../lib/api';

const MyUuDai = () => {
  const [copiedCode, setCopiedCode] = useState(null);
  const [filter, setFilter] = useState('all');
  const { authUser } = useAuthUser();

  const {
    data: history,
    isLoading,
    error
  } = useQuery({
    queryKey: ['myVouchers', authUser?.id],
    queryFn: () => getMyVouchers(authUser.id),
    enabled: !!authUser?.id,
    retry: 1,
  });

  const vouchers = history?.history || [];

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getVoucherStatus = (voucher) => {
    if (voucher.used === 1 || voucher.status === 'used') return 'used';
    if (isPast(parseISO(voucher.expires_at))) return 'expired';
    return 'available';
  };

  const getVoucherIcon = (rewardType, discountType) => {
    if (rewardType === 'voucher') {
      return discountType === 'percent' ? Percent : Tag;
    }
    return Gift;
  };

  const getVoucherColor = (status) => {
    switch (status) {
      case 'available':
        return {
          bg: 'from-green-900/30 to-emerald-900/30',
          border: 'border-green-500/50',
          text: 'text-green-400',
          badge: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
      case 'used':
        return {
          bg: 'from-gray-900/50 to-gray-800/50',
          border: 'border-gray-600/30',
          text: 'text-gray-500',
          badge: 'bg-gray-700/50 text-gray-400 border-gray-600/30',
        };
      case 'expired':
        return {
          bg: 'from-red-900/20 to-orange-900/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
      default:
        return {
          bg: 'from-gray-900/30 to-black',
          border: 'border-gray-700',
          text: 'text-gray-400',
          badge: 'bg-gray-700 text-gray-400 border-gray-600',
        };
    }
  };

  const formatDiscount = (voucher) => {
    if (voucher.discount_type === 'percent') {
      return `${voucher.discount_value}%`;
    }
    if (voucher.discount_type === 'fixed') {
      return `${(voucher.discount_value / 1000).toFixed(0)}K`;
    }
    return voucher.reward || 'Ưu đãi';
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(voucher => {
      const status = getVoucherStatus(voucher);
      if (filter === 'all') return true;
      return status === filter;
    });
  }, [vouchers, filter]);

  const stats = useMemo(() => {
    const init = { total: 0, available: 0, used: 0, expired: 0 };
    if (!vouchers.length) return init;

    return vouchers.reduce((acc, voucher) => {
      const status = getVoucherStatus(voucher);
      acc.total++;
      acc[status]++;
      return acc;
    }, init);
  }, [vouchers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">Không thể tải ưu đãi</h2>
          <p className="text-gray-400 text-sm">Vui lòng thử lại</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-6 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Ưu đãi của tôi</h1>
              <p className="text-gray-400 text-xs">Quản lý voucher và phần thưởng</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-3 border border-gray-700">
            <p className="text-gray-400 text-xs mb-0.5">Tổng</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-3 border border-green-500/30">
            <p className="text-green-300 text-xs mb-0.5">Dùng được</p>
            <p className="text-2xl font-bold text-green-400">{stats.available}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-lg p-3 border border-gray-600/30">
            <p className="text-gray-400 text-xs mb-0.5">Đã dùng</p>
            <p className="text-2xl font-bold text-gray-500">{stats.used}</p>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-lg p-3 border border-red-500/30">
            <p className="text-red-300 text-xs mb-0.5">Hết hạn</p>
            <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'Tất cả', count: stats.total },
            { value: 'available', label: 'Dùng được', count: stats.available },
            { value: 'used', label: 'Đã dùng', count: stats.used },
            { value: 'expired', label: 'Hết hạn', count: stats.expired },
          ].map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === value
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Voucher Grid - 4 columns */}
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-500 mb-1">
              Chưa có ưu đãi
            </h3>
            <p className="text-gray-600 text-sm">
              {filter === 'all' 
                ? 'Hãy quay thưởng để nhận ưu đãi!' 
                : `Không có ưu đãi ${filter === 'available' ? 'khả dụng' : filter === 'used' ? 'đã dùng' : 'hết hạn'}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredVouchers.map((voucher) => {
              const status = getVoucherStatus(voucher);
              const colors = getVoucherColor(status);
              const Icon = getVoucherIcon(voucher.reward_type, voucher.discount_type);
              const isUsedOrExpired = status !== 'available';

              return (
                <div
                  key={voucher.id}
                  className={`relative bg-gradient-to-br ${colors.bg} rounded-xl overflow-hidden border ${colors.border} shadow-lg transition-all hover:scale-105 ${isUsedOrExpired ? 'opacity-60' : ''}`}
                >
                  {/* Stamp */}
                  {isUsedOrExpired && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className={`rotate-[-15deg] border-2 ${status === 'used' ? 'border-gray-600 text-gray-600' : 'border-red-600 text-red-600'} rounded px-4 py-1 text-xl font-bold opacity-90 bg-black/40`}>
                        {status === 'used' ? 'ĐÃ DÙNG' : 'HẾT HẠN'}
                      </div>
                    </div>
                  )}

                  <div className="relative z-0 p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 ${isUsedOrExpired ? 'grayscale' : ''}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors.badge}`}>
                        {status === 'available' ? 'Dùng được' : status === 'used' ? 'Đã dùng' : 'Hết hạn'}
                      </div>
                    </div>

                    {/* Discount */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${isUsedOrExpired ? 'text-gray-600' : 'text-white'}`}>
                          {formatDiscount(voucher)}
                        </span>
                        <span className="text-xs text-gray-400">OFF</span>
                      </div>
                      <p className={`text-xs font-medium mt-0.5 line-clamp-1 ${isUsedOrExpired ? 'text-gray-600' : colors.text}`}>
                        {voucher.reward || 'Ưu đãi đặc biệt'}
                      </p>
                    </div>

                    {/* Voucher Code */}
                    {voucher.voucher_code && (
                      <div className="bg-black/50 rounded-lg p-2 border border-gray-800">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 mb-0.5">Mã voucher</p>
                            <p className={`font-mono font-bold text-sm tracking-wide truncate ${isUsedOrExpired ? 'text-gray-600' : 'text-white'}`}>
                              {voucher.voucher_code}
                            </p>
                          </div>
                          {!isUsedOrExpired && (
                            <button
                              onClick={() => handleCopy(voucher.voucher_code)}
                              className="flex-shrink-0 w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center transition-colors"
                              title="Sao chép"
                            >
                              {copiedCode === voucher.voucher_code ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expiry */}
                    {voucher.expires_at && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate">
                          HSD: {format(parseISO(voucher.expires_at), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                    )}

                    {/* Use Button */}
                    {status === 'available' && (
                      <button className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-semibold rounded-lg transition-all shadow-md">
                        Sử dụng ngay
                      </button>
                    )}
                  </div>

                  {/* Decorative circles */}
                  <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 blur-xl"></div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">Lưu ý</h3>
              <ul className="text-xs text-gray-400 space-y-0.5">
                <li>• Mỗi voucher chỉ dùng 1 lần</li>
                <li>• Tự động hết hạn sau thời gian quy định</li>
                <li>• Không hoàn lại sau khi dùng</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyUuDai;