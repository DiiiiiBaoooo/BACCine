import React from 'react'
import{Bell,User} from 'lucide-react'
import { assets } from '../assets/assets'
const AdminNavbar = () => {
  return (
    <header className="w-full bg-gray-900 text-white  shadow-md px-6 py-3 flex items-center justify-between">
    {/* Logo bên trái */}
    <div className="flex items-center gap-2">
      <img
        src={assets.logo}
        alt="logo"
        className="h-14 w-14 object-contain"
      />
    </div>

    {/* Tên hệ thống ở giữa */}
    <h1 className="text-xl font-bold text-center flex-1">
      HỆ THỐNG QUẢN LÝ RẠP PHIM
    </h1>

    {/* Bên phải: Thông báo + Avatar */}
    <div className="flex items-center gap-4">
      {/* Nút thông báo */}
      <button className="relative text-gray-300 hover:text-yellow-400">
        <Bell className="h-6 w-6" />
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
          3
        </span>
      </button>

      {/* Avatar Admin */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
          <User className="h-6 w-6 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold">Admin</p>
          <p className="text-xs text-gray-400">Quản trị viên</p>
        </div>
      </div>
    </div>
  </header>
  )
}

export default AdminNavbar
