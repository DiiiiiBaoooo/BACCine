import React, { useState, useEffect } from 'react';
import { 
  Building, Film, CalendarClock, Users, DollarSign, TrendingUp, 
  Ticket, Clock, Target, Award, BarChart3
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ComposedChart, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import axios from 'axios';

const ManagerDashboard = ({ cinemaId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/manager/dashboard?cinemaId=${cinemaId}`);
        setData(res.data.data);
      } catch (error) {
        console.error('Error loading manager dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    if (cinemaId) fetchData();
  }, [cinemaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-6 text-lg">Đang tải dữ liệu rạp...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-500 p-10 text-center text-2xl">Không tải được dữ liệu</div>;

  const { cinema, summary, charts } = data;

  // Colors for charts
  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];
  const TIME_SLOT_COLORS = {
    'Sáng (6h-11h)': '#fbbf24',
    'Chiều (12h-17h)': '#fb923c',
    'Tối (18h-21h)': '#a855f7',
    'Khuya (22h-5h)': '#3b82f6'
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Format month label
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return `Tháng ${month}/${year}`;
  };

  // Custom Tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-purple-500/50 p-4 rounded-xl shadow-2xl backdrop-blur-sm">
          <p className="text-purple-400 font-bold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-green-500/50 p-4 rounded-xl shadow-2xl backdrop-blur-sm">
          <p className="text-green-400 font-bold mb-2">{formatMonth(label)}</p>
          <p className="text-white">
            Doanh thu: <strong className="text-green-400">{formatCurrency(payload[0].value)}</strong>
          </p>
          <p className="text-gray-300 text-sm mt-1">
            Đơn hàng: {payload[0].payload.orderCount}
          </p>
        </div>
      );
    }
    return null;
  };

  // Summary Cards
  const summaryCards = [
    { 
      title: "Tổng Phim Đã Chiếu", 
      value: summary.totalMoviesScreened, 
      icon: Film, 
      color: "from-purple-600 to-pink-600",
      bgIcon: "bg-purple-500/20",
      iconColor: "text-purple-400"
    },
    { 
      title: "Tổng Suất Chiếu", 
      value: summary.totalShowtimes.toLocaleString(), 
      icon: CalendarClock, 
      color: "from-blue-600 to-cyan-600",
      bgIcon: "bg-blue-500/20",
      iconColor: "text-blue-400"
    },
    { 
      title: "Tổng Doanh Thu", 
      value: formatCurrency(summary.totalRevenue), 
      icon: DollarSign, 
      color: "from-green-600 to-emerald-600",
      bgIcon: "bg-green-500/20",
      iconColor: "text-green-400",
      isLarge: true
    },
    { 
      title: "Tổng Nhân Viên", 
      value: summary.totalEmployees, 
      icon: Users, 
      color: "from-orange-600 to-red-600",
      bgIcon: "bg-orange-500/20",
      iconColor: "text-orange-400"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white p-6">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-700 p-8 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold flex items-center gap-4 drop-shadow-lg">
                <Building className="h-12 w-12" />
                {cinema.name}
              </h1>
              <p className="text-xl mt-3 opacity-90">Dashboard Quản Lý • {cinema.rooms} Phòng Chiếu</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Doanh thu hôm nay</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.revenueToday)}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, i) => (
            <div 
              key={i}
              className={`relative overflow-hidden bg-gradient-to-br ${card.color} p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300`}
            >
              <div className={`absolute top-4 right-4 ${card.bgIcon} p-3 rounded-xl`}>
                <card.icon className={`h-8 w-8 ${card.iconColor}`} />
              </div>
              <p className="text-sm font-medium opacity-90 mb-2">{card.title}</p>
              <p className={`${card.isLarge ? 'text-2xl' : 'text-4xl'} font-bold mt-2`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700 pb-4">
          {['overview', 'revenue', 'movies', 'occupancy'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'overview' && 'Tổng Quan'}
              {tab === 'revenue' && 'Doanh Thu'}
              {tab === 'movies' && 'Phim'}
              {tab === 'occupancy' && 'Lấp Đầy'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue by Month */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-400" />
                Doanh Thu 12 Tháng Gần Nhất
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={charts.revenueByMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9ca3af"
                    tickFormatter={formatMonth}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tickFormatter={(value) => `${(value/1000000).toFixed(0)}tr`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Tickets by Week */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Ticket className="h-6 w-6 text-blue-400" />
                Vé Bán Theo Tuần
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={charts.ticketsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="weekLabel" stroke="#9ca3af" />
                  <YAxis yAxisId="left" stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ticketsSold" fill="#3b82f6" name="Số vé" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Doanh thu"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            {/* Top Revenue Movies */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-green-500/20 p-6 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Award className="h-6 w-6 text-yellow-400" />
                Top 10 Phim Doanh Thu Cao Nhất
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={charts.revenueByMovie} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" tickFormatter={(v) => `${(v/1000000).toFixed(0)}tr`} />
                  <YAxis dataKey="title" type="category" stroke="#9ca3af" width={150} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Details Table */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-2xl overflow-x-auto">
              <h3 className="text-2xl font-bold mb-6">Chi Tiết Doanh Thu Theo Phim</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 px-4">STT</th>
                    <th className="pb-3 px-4">Tên Phim</th>
                    <th className="pb-3 px-4 text-right">Doanh Thu</th>
                    <th className="pb-3 px-4 text-right">Số Vé</th>
                    <th className="pb-3 px-4 text-right">Đơn Hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.revenueByMovie.map((movie, idx) => (
                    <tr key={movie.movieId} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold">{movie.title}</td>
                      <td className="py-3 px-4 text-right text-green-400">{formatCurrency(movie.revenue)}</td>
                      <td className="py-3 px-4 text-right">{movie.ticketsSold}</td>
                      <td className="py-3 px-4 text-right">{movie.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Showtimes by Movie */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <CalendarClock className="h-6 w-6 text-purple-400" />
                Top 10 Phim Có Nhiều Suất Chiếu Nhất
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={charts.showtimesByMovie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="title" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="showtimeCount" fill="#a855f7" name="Tổng suất chiếu" />
                  <Bar dataKey="completedCount" fill="#10b981" name="Đã hoàn thành" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Movie Stats Pie Chart */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-cyan-400" />
                Phân Bổ Suất Chiếu Top 5
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={charts.showtimesByMovie.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ title, percent }) => `${title.slice(0, 15)}... (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="showtimeCount"
                  >
                    {charts.showtimesByMovie.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Occupancy Tab */}
        {activeTab === 'occupancy' && (
          <div className="space-y-8">
            {/* Occupancy by Movie */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-cyan-500/20 p-6 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Target className="h-6 w-6 text-cyan-400" />
                Tỷ Lệ Lấp Đầy Theo Phim (%)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={charts.occupancyByMovie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="title" 
                    stroke="#9ca3af" 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    interval={0}
                  />
                  <YAxis stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="occupancyRate" fill="#06b6d4" name="Tỷ lệ lấp đầy (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Occupancy by Time Slot */}
              <div className="bg-gray-900/80 backdrop-blur-xl border border-orange-500/20 p-6 rounded-3xl shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-400" />
                  Tỷ Lệ Lấp Đầy Theo Khung Giờ
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.occupancyByTimeSlot}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timeSlot" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="occupancyRate" name="Tỷ lệ lấp đầy (%)">
                      {charts.occupancyByTimeSlot.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TIME_SLOT_COLORS[entry.timeSlot]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Time Slot Radar */}
              <div className="bg-gray-900/80 backdrop-blur-xl border border-pink-500/20 p-6 rounded-3xl shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-pink-400" />
                  Phân Tích Khung Giờ
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={charts.occupancyByTimeSlot}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="timeSlot" stroke="#9ca3af" />
                    <PolarRadiusAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Radar 
                      name="Tỷ lệ lấp đầy" 
                      dataKey="occupancyRate" 
                      stroke="#ec4899" 
                      fill="#ec4899" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Occupancy Details Table */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-2xl overflow-x-auto">
              <h3 className="text-2xl font-bold mb-6">Chi Tiết Lấp Đầy Theo Khung Giờ</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 px-4">Khung Giờ</th>
                    <th className="pb-3 px-4 text-right">Tổng Suất</th>
                    <th className="pb-3 px-4 text-right">Vé Đã Bán</th>
                    <th className="pb-3 px-4 text-right">Tổng Ghế</th>
                    <th className="pb-3 px-4 text-right">Tỷ Lệ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.occupancyByTimeSlot.map((slot, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-semibold">{slot.timeSlot}</td>
                      <td className="py-3 px-4 text-right">{slot.totalShowtimes}</td>
                      <td className="py-3 px-4 text-right">{slot.ticketsSold}</td>
                      <td className="py-3 px-4 text-right">{slot.totalCapacity}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${
                          slot.occupancyRate >= 70 ? 'text-green-400' :
                          slot.occupancyRate >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {slot.occupancyRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagerDashboard;