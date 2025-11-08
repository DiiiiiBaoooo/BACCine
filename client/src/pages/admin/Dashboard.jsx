// frontend/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { Building, Film, CalendarClock, Users, UserCheck, DollarSign, Ticket, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCinemas: 0,
    moviesPlaying: 0,
    totalShowtimes: 0,
    totalEmployees: 0,
    totalMembers: 0,
    totalRevenue: 0,
    ticketsToday: 0,
    totalTicketsSold: 0,
  });
  
  const [revenueData, setRevenueData] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, topRes] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/revenue-monthly'),
          axios.get('/api/admin/top-movies')
        ]);

        setStats(statsRes.data.stats);
        setRevenueData(revenueRes.data.revenueData);
        setTopMovies(topRes.data.topMovies);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;

  const statItems = [
    { title: "Tổng số rạp", value: stats.totalCinemas, icon: Building },
    { title: "Phim đang chiếu", value: stats.moviesPlaying, icon: Film },
    { title: "Tổng suất chiếu", value: stats.totalShowtimes, icon: CalendarClock },
    { title: "Nhân viên", value: stats.totalEmployees, icon: Users },
    { title: "Thành viên", value: stats.totalMembers, icon: UserCheck },
    { title: "Doanh thu", value: `${Number(stats.totalRevenue).toLocaleString()}đ`, icon: DollarSign },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-1">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="bg-gray-900 text-white rounded-2xl shadow-lg p-5 flex items-center gap-4 hover:scale-[1.02] transition"
          >
            <div className="p-3 bg-gray-800 rounded-xl">
              <item.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{item.title}</p>
              <h2 className="text-2xl font-bold">{item.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {/* Biểu đồ doanh thu */}
        <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip formatter={(value) => `${value.toLocaleString()}đ`} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Cards: Vé hôm nay, Tổng vé, Top phim */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vé bán hôm nay */}
          <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-6 flex flex-col items-center">
            <Ticket className="h-8 w-8 text-primary mb-2" />
            <p className="text-gray-400">Vé bán hôm nay</p>
            <p className="text-3xl font-bold mt-2">{stats.ticketsToday.toLocaleString()}</p>
          </div>

          {/* Tổng số vé đã bán */}
          <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-6 flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-green-400 mb-2" />
            <p className="text-gray-400">Tổng số vé đã bán</p>
            <p className="text-3xl font-bold mt-2">{stats.totalTicketsSold.toLocaleString()}</p>
          </div>

          {/* Top phim */}
          <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-6">
            <p className="text-gray-400 mb-2">Top phim doanh thu cao</p>
            <ul className="space-y-2">
              {topMovies.length > 0 ? (
                topMovies.map((movie, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="truncate max-w-[150px]">{movie.name}</span>
                    <span className="font-semibold">{Number(movie.revenue).toLocaleString()}đ</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">Chưa có dữ liệu</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard