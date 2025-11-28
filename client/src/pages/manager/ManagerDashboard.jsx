import React, { useState, useEffect } from 'react';
import { 
  Building, Film, CalendarClock, Users, Ticket, DollarSign, TrendingUp, 
  Calendar, Sparkles 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Area, AreaChart, ComposedChart 
} from 'recharts';
import axios from 'axios';

const ManagerDashboard = ({ cinemaId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const { cinema, stats, revenue7Days } = data;

  // Chuẩn bị dữ liệu cho biểu đồ: tách vé thường + event
  const chartData = revenue7Days.map(day => ({
    date: new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' }),
    fullDate: day.date,
    normal: day.revenue_normal || 0,
    event: day.revenue_event || 0,
    total: day.revenue
  }));

  const statsList = [
    { title: "Nhân viên", value: stats.employees, icon: Users, color: "from-purple-600 to-pink-600" },
    { title: "Phim đang chiếu", value: stats.moviesPlaying, icon: Film, color: "from-blue-600 to-cyan-600" },
    { title: "Tổng suất chiếu", value: stats.totalShowtimes, icon: CalendarClock, color: "from-indigo-600 to-blue-600" },
    { title: "Suất hôm nay", value: stats.showtimesToday, icon: Calendar, color: "from-orange-600 to-red-600" },
    { title: "Tổng vé đã bán", value: stats.totalTickets.toLocaleString(), icon: Ticket, color: "from-green-600 to-emerald-600" },
    { title: "Vé hôm nay", value: stats.ticketsToday, icon: TrendingUp, color: "from-yellow-500 to-orange-500" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-purple-500 p-4 rounded-xl shadow-2xl">
          <p className="text-purple-400 font-bold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={`text-sm ${entry.color}`}>
              {entry.name}: <strong>{Number(entry.value).toLocaleString()}đ</strong>
            </p>
          ))}
          <p className="text-green-400 font-bold mt-3 text-lg">
            Tổng: {Number(payload.reduce((a, b) => a + b.value, 0)).toLocaleString()}đ
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header rạp */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-pink-600 to-red-700 p-8 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold flex items-center gap-4 drop-shadow-lg">
                <Building className="h-12 w-12" />
                {cinema.name}
              </h1>
              <p className="text-xl mt-3 opacity-90">Quản lý rạp • {cinema.rooms} phòng chiếu</p>
            </div>
            <Sparkles className="h-20 w-20 text-yellow-300 opacity-70" />
          </div>
        </div>

        {/* Stats Grid - Siêu đẹp */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {statsList.map((item, i) => (
            <div 
              key={i}
              className={`relative overflow-hidden bg-gradient-to-br ${item.color} p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300`}
            >
              <div className="absolute top-2 right-2 opacity-30">
                <item.icon className="h-12 w-12" />
              </div>
              <p className="text-sm font-medium opacity-90">{item.title}</p>
              <p className="text-3xl font-bold mt-3">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Doanh thu hôm nay & tháng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hôm nay */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <DollarSign className="h-16 w-16 opacity-80" />
                <span className="text-5xl">Money</span>
              </div>
              <p className="text-xl opacity-90">Doanh thu hôm nay</p>
              <p className="text-5xl  mt-4 font-extrabold">
                {Number(stats.revenueToday).toLocaleString()}đ
              </p>
              {stats.revenueFromEventsToday > 0 && (
                <p className="mt-4 text-yellow-300 text-lg">
                  Money Bag +{Number(stats.revenueFromEventsToday).toLocaleString()}đ từ suất chiếu riêng
                </p>
              )}
            </div>
          </div>

          {/* Tháng này */}
          <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-700 p-8 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-30"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <TrendingUp className="h-16 w-16 opacity-80" />
                <span className="text-5xl">Chart Increasing</span>
              </div>
              <p className="text-xl opacity-90">Doanh thu tháng này</p>
              <p className="text-5xl  mt-4 font-extrabold">
                {Number(stats.revenueThisMonth).toLocaleString()}đ
              </p>
              {stats.revenueFromEventsThisMonth > 0 && (
                <p className="mt-4 text-cyan-300 text-lg">
                  Sparkles +{Number(stats.revenueFromEventsThisMonth).toLocaleString()}đ từ suất chiếu riêng
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Biểu đồ doanh thu 7 ngày - ĐỈNH CAO CỦA CÔNG NGHỆ */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-8 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Biểu đồ doanh thu 7 ngày gần nhất
          </h2>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEvent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tickFormatter={(value) => `${(value/1000000).toFixed(1)}tr`}
                />
                
                <Tooltip content={<CustomTooltip />} />

                {/* Area cho tổng doanh thu */}
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#a855f7" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />

                {/* Line cho doanh thu từ event - nổi bật */}
                <Line 
                  type="monotone" 
                  dataKey="event" 
                  stroke="#f59e0b" 
                  strokeWidth={5}
                  dot={{ fill: '#f59e0b', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Suất chiếu riêng"
                />

                {/* Line cho vé thường */}
                <Line 
                  type="monotone" 
                  dataKey="normal" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={false}
                  name="Vé thường"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chú thích */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded bg-gradient-to-b from-purple-500 to-transparent"></div>
              <span>Tổng doanh thu</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-yellow-500"></div>
              <span>Suất chiếu riêng</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-green-500"></div>
              <span>Vé thường</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagerDashboard;