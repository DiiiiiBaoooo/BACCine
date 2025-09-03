import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser'; // ✅ hook lấy user login

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { authUser, isLoading } = useAuthUser(); 
  const isAuthenticated = Boolean(authUser);

  // Handle dropdown visibility with a delay
  useEffect(() => {
    let timeoutId;
    if (isAuthenticated && !isLoading) {
      const handleMouseLeave = () => {
        timeoutId = setTimeout(() => {
          const dropdown = dropdownRef.current;
          if (dropdown && !dropdown.matches(':hover')) {
            dropdown.classList.add('hidden');
          }
        }, 200); // Delay of 200ms before hiding
      };

      const handleMouseEnter = () => {
        clearTimeout(timeoutId);
        const dropdown = dropdownRef.current;
        if (dropdown) {
          dropdown.classList.remove('hidden');
        }
      };

      const avatar = document.querySelector('.avatar-wrapper');
      if (avatar) {
        avatar.addEventListener('mouseenter', handleMouseEnter);
        avatar.addEventListener('mouseleave', handleMouseLeave);
      }

      return () => {
        if (avatar) {
          avatar.removeEventListener('mouseenter', handleMouseEnter);
          avatar.removeEventListener('mouseleave', handleMouseLeave);
        }
        clearTimeout(timeoutId);
      };
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="" className="w-36 h-auto" />
      </Link>
      
      {/* Menu */}
      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 
          max-md:font-medium max-md:text-lg z-50 flex flex-col 
          md:flex-row items-center max-md:justify-center gap-8
          min-md:px-8 py-3 max-md:h-screen min-md:rounded-full 
          backdrop-blur bg-black/70 md:bg-white/70 md:border
          border-r-gray-300/20 overflow-hidden transition-[width]
          duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}`}
      >
        <XIcon
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
        />

        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/" className="px-4 py-2 hover:text-red-500">Home</Link>
        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/movies" className="px-4 py-2 hover:text-red-500">Movies</Link>
        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/theaters" className="px-4 py-2 hover:text-red-500">Theater</Link>
        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/releases" className="px-4 py-2 hover:text-red-500">Releases</Link>
      </div>

      {/* Phần bên phải */}
      <div className="flex items-center gap-8">
        <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer" />

        {!isLoading && (
          <>
            {isAuthenticated ? (
              // ✅ Nếu login thì hiển thị avatar + dropdown
              <div className="relative avatar-wrapper group" onClick={() => {}}>
                <img
                  src={authUser.profilePicture || "https://via.placeholder.com/40"}
                  alt="avatar"
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-red-500"
                />
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-52 bg-gray-800 text-white shadow-lg rounded-md py-2 hidden group-hover:block z-50"
                >
                  <Link to="/profile" className="block px-6 py-3 hover:bg-gray-700">Hồ sơ</Link>
                  <Link to="/tickets" className="block px-6 py-3 hover:bg-gray-700">Vé của tôi</Link>
                  {authUser.role === "admin" && (
                    <Link to="/admin" className="block px-6 py-3 hover:bg-gray-700">Trang Admin</Link>
                  )}
                  <button
                    onClick={() => {
                      // call API logout ở đây
                      navigate("/login");
                    }}
                    className="block w-full text-left px-6 py-3 text-red-400 hover:bg-gray-700"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              // ✅ Nếu chưa login thì hiển thị nút
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1 sm:px-6 sm:py-2 bg-red-600 hover:bg-red-700 transition rounded-full font-medium cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4 py-1 sm:px-6 sm:py-2 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition rounded-full font-medium cursor-pointer"
                >
                  Đăng ký
                </button>
              </>
            )}
          </>
        )}
      </div>

      <MenuIcon
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

export default Header;