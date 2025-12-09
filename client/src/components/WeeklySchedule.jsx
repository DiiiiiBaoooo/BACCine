import React from 'react';
import PropTypes from 'prop-types';
import ShiftCell from './ShiftCell';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SHIFTS = [
  { key: 'morning', label: 'Sáng', time: '6h-12h' },
  { key: 'afternoon', label: 'Chiều', time: '12h-18h' },
  { key: 'evening', label: 'Tối', time: '18h-24h' },
];

const WeeklySchedule = ({ schedule, onDrop, onRemoveEmployee, weekStart, cinemaClusterId, showAllSchedules }) => {
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDateForDay = (dayIndex) => {
    const date = parseDateString(getDateString(dayIndex));
    return date.getDate();
  };

  const getDateString = (dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEmployeesForShift = (date, shift) => {
    const entry = schedule.find((e) => e.date === date && e.shift === shift);
    return entry?.employees || [];
  };

  if (!cinemaClusterId) {
    console.error('cinemaClusterId is undefined in WeeklySchedule');
    return null;
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-3">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {/* Header ngày */}
          <div className="grid grid-cols-8 gap-0 border-b border-gray-200 bg-gray-50">
            <div className="py-2 px-3 font-bold text-gray-700 text-[11px]">CA LÀM</div>
            {DAYS.map((day, i) => {
              const dateStr = getDateString(i);
              const dayNum = new Date(dateStr).getDate();
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={day}
                  className={`py-2 text-center border-l border-gray-200 ${
                    isToday ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">{dayNum}</div>
                  <div className="text-[10px] text-gray-500">{day}</div>
                  {isToday && <div className="text-[9px] text-red-600 font-bold">HÔM NAY</div>}
                </div>
              );
            })}
          </div>

          {/* Các ca */}
          {SHIFTS.map((shift) => (
            <div key={shift.key} className="grid grid-cols-8 gap-0 border-b border-gray-200 last:border-0">
              {/* Tên ca */}
              <div className="py-3 px-3 bg-gray-50 border-r border-gray-200 flex flex-col justify-center">
                <div className="font-bold text-gray-900 text-xs">{shift.label}</div>
                <div className="text-[10px] text-gray-500">{shift.time}</div>
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
          status: PropTypes.oneOf(['pending', 'confirmed', 'cancelled','completed','absent']).isRequired,
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