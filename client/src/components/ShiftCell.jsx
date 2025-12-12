import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Clock } from 'lucide-react';
import axios from 'axios';

const ShiftCell = ({ date, shift, employees, onDrop, onRemoveEmployee, cinemaClusterId }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(null);
  const [status, setStatus] = useState('pending');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [draggedEmployee, setDraggedEmployee] = useState(null);

  const API_BASE_URL = '/api';

  // === MÀU THEO TRẠNG THÁI ===
  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-600 text-green-800';
      case 'completed':
        return 'bg-blue-100 border-blue-600 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 border-red-600 text-red-800';
      case 'absent':
        return 'bg-orange-100 border-orange-600 text-orange-800';
      case 'pending':
      default:
        return 'bg-yellow-100 border-yellow-600 text-yellow-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'absent': return 'Vắng';
      case 'pending':
      default: return 'Chờ xác nhận';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const employeeData = e.dataTransfer.getData('employee');
    if (!employeeData) return;

    try {
      const employee = JSON.parse(employeeData);
      setDraggedEmployee(employee);
      setShowForm(true);
    } catch (err) {
      alert('Dữ liệu nhân viên không hợp lệ');
    }
  };

  const handleSubmit = () => {
    if (draggedEmployee) {
      onDrop(date, shift, draggedEmployee, { status: 'pending' });
      setShowForm(false);
      setDraggedEmployee(null);
    }
  };

  const handleAttendanceSubmit = async (e, scheduleId) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      alert('Vui lòng nhập giờ vào và giờ ra');
      return;
    }

    setLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/schedule/attendance/${scheduleId}`, {
        start_time: startTime,
        end_time: endTime,
      });
      alert('Chấm công thành công!');
      setShowAttendanceForm(null);
      setStartTime('');
      setEndTime('');
      onDrop(date, shift, null, { refresh: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi chấm công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-l-4 border-transparent min-h-32 p-3 transition-all rounded-r-lg ${
        isDragOver ? 'bg-red-50 border-l-red-500' : 'hover:bg-gray-50'
      }`}
    >
      <div className="space-y-2">
        {employees.length === 0 ? (
          <div className="text-center text-gray-400 text-xs pt-6">
            Kéo nhân viên vào đây
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className={`relative group rounded-lg p-3 border-2 ${getStatusStyle(emp.status)} shadow-sm transition-all`}
            >
              {/* Tên & vị trí */}
              <div className="font-bold text-sm leading-tight">{emp.name}</div>
              <div className="text-xs opacity-90">{emp.position}</div>

              {/* Trạng thái */}
              <div className="text-xs font-semibold mt-1">
                {getStatusText(emp.status)}
              </div>

              {/* Giờ chấm công */}
              {emp.startTime && emp.endTime ? (
                <div className="text-xs mt-1 font-medium text-green-700">
                  {emp.startTime} - {emp.endTime}
                </div>
              ) : (
                <div className="text-xs text-gray-600 italic">Chưa chấm công</div>
              )}

            
            </div>
          ))
        )}
      </div>

      {/* Form xác nhận kéo thả */}
      {showForm && draggedEmployee && (
        <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-sm">
          <p className="font-semibold">
            Xếp <span className="text-red-600">{draggedEmployee.name}</span> vào ca này?
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              Xác nhận
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setDraggedEmployee(null);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Form chấm công */}
      {showAttendanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Chấm công</h3>
            <form onSubmit={(e) => handleAttendanceSubmit(e, showAttendanceForm)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giờ vào</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giờ ra</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttendanceForm(null);
                    setStartTime('');
                    setEndTime('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu chấm công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ShiftCell.propTypes = {
  date: PropTypes.string.isRequired,
  shift: PropTypes.oneOf(['morning', 'afternoon', 'evening']).isRequired,
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      position: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['pending', 'confirmed', 'cancelled', 'absent', 'completed']).isRequired,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      scheduleId: PropTypes.string,
    })
  ).isRequired,
  onDrop: PropTypes.func.isRequired,
  onRemoveEmployee: PropTypes.func.isRequired,
  cinemaClusterId: PropTypes.string.isRequired,
};

export default ShiftCell;