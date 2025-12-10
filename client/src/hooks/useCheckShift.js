import { useState, useEffect } from 'react';
import axios from 'axios';

const useCheckShift = (employeeId, cinemaClusterId) => {
  const [shiftStatus, setShiftStatus] = useState({
    loading: true,
    hasShift: false,
    isClosed: false,
    message: '',
    schedule: null,
    currentShift: null,
    closedPeriod: null,
    reopenTime: null,
  });

  useEffect(() => {
    const checkShift = async () => {
      if (!employeeId || !cinemaClusterId) {
        setShiftStatus({
          loading: false,
          hasShift: false,
          isClosed: false,
          message: 'Thiếu thông tin nhân viên',
          schedule: null,
          currentShift: null,
          closedPeriod: null,
          reopenTime: null,
        });
        return;
      }

      try {
        const response = await axios.get(
          `/api/schedule/check-shift/${employeeId}/${cinemaClusterId}`
        );

        setShiftStatus({
          loading: false,
          hasShift: response.data.hasShift,
          isClosed: response.data.isClosed || false,
          message: response.data.message,
          schedule: response.data.schedule || null,
          currentShift: response.data.currentShift,
          currentTime: response.data.currentTime,
          closedPeriod: response.data.closedPeriod || null,
          reopenTime: response.data.reopenTime || null,
        });
      } catch (error) {
        console.error('Error checking shift:', error);
        setShiftStatus({
          loading: false,
          hasShift: false,
          isClosed: false,
          message: 'Không thể kiểm tra ca làm việc',
          schedule: null,
          currentShift: null,
          closedPeriod: null,
          reopenTime: null,
        });
      }
    };

    checkShift();

    // Kiểm tra lại mỗi 5 phút
    const interval = setInterval(checkShift, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [employeeId, cinemaClusterId]);

  return shiftStatus;
};

export default useCheckShift;