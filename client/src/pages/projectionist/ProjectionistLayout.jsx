import React from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import { Outlet } from 'react-router-dom'
import ProjectionistSidebar from '../../components/ProjectionistSidebar'

const ProjectionistLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
    <AdminNavbar />
    <div className="flex flex-1 overflow-hidden">
      <ProjectionistSidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  </div>
  )
}

export default ProjectionistLayout