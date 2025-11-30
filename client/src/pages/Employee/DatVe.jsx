import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Film } from 'lucide-react';

const DatVe = ({ cinemaId }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [dates, setDates] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  // Generate 7 days from today
  useEffect(() => {
    const today = new Date();
    const dateArray = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dateArray.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        }),
        isToday: i === 0,
      });
    }
    setDates(dateArray);
    setSelectedDate(dateArray[0].value);
  }, []);

  // Fetch showtimes
  useEffect(() => {
    if (!selectedDate || !cinemaId) return;

    const fetchShowtimes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/showtimes/datve/${cinemaId}/${selectedDate}`);
        if (response.data.success) {
          setMovies(response.data.movies || []);
        } else {
          setError(response.data.message || 'Không có dữ liệu suất chiếu');
          setMovies([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi kết nối server');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedDate, cinemaId]);

  const handleShowtimeClick = (showtime, movie) => {
    navigate('/employee/chon-ghe', {
      state: { showtime, movie, cinemaId, selectedDate }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
            Đặt Vé Tại Quầy
          </h1>
          <p className="text-xl text-gray-300 mt-3">Chọn ngày và suất chiếu cho khách</p>
        </div>

        {/* Date Selector - Glassmorphism */}
        <div className="flex flex-wrap justify-center gap-3 backdrop-blur-xl bg-white/5 border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
          {dates.map((date) => {
  const [weekday, datePart] = date.label.split(', ');
  const cleanWeekday = weekday?.trim() || 'T2'; // fallback an toàn

  return (
    <button
      key={date.value}
      onClick={() => setSelectedDate(date.value)}
      className={`relative px-6 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
        selectedDate === date.value
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl ring-4 ring-purple-500/50'
          : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/80 border border-gray-600'
      }`}
    >
      {date.isToday && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-2 py-1 rounded-full animate-pulse font-bold">
          Hôm nay
        </span>
      )}
      <div className="text-xs opacity-80">{cleanWeekday}</div>
      <div className="text-lg font-bold">{datePart || date.value.slice(8)}</div>
    </button>
  );
})}
        </div>

        {/* Loading & Error */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-16 bg-red-900/30 border border-red-500/50 backdrop-blur-sm rounded-3xl">
            <p className="text-red-400 text-xl">{error}</p>
          </div>
        )}

        {/* No showtimes */}
        {!loading && !error && movies.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="h-20 w-20 text-gray-600 mx-auto mb-4" />
            <p className="text-2xl text-gray-400">Không có suất chiếu nào trong ngày này</p>
            <p className="text-gray-500 mt-2">Vui lòng chọn ngày khác</p>
          </div>
        )}

        {/* Movies Grid */}
        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {movies.map((movie) => (
              <div
                key={movie.movie_id}
                className="group relative bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl hover:border-purple-400 transition-all duration-500"
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70"></div>

                {/* Movie Info */}
                <div className="relative z-10 p-6 flex gap-6">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        src={image_base_url + movie.poster_path}
                        alt={movie.title}
                        className="w-40 h-60 object-cover rounded-2xl shadow-2xl border-4 border-purple-500/30 group-hover:border-purple-400 transition-all"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>

                  {/* Title & Details */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {movie.runtime} phút
                      </span>
                      {/* <span className="flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        {movie.showtimes.length} suất
                      </span> */}
                    </div>

                    {/* Showtimes */}
                    <div className="flex flex-wrap gap-3">
                      {movie.showtimes.map((showtime) => {
                        const time = new Date(showtime.start_time).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <button
                            key={showtime.showtime_id}
                            onClick={() => handleShowtimeClick(showtime, movie)}
                            className="relative px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold rounded-xl hover:from-teal-400 hover:to-cyan-400 transform hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-teal-500/50"
                          >
                            <span className="drop-shadow-md">{time}</span>
                            <div className="absolute inset-0 rounded-xl bg-white opacity-0 hover:opacity-20 transition-opacity"></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Glow Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatVe;