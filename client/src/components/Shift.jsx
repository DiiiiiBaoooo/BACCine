import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Clock, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Shift = ({ date, shift, employees, onDrop, onRemoveEmployee, cinemaClusterId }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const navigate = useNavigate();

  // Define shift time mappings
  const shiftTimes = {
    morning: { start: '08:00', end: '13:00' },
    afternoon: { start: '13:00', end: '18:00' },
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
    confirmed: 'Đã chấm công',
    completed: 'Hoàn tất',
    cancelled: 'Đã hủy',
  };

  // Map status to Tailwind CSS classes
  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 border-green-200';
      case 'completed':
        return 'bg-gray-100 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-blue-100 border-blue-200';
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
    const employeeData = e.dataTransfer.getData('employee');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error(`Invalid date format in handleDrop: ${date}`);
      alert('Ngày không hợp lệ. Vui lòng thử lại.');
      return;
    }
    if (employeeData) {
      try {
        const employee = JSON.parse(employeeData);
        if (!employee.id || !employee.name || !employee.position) {
          alert('Dữ liệu nhân viên không hợp lệ');
          return;
        }
        setDraggedEmployee(employee);
        setShowForm(true);
      } catch (error) {
        console.error('Error parsing employee data:', error);
        alert('Dữ liệu nhân viên không hợp lệ');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (draggedEmployee?.id) {
      console.log(`Submitting employee ${draggedEmployee.id} for date ${date}, shift ${shift}`);
      const dateObj = new Date(date);
      const weekStart = new Date(date);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay() + (dateObj.getDay() === 0 ? -6 : 1));
      const dayIndex = Math.round((dateObj.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
      onDrop(date, shift, draggedEmployee, { status, cinemaClusterId: cinemaClusterId.toString(), dayIndex });
      setShowForm(false);
      setStatus('pending');
      setDraggedEmployee(null);
    } else {
      alert('Không có dữ liệu nhân viên để xếp lịch');
    }
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
      className={`bg-white border-2 border-dashed rounded-lg p-3 min-h-[120px] transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-2 p-2 bg-gray-50 rounded">
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-900">Trạng thái:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="ml-2 text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Chưa chấm công</option>
              <option value="confirmed">Đã chấm công</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className={`text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              Xác nhận
            </button>
            <button
              type="button"
              className={`text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => {
                setShowForm(false);
                setDraggedEmployee(null);
              }}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
      <div className="space-y-2">
        {employees.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">Không có ca làm việc</div>
        ) : (
          employees.map((employee) => (
            <div
              key={employee.id}
              className={`border rounded px-2 py-1.5 text-xs group relative ${getStatusStyles(employee.status)}`}
            >
              <div className="font-medium text-gray-900 pr-16">{employee.name}</div>
              <div className="text-[10px] text-gray-500">{employee.position}</div>
              <div className="text-[10px] text-gray-500">
                {getShiftDisplayTime(shift, employee)} ({statusDisplay[employee.status] || 'Không xác định'})
              </div>
              <button
                onClick={() => onRemoveEmployee(date, shift, employee.id)}
                className="absolute right-14 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 rounded-full"
              >
                <X className="h-3 w-3 text-gray-600" />
              </button>
              {employee.status === 'pending' && (
                <button
                  onClick={() => handleClockClick(employee.id, employee.scheduleId)}
                  className={`absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 rounded-full ${
                    !employee.scheduleId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!employee.scheduleId}
                >
                  <Clock className="h-3 w-3 text-gray-600" />
                </button>
              )}
              {employee.status === 'confirmed' && (
                <button
                  onClick={() => handleCheckoutClick(employee.id, employee.scheduleId)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 rounded-full ${
                    !employee.scheduleId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!employee.scheduleId}
                >
                  <LogOut className="h-3 w-3 text-gray-600" />
                </button>
              )}
              {employee.status === 'completed' && (
                <>
                  <button
                    className="absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center opacity-0 cursor-not-allowed"
                    disabled
                  >
                    <Clock className="h-3 w-3 text-gray-400" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center opacity-0 cursor-not-allowed"
                    disabled
                  >
                    <LogOut className="h-3 w-3 text-gray-400" />
                  </button>
                </>
              )}
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