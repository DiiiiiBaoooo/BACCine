"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Film, Calendar, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { format, addDays, isToday, isTomorrow } from "date-fns";

const RapPhim = () => {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [error, setError] = useState("");

  // Tạo 7 ngày từ hôm nay
  const dateList = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Lấy danh sách rạp
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await axios.get("/api/cinemas/");
        if (res.data.success) {
          setCinemas(res.data.cinemas);
        }
      } catch (err) {
        setError("Không thể tải danh sách rạp");
        console.error(err);
      } finally {
        setLoadingCinemas(false);
      }
    };
    fetchCinemas();
  }, []);

  // Lấy lịch chiếu theo ngày
  const fetchShowtimesByDate = async (cinemaId, date) => {
    setLoadingShowtimes(true);
    setError("");
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const res = await axios.get(`/api/showtimes/datve/${cinemaId}/${formattedDate}`);
      if (res.data.success) {
        setShowtimes(res.data.movies || []);
      } else {
        setShowtimes([]);
      }
    } catch (err) {
      console.error(err);
      setShowtimes([]);
    } finally {
      setLoadingShowtimes(false);
    }
  };

  // Khi chọn rạp → chọn hôm nay
  const handleCinemaClick = (cinema) => {
    if (selectedCinema?.id === cinema.id) {
      setSelectedCinema(null);
      setSelectedDate(null);
      setShowtimes([]);
      return;
    }

    setSelectedCinema(cinema);
    const today = new Date();
    setSelectedDate(today);
    fetchShowtimesByDate(cinema.id, today);
  };

  // Khi chọn ngày
  const handleDateClick = (date) => {
    setSelectedDate(date);
    fetchShowtimesByDate(selectedCinema.id, date);
  };

  // Format ngày
  const formatDateLabel = (date) => {
    if (isToday(date)) return "Hôm nay";
    if (isTomorrow(date)) return "Ngày mai";
    return format(date, "dd/MM");
  };

  return (
    <div className="relative min-h-screen    bg-gradient-to-b from-black via-gray-900 to-black py-16 px-6 md:px-16 lg:px-36 xl:px-44 overflow-hidden">
      <BlurCircle top="10%" left="5%" />
      <BlurCircle bottom="20%" right="5%" />

      {/* Tiêu đề */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          Hệ Thống Rạp BAC
        </h1>
        <p className="text-gray-400 text-lg">Chọn rạp và ngày để xem lịch chiếu</p>
      </div>

      {/* Danh sách rạp - Tag Style */}
      <div className="flex flex-wrap justify-center gap-3 max-w-6xl mx-auto mb-12">
        {loadingCinemas ? (
          Array(12)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full animate-pulse"
              >
                <div className="h-5 bg-gray-700 rounded w-32"></div>
              </div>
            ))
        ) : error && cinemas.length === 0 ? (
          <div className="text-center text-red-400 py-12">{error}</div>
        ) : (
          cinemas.map((cinema) => (
            <button
              key={cinema.id}
              onClick={() => handleCinemaClick(cinema)}
              className={`
                px-6 py-3 rounded-full font-medium text-sm transition-all duration-300
                backdrop-blur-md border shadow-md
                ${selectedCinema?.id === cinema.id
                  ? "bg-red-600/30 text-red-400 border-red-500/50 shadow-lg shadow-red-500/20 scale-105"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
                }
              `}
            >
              {cinema.cinema_name}
            </button>
          ))
        )}
      </div>

      {/* Chi tiết rạp + Lịch theo ngày */}
      {selectedCinema && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Tên rạp + Đóng */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-6 h-6 text-red-500" />
                {selectedCinema.cinema_name}
              </h2>
              <button
                onClick={() => {
                  setSelectedCinema(null);
                  setSelectedDate(null);
                  setShowtimes([]);
                }}
                className="text-gray-400 hover:text-red-400 transition text-sm"
              >
                Đóng
              </button>
            </div>

            {/* Danh sách ngày */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              {dateList.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`
                    px-5 py-3 rounded-full font-medium text-sm transition-all duration-300
                    backdrop-blur-md border shadow-md flex flex-col items-center
                    ${selectedDate && format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                      ? "bg-red-600/30 text-red-400 border-red-500/50 shadow-lg shadow-red-500/20"
                      : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30"
                    }
                  `}
                >
                  <span className="text-xs">{formatDateLabel(date)}</span>
                  <span className="text-xs opacity-70">{format(date, "EEEE")}</span>
                </button>
              ))}
            </div>

            {/* Lịch chiếu theo ngày */}
            {loadingShowtimes ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : error ? (
              <p className="text-red-400 text-center py-8">{error}</p>
            ) : showtimes.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Không có suất chiếu nào vào ngày này
              </p>
            ) : (
              <div className="space-y-8">
                {showtimes.map((movie) => (
                  <div
                    key={movie.movie_id}
                    className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt={movie.title}
                        className="w-20 h-28 object-cover rounded-lg shadow-md"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">
                          {movie.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">
                          Thời lượng: {movie.runtime} phút
                        </p>

                        {/* Suất chiếu → Dùng Link */}
                        <div className="flex flex-wrap gap-2">
                          {movie.showtimes.map((show) => {
                            const showDate = format(new Date(show.start_time), "yyyy-MM-dd");
                            return (
                                <Link
                                to={`/movies/${movie.movie_id}/${selectedCinema.id}/${showDate}/?${show.showtime_id}`}                                className={`
                                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 inline-flex items-center
                                  ${show.status === "Ongoing"
                                    ? "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30"
                                    : "bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30"
                                  }
                                `}
                              >
                                <Clock className="w-3 h-3 inline mr-1" />
                                {format(new Date(show.start_time), "HH:mm")}
                                <span className="ml-1 text-xs">({show.room_name})</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  ); // Đóng return
}; // Đóng component

export default RapPhim;