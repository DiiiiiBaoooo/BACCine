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

  // Lấy thông tin từ trang trước
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

  // Thông tin người dùng
  const [formData, setFormData] = useState({
    cinema_id: bookingInfo.cinemaId,
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
        console.error('Error fetching services:', error);
        toast.error('Lỗi khi tải dịch vụ: ' + error.message);
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
        } else {
          setPromotions([]);
        }
      } catch (error) {
        console.error('Error fetching promotions:', error);
        toast.error('Lỗi khi tải khuyến mãi');
      } finally {
        setLoadingPromotions(false);
      }
    };

    fetchPromotions();
  }, []);

  // Kiểm tra thông tin booking
  useEffect(() => {
    if (!bookingInfo) {
      toast.error('Thông tin đặt vé không hợp lệ');
      navigate('/');
    }
  }, [bookingInfo, navigate]);

  // Fetch membership by user id
  useEffect(() => {
    const fetchMembership = async () => {
      if (!authUser?.id) return;
      try {
        setLoadingMembership(true);
        const res = await axios.get(`/api/membershiptiers/${authUser.id}`);
        if (res.data?.success && Array.isArray(res.data.membership) && res.data.membership.length > 0) {
          setMembership(res.data.membership[0]);
        } else {
          setMembership(null);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceQuantityChange = useCallback((serviceId, change) => {
    setSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      const newQuantity = Math.max(0, current + change);

      if (newQuantity === 0) {
        const { [serviceId]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [serviceId]: newQuantity,
      };
    });
  }, []);

  const calculateServiceTotal = useCallback(() => {
    let total = 0;
    Object.entries(selectedServices).forEach(([serviceId, quantity]) => {
      const service = services.find((s) => s.id === parseInt(serviceId));
      if (service) {
        total += service.price * quantity;
      }
    });
    return total;
  }, [selectedServices, services]);

  const calculateGrandTotal = useCallback(() => {
    const subtotal = (bookingInfo?.total || 0) + calculateServiceTotal();
    return Math.max(0, subtotal - discountAmount);
  }, [bookingInfo?.total, calculateServiceTotal, discountAmount]);

  const calculateDiscount = useCallback((subtotal) => {
    if (!selectedPromotionId) return 0;
    const promo = promotions.find((p) => p.id === selectedPromotionId);
    if (!promo) return 0;

    const minOrder = Number(promo.min_order || 0);
    if (minOrder > 0 && subtotal < minOrder) return 0;

    const type = String(promo.discount_type || '').toLowerCase();
    const value = Number(promo.discount_value || 0);
    let discount = 0;
    if (type === 'percent') {
      discount = (subtotal * value) / 100;
      const maxDiscount = Number(promo.max_discount || 0);
      if (maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount);
      }
    } else if (type === 'fixed') {
      discount = value;
    }
    discount = Math.min(discount, subtotal);
    return Math.max(0, Math.floor(discount));
  }, [selectedPromotionId, promotions]);

  // Cập nhật discountAmount khi selectedServices hoặc bookingInfo.total thay đổi
  useEffect(() => {
    const subtotal = (bookingInfo?.total || 0) + calculateServiceTotal();
    setDiscountAmount(calculateDiscount(subtotal));
  }, [bookingInfo?.total, calculateServiceTotal, calculateDiscount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      // Chuẩn bị dữ liệu cho trang PaymentSelection
      const bookingData = {
        cinema_id: bookingInfo.cinemaId,
        user_id: formData.user_id,
        showtime_id: bookingInfo.selectedTime.id,
        tickets: bookingInfo.selectedSeats.map(seat => ({
          seat_id: seat,
          ticket_price: bookingInfo.total / bookingInfo.selectedSeats.length // Giả định giá vé trung bình
        })),
        services: Object.entries(selectedServices).map(([serviceId, quantity]) => ({
          service_id: parseInt(serviceId),
          quantity
        })),
        promotion_id: selectedPromotionId || null,
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

      // Chuyển hướng sang trang PaymentSelection
      navigate('/payment', {
        state: {
          bookingData
        }
      });
    } catch (error) {
      console.error('Error preparing booking:', error);
      toast.error('Lỗi khi chuẩn bị đặt vé: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingInfo) {
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
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Dịch vụ */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Dịch vụ bổ sung</h2>

              {loading ? (
                <p className="text-gray-400">Đang tải dịch vụ...</p>
              ) : services.length === 0 ? (
                <p className="text-gray-400">Không có dịch vụ nào tại rạp này</p>
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
                              <img
                                src={service.image_url}
                                alt={service.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <h3 className="font-medium text-white">{service.name}</h3>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-400">{service.description}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleServiceQuantityChange(service.id, -1)}
                                disabled={!selectedServices[service.id]}
                                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <MinusIcon className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">
                                {selectedServices[service.id] || 0}
                              </span>
                              <button
                                onClick={() => handleServiceQuantityChange(service.id, 1)}
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80"
                              >
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

          {/* Thông tin đặt vé */}
          <div className="space-y-6">
            {/* Thông tin phim */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl text-center font-semibold mb-4 text-primary">Thông tin phim</h2>
              
              {/* Poster phim */}
              <div className="mb-4 flex justify-center">
                <img 
                  src={image_base_url + bookingInfo.movieimg} 
                  alt={bookingInfo.movieName || 'Poster phim'} 
                  className='h-80 w-56 object-cover rounded-lg shadow-lg' 
                />
              </div>
              
              {/* Thông tin chi tiết */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3 ml-12">
                  <div>
                    <span className="text-gray-400 text-sm">Tên phim:</span>
                    <p className="font-medium text-white text-lg">{bookingInfo.movieName || 'Tên phim'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Rạp chiếu:</span>
                    <p className="font-medium text-white">{bookingInfo.cinemaName || 'Tên rạp'}</p>
                  </div>
                </div>
                <div className="space-y-3 ml-8">
                  <div>
                    <span className="text-gray-400 text-sm">Ngày chiếu:</span>
                    <p className="font-medium text-white">{bookingInfo.date}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Giờ chiếu:</span>
                    <p className="font-medium text-white">
                      {bookingInfo.selectedTime?.start_time
                        ? (() => {
                            try {
                              return format(new Date(bookingInfo.selectedTime.start_time), 'HH:mm');
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
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Tóm tắt đơn hàng</h2>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Ghế đã chọn:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {bookingInfo.selectedSeats.map((seat) => (
                      <span key={seat} className="px-2 py-1 bg-primary text-white rounded text-sm">
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Số vé:</span>
                  <span className="font-medium">{bookingInfo.selectedSeats.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Tiền vé:</span>
                  <span className="font-medium">{bookingInfo.total.toLocaleString()} VND</span>
                </div>

                {Object.keys(selectedServices).length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dịch vụ:</span>
                      <span className="font-medium">{calculateServiceTotal().toLocaleString()} VND</span>
                    </div>

                    {Object.entries(selectedServices).map(([serviceId, quantity]) => {
                      const service = services.find((s) => s.id === parseInt(serviceId));
                      return service ? (
                        <div key={serviceId} className="text-sm text-gray-400 ml-4">
                          {service.name} x{quantity}: {(service.price * quantity).toLocaleString()} VND
                        </div>
                      ) : null;
                    })}
                  </>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Giảm giá áp dụng:</span>
                    <span>-{discountAmount.toLocaleString()} VND</span>
                  </div>
                )}

                <div className="mt-1">
                  <div className="mb-2 font-semibold text-primary">Thành viên</div>
                  {loadingMembership ? (
                    <p className="text-gray-400">Đang tải thông tin thành viên...</p>
                  ) : !membership ? (
                    <>
                      <p className="text-gray-400">Bạn chưa có thẻ thành viên! Đăng ký thẻ thành viên tại </p>
                      <a href='/membership'>đây</a>
                    </>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-400">Hạng thẻ</div>
                          <div className="text-white font-medium">
                            {membership.tier_name || membership.tier || membership.name || 'Thành viên'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Điểm hiện có</div>
                          <div className="text-white font-semibold">
                            {Number(membership.points || membership.current_points || 0).toLocaleString()} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 font-semibold text-primary">Khuyến mãi</div>
                  {loadingPromotions ? (
                    <p className="text-gray-400">Đang tải khuyến mãi...</p>
                  ) : promotions.length === 0 ? (
                    <p className="text-gray-400">Hiện chưa có khuyến mãi</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {promotions.map((promo) => {
                        const isPercent = String(promo.discount_type).toLowerCase() === 'percent';
                        const isFixed = String(promo.discount_type).toLowerCase() === 'fixed';
                        const valueText = isPercent
                          ? `${Number(promo.discount_value || 0)}%`
                          : `${Number(promo.discount_value || 0).toLocaleString()} VND`;
                        const conditions = [];
                        if (promo.min_order && Number(promo.min_order) > 0) {
                          conditions.push(`Đơn tối thiểu ${Number(promo.min_order).toLocaleString()} VND`);
                        }
                        if (promo.max_discount && Number(promo.max_discount) > 0 && isPercent) {
                          conditions.push(`Giảm tối đa ${Number(promo.max_discount).toLocaleString()} VND`);
                        }
                        return (
                          <div
                            key={promo.id}
                            className="bg-gray-800 border border-gray-700 hover:border-primary/60 transition-colors rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-white font-medium">{promo.name}</h4>
                                {promo.description && (
                                  <p className="text-sm text-gray-400 mt-1">{promo.description}</p>
                                )}
                                <div className="mt-2 text-sm">
                                  <span className="text-gray-400">Giá trị:</span>
                                  <span className="ml-2 font-semibold text-white">
                                    {valueText} {isFixed ? '' : ''}
                                  </span>
                                </div>
                                {conditions.length > 0 && (
                                  <div className="mt-1 text-xs text-gray-400">
                                    Điều kiện: {conditions.join(' • ')}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedPromotionId === promo.id ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPromotionId(null)}
                                    className="px-3 py-1 rounded-md text-xs bg-primary text-white hover:bg-primary/80"
                                  >
                                    Bỏ chọn
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPromotionId(promo.id)}
                                    className="px-3 py-1 rounded-md text-xs bg-gray-700 text-white hover:bg-gray-600"
                                  >
                                    Chọn
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{calculateGrandTotal().toLocaleString()} VND</span>
                </div>
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
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