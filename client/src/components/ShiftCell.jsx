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
            <label className="text-xs font-medium">Trạng thái:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="ml-2 text-xs border rounded px-1 py-0.5"
            >
              <option value="pending">Chưa chấm công</option>
              <option value="confirmed">Đã chấm công</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="text-xs" disabled={loading}>
              Xác nhận
            </Button>
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => {
                setShowForm(false);
                setDraggedEmployee(null);
              }}
              disabled={loading}
            >
              Hủy
            </Button>
          </div>
        </form>
      )}
      {showAttendanceForm && (
        <form
          onSubmit={(e) => handleAttendanceSubmit(e, showAttendanceForm)}
          className="mb-2 p-2 bg-gray-50 rounded"
        >
          <div className="mb-2">
            <label className="text-xs font-medium">Giờ bắt đầu:</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="ml-2 text-xs border rounded px-1 py-0.5"
              required
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium">Giờ kết thúc:</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="ml-2 text-xs border rounded px-1 py-0.5"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="text-xs" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => setShowAttendanceForm(null)}
              disabled={loading}
            >
              Hủy
            </Button>
          </div>
        </form>
      )}
      <div className="space-y-2">
        {employees.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">Kéo nhân viên vào đây</div>
        ) : (
          employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-blue-100 border border-blue-200 rounded px-2 py-1.5 text-xs group relative"
            >
              <div className="font-medium text-gray-900 pr-10">{employee.name}</div>
              <div className="text-[10px] text-gray-500">{employee.position}</div>
              <div className="text-[10px] text-gray-500">
                {employee.startTime && employee.endTime
                  ? `${employee.startTime} - ${employee.endTime}`
                  : 'Chưa chấm công'}{' '}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveEmployee(date, shift, employee.id)}
                className="absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAttendanceForm(employee.scheduleId)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={!employee.scheduleId}
              >
                <Clock className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
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