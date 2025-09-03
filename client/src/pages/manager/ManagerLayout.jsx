import React from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import AdminSidebar from '../../components/AdminSidebar'
import ManagerSidebar from '../../components/ManagerSidebar'
import { Outlet } from 'react-router-dom'
const ManagerLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
          <AdminNavbar />
          <div className="flex flex-1 overflow-hidden">
            <ManagerSidebar />
            <div className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </div>
          </div>
        </div>
      )
}

export default ManagerLayout
