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

  const handleAttendanceSubmit = async (e, scheduleId) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      alert('Vui lòng nhập giờ bắt đầu và giờ kết thúc');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.patch(`${API_BASE_URL}/schedule/attendance/${scheduleId}`, {
        start_time: startTime,
        end_time: endTime,
      });
      if (response.status === 200) {
        alert('Cập nhật chấm công thành công!');
        setShowAttendanceForm(null);
        setStartTime('');
        setEndTime('');
        onDrop(date, shift, null, { refresh: true });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert(error.response?.data?.error || 'Có lỗi khi cập nhật chấm công!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-l border-gray-700 min-h-32 p-2 transition-all ${
        isDragOver 
          ? 'bg-red-50 border-l-2 border-l-red-600' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="space-y-1.5">
        {employees.length === 0 ? (
          <div className="text-center text-gray-400 text-[10px] pt-8">
            Kéo nhân viên vào
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="group relative bg-white border border-gray-200 rounded p-2 pr-8
                       hover:border-red-500 hover:shadow-sm transition-all text-[11px]"
            >
              <div className="font-semibold text-gray-900 truncate leading-tight">{emp.name}</div>
              <div className="text-[10px] text-gray-500 leading-tight">{emp.position}</div>
              <div className="text-[10px] text-red-600 font-medium leading-tight mt-0.5">
                {emp.startTime ? `${emp.startTime} - ${emp.endTime || '?'}` : 'Chưa chấm công'}
              </div>

              {/* Nút xóa + chấm công */}
              <button
                onClick={() => onRemoveEmployee(date, shift, emp.id)}
                className="absolute top-1.5 right-7 opacity-0 group-hover:opacity-100 
                         bg-red-600 hover:bg-red-700 p-1 rounded transition"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
              {emp.scheduleId && (
                <button
                  onClick={() => setShowAttendanceForm(emp.scheduleId)}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 
                           bg-gray-600 hover:bg-gray-700 p-1 rounded transition"
                >
                  <Clock className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form khi kéo thả */}
      {showForm && draggedEmployee && (
        <div className="mt-2 p-2 bg-gray-50 border border-red-300 rounded text-[10px]">
          <p className="mb-1.5">Xếp <span className="text-red-600 font-bold">{draggedEmployee.name}</span>?</p>
          <div className="flex gap-1.5">
            <button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-bold">
              OK
            </button>
            <button onClick={() => { setShowForm(false); setDraggedEmployee(null); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Form chấm công */}
      {showAttendanceForm && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-300 rounded text-[10px]">
          <p className="font-semibold mb-1.5 text-gray-900">Chấm công</p>
          <form onSubmit={(e) => handleAttendanceSubmit(e, showAttendanceForm)} className="space-y-1.5">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-[10px]"
              required
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-[10px]"
              required
            />
            <div className="flex gap-1.5">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-bold disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button 
                type="button"
                onClick={() => setShowAttendanceForm(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
              >
                Hủy
              </button>
            </div>
          </form>
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
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'confirmed', 'cancelled','absent','completed']).isRequired,
      scheduleId: PropTypes.string,
    })
  ).isRequired,
  onDrop: PropTypes.func.isRequired,
  onRemoveEmployee: PropTypes.func.isRequired,
  cinemaClusterId: PropTypes.string.isRequired,
};

export default ShiftCell;