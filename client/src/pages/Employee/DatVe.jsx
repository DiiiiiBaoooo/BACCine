import axios from 'axios';
import React, { useState, useEffect } from 'react';

const DatVe = ({ cinemaId }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [dates, setDates] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [staffSeats, setStaffSeats] = useState([]); // Seats selected by staff
  const [ticketPrices, setTicketPrices] = useState([]);
  const [services, setServices] = useState([]); // All available services
  const [selectedServices, setSelectedServices] = useState([]); // Selected services with quantities
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [bookingData, setBookingData] = useState([]); // Local storage for booking data
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  // Generate 7 days from today
  useEffect(() => {
    const today = new Date();
    const dateArray = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dateArray.push(date.toISOString().split('T')[0]);
    }
    setDates(dateArray);
    setSelectedDate(dateArray[0]); // Set today as default selected date
  }, []);

  // Fetch showtimes and ticket prices when date or cinemaId changes
  useEffect(() => {
    if (!selectedDate || !cinemaId) return;

    const fetchShowtimes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/showtimes/datve/${cinemaId}/${selectedDate}`);
        const data = response.data;
        if (data.success) {
          setMovies(data.movies || []);
        } else {
          setError(data.message || 'Không có dữ liệu suất chiếu');
          setMovies([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTicketPrices = async () => {
      try {
        const response = await axios.get(`/api/ticketprice/getprice/${cinemaId}/${selectedDate}`);
        if (response.data.success && Array.isArray(response.data.ticket_price)) {
          setTicketPrices(response.data.ticket_price);
        } else {
          setTicketPrices([]);
          console.warn('No ticket prices or invalid response:', response.data);
        }
      } catch (err) {
        console.error('Error fetching ticket prices:', err);
        setTicketPrices([]);
      }
    };

    fetchShowtimes();
    fetchTicketPrices();
  }, [selectedDate, cinemaId]);

  // Fetch occupied seats when a showtime is selected
  useEffect(() => {
    if (!selectedShowtime) {
      setOccupiedSeats([]);
      setStaffSeats([]);
      return;
    }

    const fetchOccupiedSeats = async () => {
      try {
        const response = await axios.get(`/api/showtimes/seat/${selectedShowtime.showtime_id}`);
        console.log('API Response for occupied seats:', response.data);
        if (response.data && Array.isArray(response.data.occupiedSeats)) {
          const seats = response.data.occupiedSeats.map(seat => seat.seat_number.toUpperCase());
          setOccupiedSeats(seats);
          console.log('Occupied seats set:', seats);
        } else {
          setOccupiedSeats([]);
          console.warn('No occupied seats or invalid response:', response.data);
        }
      } catch (err) {
        console.error('Error fetching occupied seats:', err);
        setOccupiedSeats([]);
      }
    };

    fetchOccupiedSeats();
  }, [selectedShowtime]);

  // Fetch services when modal is shown
  useEffect(() => {
    if (showModal && cinemaId) {
      const fetchServices = async () => {
        try {
          const response = await axios.get(`/api/services/active/${cinemaId}`);
          if (response.data.success && Array.isArray(response.data.services)) {
            setServices(response.data.services);
          } else {
            setServices([]);
            console.warn('No services or invalid response:', response.data);
          }
        } catch (err) {
          console.error('Error fetching services:', err);
          setServices([]);
        }
      };
      fetchServices();
    }
  }, [showModal, cinemaId]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getSeatType = (seatId) => {
    const row = seatId[0];
    if (['A', 'B'].includes(row)) return 'Standard';
    if (['C', 'D', 'E', 'F', 'G'].includes(row)) return 'VIP';
    if (['I', 'J'].includes(row)) return 'Couple';
    return 'Standard';
  };

  const getSeatPrice = (seatId) => {
    const seatType = getSeatType(seatId);
    const priceData = ticketPrices.find((price) => price.seat_type.toLowerCase() === seatType.toLowerCase());
    return priceData ? Number(priceData.effective_price) : 0;
  };

  const handleSeatClick = (seatId) => {
    const normalizedSeatId = seatId.toUpperCase();
    if (occupiedSeats.includes(normalizedSeatId)) {
      return; // Prevent modifying occupied seats
    }
    setStaffSeats((prev) =>
      prev.includes(normalizedSeatId)
        ? prev.filter((seat) => seat !== normalizedSeatId)
        : [...prev, normalizedSeatId]
    );
  };

  const saveSeatAssignments = async () => {
    if (!selectedShowtime || staffSeats.length === 0) return;

    const newBooking = {
      showtimeId: selectedShowtime.showtime_id,
      seats: [...staffSeats],
      timestamp: new Date().toISOString(),
    };
    setBookingData((prev) => [...prev, newBooking]);
    setOccupiedSeats([...occupiedSeats, ...staffSeats]);
    setStaffSeats([]);
    setShowModal(true); // Open service modal after saving seats
  };

  const cancelSelection = () => {
    setStaffSeats([]);
    setSelectedShowtime(null);
  };

  const closeModal = () => {
    const lastBooking = bookingData.find((b) => b.showtimeId === selectedShowtime?.showtime_id);
    if (lastBooking && selectedServices.length > 0) {
      const updatedBooking = bookingData.map((b) =>
        b.showtimeId === selectedShowtime.showtime_id ? { ...b, services: selectedServices } : b
      );
      setBookingData(updatedBooking);
    }
    setShowModal(false);
    setServices([]);
  };

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

  const calculateTotalBill = () => {
    const lastBooking = bookingData.find((b) => b.showtimeId === selectedShowtime?.showtime_id);
    if (!lastBooking) return 0;

    const seatTotal = lastBooking.seats.reduce((sum, seat) => sum + getSeatPrice(seat), 0);
    const serviceTotal = (lastBooking.services || []).reduce(
      (sum, service) => sum + (Number(service.price || 0) * service.quantity),
      0
    );
    return seatTotal + serviceTotal;
  };

  const renderSeats = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return rows.map((row) => {
      const isDoubleSize = row === 'I' || row === 'J';
      const count = isDoubleSize ? 4 : 9;
      return (
        <div key={row} className="flex gap-2 mt-2">
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`;
            const normalizedSeatId = seatId.toUpperCase();
            const isOccupied = occupiedSeats.includes(normalizedSeatId);
            const isSelected = staffSeats.includes(normalizedSeatId);
            const sizeClass = isDoubleSize ? 'w-20 h-10' : 'w-8 h-8';
            const price = getSeatPrice(seatId);

            return (
              <button
                key={seatId}
                onClick={() => handleSeatClick(seatId)}
                className={`rounded border cursor-pointer ${sizeClass} ${
                  isOccupied
                    ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-75'
                    : isSelected
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-gray-300 hover:border-teal-600'
                }`}
                disabled={isOccupied}
                title={isOccupied ? `Ghế đã đặt (Giá: ${price} VND)` : `Giá: ${price} VND`}
              >
                {seatId}
              </button>
            );
          })}
        </div>
      );
    });
  };

  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(calculateTotalBill());
  }, [bookingData, selectedShowtime]);

  // Reset data when a new showtime is selected
  const handleShowtimeChange = (showtime) => {
    setSelectedShowtime(showtime);
    setStaffSeats([]);
    setSelectedServices([]);
    setBookingData((prev) => prev.filter((b) => b.showtimeId !== showtime.showtime_id));
  };

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen text-white flex">
      {/* Left Panel: Date, Movie, and Seat Selection */}
      <div className="w-full lg:w-3/4 pr-4">
        {/* Date selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedDate === date
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              } border border-gray-600`}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {/* Loading state */}
        {loading && <div className="text-center text-gray-300">Đang tải...</div>}

        {/* Movie list */}
        {!loading && movies.length === 0 && !error && (
          <div className="text-center text-gray-300">Không có suất chiếu nào cho ngày này</div>
        )}

        {!loading && movies.length > 0 && (
          <div className="space-y-6">
            {movies.map((movie) => (
              <div key={movie.movie_id} className="flex items-start gap-1.5">
                {/* Left frame: Movie (Poster, Title, Runtime) */}
                <div className="flex-shrink-0 p-4 rounded-lg h-80 bg-blue-50">
                  <img
                    src={image_base_url + movie.poster_path}
                    alt={movie.title}
                    className="w-32 h-48 object-cover rounded-md"
                  />
                  <h2 className="text-xl font-semibold text-gray-900 mt-2">{movie.title}</h2>
                  <p className="text-gray-600">Thời lượng: {movie.runtime} phút</p>
                </div>

                {/* Right frame: Showtimes */}
                <div className="flex-1 p-4 rounded-lg h-80 bg-green-50">
                  <div className="flex flex-row gap-2">
                    {movie.showtimes.map((showtime) => (
                      <button
                        key={showtime.showtime_id}
                        onClick={() => handleShowtimeChange(showtime)}
                        className="w-fit inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 rounded-md hover:bg-teal-200 transition-colors"
                      >
                        <span>
                          {new Date(showtime.start_time).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Staff Seat Selection Panel */}
        {selectedShowtime && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              Quản lý ghế - {selectedShowtime.room_name} - {new Date(selectedShowtime.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </h3>
            <div className="flex flex-col items-center">
              <div className="text-center mb-4">Màn hình</div>
              <div className="flex flex-col items-center text-xs text-gray-300">{renderSeats()}</div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={saveSeatAssignments}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  Lưu
                </button>
                <button
                  onClick={cancelSelection}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Booking Information (Fixed to Right) */}
      <div className="hidden lg:block fixed right-0 top-0 h-fit mt-30 w-80 bg-gray-800 p-4 rounded-l-lg overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-white">Thông tin đặt vé</h3>
        {selectedShowtime && (
          <div>
            <p className="mb-2">Phim: {movies.find(m => m.showtimes.some(s => s.showtime_id === selectedShowtime.showtime_id))?.title || 'Chưa chọn'}</p>
            <p className="mb-2">Thời gian: {new Date(selectedShowtime.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="mb-2">Phòng: {selectedShowtime.room_name}</p>
            <p className="mb-2">Ghế đã chọn: {bookingData.find(b => b.showtimeId === selectedShowtime.showtime_id)?.seats.join(', ') || 'Chưa chọn'}</p>
            <p className="mb-2">Giá vé: {bookingData.find(b => b.showtimeId === selectedShowtime.showtime_id)?.seats.map(seat => getSeatPrice(seat)).reduce((sum, price) => sum + price, 0).toLocaleString('vi-VN') || 0} VND</p>
            <p className="mb-2">Dịch vụ: {bookingData.find(b => b.showtimeId === selectedShowtime.showtime_id)?.services?.map(s => `${s.name} x${s.quantity}`).join(', ') || 'Chưa chọn'}</p>
            <p className="mb-2">Tổng: {calculateTotalBill().toLocaleString('vi-VN')} VND</p>
          </div>
        )}
      </div>

      {/* Modal for Services */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-white">Chọn Combo</h3>
            {/* Available Services */}
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 text-gray-200">Dịch vụ có sẵn</h4>
              {services.length > 0 ? (
                <ul className="text-sm text-gray-300">
                  {services.map((service) => (
                    <li key={service.id} className="mb-2">
                      {service.name} - {service.description || 'Không có mô tả'} (Giá: {Number(service.price || 0).toLocaleString('vi-VN')} VND)
                      <button
                        onClick={() => addService(service)}
                        className="ml-2 px-2 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                      >
                        Thêm
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">Không có dịch vụ nào hiện tại.</p>
              )}
            </div>
            {/* Selected Services */}
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 text-gray-200">Combo đã chọn</h4>
              {selectedServices.length > 0 ? (
                <ul className="text-sm text-gray-300">
                  {selectedServices.map((service) => (
                    <li key={service.id} className="mb-2 flex items-center">
                      {service.name} - {Number(service.price || 0).toLocaleString('vi-VN')} VND x {service.quantity}
                      <button
                        onClick={() => removeService(service.id)}
                        className="ml-2 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        -
                      </button>
                      <button
                        onClick={() => addService(service)}
                        className="ml-2 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        +
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="ml-2 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">Chưa chọn combo nào.</p>
              )}
            </div>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatVe;