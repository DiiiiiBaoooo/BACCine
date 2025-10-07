import React from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import { Outlet } from 'react-router-dom'

const EmployeeLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
    <AdminNavbar />
    <div className="flex flex-1 overflow-hidden">
      <EmployeeSidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  </div>
  )
}

export default EmployeeLayout
