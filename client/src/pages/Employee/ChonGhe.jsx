import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ChonGhe = () => {
  const { state } = useLocation();
  const { showtime, movie, cinemaId, selectedDate } = state || {};
  const navigate = useNavigate();
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [staffSeats, setStaffSeats] = useState([]);
  const [ticketPrices, setTicketPrices] = useState([]);
  const [bookingData, setBookingData] = useState(null);

  // Fetch occupied seats
  useEffect(() => {
    if (!showtime) return;

    const fetchOccupiedSeats = async () => {
      try {
        const response = await axios.get(`/api/showtimes/seat/${showtime.showtime_id}`);
        if (response.data && Array.isArray(response.data.occupiedSeats)) {
          const seats = response.data.occupiedSeats.map((seat) => seat.seat_number.toUpperCase());
          setOccupiedSeats(seats);
        } else {
          setOccupiedSeats([]);
        }
      } catch (err) {
        console.error('Error fetching occupied seats:', err);
        setOccupiedSeats([]);
      }
    };

    fetchOccupiedSeats();
  }, [showtime]);

  // Fetch ticket prices
  useEffect(() => {
    if (!cinemaId || !selectedDate) return;

    const fetchTicketPrices = async () => {
      try {
        const response = await axios.get(`/api/ticketprice/getprice/${cinemaId}/${selectedDate}`);
        if (response.data.success && Array.isArray(response.data.ticket_price)) {
          setTicketPrices(response.data.ticket_price);
        } else {
          setTicketPrices([]);
        }
      } catch (err) {
        console.error('Error fetching ticket prices:', err);
        setTicketPrices([]);
      }
    };

    fetchTicketPrices();
  }, [cinemaId, selectedDate]);

  const getSeatType = (seatId) => {
    const row = seatId[0];
    if (['A', 'B'].includes(row)) return 'Standard';
    if (['C', 'D', 'E', 'F', 'G'].includes(row)) return 'VIP';
    if (['I', 'J'].includes(row)) return 'Couple';
    return 'Standard';
  };

  const getSeatPrice = (seatId) => {
    const seatType = getSeatType(seatId);
    const priceData = ticketPrices.find(
      (price) => price.seat_type.toLowerCase() === seatType.toLowerCase()
    );
    return priceData ? Number(priceData.effective_price) : 0;
  };

  const handleSeatClick = (seatId) => {
    const normalizedSeatId = seatId.toUpperCase();
    if (occupiedSeats.includes(normalizedSeatId)) return;
    setStaffSeats((prev) =>
      prev.includes(normalizedSeatId)
        ? prev.filter((seat) => seat !== normalizedSeatId)
        : [...prev, normalizedSeatId]
    );
  };

  const saveSeatAssignments = () => {
    if (!showtime || staffSeats.length === 0) return;

    const newBooking = {
      showtimeId: showtime.showtime_id,
      movieTitle: movie.title,
      roomName: showtime.room_name,
      startTime: showtime.start_time,
      seats: [...staffSeats],
      timestamp: new Date().toISOString(),
      seatTotal: staffSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0),
    };
    setBookingData(newBooking);
    navigate('/employee/chon-dich-vu', { state: { bookingData: newBooking, cinemaId } });
  };

  const cancelSelection = () => {
    setStaffSeats([]);
  };

  const renderSeats = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return rows.map((row) => {
      const isDoubleSize = row === 'I' || row === 'J';
      const count = isDoubleSize ? 4 : 9;
      const seatType = getSeatType(row + '1');
      
      return (
        <div key={row} className="flex items-center gap-3 mb-2">
          <span className="text-white font-bold w-6">{row}</span>
          <div className="flex gap-2">
            {Array.from({ length: count }, (_, i) => {
              const seatId = `${row}${i + 1}`;
              const normalizedSeatId = seatId.toUpperCase();
              const isOccupied = occupiedSeats.includes(normalizedSeatId);
              const isSelected = staffSeats.includes(normalizedSeatId);
              const sizeClass = isDoubleSize ? 'w-20 h-10' : 'w-10 h-10';
              const price = getSeatPrice(seatId);

              let bgColor = 'bg-gray-800 hover:bg-gray-700 border-gray-600';
              if (isOccupied) {
                bgColor = 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50';
              } else if (isSelected) {
                bgColor = 'bg-green-600 border-green-600 hover:bg-green-700';
              } else if (seatType === 'VIP') {
                bgColor = 'bg-yellow-900 hover:bg-yellow-800 border-yellow-700';
              } else if (seatType === 'Couple') {
                bgColor = 'bg-pink-900 hover:bg-pink-800 border-pink-700';
              }

              return (
                <button
                  key={seatId}
                  onClick={() => handleSeatClick(seatId)}
                  className={`rounded-lg border-2 cursor-pointer text-white font-semibold text-xs transition-all ${sizeClass} ${bgColor}`}
                  disabled={isOccupied}
                  title={isOccupied ? `Ghế đã đặt` : `${seatType} - ${price.toLocaleString('vi-VN')} VND`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      );
    });
  };

  if (!showtime || !movie) {
    return <div className="text-center text-red-600">Dữ liệu không hợp lệ</div>;
  }

  const totalPrice = staffSeats
    .map((seat) => getSeatPrice(seat))
    .reduce((sum, price) => sum + price, 0);

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Main Content - Left Side */}
        <div className="flex-1 pr-0 lg:pr-80">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Chọn ghế ngồi</h1>
              <p className="text-gray-400">
                {showtime.room_name} -{' '}
                {new Date(showtime.start_time).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-gray-400">Phim: {movie.title}</p>
            </div>

            {/* Screen */}
            <div className="mb-8">
              <div className="w-full max-w-3xl mx-auto">
                <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-full h-3 mb-2"></div>
                <div className="text-center text-gray-400 text-sm mb-8">MÀN HÌNH</div>
              </div>
            </div>

            {/* Seats */}
            <div className="flex justify-center mb-8">
              <div className="inline-block">{renderSeats()}</div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-lg"></div>
                <span className="text-gray-300">Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-900 border-2 border-yellow-700 rounded-lg"></div>
                <span className="text-gray-300">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-900 border-2 border-pink-700 rounded-lg"></div>
                <span className="text-gray-300">Couple</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 border-2 border-green-600 rounded-lg"></div>
                <span className="text-gray-300">Đã chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 border-2 border-gray-600 rounded-lg opacity-50"></div>
                <span className="text-gray-300">Đã đặt</span>
              </div>
            </div>

            {/* Action Buttons - Mobile */}
            <div className="lg:hidden flex gap-4 justify-center">
              <button
                onClick={cancelSelection}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-semibold transition-colors"
              >
                Hủy chọn
              </button>
              <button
                onClick={saveSeatAssignments}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={staffSeats.length === 0}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Booking Summary (Desktop Only) */}
        <div className="hidden lg:block fixed right-0 top-0 w-80 h-screen bg-gray-900 border-l-2 border-red-600 overflow-y-auto pt-20">
          <div className="p-4">
            <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-red-600 pb-2">
              Thông tin đặt vé
            </h3>

            {/* Movie Info */}
            <div className="space-y-2 mb-4">
              <div className="bg-gray-800 rounded-lg p-2.5">
                <p className="text-gray-400 text-xs mb-1">Phim</p>
                <p className="text-white font-semibold text-sm">{movie.title}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-2.5">
                <p className="text-gray-400 text-xs mb-1">Thời gian</p>
                <p className="text-white font-semibold text-sm">
                  {new Date(showtime.start_time).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-2.5">
                <p className="text-gray-400 text-xs mb-1">Phòng chiếu</p>
                <p className="text-white font-semibold text-sm">{showtime.room_name}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-2.5">
                <p className="text-gray-400 text-xs mb-1">Ghế đã chọn</p>
                <p className="text-white font-semibold text-sm">
                  {staffSeats.length > 0 ? staffSeats.join(', ') : 'Chưa chọn ghế'}
                </p>
              </div>
            </div>

            {/* Selected Seats Details */}
            {staffSeats.length > 0 && (
              <div className="mb-4">
                <h4 className="text-base font-bold text-white mb-2">Chi tiết ghế</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {staffSeats.map((seat) => (
                    <div
                      key={seat}
                      className="flex justify-between items-center bg-gray-800 rounded-lg p-2 text-xs"
                    >
                      <div>
                        <span className="text-white font-semibold">{seat}</span>
                        <span className="text-gray-400 ml-2">({getSeatType(seat)})</span>
                      </div>
                      <span className="text-white font-bold">
                        {getSeatPrice(seat).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="border-t-2 border-gray-800 pt-3 mb-4">
              <div className="flex justify-between text-lg font-bold bg-red-600 text-white rounded-lg p-3">
                <span>Tổng tiền</span>
                <span>{totalPrice.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={saveSeatAssignments}
                className="w-full py-3 bg-white hover:bg-gray-200 text-black text-base font-bold rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={staffSeats.length === 0}
              >
                Tiếp tục
              </button>
              <button
                onClick={cancelSelection}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white text-base font-bold rounded-xl transition-all duration-300"
              >
                Hủy chọn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChonGhe;