import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import Weekly from './Weekly';

const ScheduleEmployee = ({ cinemaClusterId }) => {
  const { isLoading: isAuthLoading, authUser } = useAuthUser();
  const employeeId = authUser?.employee_id;

  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  const API_BASE_URL = '/api';

  const getDateString = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return new Date().toISOString().split('T')[0];
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getWeekDateRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(start.getDate() + 6);
    return { start: getDateString(start), end: getDateString(end) };
  };

  const isDateInWeekRange = (dateStr) => {
    const { start } = getWeekDateRange();
    const date = parseDateString(dateStr);
    const startDate = parseDateString(start);
    
    if (!date || !startDate) return false;
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return date >= startDate && date <= endDate;
  };

  const fetchSchedule = async () => {
    if (!cinemaClusterId || !employeeId) {
      setError('cinemaClusterId và employeeId là bắt buộc');
      return;
    }
    try {
      setLoading(true);
      const { start, end } = getWeekDateRange();
      
      const url = showAllSchedules
        ? `${API_BASE_URL}/schedule/${cinemaClusterId}/${employeeId}`
        : `${API_BASE_URL}/schedule/${cinemaClusterId}/${employeeId}?start=${start}&end=${end}`;
      const res = await axios.get(url);
      
      const mappedSchedule = res.data.reduce((acc, entry) => {
        const employee = employees.find((emp) => emp.id === entry.employee_id.toString());
        if (!employee) {
          return acc;
        }
        
        let shiftDate = entry.shift_date;
        if (shiftDate.includes('T')) {
          shiftDate = shiftDate.split('T')[0];
        }
        
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(shiftDate)) {
          return acc;
        }
        
        if (!showAllSchedules && !isDateInWeekRange(shiftDate)) {
          return acc;
        }
        
        const employeeWithDetails = {
          ...employee,
          startTime: entry.start_time || null,
          endTime: entry.end_time || null,
          status: entry.status,
          scheduleId: entry.id.toString(),
        };
        
        const existing = acc.find((e) => e.date === shiftDate && e.shift === entry.shift_type);
        if (existing) {
          existing.employees.push(employeeWithDetails);
          return acc;
        }
        
        return [...acc, { 
          date: shiftDate, 
          shift: entry.shift_type, 
          cinemaClusterId: cinemaClusterId.toString(), 
          employees: [employeeWithDetails] 
        }];
      }, []);
      
      setSchedule(mappedSchedule);
      setError(null);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.response?.data?.error || 'Không thể tải lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!cinemaClusterId) {
        setError('cinemaClusterId is required');
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/employee/cinema-cluster/${cinemaClusterId}`);
        const mappedEmployees = res.data.map((emp) => ({
          id: emp.employee_id.toString(),
          name: emp.employee_name,
          position: emp.position,
        }));
        setEmployees(mappedEmployees);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Không thể tải danh sách nhân viên');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [cinemaClusterId]);

  useEffect(() => {
    if (employees.length > 0 && cinemaClusterId && employeeId) {
      fetchSchedule();
    }
  }, [employees, currentWeekStart, cinemaClusterId, employeeId, showAllSchedules]);

  const handleDrop = (date, shift, employee, { refresh }) => {
    if (refresh) {
      fetchSchedule();
      return;
    }
  };

  const handleRemoveEmployee = () => {
    // Nhân viên không được phép xóa lịch
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const formatWeekRange = () => {
    const startDate = new Date(currentWeekStart);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    const formatDate = (date) => {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (!cinemaClusterId) {
    return (
      <div className="p-4 text-red-600 text-sm">
        Lỗi: Vui lòng cung cấp cinemaClusterId để xem lịch làm việc.
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        {/* Header compact */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">
              LỊCH LÀM VIỆC <span className="text-red-600">CỦA TÔI</span>
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllSchedules(!showAllSchedules)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  showAllSchedules 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAllSchedules ? 'Tuần hiện tại' : 'Tất cả lịch'}
              </button>

              <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                <button 
                  onClick={goToPreviousWeek} 
                  className="p-1.5 hover:bg-white rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <span className="font-semibold text-red-600 text-xs w-32 text-center">
                  {formatWeekRange()}
                </span>
                <button 
                  onClick={goToNextWeek} 
                  className="p-1.5 hover:bg-white rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            {error}
          </div>
        )}

        {loading && (
          <div className="mx-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
            Đang tải lịch làm việc...
          </div>
        )}

        <Weekly
          schedule={schedule}
          onDrop={handleDrop}
          onRemoveEmployee={handleRemoveEmployee}
          weekStart={currentWeekStart}
          cinemaClusterId={cinemaClusterId}
          showAllSchedules={showAllSchedules}
        />
      </div>
    </div>
  );
};

ScheduleEmployee.propTypes = {
  cinemaClusterId: PropTypes.string.isRequired,
};

export default ScheduleEmployee;