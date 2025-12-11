import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react';
const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

const QuanLyLichChieu = ({ cinemaId }) => {
  const [showtimes, setShowtimes] = useState([]);
  const [filteredShowtimes, setFilteredShowtimes] = useState([]);
  const [statistics, setStatistics] = useState({
    total_showtimes: 0,
    total_ongoing: 0,
    total_scheduled: 0,
    total_finished: 0,
    total_cancelled: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updateData, setUpdateData] = useState({ start_time: '', end_time: '', status: '' });
  const currency = 'VND';

  // Tính toán thống kê từ danh sách lịch chiếu
  const calculateStatistics = (showtimeList) => {
    const total_showtimes = showtimeList.length;
    const total_ongoing = showtimeList.filter(showtime => showtime.status === 'Ongoing').length;
    const total_scheduled = showtimeList.filter(showtime => showtime.status === 'Scheduled').length;
    const total_finished = showtimeList.filter(showtime => showtime.status === 'Completed').length;
    const total_cancelled = showtimeList.filter(showtime => showtime.status === 'Cancelled').length;

    return {
      total_showtimes,
      total_ongoing,
      total_scheduled,
      total_finished,
      total_cancelled,
    };
  };

  // Fetch danh sách lịch chiếu
  const fetchShowtimes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/showtimes/cinema/${cinemaId}`);
      if (response.data.success) {
        setShowtimes(response.data.showtimes);
        setFilteredShowtimes(response.data.showtimes);
        setStatistics(calculateStatistics(response.data.showtimes));
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể tải danh sách lịch chiếu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch danh sách phim đang chiếu tại cụm rạp
// Fetch danh sách phim từ TẤT CẢ các kế hoạch
const fetchNowPlayingMovies = async () => {
  try {
    const response = await axios.get(`/api/cinemas/planmovies/${cinemaId}`);
    if (response.data.success) {
      // Gom tất cả phim từ TẤT CẢ các plan
      const allMovies = response.data.plans.reduce((acc, plan) => {
        return acc.concat(plan.movies || []);
      }, []);

      // Loại bỏ trùng lặp theo movie_id
      const uniqueMovies = Array.from(
        new Map(allMovies.map(m => [m.movie_id, m])).values()
      );

      setNowPlayingMovies(uniqueMovies);
    } else {
      toast.error(response.data.message || "Không thể tải danh sách phim");
    }
  } catch (err) {
    console.error("Lỗi fetch phim:", err);
    toast.error("Không thể tải danh sách phim");
  }
};

  // Fetch danh sách phòng chiếu
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`/api/rooms/cinema/${cinemaId}`);
      if (response.data.success) {
        // Only include rooms that are not 'Closed'
        const activeAndMaintenanceRooms = response.data.rooms.filter(
          room => room.status !== 'Closed'
        );
        setRooms(activeAndMaintenanceRooms);
      } else {
        toast.error(response.data.message || "Không thể tải danh sách phòng chiếu");
      }
    } catch (err) {
      toast.error("Không thể tải danh sách phòng chiếu");
    }
  };

  // Lọc lịch chiếu theo trạng thái
  const filterShowtimes = () => {
    let filtered = [...showtimes];
    if (statusFilter) {
      filtered = filtered.filter(showtime => showtime.status === statusFilter);
    }
    setFilteredShowtimes(filtered);
  };

  // Thêm ngày giờ vào danh sách
  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split('T');
    if (!date || !time) return;

    const formattedTime = time.length === 5 ? `${time}:00` : time;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(formattedTime)) {
        return { ...prev, [date]: [...times, formattedTime] };
      }
      return prev;
    });
    setDateTimeInput('');
  };

  // Xóa ngày giờ đã chọn
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date]?.filter((t) => t !== time) || [];
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  // Thêm lịch chiếu mới
// Thay thế phần handleAddShowtime trong QuanLyLichChieu.jsx

// Thay thế phần handleAddShowtime trong QuanLyLichChieu.jsx

const handleAddShowtime = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    if (!selectedMovie) {
      toast.error("Vui lòng chọn một bộ phim");
      return;
    }
    if (!selectedRoom) {
      toast.error("Vui lòng chọn một phòng chiếu");
      return;
    }
    if (Object.keys(dateTimeSelection).length === 0) {
      toast.error("Vui lòng chọn ít nhất một ngày và giờ");
      return;
    }

    // Validate that the selected room is Active
    const selectedRoomData = rooms.find(room => room.id === selectedRoom);
    if (selectedRoomData && selectedRoomData.status === 'Maintenance') {
      toast.error("Phòng chiếu đang bảo trì, không thể chọn");
      return;
    }

    const showtimes = [];
    Object.entries(dateTimeSelection).forEach(([date, times]) => {
      times.forEach((time) => {
        // ✅ GỬI TRỰC TIẾP ĐỊNH DẠNG YYYY-MM-DD HH:mm:ss
        // Backend sẽ tự hiểu đây là giờ địa phương (UTC+7)
        const startTime = `${date} ${time}`;
        
        // Tính end_time bằng cách thêm 2 giờ
        const startDate = new Date(`${date}T${time}`);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        
        // Format end_time
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const hours = String(endDate.getHours()).padStart(2, '0');
        const minutes = String(endDate.getMinutes()).padStart(2, '0');
        const seconds = String(endDate.getSeconds()).padStart(2, '0');
        const endTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        showtimes.push({
          movie_id: selectedMovie,
          room_id: selectedRoom,
          start_time: startTime,
          end_time: endTime,
          status: 'Scheduled',
        });
      });
    });

    const response = await axios.post("/api/showtimes", showtimes);

    if (response.data.success) {
      toast.success("Thêm lịch chiếu thành công");
      setIsModalOpen(false);
      setSelectedMovie(null);
      setSelectedRoom(null);
      setDateTimeSelection({});
      fetchShowtimes();
    } else {
      setError(response.data.message);
      toast.error(response.data.message);
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || "Không thể thêm lịch chiếu";
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
  // Mở modal cập nhật
  const openUpdateModal = (showtime) => {
    setSelectedShowtime(showtime);
    setUpdateData({
      start_time: showtime.start_time.slice(0, 16),
      end_time: showtime.end_time.slice(0, 16),
      status: showtime.status,
    });
    setIsUpdateModalOpen(true);
  };

  // Cập nhật lịch chiếu
  const handleUpdateShowtime = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(`/api/showtimes/${selectedShowtime.id}`, updateData);
      if (response.data.success) {
        toast.success(response.data.message);
        setIsUpdateModalOpen(false);
        setSelectedShowtime(null);
        setUpdateData({ start_time: '', end_time: '', status: '' });
        fetchShowtimes();
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể cập nhật lịch chiếu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xóa lịch chiếu
  const handleDeleteShowtime = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch chiếu này?")) return;
    try {
      const response = await axios.delete(`/api/showtimes/${id}`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchShowtimes();
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể xóa lịch chiếu";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle input cập nhật
  const handleUpdateChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  // Handle filter status
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Debounced filter
  useEffect(() => {
    const timer = setTimeout(() => {
      filterShowtimes();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, showtimes]);

  // Fetch dữ liệu khi component mount hoặc cinemaId thay đổi
  useEffect(() => {
    fetchShowtimes();
    fetchNowPlayingMovies();
    fetchRooms();
  }, [cinemaId]);

  // Polling to refresh showtimes every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchShowtimes, 30000);
    return () => clearInterval(interval);
  }, [cinemaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Quản lý Lịch Chiếu</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-900">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Tổng lịch chiếu</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_showtimes}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-900">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Đang diễn ra</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_ongoing}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-900">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Đã lên lịch</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_scheduled}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-900">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Đã kết thúc</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_finished}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-600">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Đã hủy</p>
                <p className="text-2xl font-semibold text-white">{statistics.total_cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap gap-4">
            <select 
              name="status" 
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-gray-800">Tất cả trạng thái</option>
              <option value="Ongoing" className="bg-gray-800">Đang diễn ra</option>
              <option value="Scheduled" className="bg-gray-800">Đã lên lịch</option>
              <option value="Completed" className="bg-gray-800">Đã kết thúc</option>
              <option value="Cancelled" className="bg-gray-800">Đã hủy</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Thêm lịch chiếu
          </button>
        </div>

        {/* Showtimes Table */}
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tên phim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phòng chiếu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thời gian bắt đầu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thời gian kết thúc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredShowtimes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      Không có lịch chiếu nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  filteredShowtimes.map((showtime) => (
                    <tr key={showtime.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {showtime.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {showtime.room_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(showtime.start_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(showtime.end_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          showtime.status === 'Ongoing' 
                            ? 'bg-green-900 text-green-300' 
                            : showtime.status === 'Scheduled'
                            ? 'bg-yellow-900 text-yellow-300'
                            : showtime.status === 'Completed'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {showtime.status === 'Ongoing' ? 'Đang diễn ra' : 
                           showtime.status === 'Scheduled' ? 'Đã lên lịch' : 
                           showtime.status === 'Completed' ? 'Đã kết thúc' : 'Đã hủy'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUpdateModal(showtime)}
                            className="text-blue-400 hover:text-blue-300"
                            disabled={showtime.status === 'Ongoing' || showtime.status === 'Completed'}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteShowtime(showtime.id)}
                            className="text-red-400 hover:text-red-300"
                            disabled={showtime.status === 'Ongoing' || showtime.status === 'Completed'}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Showtime Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Thêm lịch chiếu mới</h3>
              <form onSubmit={handleAddShowtime} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Chọn phim đang chiếu</label>
                  <div className="overflow-x-auto pb-4">
                    <div className="group flex flex-wrap gap-4 mt-4 w-max">
                      {nowPlayingMovies.length === 0 ? (
                        <p className="text-gray-400">Không có phim đang chiếu</p>
                      ) : (
                        nowPlayingMovies.map((movie) => (
                          <div
                            key={movie.movie_id}
                            className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
                            onClick={() => setSelectedMovie(movie.movie_id)}
                          >
                            <div className="relative rounded-lg overflow-hidden">
                              <img
                                src={movie.poster_path ? `${image_base_url}${movie.poster_path}` : '/placeholder-poster.jpg'}
                                alt={movie.title}
                                className="w-full object-cover brightness-90"
                              />
                              <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                              <p className="flex items-center gap-1 text-gray-400">
  <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
  {(() => {
    const rating = parseFloat(movie.vote_average);
    return isNaN(rating) ? 'N/A' : rating.toFixed(1);
  })()}
</p>
                                <p className="text-gray-300">{movie.vote_count || 0} Votes</p>
                              </div>
                            </div>
                            {selectedMovie === movie.movie_id && (
                              <div className="absolute top-2 right-2 flex items-center justify-center bg-blue-600 h-6 w-6 rounded">
                                <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                              </div>
                            )}
                            <p className="font-medium truncate text-white">{movie.title}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(movie.release_date).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Chọn phòng chiếu</label>
                  <div className="flex flex-wrap gap-4">
                    {rooms.length === 0 ? (
                      <p className="text-gray-400">Không có phòng chiếu khả dụng</p>
                    ) : (
                      rooms.map((room) => (
                        <div
                          key={room.id}
                          className={`relative p-4 border rounded-lg ${
                            room.status === 'MAINTENANCE'
                              ? 'border-gray-600 opacity-50 cursor-not-allowed'
                              : selectedRoom === room.id
                              ? 'border-blue-500 bg-blue-900/50 cursor-pointer'
                              : 'border-gray-600 cursor-pointer'
                          } hover:border-blue-400 transition duration-300`}
                          onClick={() => {
                            if (room.status !== 'MAINTENANCE') {
                              setSelectedRoom(room.id);
                            }
                          }}
                        >
                          <p className="font-medium text-white">{room.name}</p>
                          <p className="text-sm text-gray-400">Sức chứa: {room.capacity} ghế</p>
                          {room.status === 'MAINTENANCE' && (
                            <div className="absolute top-2 right-2 flex items-center justify-center bg-red-600 h-6 px-2 rounded">
                              <span className="text-white text-xs">Đang bảo trì</span>
                            </div>
                          )}
                          {selectedRoom === room.id && room.status !== 'MAINTENANCE' && (
                            <div className="absolute top-2 right-2 flex items-center justify-center bg-blue-600 h-6 w-6 rounded">
                              <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Chọn ngày và giờ</label>
                  <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
                    <input
                      type="datetime-local"
                      value={dateTimeInput}
                      onChange={(e) => setDateTimeInput(e.target.value)}
                      className="outline-none rounded-md bg-gray-900 text-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleDateTimeAdd}
                      className="bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Thêm thời gian
                    </button>
                  </div>
                </div>

                {Object.keys(dateTimeSelection).length > 0 && (
                  <div>
                    <h2 className="mb-2 text-white">Ngày và giờ đã chọn</h2>
                    <ul className="space-y-3">
                      {Object.entries(dateTimeSelection).map(([date, times]) => (
                        <li key={date}>
                          <div className="font-medium text-white">{date}</div>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm">
                            {times.map((time) => (
                              <div className="border border-blue-500 px-2 py-1 flex items-center rounded" key={time}>
                                <span className="text-gray-200">{time}</span>
                                <DeleteIcon
                                  onClick={() => handleRemoveTime(date, time)}
                                  width={15}
                                  className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedMovie(null);
                      setSelectedRoom(null);
                      setDateTimeSelection({});
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang thêm...' : 'Thêm lịch chiếu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Showtime Modal */}
      {isUpdateModalOpen && selectedShowtime && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Cập nhật lịch chiếu</h3>
              <form onSubmit={handleUpdateShowtime} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Thời gian bắt đầu *</label>
                    <input
                      type="datetime-local"
                      name="start_time"
                      value={updateData.start_time}
                      onChange={handleUpdateChange}
                      required
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Thời gian kết thúc *</label>
                    <input
                      type="datetime-local"
                      name="end_time"
                      value={updateData.end_time}
                      onChange={handleUpdateChange}
                      required
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Trạng thái *</label>
                  <select
                    name="status"
                    value={updateData.status}
                    onChange={handleUpdateChange}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Scheduled" className="bg-gray-900">Đã lên lịch</option>
                    <option value="Ongoing" className="bg-gray-900">Đang diễn ra</option>
                    <option value="Completed" className="bg-gray-900">Đã kết thúc</option>
                    <option value="Cancelled" className="bg-gray-900">Đã hủy</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdateModalOpen(false);
                      setSelectedShowtime(null);
                      setUpdateData({ start_time: '', end_time: '', status: '' });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyLichChieu;