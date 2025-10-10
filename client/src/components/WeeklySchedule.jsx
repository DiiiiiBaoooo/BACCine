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

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="min-w-max">
        {showAllSchedules && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Tất cả lịch làm việc</h3>
            {schedule.map((entry) => (
              <div key={`${entry.date}-${entry.shift}`} className="mt-2">
                <div className="text-xs font-medium text-gray-700">{entry.date} - {entry.shift}</div>
                {entry.employees.map((emp) => (
                  <div key={emp.id} className="text-xs text-gray-500 ml-4">
                    {emp.name} ({emp.position}) - {emp.status}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-500">Ca làm</div>
          </div>
          {DAYS.map((day, index) => (
            <div key={day} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-sm font-semibold text-gray-900">{day}</div>
              <div className="text-xs text-gray-500 mt-1">{getDateForDay(index)}</div>
            </div>
          ))}
          {SHIFTS.map((shift) => (
            <React.Fragment key={`label-${shift.key}`}>
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 flex items-center">
                <div className="text-sm font-medium text-gray-900">{shift.label}</div>
              </div>
              {DAYS.map((_, dayIndex) => (
                <ShiftCell
                  key={`${dayIndex}-${shift.key}`}
                  date={getDateString(dayIndex)}
                  shift={shift.key}
                  employees={getEmployeesForShift(getDateString(dayIndex), shift.key)}
                  onDrop={(date, shift, employee, options) => onDrop(date, shift, employee, { ...options, dayIndex })}
                  onRemoveEmployee={onRemoveEmployee}
                  cinemaClusterId={cinemaClusterId.toString()}
                />
              ))}
            </React.Fragment>
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
          status: PropTypes.oneOf(['pending', 'confirmed', 'cancelled']).isRequired,
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