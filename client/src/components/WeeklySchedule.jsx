import React from 'react';
import PropTypes from 'prop-types';
import ShiftCell from './ShiftCell';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const SHIFTS = [
  { key: 'morning', label: 'Sáng' },
  { key: 'afternoon', label: 'Chiều' },
  { key: 'evening', label: 'Tối' },
];

const WeeklySchedule = ({ schedule, onDrop, onRemoveEmployee, weekStart, cinemaClusterId, showAllSchedules }) => {
  // Parse date string to get day without timezone issues
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDateForDay = (dayIndex) => {
    const date = parseDateString(getDateString(dayIndex));
    const day = date.getDate();
    console.log(`getDateForDay(${dayIndex}): ${getDateString(dayIndex)} (display: ${day})`);
    return day;
  };

  const getDateString = (dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    // Format as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log(`getDateString(${dayIndex}): ${dateStr}`);
    return dateStr;
  };

  const getEmployeesForShift = (date, shift) => {
    const entry = schedule.find((e) => e.date === date && e.shift === shift);
    console.log(`getEmployeesForShift(${date}, ${shift}):`, entry?.employees || []);
    return entry?.employees || [];
  };

  if (!cinemaClusterId) {
    console.error('cinemaClusterId is undefined in WeeklySchedule');
    return null;
  }

 // WeeklySchedule.jsx (chỉ thay phần return)
return (
  <div className="flex-1 overflow-auto bg-gradient-to-b from-black to-gray-950">
    <div className="p-6">
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-red-900/30 overflow-hidden shadow-2xl">
        {/* Header ngày */}
        <div className="grid grid-cols-8 gap-0 border-b border-red-900/30">
          <div className="py-5 px-6 font-bold text-gray-400 text-sm">CA LÀM</div>
          {DAYS.map((day, i) => {
            const dateStr = getDateString(i);
            const dayNum = new Date(dateStr).getDate();
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            return (
              <div
                key={day}
                className={`py-5 text-center border-l border-red-900/30 ${
                  isToday ? 'bg-red-600/20' : ''
                }`}
              >
                <div className="font-bold text-lg text-white">{dayNum}</div>
                <div className="text-xs text-gray-400 mt-1">{day}</div>
                {isToday && <div className="text-[10px] text-red-400 font-bold mt-1">HÔM NAY</div>}
              </div>
            );
          })}
        </div>

        {/* Các ca */}
        {SHIFTS.map((shift) => (
          <div key={shift.key} className="grid grid-cols-8 gap-0 border-b border-gray-800 last:border-0">
            {/* Tên ca */}
            <div className="py-6 px-6 bg-gradient-to-r from-red-900/20 to-transparent flex flex-col">
              <div className="font-bold text-red-400 text-lg">{shift.label}</div>
              <div className="text-xs text-gray-500">{shift.time}</div>
            </div>

            {/* 7 ngày */}
            {DAYS.map((_, dayIndex) => {
              const date = getDateString(dayIndex);
              return (
                <ShiftCell
                  key={`${dayIndex}-${shift.key}`}
                  date={date}
                  shift={shift.key}
                  employees={getEmployeesForShift(date, shift.key)}
                  onDrop={(date, shift, emp, opt) => onDrop(date, shift, emp, { ...opt, dayIndex })}
                  onRemoveEmployee={onRemoveEmployee}
                  cinemaClusterId={cinemaClusterId}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

WeeklySchedule.propTypes = {
  schedule: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      shift: PropTypes.oneOf(['morning', 'afternoon', 'evening']).isRequired,
      cinemaClusterId: PropTypes.string,
      employees: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          position: PropTypes.string.isRequired,
          startTime: PropTypes.string,
          endTime: PropTypes.string,
          status: PropTypes.oneOf(['pending', 'confirmed', 'cancelled','completed']).isRequired,
          scheduleId: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  onDrop: PropTypes.func.isRequired,
  onRemoveEmployee: PropTypes.func.isRequired,
  weekStart: PropTypes.instanceOf(Date).isRequired,
  cinemaClusterId: PropTypes.string.isRequired,
  showAllSchedules: PropTypes.bool.isRequired,
};

export default WeeklySchedule;