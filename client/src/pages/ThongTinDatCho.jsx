import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { PlusIcon, MinusIcon, ArrowLeftIcon } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import { format } from 'date-fns';

const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

const ThongTinDatCho = ({ cinemaId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser } = useAuthUser();

  const bookingInfo = location.state?.bookingInfo;

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [membership, setMembership] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(false);

  // Voucher cá nhân
  const [voucherCode, setVoucherCode] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { code, discount, type }

  const [formData, setFormData] = useState({
    cinema_id: bookingInfo?.cinemaId || cinemaId,
    user_id: authUser?.id || '',
    fullName: authUser?.name || '',
    phone: authUser?.phone || '',
    email: authUser?.email || '',
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const cinema_id = bookingInfo.cinemaId;
        const response = await axios.get(`/api/services/active/${cinema_id}`);
        if (response.data.success) {
          setServices(response.data.services || []);
        } else {
          toast.error('Không thể tải danh sách dịch vụ');
        }
      } catch (error) {
        toast.error('Lỗi khi tải dịch vụ');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [bookingInfo]);

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoadingPromotions(true);
        const res = await axios.get('/api/promotions/km');
        if (res.data?.success) {
          setPromotions(res.data.promotions || []);
        }
      } catch (error) {
        toast.error('Lỗi khi tải khuyến mãi');
      } finally {
        setLoadingPromotions(false);
      }
    };
    fetchPromotions();
  }, []);

  // Fetch membership
  useEffect(() => {
    const fetchMembership = async () => {
      if (!authUser?.id) return;
      try {
        setLoadingMembership(true);
        const res = await axios.get(`/api/membershiptiers/${authUser.id}`);
        if (res.data?.success && res.data.membership?.length > 0) {
          setMembership(res.data.membership[0]);
        }
      } catch (error) {
        console.error('Error fetching membership:', error);
      } finally {
        setLoadingMembership(false);
      }
    };
    fetchMembership();
  }, [authUser?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceQuantityChange = useCallback((serviceId, change) => {
    setSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      const newQuantity = Math.max(0, current + change);
      if (newQuantity === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQuantity };
    });
  }, []);

  const calculateServiceTotal = useCallback(() => {
    return Object.entries(selectedServices).reduce((total, [serviceId, quantity]) => {
      const service = services.find((s) => s.id === parseInt(serviceId));
      return total + (service?.price || 0) * quantity;
    }, 0);
  }, [selectedServices, services]);

  // Áp dụng mã giảm giá cá nhân
  const applyVoucherCode = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    if (!authUser?.id) {
      toast.error('Vui lòng đăng nhập để sử dụng mã');
      return;
    }

    setApplyingVoucher(true);
    try {
      const res = await axios.post(`/api/promotions/apply/${authUser.id}`, {
        voucherCode: voucherCode.trim().toUpperCase()
      });

      if (res.data?.success) {
        const { discount_type, discount_value } = res.data;

        setAppliedVoucher({
          code: voucherCode.trim().toUpperCase(),
          type: discount_type,
          value: Number(discount_value)
        });

        toast.success(
          discount_type === 'percent'
            ? `Áp dụng mã thành công! Giảm ${discount_value}% trên giá vé`
            : `Áp dụng mã thành công! Giảm ${Number(discount_value).toLocaleString()} VND trên giá vé`
        );
      } else {
        toast.error(res.data?.message || 'Mã không hợp lệ');
        setAppliedVoucher(null);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi áp dụng mã giảm giá';
      toast.error(msg);
      setAppliedVoucher(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Tính tổng giảm giá (khuyến mãi + voucher) - CHỈ ÁP DỤNG CHO VÉ
  const calculateTotalDiscount = useCallback(() => {
    const ticketTotal = bookingInfo?.total || 0; // Chỉ tính trên giá vé
    let totalDiscount = 0;

    // Khuyến mãi hệ thống - áp dụng cho tổng đơn hàng
    if (selectedPromotionId) {
      const promo = promotions.find(p => p.id === selectedPromotionId);
      if (promo) {
        const subtotal = ticketTotal + calculateServiceTotal();
        const type = String(promo.discount_type || '').toLowerCase();
        const value = Number(promo.discount_value || 0);
        if (type === 'percent') {
          totalDiscount += (subtotal * value) / 100;
          if (promo.max_discount) totalDiscount = Math.min(totalDiscount, Number(promo.max_discount));
        } else if (type === 'fixed') {
          totalDiscount += value;
        }
      }
    }

    // Voucher cá nhân - CHỈ áp dụng cho giá vé
    if (appliedVoucher) {
      if (appliedVoucher.type === 'percent') {
        totalDiscount += (ticketTotal * appliedVoucher.value) / 100;
      } else if (appliedVoucher.type === 'fixed') {
        totalDiscount += appliedVoucher.value;
      }
    }
  
    // Giảm giá không vượt quá tổng tiền
    const subtotal = ticketTotal + calculateServiceTotal();
    return Math.min(totalDiscount, subtotal);
  }, [selectedPromotionId, promotions, appliedVoucher, bookingInfo?.total, calculateServiceTotal]);

  const calculateGrandTotal = useCallback(() => {
    const subtotal = (bookingInfo?.total || 0) + calculateServiceTotal();
    return Math.max(0, subtotal - calculateTotalDiscount());
  }, [bookingInfo?.total, calculateServiceTotal, calculateTotalDiscount]);

  // Cập nhật discountAmount
  useEffect(() => {
    setDiscountAmount(calculateTotalDiscount());
  }, [calculateTotalDiscount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      const bookingData = {
        cinema_id: bookingInfo.cinemaId,
        user_id: formData.user_id,
        showtime_id: bookingInfo.selectedTime.id,
        payment_method: 'qr code',
        status: 'pending',
        tickets: bookingInfo.selectedSeats.map(seat => ({
          seat_id: seat,
          ticket_price: bookingInfo.total / bookingInfo.selectedSeats.length
        })),
        services: Object.entries(selectedServices).map(([serviceId, quantity]) => ({
          service_id: parseInt(serviceId),
          quantity
        })),
        promotion_id: selectedPromotionId || null,
        voucher_code: appliedVoucher?.code || null,
        ticket_total: bookingInfo.total,
        service_total: calculateServiceTotal(),
        discount_amount: discountAmount,
        grand_total: calculateGrandTotal(),
        movieName: bookingInfo.movieName,
        cinemaName: bookingInfo.cinemaName,
        movieimg: bookingInfo.movieimg,
        selectedTime: bookingInfo.selectedTime,
        date: bookingInfo.date
      };

      navigate('/payment', { state: { bookingData } });
    } catch (error) {
      toast.error('Lỗi khi chuẩn bị đặt vé');
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingInfo) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Thông tin đặt vé không hợp lệ</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:text-primary/80 mr-4">
            <ArrowLeftIcon className="w-5 h-5" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold">Thông tin đặt vé</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form đặt vé */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thông tin cá nhân */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Thông tin cá nhân</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Họ và tên *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary" required />
                </div>
              </form>
            </div>

            {/* Dịch vụ */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Dịch vụ bổ sung</h2>
              {loading ? (
                <p className="text-gray-400">Đang tải dịch vụ...</p>
              ) : services.length === 0 ? (
                <p className="text-gray-400">Không có dịch vụ nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-gray-400">Ảnh</th>
                        <th className="py-3 px-4 text-gray-400">Tên</th>
                        <th className="py-3 px-4 text-gray-400">Mô tả</th>
                        <th className="py-3 px-4 text-gray-400">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr key={service.id} className="border-b border-gray-700 hover:bg-gray-800">
                          <td className="py-4 px-4">
                            {service.image_url ? (
                              <img src={service.image_url} alt={service.name} className="w-16 h-16 object-cover rounded-lg" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-xs">No Image</div>
                            )}
                          </td>
                          <td className="py-4 px-4"><h3 className="font-medium">{service.name}</h3></td>
                          <td className="py-4 px-4"><p className="text-sm text-gray-400">{service.description}</p></td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleServiceQuantityChange(service.id, -1)} disabled={!selectedServices[service.id]}
                                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 disabled:opacity-50">
                                <MinusIcon className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{selectedServices[service.id] || 0}</span>
                              <button onClick={() => handleServiceQuantityChange(service.id, 1)}
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80">
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Tóm tắt đơn hàng */}
          <div className="space-y-6">
            {/* Thông tin phim */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl text-center font-semibold mb-4 text-primary">Thông tin phim</h2>
              <div className="mb-4 flex justify-center">
                <img src={image_base_url + bookingInfo.movieimg} alt={bookingInfo.movieName} className='h-80 w-56 object-cover rounded-lg shadow-lg' />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3 ml-12">
                  <div><span className="text-gray-400 text-sm">Tên phim:</span><p className="font-medium text-white text-lg">{bookingInfo.movieName}</p></div>
                  <div><span className="text-gray-400 text-sm">Rạp chiếu:</span><p className="font-medium text-white">{bookingInfo.cinemaName}</p></div>
                </div>
                <div className="space-y-3 ml-8">
                  <div><span className="text-gray-400 text-sm">Ngày chiếu:</span><p className="font-medium text-white">{bookingInfo.date}</p></div>
                  <div><span className="text-gray-400 text-sm">Giờ chiếu:</span>
                    <p className="font-medium text-white">
                      {bookingInfo.selectedTime?.start_time ? format(new Date(bookingInfo.selectedTime.start_time), 'HH:mm') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Tóm tắt đơn hàng</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Ghế đã chọn:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {bookingInfo.selectedSeats.map((seat) => (
                      <span key={seat} className="px-2 py-1 bg-primary text-white rounded text-sm">{seat}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-gray-400">Số vé:</span><span className="font-medium">{bookingInfo.selectedSeats.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Tiền vé:</span><span className="font-medium">{bookingInfo.total.toLocaleString()} VND</span></div>

                {Object.keys(selectedServices).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dịch vụ:</span>
                    <span className="font-medium">{calculateServiceTotal().toLocaleString()} VND</span>
                  </div>
                )}

                {/* Mã giảm giá cá nhân - CHỈ GIẢM GIÁ VÉ */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="font-semibold text-primary mb-2">Nhập mã giảm giá</div>
                  <p className="text-xs text-yellow-400 mb-2">* Mã chỉ áp dụng cho giá vé</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã (VD: CGV123ABC)"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                      disabled={applyingVoucher || appliedVoucher}
                    />
                    <button
                      onClick={applyVoucherCode}
                      disabled={applyingVoucher || appliedVoucher || !voucherCode.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 disabled:opacity-50"
                    >
                      {applyingVoucher ? '...' : appliedVoucher ? 'Đã áp' : 'Áp dụng'}
                    </button>
                  </div>
                  {appliedVoucher && (
                    <div className="mt-2 text-green-400 text-sm flex items-center justify-between">
                      <span>Đã áp dụng: {appliedVoucher.code}</span>
                      <button onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }} className="text-xs underline">Bỏ</button>
                    </div>
                  )}
                </div>

                {/* Khuyến mãi hệ thống */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="font-semibold text-primary mb-3">Khuyến mãi hệ thống</div>
                  {loadingPromotions ? (
                    <p className="text-gray-400 text-sm">Đang tải...</p>
                  ) : promotions.length === 0 ? (
                    <p className="text-gray-400 text-sm">Chưa có khuyến mãi</p>
                  ) : (
                    <div className="space-y-2">
                      {promotions.map((promo) => (
                        <div key={promo.id} className={`p-3 rounded-lg border ${selectedPromotionId === promo.id ? 'border-primary bg-primary/10' : 'border-gray-700'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{promo.name}</p>
                              <p className="text-xs text-gray-400">{promo.description || 'Không có mô tả'}</p>
                            </div>
                            <button
                              onClick={() => setSelectedPromotionId(selectedPromotionId === promo.id ? null : promo.id)}
                              className={`text-xs px-2 py-1 rounded ${selectedPromotionId === promo.id ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}
                            >
                              {selectedPromotionId === promo.id ? 'Đã chọn' : 'Chọn'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Thành viên */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="font-semibold text-primary mb-2">Thành viên</div>
                  {loadingMembership ? (
                    <p className="text-gray-400 text-sm">Đang tải...</p>
                  ) : !membership ? (
                    <p className="text-gray-400 text-sm">Bạn chưa có thẻ thành viên! <a href="/membership" className="text-primary underline">Đăng ký tại đây</a></p>
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hạng thẻ:</span>
                        <span className="font-medium text-white">{membership.name || membership.tier_name}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400">Điểm:</span>
                        <span className="font-medium text-yellow-400">
                          {Number(membership.points || membership.current_points || 0).toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tổng tiền */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400 font-medium">
                    <span>Giảm giá:</span>
                    <span>-{discountAmount.toLocaleString()} VND</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-4 border-t border-gray-700">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{calculateGrandTotal().toLocaleString()} VND</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-6 px-6 py-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/80 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThongTinDatCho;