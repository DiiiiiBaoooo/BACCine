import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Users, Calendar, DollarSign, Clock, Film, TrendingUp, Ticket, Award 
} from 'lucide-react';
import useAuthUser from '../../hooks/useAuthUser';
import { getEmployeeDashboard } from '../../lib/api';

const EmployeeDashboard = () => {
  const { authUser } = useAuthUser();

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employeeDashboard'],
    queryFn: getEmployeeDashboard,
    enabled: !!authUser?.id && authUser?.role === 'employee',
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-6 text-lg">Đang tải hiệu suất làm việc...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-500/50 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 text-xl font-bold mb-4">Không thể tải dữ liệu</p>
          <button 
            onClick={() => refetch()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const { summary, charts, top_movies, upcoming_shifts } = dashboardData;

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const statsCards = [
    { title: "Đơn hàng hôm nay", value: summary.orders.today, total: summary.orders.this_month, icon: Users, color: "from-purple-600 to-pink-600", label: "tháng này" },
    { title: "Vé đã bán", value: summary.tickets.today, total: summary.tickets.this_month, icon: Ticket, color: "from-cyan-600 to-blue-600", label: "tháng này" },
    { title: "Doanh thu hôm nay", value: formatCurrency(summary.revenue.today), total: formatCurrency(summary.revenue.this_month), icon: DollarSign, color: "from-green-600 to-emerald-600", label: "tháng này", highlight: true },
    { title: "Tỷ lệ hoàn thành ca", value: `${summary.shifts.completion_rate}%`, total: `${summary.shifts.completed}/${summary.shifts.total}`, icon: Award, color: "from-orange-600 to-red-600", label: "ca hoàn thành" },
  ];

  const shiftPieData = [
    { name: 'Hoàn thành', value: summary.shifts.completed, color: '#10b981' },
    { name: 'Đã xác nhận', value: summary.shifts.confirmed, color: '#3b82f6' },
    { name: 'Chờ xác nhận', value: summary.shifts.pending, color: '#f59e0b' },
    { name: 'Đã hủy', value: summary.shifts.cancelled, color: '#ef4444' },
    { name: 'Vắng mặt', value: summary.shifts.absent, color: '#6b7280' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white p-6">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-800 p-10 rounded-3xl shadow-2xl border border-purple-500/30">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10">
            <h1 className="text-5xl font-bold flex items-center gap-4 drop-shadow-2xl">
              <TrendingUp className="h-14 w-14 text-yellow-400" />
              Dashboard Nhân Viên
            </h1>
            <p className="text-2xl mt-4 opacity-90">Chào mừng trở lại, <span className="text-yellow-300 font-bold">{authUser?.name || 'Nhân viên'}</span>!</p>
            <p className="text-lg mt-2 opacity-80">Theo dõi hiệu suất bán vé & ca làm việc của bạn</p>
          </div>
        </div>

        {/* Stats Cards - Dark Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, i) => (
            <div 
              key={i}
              className={`relative overflow-hidden bg-gradient-to-br ${card.color} p-6 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl transform hover:scale-105 transition-all duration-300`}
            >
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <card.icon className="h-8 w-8 text-white" />
                  </div>
                  <TrendingUp className="h-6 w-6 text-yellow-400 opacity-80" />
                </div>
                <p className="text-sm font-medium opacity-90">{card.title}</p>
                <p className={`text-3xl font-bold mt-2 ${card.highlight ? 'text-4xl' : ''}`}>
                  {card.value}
                </p>
                <p className="text-sm mt-3 opacity-80">
                  {card.total} {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Doanh thu 7 ngày */}
          <div className="bg-gray-900/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <DollarSign className="h-7 w-7 text-green-400" />
              Doanh Thu 7 Ngày Gần Nhất
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={charts.revenue_7_days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                />
                <YAxis stroke="#9ca3af" tickFormatter={(v) => `${(v/1000000).toFixed(1)}tr`} />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #6b7280', borderRadius: '12px' }}
                  formatter={(v) => formatCurrency(v)}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  dot={{ fill: '#10b981', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Vé bán theo tuần */}
          <div className="bg-gray-900/90 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Ticket className="h-7 w-7 text-cyan-400" />
              Vé Bán Theo Tuần
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.tickets_weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #06b6d4', borderRadius: '12px' }} />
                <Bar dataKey="tickets" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Movies + Shift Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 5 Phim */}
          <div className="bg-gray-900/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Film className="h-7 w-7 text-pink-400" />
              Top 5 Phim Bán Chạy
            </h3>
            <div className="space-y-4">
              {top_movies.map((movie, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/30 rounded-2xl border border-purple-500/20 hover:border-purple-400 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-yellow-400">#{i + 1}</span>
                    {movie.poster_path && (
                      <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="w-14 h-20 object-cover rounded-lg shadow-lg" />
                    )}
                    <div>
                      <p className="font-bold text-lg">{movie.title}</p>
                      <p className="text-sm text-gray-400">{movie.tickets_sold} vé bán ra</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(movie.revenue)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trạng thái ca làm */}
          {/* Trạng thái ca làm việc – ĐÃ FIX 100% CHO DỮ LIỆU CHUỖI */}
<div className="bg-gray-900/90 backdrop-blur-2xl border border-orange-500/30 rounded-3xl p-8 shadow-2xl">
  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
    <Clock className="h-7 w-7 text-orange-400" />
    Trạng Thái Ca Làm Việc
  </h3>

  {summary.shifts.total === 0 ? (
    <div className="h-[320px] flex items-center justify-center">
      <div className="text-center">
        <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4 opacity-50" />
        <p className="text-xl text-gray-400">Chưa có ca làm việc nào</p>
      </div>
    </div>
  ) : (
    (() => {
      // ÉP KIỂU CHUỖI → SỐ (fix chính ở đây!)
      const s = summary.shifts;
      const completed = Number(s.completed) || 0;
      const confirmed = Number(s.confirmed) || 0;
      const pending   = Number(s.pending)   || 0;
      const cancelled = Number(s.cancelled) || 0;
      const absent = Number(s.absent) || 0;
      const pieData = [
        { name: 'Hoàn thành',    value: completed, color: '#10b981' },
        { name: 'Đang trong ca',   value: confirmed, color: '#3b82f6' },
        { name: 'Chưa chấm công',  value: pending,   color: '#f59e0b' },
        { name: 'Đã hủy',        value: cancelled, color: '#ef4444' },
        { name: 'Vắng mặt',      value: absent,    color: '#6b7280' },
      ].filter(item => item.value > 0);

      return pieData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-gray-500">
          Không có dữ liệu trạng thái
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={6}
                dataKey="value"
                stroke="#1f2937"
                strokeWidth={3}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                formatter={(v) => `${v} ca`}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend đẹp */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-300">{item.name}</span>
                <span className="ml-auto font-bold text-white">{item.value} ca</span>
              </div>
            ))}
          </div>
        </>
      );
    })()
  )}
</div>
        </div>

        {/* Upcoming Shifts */}
        <div className="bg-gray-900/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Calendar className="h-7 w-7 text-purple-400" />
            Ca Làm Việc Sắp Tới
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="pb-4 px-2 text-purple-400">Ngày</th>
                  <th className="pb-4 px-2 text-cyan-400">Ca</th>
                  <th className="pb-4 px-2 text-green-400">Thời gian</th>
                  <th className="pb-4 px-2 text-pink-400">Rạp</th>
                  <th className="pb-4 px-2 text-orange-400">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {upcoming_shifts.length > 0 ? upcoming_shifts.map((shift, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 transition-all">
                    <td className="py-4 px-2">{new Date(shift.date).toLocaleDateString('vi-VN')}</td>
                    <td className="py-4 px-2 font-semibold">{shift.type}</td>
                    <td className="py-4 px-2">{shift.start_time || 'Chưa xác định'}</td>
                    <td className="py-4 px-2">{shift.cinema}</td>
                    <td className="py-4 px-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        shift.status === 'confirmed' ? 'bg-blue-500/30 text-blue-300' :
                        shift.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {shift.status === 'confirmed' ? 'Đang trong ca' : 
                         shift.status === 'pending' ? 'Chưa chấm công' : shift.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">Chưa có ca làm việc sắp tới</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;