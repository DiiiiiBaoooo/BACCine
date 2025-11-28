import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Clock } from 'lucide-react';
import axios from 'axios';
import Button from './ui/Button';

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

 // ShiftCell.jsx – gọn đẹp nhất
return (
  <div
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={`border-l border-gray-800 min-h-48 p-4 transition-all ${
      isDragOver 
        ? 'bg-red-900/30 border-l-4 border-l-red-500' 
        : 'hover:bg-gray-900/30'
    }`}
  >
    <div className="space-y-2">
      {employees.length === 0 ? (
        <div className="text-center text-gray-600 text-xs pt-12">
          Kéo nhân viên vào
        </div>
      ) : (
        employees.map((emp) => (
          <div
            key={emp.id}
            className="group relative bg-gradient-to-r from-red-900/40 to-black/60 
                     border border-red-800/50 rounded-lg p-3 pr-10 
                     hover:border-red-500 hover:shadow-lg hover:shadow-red-900/30 
                     transition-all text-sm"
          >
            <div className="font-semibold text-white truncate">{emp.name}</div>
            <div className="text-xs text-gray-400">{emp.position}</div>
            <div className="text-xs text-red-400 font-medium">
              {emp.startTime ? `${emp.startTime} - ${emp.endTime || '?'}` : 'Chưa chấm công'}
            </div>

            {/* Nút xóa + chấm công */}
            <button
              onClick={() => onRemoveEmployee(date, shift, emp.id)}
              className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 
                       bg-red-600 hover:bg-red-700 p-2 rounded transition"
            >
              <X className="w-3 h-3" />
            </button>
            {emp.scheduleId && (
              <button
                onClick={() => setShowAttendanceForm(emp.scheduleId)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                         bg-gray-700 hover:bg-gray-600 p-2 rounded transition"
              >
                <Clock className="w-3 h-3" />
              </button>
            )}
          </div>
        ))
      )}
    </div>

    {/* Form khi kéo thả */}
    {showForm && draggedEmployee && (
      <div className="mt-2 p-3 bg-black/70 border border-red-700 rounded-lg text-xs">
        <p className="mb-2">Xếp <span className="text-red-400 font-bold">{draggedEmployee.name}</span>?</p>
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded font-bold">
            OK
          </button>
          <button onClick={() => { setShowForm(false); setDraggedEmployee(null); }} className="bg-gray-700 px-4 py-1.5 rounded">
            Hủy
          </button>
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
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'confirmed', 'cancelled']).isRequired,
      scheduleId: PropTypes.string,
    })
  ).isRequired,
  onDrop: PropTypes.func.isRequired,
  onRemoveEmployee: PropTypes.func.isRequired,
  cinemaClusterId: PropTypes.string.isRequired,
};

export default ShiftCell;