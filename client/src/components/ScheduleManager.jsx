import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmployeeList from './EmployeeList';
import WeeklySchedule from './WeeklySchedule';
import Button from './ui/Button';

const ScheduleManager = ({ cinemaClusterId }) => {
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Set to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    console.log('Initialized currentWeekStart:', monday.toISOString().split('T')[0]);
    return monday;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  const API_BASE_URL = '/api';

  const getDateString = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('Invalid date object:', date);
      return new Date().toISOString().split('T')[0];
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse date string without timezone issues
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    // Remove time part if exists
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getWeekDateRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(start.getDate() + 6); // 7 days: Monday to Sunday
    return { start: getDateString(start), end: getDateString(end) };
  };

  const isDateInWeekRange = (dateStr, expectedDayIndex = null) => {
    const { start } = getWeekDateRange();
    const date = parseDateString(dateStr);
    const startDate = parseDateString(start);
    
    if (!date || !startDate) return false;

    if (expectedDayIndex !== null) {
      const expectedDate = new Date(startDate);
      expectedDate.setDate(startDate.getDate() + expectedDayIndex);
      const expectedDateStr = getDateString(expectedDate);
      const inputDateStr = dateStr.split('T')[0];
      
      if (inputDateStr !== expectedDateStr) {
        console.warn(`Date ${inputDateStr} does not match expected date ${expectedDateStr} for dayIndex ${expectedDayIndex}`);
      }
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // 7 days
    return date >= startDate && date <= endDate;
  };

  const fetchSchedule = async () => {
    if (!cinemaClusterId) {
      setError('cinemaClusterId is required');
      return;
    }
    try {
      setLoading(true);
      const { start, end } = getWeekDateRange();
      console.log(`Fetching schedule for ${start} to ${end}`);
      
      const url = showAllSchedules
        ? `${API_BASE_URL}/schedule/${cinemaClusterId}`
        : `${API_BASE_URL}/schedule/${cinemaClusterId}?start=${start}&end=${end}`;
      const res = await axios.get(url);
      
      const mappedSchedule = res.data.reduce((acc, entry) => {
        const employee = employees.find((emp) => emp.id === entry.employee_id.toString());
        if (!employee) {
          console.warn(`Employee not found for employee_id: ${entry.employee_id}`);
          return acc;
        }
        
        // Get date string from shift_date (already in YYYY-MM-DD format from backend)
        let shiftDate = entry.shift_date;
        if (shiftDate.includes('T')) {
          shiftDate = shiftDate.split('T')[0];
        }
        
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(shiftDate)) {
          console.warn(`Invalid shift_date from backend: ${entry.shift_date}`);
          return acc;
        }
        
        if (!showAllSchedules && !isDateInWeekRange(shiftDate)) {
          console.warn(`shift_date out of week range: ${shiftDate}`);
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
      
      console.log('Mapped schedule:', JSON.stringify(mappedSchedule, null, 2));
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
    if (employees.length > 0 && cinemaClusterId) fetchSchedule();
  }, [employees, currentWeekStart, cinemaClusterId, showAllSchedules]);

  const handleDrop = (date, shift, employee, { status, cinemaClusterId, refresh, dayIndex }) => {
    if (refresh) {
      fetchSchedule();
      return;
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error(`Invalid date format in handleDrop: ${date}`);
      alert('Ngày không hợp lệ. Vui lòng thử lại.');
      return;
    }
    
    if (!isDateInWeekRange(date, dayIndex)) {
      console.error(`Date out of week range or incorrect for dayIndex ${dayIndex}: ${date}`);
      alert('Ngày không nằm trong tuần hiện tại hoặc không khớp với ngày được chọn.');
      return;
    }
    
    setSchedule((prev) => {
      const existingEntry = prev.find((e) => e.date === date && e.shift === shift);
      if (existingEntry) {
        const alreadyAssigned = existingEntry.employees.some((e) => e.id === employee.id);
        if (alreadyAssigned) {
          alert('Nhân viên đã được xếp lịch cho ca này!');
          return prev;
        }
        return prev.map((e) =>
          e.date === date && e.shift === shift
            ? {
                ...e,
                employees: [...e.employees, { ...employee, startTime: null, endTime: null, status, scheduleId: null }],
              }
            : e
        );
      } else {
        return [...prev, { 
          date, 
          shift, 
          cinemaClusterId: cinemaClusterId.toString(), 
          employees: [{ ...employee, startTime: null, endTime: null, status, scheduleId: null }] 
        }];
      }
    });
  };

  const handleRemoveEmployee = (date, shift, employeeId) => {
    setSchedule((prev) =>
      prev
        .map((e) =>
          e.date === date && e.shift === shift
            ? { ...e, employees: e.employees.filter((emp) => emp.id !== employeeId) }
            : e
        )
        .filter((e) => e.employees.length > 0)
    );
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      console.log('Previous week:', getDateString(newDate));
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      console.log('Next week:', getDateString(newDate));
      return newDate;
    });
  };

  const formatWeekRange = () => {
    const startDate = new Date(currentWeekStart);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6); // 7 days (Monday to Sunday)
    const formatDate = (date) => {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleSaveSchedule = async () => {
    if (!cinemaClusterId) {
      setError('cinemaClusterId is required to save schedule');
      return;
    }
    try {
      setLoading(true);
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const payload = schedule.flatMap((entry) =>
        entry.employees.map((employee) => {
          if (!dateRegex.test(entry.date)) {
            throw new Error(`Invalid shift_date format: ${entry.date}. Use YYYY-MM-DD`);
          }
          if (!isDateInWeekRange(entry.date)) {
            throw new Error(`shift_date out of week range: ${entry.date}`);
          }
          return {
            employee_id: employee.id,
            cinema_cluster_id: cinemaClusterId.toString(),
            shift_date: entry.date,
            shift_type: entry.shift,
            status: employee.status,
            start_time: employee.startTime || null,
            end_time: employee.endTime || null,
            employee_cinema_cluster_id: employee.employee_cinema_cluster_id || null,
          };
        })
      );

      if (payload.length === 0) {
        throw new Error('Không có lịch làm việc để lưu');
      }
      
      for (const entry of payload) {
        if (
          !entry.employee_id ||
          !entry.cinema_cluster_id ||
          !entry.shift_date ||
          !entry.shift_type ||
          !entry.status ||
          entry.cinema_cluster_id !== cinemaClusterId.toString()
        ) {
          throw new Error(`Invalid schedule data: ${JSON.stringify(entry)}`);
        }
        if (!dateRegex.test(entry.shift_date)) {
          throw new Error(`Invalid shift_date format: ${entry.shift_date}. Use YYYY-MM-DD`);
        }
      }

      console.log('Saving schedule payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${API_BASE_URL}/schedule/${cinemaClusterId}`, payload);
      if (response.status === 200) {
        alert('Lịch làm việc đã được lưu!');
        fetchSchedule();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError(error.response?.data?.error || error.message || 'Có lỗi xảy ra khi lưu lịch!');
    } finally {
      setLoading(false);
    }
  };

  if (!cinemaClusterId) {
    return (
      <div className="p-4 text-red-600 text-sm">
        Lỗi: Vui lòng cung cấp cinemaClusterId để quản lý lịch làm việc.
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <EmployeeList employees={employees} loading={loading} error={error} />
      <div className="flex-1 flex flex-col">
       <div className="bg-black/90 backdrop-blur-xl border-b border-red-900/50 px-6 py-5">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-black text-white">
      LỊCH LÀM VIỆC <span className="text-red-500">BAC CINEMA</span>
    </h1>

    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowAllSchedules(!showAllSchedules)}
        className="px-4 py-2 rounded-lg text-sm ${showAllSchedules ? 'bg-red-600' : 'bg-gray-800'} text-white`}"
      >
        {showAllSchedules ? 'Ẩn lịch cũ' : 'Tất cả lịch'}
      </button>

      <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-2">
        <button onClick={goToPreviousWeek} className="p-2 hover:bg-red-900/50 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-red-400 w-40 text-center">{formatWeekRange()}</span>
        <button onClick={goToNextWeek} className="p-2 hover:bg-red-900/50 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={handleSaveSchedule}
        disabled={loading}
        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 
                 px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-900/50 
                 disabled:opacity-50 transition-all"
      >
        {loading ? 'Đang lưu...' : 'LƯU LỊCH'}
      </button>
    </div>
  </div>
</div>
        {error && (
          <div className="p-4 text-red-600 text-sm">{error}</div>
        )}
        <WeeklySchedule
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

ScheduleManager.propTypes = {
  cinemaClusterId: PropTypes.string.isRequired,
};

export default ScheduleManager;