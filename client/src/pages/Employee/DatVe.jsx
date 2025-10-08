
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      dateArray.push(date.toISOString().split('T')[0]);
    }
    setDates(dateArray);
    setSelectedDate(dateArray[0]); // Set today as default selected date
  }, []);

  // Fetch showtimes when date or cinemaId changes
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

    fetchShowtimes();
  }, [selectedDate, cinemaId]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Navigate to ChonGhe with selected showtime
  const handleShowtimeChange = (showtime, movie) => {
    navigate('/employee/chon-ghe', { state: { showtime, movie, cinemaId, selectedDate } });
  };

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen text-white">
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
                      onClick={() => handleShowtimeChange(showtime, movie)}
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
    </div>
  );
};

export default DatVe;
