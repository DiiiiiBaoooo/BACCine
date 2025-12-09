// client/src/components/ScheduleEmployee.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';

const ScheduleEmployee = ({ cinemaClusterId }) => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const employeeId = authUser?.employee_id;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  // Tính tuần (Thứ 2 → Chủ nhật)
  const getWeekRange = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const fetchSchedules = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const { start, end } = getWeekRange(selectedWeek);
      const startStr = start.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const endStr = end.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

      const { data } = await axios.get(
        `/api/schedule/${cinemaClusterId}/${employeeId}?start=${startStr}&end=${endStr}`
      );
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedWeek, employeeId, cinemaClusterId]);

  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chờ', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50', icon: Clock },
      confirmed: { label: 'Đã vào', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/50', icon: CheckCircle },
      completed: { label: 'Hoàn thành', color: 'bg-green-500/20 text-green-400 border border-green-500/50', icon: CheckCircle },
      cancelled: { label: 'Hủy', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/50', icon: XCircle },
      absent: { label: 'Vắng', color: 'bg-red-500 text-white', icon: AlertCircle },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const getShiftLabel = (type) => {
    const shifts = { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối' };
    return shifts[type] || type;
  };

  const goToPreviousWeek = () => setSelectedWeek(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
  const goToNextWeek = () => setSelectedWeek(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
  const goToToday = () => setSelectedWeek(new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-400">Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }

  const { start, end } = getWeekRange(selectedWeek);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            LỊCH LÀM VIỆC
          </h1>
          <p className="text-red-500 text-lg font-medium">Nhân viên: {authUser?.name || 'Bạn'}</p>
        </div>

        {/* Week Navigation */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <button onClick={goToPreviousWeek} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-red-500" />
                <span className="text-2xl font-bold text-white">
                  {start.toLocaleDateString('vi-VN')} → {end.toLocaleDateString('vi-VN')}
                </span>
              </div>
              <button
                onClick={goToToday}
                className="text-sm px-5 py-2 bg-red-600 hover:bg-red-700 rounded-full font-bold transition-all shadow-lg"
              >
                Hôm nay
              </button>
            </div>

            <button onClick={goToNextWeek} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-6">
          {schedules.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <Calendar className="w-20 h-20 text-zinc-700 mx-auto mb-6" />
              <p className="text-2xl text-zinc-500 font-medium">Không có ca làm việc trong tuần này</p>
            </div>
          ) : (
            schedules.map((schedule) => {
              const today = isToday(schedule.shift_date);
              const isPast = new Date(schedule.shift_date) < new Date().setHours(0, 0, 0, 0);
              const canCheckin = today && schedule.status === 'pending';
              const canCheckout = today && schedule.status === 'confirmed';

              return (
                <div
                  key={schedule.id}
                  className={`
                    relative overflow-hidden rounded-2xl border transition-all duration-300
                    ${today 
                      ? 'bg-gradient-to-r from-red-900/40 to-black border-red-600 shadow-2xl shadow-red-900/30 scale-105' 
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }
                    ${isPast && schedule.status !== 'completed' ? 'opacity-60' : ''}
                  `}
                >
                  {/* Highlight bar bên trái nếu là hôm nay */}
                  {today && <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-600"></div>}

                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Thông tin ca */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-2xl font-black text-white">
                            {new Date(schedule.shift_date).toLocaleDateString('vi-VN', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            }).replace('thứ ', '').toUpperCase()}
                          </h3>
                          {today && (
                            <span className="px-4 py-2 bg-red-600 text-white font-bold rounded-full text-sm animate-pulse">
                              HÔM NAY
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-gray-300 text-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-red-500" />
                            <span className="font-medium">Ca {getShiftLabel(schedule.shift_type)}</span>
                          </div>
                          {schedule.start_time && (
                            <span className="text-white font-bold">{schedule.start_time} → {schedule.end_time || '...'} </span>
                          )}
                        </div>

                        <div className="mt-4">
                          {getStatusBadge(schedule.status)}
                        </div>
                      </div>

                      {/* Nút hành động */}
                      <div className="flex flex-col gap-3">
                        {canCheckin && (
                          <button
                            onClick={() => navigate(`/employee/face-checkin/${employeeId}/${schedule.id}/${cinemaClusterId}`)}
                            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-green-600/50 transition-all transform hover:scale-105"
                          >
                            CHECK-IN NGAY
                          </button>
                        )}

                        {canCheckout && (
                          <button
                            onClick={() => navigate(`/employee/face-checkout/${employeeId}/${schedule.id}/${cinemaClusterId}`)}
                            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-red-600/50 transition-all transform hover:scale-105"
                          >
                            CHECK-OUT
                          </button>
                        )}

                        {isPast && schedule.status === 'pending' && (
                          <div className="text-center">
                            <p className="text-red-400 font-bold text-lg">ĐÃ QUÁ GIỜ CHECK-IN</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleEmployee;