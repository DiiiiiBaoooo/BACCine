import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScheduleEmployee from '../../components/SheduleEmployee';
import useAuthUser from '../../hooks/useAuthUser';

const LichLamViec = ({ cinemaClusterId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasFaceDescriptor, setHasFaceDescriptor] = useState(null);
  const { isLoading: isAuthLoading, authUser } = useAuthUser();
  const employeeId= authUser.employee_id;
  // Giả sử employeeId lấy từ context hoặc localStorage


  useEffect(() => {
    const checkFaceRegistration = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/schedule/employee/face/check/${employeeId}`);
        setHasFaceDescriptor(response.data.hasFaceDescriptor);
        setLoading(false);
      } catch (error) {
        console.error('Error checking face descriptor:', error);
        setLoading(false);
        navigate(`/face-register/${employeeId}/${cinemaClusterId}`);
      }
    };

    if (employeeId) {
      checkFaceRegistration();
    } else {
      setLoading(false);
      navigate(`/face-register/${employeeId}/${cinemaClusterId}`);
    }
  }, [employeeId, cinemaClusterId, navigate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="text-gray-600">Đang kiểm tra đăng ký khuôn mặt...</div>
      </main>
    );
  }

  if (!hasFaceDescriptor) {
    navigate(`/face-register/${employeeId}/${cinemaClusterId}`);
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ScheduleEmployee cinemaClusterId={cinemaClusterId} />
    </main>
  );
};

export default LichLamViec;