import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { assets } from '../assets/assets';
import Loading from '../components/Loading';
import { ClockIcon, TicketCheckIcon } from 'lucide-react';
import isoTimeFormat from '../lib/isoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import { toast } from 'react-toastify';
import axios from 'axios';
import { parseISO, format } from 'date-fns';

const SeatLayout = () => {
  const navigate = useNavigate();
  const groupRows = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'I'], ['H', 'J']];
  const allRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const { id: movieId, cinemaId, date } = useParams();
  console.log('Raw URL Parameters:', { movieId, cinemaId, date });
  const showtimeId = useSearchParams(); // Lấy showtimeId từ ?2
  // Validate URL parameters
  if (!movieId || !cinemaId || !date) {
    return (
      <div className="mt-20 text-center">
        <p className="text-red-500">Invalid URL parameters. Please provide valid movie ID, cinema ID, and date.</p>
        <p>Received: movieId={movieId}, cinemaId={cinemaId}, date={date}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketPrices, setTicketPrices] = useState([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [movieName, setMovieName] = useState('');
  const [cinemaName, setCinemaName] = useState('');
  const [movieimg, setMovieimg] = useState('');
  const [occupiedSeats, setOccupiedSeats] = useState([]); // Array of seat_number strings, e.g., ['I3']

  const getSeatType = (seatId) => {
    const row = seatId[0];
    if (['A', 'B'].includes(row)) return 'Standard';
    if (['C', 'D', 'E', 'F', 'G', 'H'].includes(row)) return 'VIP';
    if (['I', 'J'].includes(row)) return 'Couple';
    return 'Standard';
  };

  const getSeatPrice = (seatId) => {
    const seatType = getSeatType(seatId);
    const priceData = ticketPrices.find((price) => price.seat_type.toLowerCase() === seatType.toLowerCase());
    console.log(`Getting price for seat ${seatId} (type: ${seatType}):`, priceData);
    const price = priceData?.effective_price || 0;
    return Number(price);
  };

  const calculateTotal = () => {
    if (!ticketPrices.length) {
      console.log('No ticket prices available for total calculation');
      return 0;
    }

    let total = 0;
    selectedSeats.forEach((seat) => {
      const seatPrice = getSeatPrice(seat);
      total += seatPrice;
    });

    console.log('Calculated total:', total, 'for seats:', selectedSeats);
    return total;
  };

  const getPriceBreakdown = () => {
    const breakdown = { Standard: [], VIP: [], Couple: [] };
    selectedSeats.forEach((seat) => {
      const seatType = getSeatType(seat);
      breakdown[seatType].push(seat);
    });
    console.log('Price breakdown:', breakdown);
    return breakdown;
  };

  // Fetch occupied seats for the selected showtime
  const fetchOccupiedSeats = async (showtimeId) => {
    try {
      console.log('Fetching occupied seats for showtimeId:', showtimeId);
      const response = await axios.get(`/api/showtimes/seat/${showtimeId}`);
      console.log('Occupied Seats API Response:', JSON.stringify(response.data, null, 2));
      if (response.data && Array.isArray(response.data.occupiedSeats)) {
        // Normalize seat_number to uppercase and extract as array of strings
        const occupiedList = response.data.occupiedSeats.map(seat => seat.seat_number.toUpperCase());
        setOccupiedSeats(occupiedList);
        console.log('Set occupied seats:', occupiedList);
      } else {
        console.warn('No occupied seats or invalid response:', response.data);
        setOccupiedSeats([]);
        toast.warn('Không có thông tin ghế đã đặt hoặc lỗi API.');
      }
    } catch (error) {
      console.error('Error fetching occupied seats:', error.message, error.response?.data);
      toast.error('Lỗi khi lấy thông tin ghế đã đặt: ' + error.message);
      setOccupiedSeats([]);
    }
  };

  useEffect(() => {
    if (selectedTime) {
      fetchOccupiedSeats(selectedTime.id);
    } else {
      setOccupiedSeats([]);
    }
  }, [selectedTime]);
  useEffect(() => {
    if (showtimes.length > 0 && showtimeId) {
      const target = showtimes.find(s => s.id === parseInt(showtimeId));
      if (target) {
        setSelectedTime(target);
      }
    }
  }, [showtimes, showtimeId]);
  // Fetch movie name
  useEffect(() => {
    const fetchMovieName = async () => {
      try {
        const response = await axios.get(`/api/showtimes/movies/${movieId}`);
        if (response.data.success) {
          setMovieName(response.data.movie.title || 'Tên phim không có sẵn');
          setMovieimg(response.data.movie.poster_path);
        } else {
          console.warn('Failed to fetch movie name:', response.data.message);
          setMovieName('Tên phim không có sẵn');
        }
      } catch (error) {
        console.error('Error fetching movie name:', error.message);
        setMovieName('Tên phim không có sẵn');
      }
    };

    if (movieId) fetchMovieName();
  }, [movieId]);

  // Fetch cinema name
  useEffect(() => {
    const fetchCinemaName = async () => {
      try {
        const response = await axios.get(`/api/showtimes/movies/${movieId}`);
        if (response.data.success && response.data.dateTime && response.data.dateTime.length > 0) {
          setCinemaName(response.data.dateTime[0].cinema_name || 'Tên rạp không có sẵn');
        } else {
          console.warn('Failed to fetch cinema name:', response.data.message);
          setCinemaName('Tên rạp không có sẵn');
        }
      } catch (error) {
        console.error('Error fetching cinema name:', error.message);
        setCinemaName('Tên rạp không có sẵn');
      }
    };

    if (movieId) fetchCinemaName();
  }, [movieId]);

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        setLoading(true);
        console.log('Fetching showtimes for:', { movieId, cinemaId, date });
        const response = await axios.get(`/api/showtimes/movies/${movieId}`);
        console.log('Showtimes API Response:', JSON.stringify(response.data, null, 2));
        if (response.data.success) {
          const { dateTime } = response.data;
          console.log('Raw dateTime:', dateTime);

          const filteredShowtimes = dateTime.filter((show) => {
            const showDate = format(parseISO(show.start_time), 'yyyy-MM-dd');
            console.log(`Show date: ${showDate}, Filter date: ${date}`);
            return showDate === date;
          });
          console.log('Filtered Showtimes:', filteredShowtimes);

          if (filteredShowtimes.length === 0) {
            console.warn('No showtimes found for date:', date);
            toast.warn('No showtimes available for the selected date.');
            setShowtimes([]);
            setSelectedTime(null);
          } else {
            setShowtimes(filteredShowtimes);
            if (!selectedTime || !filteredShowtimes.some((show) => show.id === selectedTime.id)) {
              console.log('Auto-selecting first showtime:', filteredShowtimes[0]);
              setSelectedTime(filteredShowtimes[0]);
            }
          }
        } else {
          console.warn('Showtimes API returned success: false', response.data.message);
          toast.error('Failed to fetch showtimes: ' + response.data.message);
          setShowtimes([]);
          setSelectedTime(null);
        }
      } catch (error) {
        console.error('Error fetching showtimes:', error.message, error.response?.data);
        toast.error('Error fetching showtimes: ' + error.message);
        setShowtimes([]);
        setSelectedTime(null);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, [movieId, cinemaId, date]);

  useEffect(() => {
    if (selectedTime && cinemaId && date) {
      const fetchTicketPrices = async () => {
        try {
          setPriceLoading(true);
          console.log('Fetching ticket prices with:', {
            cinemaId,
            date,
            selectedTime: selectedTime.id,
            showtimeDate: format(parseISO(selectedTime.start_time), 'yyyy-MM-dd'),
          });
          const response = await axios.get(`/api/ticketprice/getprice/${cinemaId}/${date}`);
          console.log('Ticket Prices API Response:', JSON.stringify(response.data, null, 2));
          if (response.data.success) {
            if (Array.isArray(response.data.ticket_price) && response.data.ticket_price.length > 0) {
              console.log('Setting ticketPrices:', response.data.ticket_price);
              setTicketPrices(response.data.ticket_price);
            } else {
              console.warn('No ticket prices returned in response:', response.data.ticket_price);
              toast.error('No ticket prices available for this cinema and date');
              setTicketPrices([]);
            }
          } else {
            console.warn('API returned success: false', response.data.message);
            toast.error('Failed to fetch ticket prices: ' + response.data.message);
            setTicketPrices([]);
          }
        } catch (error) {
          console.error('Error fetching ticket prices:', error.message, error.response?.data);
          toast.error('Error fetching ticket prices: ' + error.message);
          setTicketPrices([]);
        } finally {
          setPriceLoading(false);
        }
      };
      fetchTicketPrices();
    } else {
      console.log('Cannot fetch ticket prices. Missing:', {
        selectedTime: !!selectedTime,
        cinemaId: !!cinemaId,
        date: !!date,
      });
      setTicketPrices([]);
    }
  }, [selectedTime, cinemaId, date]);

  const areRowsAdjacent = (rows) => {
    if (rows.length <= 2) {
      if (rows.length === 1) return true;
      const indices = rows.map((row) => allRows.indexOf(row)).sort((a, b) => a - b);
      return indices[1] - indices[0] === 1;
    }
    return false;
  };

  const isOrphanedSeatCreatedInRow = (row, currentSelectedSeats, bookedSeats = [], newSeatId = null) => {
    const rowSeats = Array(row === 'I' || row === 'J' ? 4 : 9).fill(0);
    currentSelectedSeats.forEach((seat) => {
      if (seat.startsWith(row)) {
        const num = parseInt(seat.slice(1));
        rowSeats[num - 1] = 1;
      }
    });
    bookedSeats.forEach((seat) => {
      if (seat.startsWith(row)) {
        const num = parseInt(seat.slice(1));
        rowSeats[num - 1] = 1;
      }
    });
    if (newSeatId && newSeatId.startsWith(row)) {
      const seatNumber = parseInt(newSeatId.slice(1));
      rowSeats[seatNumber - 1] = 1;
    }

    for (let i = 0; i < rowSeats.length; i++) {
      if (rowSeats[i] === 0) {
        const leftOccupied = i > 0 && rowSeats[i - 1] === 1;
        const rightOccupied = i < rowSeats.length - 1 && rowSeats[i + 1] === 1;
        if (leftOccupied && rightOccupied) {
          return true;
        }
      }
    }
    return false;
  };

  const handleSeatClick = (seatId) => {
    const normalizedSeatId = seatId.toUpperCase();

    // Check if seat is occupied
    if (occupiedSeats.includes(normalizedSeatId)) {
      toast.warn('Ghế này đã được đặt hoặc đặt chỗ, không thể chọn.');
      return;
    }

    if (!selectedTime) {
      return toast('Please select Time first');
    }
    if (!selectedSeats.includes(normalizedSeatId) && selectedSeats.length >= 5) {
      return toast('Only select up to 5 seats');
    }

    const bookedSeats = occupiedSeats;

    if (!selectedSeats.includes(normalizedSeatId)) {
      const currentRows = [...new Set(selectedSeats.map((seat) => seat[0]))];
      const newRows = [...new Set([...currentRows, normalizedSeatId[0]])];
      if (!areRowsAdjacent(newRows)) {
        return toast('Please select seats in two adjacent rows only (e.g., A-B or B-C)');
      }

      const adjacentRowIndex = allRows.indexOf(normalizedSeatId[0]);
      const adjacentRows = [normalizedSeatId[0]];
      if (adjacentRowIndex > 0) adjacentRows.push(allRows[adjacentRowIndex - 1]);
      if (adjacentRowIndex < allRows.length - 1) adjacentRows.push(allRows[adjacentRowIndex + 1]);

      for (const checkRow of adjacentRows) {
        if (isOrphanedSeatCreatedInRow(checkRow, selectedSeats, bookedSeats, normalizedSeatId)) {
          return toast('Cannot select this seat as it creates an orphaned seat');
        }
      }
    }

    setSelectedSeats((prev) =>
      prev.includes(normalizedSeatId)
        ? prev.filter((seat) => seat !== normalizedSeatId)
        : [...prev, normalizedSeatId]
    );
  };

  const renderSeats = (row) => {
    const isDoubleSize = row === 'I' || row === 'J';
    const count = isDoubleSize ? 4 : 9;
    const sizeClass = isDoubleSize ? 'h-10 w-20' : 'h-8 w-8';

    return (
      <div key={row} className="flex gap-2 mt-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`;
            const normalizedSeatId = seatId.toUpperCase();
            const isOccupied = occupiedSeats.includes(normalizedSeatId);
            const isSelected = selectedSeats.includes(normalizedSeatId);
            const seatType = getSeatType(normalizedSeatId);

            // Màu nền theo loại ghế
            let bgColorClass = '';
            let borderColorClass = '';
            if (isOccupied) {
              bgColorClass = 'bg-gray-500';
              borderColorClass = 'border-gray-400';
            } else if (isSelected) {
              bgColorClass = 'bg-primary';
              borderColorClass = 'border-primary';
            } else {
              if (seatType === 'Standard') {
                bgColorClass = 'bg-blue-900/40 hover:bg-blue-800/60';
                borderColorClass = 'border-blue-500/60 hover:border-blue-500';
              } else if (seatType === 'VIP') {
                bgColorClass = 'bg-purple-900/40 hover:bg-purple-800/60';
                borderColorClass = 'border-purple-500/60 hover:border-purple-500';
              } else if (seatType === 'Couple') {
                bgColorClass = 'bg-pink-900/40 hover:bg-pink-800/60';
                borderColorClass = 'border-pink-500/60 hover:border-pink-500';
              }
            }

            const buttonClass = `rounded border cursor-pointer ${sizeClass} ${bgColorClass} ${borderColorClass}
              ${isOccupied
                ? 'text-gray-300 cursor-not-allowed opacity-50'
                : isSelected
                  ? 'text-white'
                  : 'text-white'
              }`;

            return (
              <button
                key={seatId}
                onClick={() => !isOccupied && handleSeatClick(seatId)}
                disabled={isOccupied}
                className={buttonClass}
                title={isOccupied ? 'Ghế đã được đặt' : 'Chọn ghế'}
              >
                {seatId}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mt-20">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 md:pt-50">
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {showtimes.length > 0 ? (
            showtimes.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedTime(item);
                  console.log('Selected showtime:', item);
                }}
                className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${
                  selectedTime?.id === item.id ? 'bg-primary text-white' : 'hover:bg-primary/20'
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                <p className="text-sm">{isoTimeFormat(item.start_time)}</p>
              </div>
            ))
          ) : (
            <p className="px-6 text-gray-500">No timings available</p>
          )}
        </div>
      </div>
      
      <div className="relative flex-1 flex flex-row gap-6 max-md:flex-col max-md:mt-16">
        {/* Main seat selection area */}
        <div className="flex-1 flex flex-col items-center">
          <BlurCircle top="-100px" left="-100px" />
          <BlurCircle bottom="0" right="0" />
          <h1 className="text-2xl font-semibold mb-4">Chọn chỗ ngồi cho bạn</h1>
          <img src={assets.screenImage} alt="screen" />
          <p className="text-gray-400 text-sm mb-6">Màn hình chiếu</p>
          <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
              {groupRows[0].map((row) => renderSeats(row))}
            </div>
            <div className="grid grid-cols-2 gap-11">
              {groupRows.slice(1).map((group, idx) => (
                <div key={idx} className="">
                  {group.map((row) => renderSeats(row))}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Seats Panel - Below seats */}
          <div className="flex justify-center w-full">
            {selectedSeats.length > 0 && (
              <div className="mt-6 p-5 bg-black shadow-md rounded-xl border border-primary/30 w-full max-w-md">
                <h3 className="font-semibold mb-3 text-primary text-lg">Ghế đã chọn</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="px-3 py-1 text-sm font-medium bg-primary text-white rounded-full shadow-sm"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
                
                {priceLoading ? (
                  <p className="text-gray-400">Đang tính toán giá vé</p>
                ) : ticketPrices.length === 0 ? (
                  <p className="text-red-400">No ticket prices available. Please try another showtime or date.</p>
                ) : (
                  <p className="text-lg font-bold text-white">
                    Tổng tiền: <span className="text-primary">{calculateTotal().toLocaleString()} VND</span>
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (selectedSeats.length === 0) {
                toast.error('Vui lòng chọn ít nhất một ghế');
                return;
              }
              if (!selectedTime) {
                toast.error('Vui lòng chọn giờ chiếu');
                return;
              }

              navigate('/booking', {
                state: {
                  bookingInfo: {
                    selectedSeats,
                    selectedTime,
                    cinemaId,
                    movieId,
                    date,
                    total: calculateTotal(),
                    movieName,
                    cinemaName,
                    movieimg
                  }
                }
              });
            }}
            className="flex items-center gap-1 mt-6 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95"
          >
            Tiến hành thanh toán <TicketCheckIcon className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        {/* Price Legend Panel - Right side */}
        {!priceLoading && ticketPrices.length > 0 && (
          <div className="w-32 max-md:w-full">
            <div className="sticky top-32 bg-gray-900/50 backdrop-blur-sm border border-primary/20 rounded-xl p-5 shadow-lg">
             
              <div className="flex flex-col gap-3">
                {['Standard', 'VIP', 'Couple'].map((type) => {
                  const priceData = ticketPrices.find(
                    (p) => p.seat_type.toLowerCase() === type.toLowerCase()
                  );
                  const price = priceData?.effective_price || 0;

                  return (
                    <div
                      key={type}
                      className={`flex flex-col p-3 rounded-lg border-2 text-xs ${
                        type === 'Standard'
                          ? 'bg-blue-900/40 border-blue-500'
                          : type === 'VIP'
                          ? 'bg-purple-900/40 border-purple-500'
                          : 'bg-pink-900/40 border-pink-500'
                      }`}
                    >
                      <span className="font-semibold text-white mb-1">{type}</span>
                      <span className="text-xs font-bold text-white">
                        {price.toLocaleString()}đ
                      </span>
                    
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatLayout;