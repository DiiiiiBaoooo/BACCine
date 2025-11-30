import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Shift = ({ date, shift, employees, onDrop, onRemoveEmployee, cinemaClusterId }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();

  // Define shift time mappings
  const shiftTimes = {
    morning: { start: '08:00', end: '12:00' },
    afternoon: { start: '12:00', end: '18:00' },
    evening: { start: '18:00', end: '23:00' },
  };

  // Get display times based on shift type
  const getShiftDisplayTime = (shiftType, employee) => {
    const { start, end } = shiftTimes[shiftType] || { start: 'N/A', end: 'N/A' };
    return employee.startTime && employee.endTime
      ? `${employee.startTime} - ${employee.endTime}`
      : `${start} - ${end}`;
  };

  // Map status to Vietnamese display text
  const statusDisplay = {
    pending: 'Chưa chấm công',
    confirmed: 'Đang làm việc',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  };

  // Map status to color styles (đen-đỏ-trắng)
  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 border-gray-300 text-gray-900'; // Xám nhạt - chưa chấm công
      case 'confirmed':
        return 'bg-red-50 border-red-400 text-red-900'; // Đỏ nhạt - đang làm việc
      case 'completed':
        return 'bg-white border-gray-400 text-gray-600'; // Trắng - đã hoàn thành
      case 'cancelled':
        return 'bg-gray-200 border-gray-400 text-gray-500 line-through'; // Xám đậm - đã hủy
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  // Status badge color
  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-700'; 
      case 'confirmed':
        return 'bg-red-600 text-white'; 
      case 'completed':
        return 'bg-gray-600 text-white'; 
      case 'cancelled':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClockClick = (employeeId, scheduleId) => {
    if (!scheduleId) {
      alert('Không có lịch làm việc để chấm công');
      return;
    }
    navigate(`/employee/face-checkin/${employeeId}/${scheduleId}/${cinemaClusterId}`);
  };

  const handleCheckoutClick = (employeeId, scheduleId) => {
    if (!scheduleId) {
      alert('Không có lịch làm việc để chấm công ra');
      return;
    }
    navigate(`/employee/face-checkout/${employeeId}/${scheduleId}/${cinemaClusterId}`);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-l border-gray-700 min-h-32 p-2 transition-all ${
        isDragOver ? 'bg-red-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="space-y-1.5">
        {employees.length === 0 ? (
          <div className="text-center text-gray-400 text-[10px] pt-8">
            Không có ca làm việc
          </div>
        ) : (
          employees.map((employee) => (
            <div
              key={employee.id}
              className={`group relative border rounded p-2 transition-all text-[11px] ${getStatusStyles(employee.status)}`}
            >
              <div className="font-semibold truncate leading-tight pr-14">{employee.name}</div>
              <div className="text-[10px] opacity-75 leading-tight">{employee.position}</div>
              <div className="text-[10px] opacity-75 leading-tight mt-0.5">
                {getShiftDisplayTime(shift, employee)}
              </div>
              
              {/* Status badge */}
              <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${getStatusBadgeStyles(employee.status)}`}>
                {statusDisplay[employee.status]}
              </div>

              {/* Action buttons */}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {employee.status === 'pending' && employee.scheduleId && (
                  <button
                    onClick={() => handleClockClick(employee.id, employee.scheduleId)}
                    className="bg-red-600 hover:bg-red-700 p-1.5 rounded transition"
                    title="Chấm công vào"
                  >
                    <Clock className="w-3 h-3 text-white" />
                  </button>
                )}
                
                {employee.status === 'confirmed' && employee.scheduleId && (
                  <button
                    onClick={() => handleCheckoutClick(employee.id, employee.scheduleId)}
                    className="bg-gray-600 hover:bg-gray-700 p-1.5 rounded transition"
                    title="Chấm công ra"
                  >
                    <LogOut className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

Shift.propTypes = {
  date: PropTypes.string.isRequired,
  shift: PropTypes.oneOf(['morning', 'afternoon', 'evening']).isRequired,
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      position: PropTypes.string.isRequired,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'confirmed', 'completed', 'cancelled']).isRequired,
      scheduleId: PropTypes.string,
    })
  ).isRequired,
  onDrop: PropTypes.func.isRequired,
  onRemoveEmployee: PropTypes.func.isRequired,
  cinemaClusterId: PropTypes.string.isRequired,
};

export default Shift;