import React from 'react'
import { assets } from '../assets/assets'

import { NavLink } from 'react-router-dom'
import { LayoutDashboardIcon, TicketIcon } from 'lucide-react'

const ManagerSidebar = () => {
  const user = {
    firstName: 'Manager',
    lastName: 'User',
    imageUrl: assets.profile
  }

  const managerNavlinks = [
    { name: 'Dashboard', path: '/manager', icon: LayoutDashboardIcon },
    { name: 'Quản lý giá vé', path: '/manager/qlgv', icon: TicketIcon },
    
  ]

  return (
    <div className="h-auto md:flex flex-col items-center pt-8 max-w-13 md:max-w-60 w-full bg-gray-900 text-gray-400 border-r border-gray-800">
      {/* User Profile Image */}
      <img
        className="h-9 md:h-14 w-9 md:w-14 rounded-full mx-auto"
        src={user.imageUrl}
        alt=""
      />
      <p className="mt-2 text-base max-md:hidden text-white">{user.firstName} {user.lastName}</p>

      {/* Navigation Links */}
      <div className="w-full mt-6">
        {managerNavlinks.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            end
            className={({ isActive }) =>
              `relative flex items-center max-md:justify-center gap-2 w-full py-2.5 pl-4 md:pl-10 hover:bg-gray-800/50 ${
                isActive ? 'bg-primary/20 text-primary' : ''
              } transition-colors duration-200`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className="h-5 w-5" />
                <p className="max-md:hidden">{link.name}</p>
                {isActive && (
                  <span className="w-1.5 h-10 rounded-l bg-primary absolute right-0"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default ManagerSidebar