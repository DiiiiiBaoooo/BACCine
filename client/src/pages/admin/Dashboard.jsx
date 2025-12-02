import React, { useState, useEffect } from 'react';
import { Building, Film, CalendarClock, DollarSign, Users, Armchair } from 'lucide-react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCinemas: 0,
    totalMovies: 0,
    totalShowtimes: 0,
    totalRevenue: 0,
    totalEmployees: 0,
    seatsSold: 0,
    totalSeats: 0,
    occupancyRate: 0,
  });

  const [revenueByCinema, setRevenueByCinema] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [showtimesByMovie, setShowtimesByMovie] = useState([]);
  const [showtimesByCinema, setShowtimesByCinema] = useState([]);
  const [occupancyByCinema, setOccupancyByCinema] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          statsRes,
          revenueCinemaRes,
          monthlyRes,
          showtimesMovieRes,
          showtimesCinemaRes,
          occupancyRes,
          topMoviesRes,
        ] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/revenue-by-cinema'),
          axios.get('/api/admin/revenue-monthly'),
          axios.get('/api/admin/showtimes-by-movie'),
          axios.get('/api/admin/showtimes-by-cinema'),
          axios.get('/api/admin/occupancy-by-cinema'),
          axios.get('/api/admin/top-movies'),
        ]);

        // ✅ Kiểm tra và set dữ liệu an toàn
        if (statsRes?.data?.stats) {
          setStats(statsRes.data.stats);
        }
        
        if (revenueCinemaRes?.data?.data && Array.isArray(revenueCinemaRes.data.data)) {
          setRevenueByCinema(revenueCinemaRes.data.data);
        }
        
        if (monthlyRes?.data?.data && Array.isArray(monthlyRes.data.data)) {
          setMonthlyRevenue(monthlyRes.data.data);
        }
        
        if (showtimesMovieRes?.data?.data && Array.isArray(showtimesMovieRes.data.data)) {
          setShowtimesByMovie(showtimesMovieRes.data.data);
        }
        
        if (showtimesCinemaRes?.data?.data && Array.isArray(showtimesCinemaRes.data.data)) {
          setShowtimesByCinema(showtimesCinemaRes.data.data);
        }
        
        if (occupancyRes?.data?.data && Array.isArray(occupancyRes.data.data)) {
          setOccupancyByCinema(occupancyRes.data.data);
        }
        
        if (topMoviesRes?.data?.data && Array.isArray(topMoviesRes.data.data)) {
          setTopMovies(topMoviesRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-white text-xl">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-950">
        <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  // Stats cards
  const statItems = [
    { title: 'Tổng số rạp', value: stats.totalCinemas || 0, icon: Building, color: 'bg-blue-500' },
    { title: 'Tổng phim đã chiếu', value: stats.totalMovies || 0, icon: Film, color: 'bg-purple-500' },
    { title: 'Tổng suất chiếu', value: stats.totalShowtimes || 0, icon: CalendarClock, color: 'bg-green-500' },
    { 
      title: 'Tổng doanh thu', 
      value: `${Number(stats.totalRevenue || 0).toLocaleString()}đ`, 
      icon: DollarSign, 
      color: 'bg-yellow-500' 
    },
    { title: 'Tổng nhân viên', value: stats.totalEmployees || 0, icon: Users, color: 'bg-red-500' },
    { 
      title: 'Tỷ lệ lấp ghế', 
      value: `${stats.occupancyRate || 0}%`, 
      icon: Armchair, 
      color: 'bg-indigo-500' 
    },
  ];

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d084d0'];
  const STATUS_COLORS = {
    scheduled: '#3b82f6',
    ongoing: '#fbbf24',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-white font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="bg-gray-900 text-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:scale-105 transition-transform"
          >
            <div className={`p-3 ${item.color} rounded-xl`}>
              <item.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{item.title}</p>
              <h2 className="text-2xl font-bold">{item.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doanh thu theo rạp */}
        <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Doanh thu theo rạp</h2>
          {revenueByCinema.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={revenueByCinema}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="cinema_name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="revenue" fill="#4f46e5" name="Doanh thu (VNĐ)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Doanh thu theo tháng */}
        <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h2>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} name="Doanh thu (VNĐ)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Suất chiếu theo phim */}
        <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Tổng suất chiếu theo phim</h2>
          {showtimesByMovie.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={showtimesByMovie}
                  dataKey="total_showtimes"
                  nameKey="movie_title"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.movie_title}: ${entry.total_showtimes}`}
                >
                  {showtimesByMovie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Suất chiếu theo rạp */}
        <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Suất chiếu theo rạp</h2>
          {showtimesByCinema.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={showtimesByCinema}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="cinema_name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="scheduled" fill={STATUS_COLORS.scheduled} name="Scheduled" stackId="a" />
                <Bar dataKey="ongoing" fill={STATUS_COLORS.ongoing} name="Ongoing" stackId="a" />
                <Bar dataKey="completed" fill={STATUS_COLORS.completed} name="Completed" stackId="a" />
                <Bar dataKey="cancelled" fill={STATUS_COLORS.cancelled} name="Cancelled" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Tỷ lệ lấp đầy ghế */}
        <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Tỷ lệ lấp đầy ghế theo rạp</h2>
          {occupancyByCinema.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={occupancyByCinema}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="cinema_name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="occupancy_rate" fill="#a855f7" name="Tỷ lệ lấp đầy (%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Top phim */}
        <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Top 5 phim doanh thu cao</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {topMovies.length > 0 ? (
              topMovies.map((movie, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                  <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                        alt={movie.movie_title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-poster.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{movie.movie_title}</p>
                    <p className="text-xs text-gray-400">{movie.total_orders} đơn hàng</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-400">{Number(movie.revenue).toLocaleString()}đ</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;