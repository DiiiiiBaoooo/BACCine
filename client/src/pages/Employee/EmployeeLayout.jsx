import React from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import { Outlet, useLocation } from 'react-router-dom'

const EmployeeLayout = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Kiểm tra nếu đang ở trang chọn ghế hoặc chọn dịch vụ
  const isHiddenLayout =
    pathname.startsWith('/employee/chon-ghe') ||
    pathname.startsWith('/employee/thanh-toan') ||
    pathname.startsWith('/employee/chon-dich-vu');

  return (
    <div className="min-h-screen flex flex-col">
      {!isHiddenLayout && <AdminNavbar />}

      <div className="flex flex-1 overflow-hidden">
        {!isHiddenLayout && <EmployeeSidebar />}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default EmployeeLayout
