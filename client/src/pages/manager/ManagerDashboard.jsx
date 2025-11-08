// frontend/ManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Building, Film, CalendarClock, Users, Ticket, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const ManagerDashboard = ({cinemaId}) => {
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
    fetchData();
  }, [cinemaId]);

  if (loading) return <div className="text-center py-10">Đang tải dữ liệu rạp...</div>;
  if (!data) return <div className="text-red-500">Không tải được dữ liệu</div>;

  const { cinema, stats, revenue7Days } = data;

  const statsList = [
    { title: "Nhân viên", value: stats.employees, icon: Users },
    { title: "Phim đang chiếu", value: stats.moviesPlaying, icon: Film },
    { title: "Tổng suất chiếu", value: stats.totalShowtimes, icon: CalendarClock },
    { title: "Suất hôm nay", value: stats.showtimesToday, icon: CalendarClock },
    { title: "Tổng vé đã bán", value: stats.totalTickets.toLocaleString(), icon: Ticket },
    { title: "Vé hôm nay", value: stats.ticketsToday, icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Tiêu đề rạp */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Building className="h-8 w-8" />
          {cinema.name}
        </h1>
        <p className="text-sm opacity-90 mt-1">Số phòng: {cinema.rooms}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsList.map((item, i) => (
          <div key={i} className="bg-gray-900 text-white p-4 rounded-xl shadow hover:scale-105 transition">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-5 w-5 text-indigo-400" />
              <p className="text-xs text-gray-400">{item.title}</p>
            </div>
            <p className="text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Doanh thu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Doanh thu hôm nay</p>
              <p className="text-3xl font-bold mt-1">
                {Number(stats.revenueToday).toLocaleString()}đ
              </p>
            </div>
            <DollarSign className="h-10 w-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Doanh thu tháng này</p>
              <p className="text-3xl font-bold mt-1">
                {Number(stats.revenueThisMonth).toLocaleString()}đ
              </p>
            </div>
            <TrendingUp className="h-10 w-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu 7 ngày */}
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Doanh thu 7 ngày gần nhất</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue7Days}>
              <XAxis 
                dataKey="date" 
                stroke="#888" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
              />
              <YAxis stroke="#888" />
              <Tooltip 
                formatter={(value) => `${Number(value).toLocaleString()}đ`}
                labelFormatter={(date) => new Date(date).toLocaleDateString('vi-VN')}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;