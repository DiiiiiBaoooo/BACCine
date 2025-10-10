import React from 'react'
import ScheduleManager from '../../components/ScheduleManager';

const QuanLyLichLamViec = ({cinemaClusterId}) => {
    return (
        <main className="min-h-screen bg-gray-50">
          <ScheduleManager cinemaClusterId={cinemaClusterId} />
        </main>
      );
    
}

export default QuanLyLichLamViec