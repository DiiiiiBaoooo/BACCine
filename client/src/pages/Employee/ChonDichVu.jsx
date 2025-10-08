import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ChonDichVu = () => {
  const { state } = useLocation();
  const { bookingData, cinemaId } = state || {};
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [total, setTotal] = useState(0);

  // Fetch services
  useEffect(() => {
    if (!cinemaId) return;

    const fetchServices = async () => {
      try {
        const response = await axios.get(`/api/services/active/${cinemaId}`);
        if (response.data.success && Array.isArray(response.data.services)) {
          setServices(response.data.services);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setServices([]);
      }
    };
    fetchServices();
  }, [cinemaId]);

  // Calculate total bill
  useEffect(() => {
    const seatTotal = bookingData?.seatTotal || 0;
    const serviceTotal = selectedServices.reduce(
      (sum, service) => sum + Number(service.price || 0) * service.quantity,
      0
    );
    setTotal(seatTotal + serviceTotal);
  }, [selectedServices, bookingData]);

  const addService = (service) => {
    setSelectedServices((prev) => {
      const existing = prev.find((s) => s.id === service.id);
      if (existing) {
        return prev.map((s) =>
          s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s
        );
      }
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const removeService = (serviceId) => {
    setSelectedServices((prev) => {
      const existing = prev.find((s) => s.id === serviceId);
      if (existing && existing.quantity > 1) {
        return prev.map((s) =>
          s.id === serviceId ? { ...s, quantity: s.quantity - 1 } : s
        );
      }
      return prev.filter((s) => s.id !== serviceId);
    });
  };

  const deleteService = (serviceId) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const confirmBooking = () => {
    const finalBooking = { ...bookingData, services: selectedServices, total };
    console.log('Final Booking:', finalBooking);
    navigate('/employee/thanh-toan', { state: { bookingData: finalBooking, cinemaId } });
  };

  const goBackToEmployee = () => {
    navigate('/employee');
  };

  const goBackToSeatSelection = () => {
    navigate('/employee/chon-ghe', {
      state: {
        showtime: {
          showtime_id: bookingData.showtimeId,
          room_name: bookingData.roomName,
          start_time: bookingData.startTime,
        },
        movie: { title: bookingData.movieTitle },
        cinemaId,
        selectedDate: new Date(bookingData.startTime).toISOString().split('T')[0],
      },
    });
  };

  const getServiceQuantity = (serviceId) => {
    const service = selectedServices.find((s) => s.id === serviceId);
    return service ? service.quantity : 0;
  };

  if (!bookingData) {
    return <div className="text-center text-red-600">Dữ liệu không hợp lệ</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Main Content - Left Side */}
        <div className="flex-1 pr-0 lg:pr-96">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <h1 className="text-4xl font-bold text-center text-white mb-2 tracking-wider">
              MENU
            </h1>
            <p className="text-center text-gray-400 mb-4">Chọn combo của bạn</p>
            <div className="flex justify-center mb-8">
              <button
                onClick={goBackToEmployee}
                className="w-full max-w-xs py-3 bg-gray-600 hover:bg-gray-700 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-lg"
              >
                Trở về Trang Nhân Viên
              </button>
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {services.length > 0 ? (
                services.map((service) => {
                  const quantity = getServiceQuantity(service.id);
                  return (
                    <div
                      key={service.id}
                      className={`relative bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border-2 ${
                        quantity > 0 ? 'border-red-600' : 'border-gray-800'
                      }`}
                    >
                      {/* Service Image */}
                      <div className="aspect-square bg-gray-800 flex items-center justify-center p-4">
                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-6xl">🍿</div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="p-4">
                        <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-wide text-center">
                          {service.name}
                        </h3>
                        <p className="text-red-500 text-xs text-center mb-3 font-semibold">
                          {Number(service.price || 0).toLocaleString('vi-VN')} VND
                        </p>

                        {/* Quantity Controls */}
                        {quantity > 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => removeService(service.id)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-white font-bold">
                              {quantity}
                            </span>
                            <button
                              onClick={() => addService(service)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addService(service)}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            Thêm
                          </button>
                        )}
                      </div>

                      {/* Quantity Badge */}
                      {quantity > 0 && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                          {quantity}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-gray-500 py-12">
                  Không có dịch vụ nào hiện tại.
                </div>
              )}
            </div>

            {/* Selected Services Summary - Mobile Only */}
            {selectedServices.length > 0 && (
              <div className="lg:hidden bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">Combo đã chọn</h3>
                <div className="space-y-2">
                  {selectedServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between text-gray-200 bg-gray-800 rounded-lg p-3"
                    >
                      <div>
                        <span className="font-semibold">{service.name}</span>
                        <span className="text-red-500 ml-2">x{service.quantity}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold">
                          {(Number(service.price || 0) * service.quantity).toLocaleString('vi-VN')} VND
                        </span>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="text-red-500 hover:text-red-400 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Button - Mobile Only */}
            <button
              onClick={confirmBooking}
              className="lg:hidden w-full py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-lg"
            >
              Tiếp tục Thanh Toán
            </button>
          </div>
        </div>

        {/* Right Sidebar - Booking Summary (Desktop Only) */}
        <div className="hidden lg:block fixed right-0 top-0 h-screen w-96 bg-gray-900 border-l-4 border-red-600 shadow-2xl overflow-y-auto">
          <div className="p-8">
            <h3 className="text-3xl font-extrabold text-white mb-8 border-b-2 border-red-700 pb-4 tracking-tight">
              Thông tin đặt vé
            </h3>

            {/* Movie Info */}
            <div className="space-y-4 mb-8">
              <div className="bg-gray-800 rounded-xl p-4 shadow-md">
                <p className="text-gray-400 text-sm font-medium mb-2">Phim</p>
                <p className="text-white text-lg font-semibold">{bookingData.movieTitle}</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 shadow-md">
                <p className="text-gray-400 text-sm font-medium mb-2">Thời gian</p>
                <p className="text-white text-lg font-semibold">
                  {new Date(bookingData.startTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 shadow-md">
                <p className="text-gray-400 text-sm font-medium mb-2">Phòng chiếu</p>
                <p className="text-white text-lg font-semibold">{bookingData.roomName}</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 shadow-md">
                <p className="text-gray-400 text-sm font-medium mb-2">Ghế đã chọn</p>
                <p className="text-white text-lg font-semibold">
                  {bookingData.seats.join(', ') || 'Chưa chọn'}
                </p>
              </div>
            </div>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-4">Combo đã chọn</h4>
                <div className="space-y-3">
                  {selectedServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between bg-gray-800 rounded-xl p-4 shadow-md"
                    >
                      <div className="flex-1">
                        <p className="text-white font-semibold">{service.name}</p>
                        <p className="text-gray-400 text-sm">
                          {Number(service.price || 0).toLocaleString('vi-VN')} VND x {service.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold">
                          {(Number(service.price || 0) * service.quantity).toLocaleString('vi-VN')} VND
                        </span>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="text-red-500 hover:text-red-400 text-lg font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="border-t-2 border-gray-700 pt-6 mb-8">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300 text-lg">
                  <span>Tiền vé</span>
                  <span className="font-semibold">
                    {bookingData.seatTotal.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between text-gray-300 text-lg">
                  <span>Tiền dịch vụ</span>
                  <span className="font-semibold">
                    {selectedServices
                      .reduce((sum, s) => sum + Number(s.price || 0) * s.quantity, 0)
                      .toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between text-2xl font-extrabold bg-red-600 text-white rounded-xl p-4 shadow-lg">
                <span>Tổng cộng</span>
                <span>{total.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-4">
              <button
                onClick={goBackToSeatSelection}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-lg"
              >
                Trở về Chọn Ghế
              </button>
              <button
                onClick={confirmBooking}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-lg"
              >
                Tiếp tục Thanh Toán
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChonDichVu;