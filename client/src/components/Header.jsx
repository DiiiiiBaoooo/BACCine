import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import useLogout from '../hooks/useLogout';
import axios from 'axios';
import { useCinema } from '../context/CinemaContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cinemas, setCinemas] = useState([]);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { authUser, isLoading } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const { logoutMutation } = useLogout();
  const { selectedCinema, setSelectedCinema } = useCinema();

  // Fetch cinemas
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await axios.get('/api/cinemas');
        setCinemas(res.data.cinemas || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách rạp:', err);
      }
    };
    fetchCinemas();
  }, []);

  // Handle avatar dropdown
  useEffect(() => {
    let timeoutId;
    if (isAuthenticated && !isLoading) {
      const handleMouseLeave = () => {
        timeoutId = setTimeout(() => {
          const dropdown = dropdownRef.current;
          if (dropdown && !dropdown.matches(':hover')) {
            dropdown.classList.add('hidden');
          }
        }, 200);
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
    <div className=" top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-transparent">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      {/* Menu */}
      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 
          max-md:font-medium max-md:text-lg z-50 flex flex-col 
          md:flex-row items-center max-md:justify-center gap-4 md:gap-8
          max-md:h-screen max-md:w-full max-md:bg-black/90 
          md:bg-white/70 md:rounded-full md:border md:border-gray-300/20 
          md:px-8 md:py-3 transition-all duration-300 
          ${isOpen ? 'max-md:w-full' : 'max-md:w-0 max-md:overflow-hidden'}`}
      >
        <XIcon
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer text-white"
        />

        <Link
          onClick={() => {
            window.scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
          className="px-4 py-2 text-white md:text-gray-800 hover:text-red-500"
        >
          Home
        </Link>
        <Link
          onClick={() => {
            window.scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
          className="px-4 py-2 text-white md:text-gray-800 hover:text-red-500"
        >
          Movies
        </Link>
        <Link
          onClick={() => {
            window.scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/recruiments"
          className="px-4 py-2 text-white md:text-gray-800 hover:text-red-500"
        >
          Tuyển dụng
        </Link>
        <Link
          onClick={() => {
            window.scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/blog"
          className="px-4 py-2 text-white md:text-gray-800 hover:text-red-500"
        >
          Blog
        </Link>
        <Link
          onClick={() => {
            window.scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/theaters"
          className="px-4 py-2 text-white md:text-gray-800 hover:text-red-500"
        >
          Theater
        </Link>
        <Link
          onClick={() => {
            window.scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/releases"
          className="px-4 py-2 text-white md:text-gray-800 hover:text-red-500"
        >
          Releases
        </Link>

        {/* Dropdown chọn rạp */}
        <select
          value={selectedCinema || ''}
          onChange={(e) => setSelectedCinema(e.target.value)}
          className="px-3 py-1.5 border rounded-full bg-white text-gray-800 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 max-md:bg-gray-800 max-md:text-white max-md:border-gray-600"
        >
          <option value="">Chọn rạp</option>
          {cinemas.map((cinema) => (
            <option key={cinema.id} value={cinema.id}>
              {cinema.cinema_name}
            </option>
          ))}
        </select>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 md:gap-8">
        <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer text-white md:text-gray-800" />

        {!isLoading && (
          <>
            {isAuthenticated ? (
              <div className="relative avatar-wrapper group">
                <img
                  src={authUser.profilePicture || 'https://via.placeholder.com/40'}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-red-500"
                />
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-52 bg-gray-800 text-white shadow-lg rounded-md py-2 hidden group-hover:block z-50"
                >
                  <Link to="/profile" className="block px-6 py-3 hover:bg-gray-700">
                    Hồ sơ
                  </Link>
                  <Link to="/tickets" className="block px-6 py-3 hover:bg-gray-700">
                    Vé của tôi
                  </Link>
                  {authUser.role === 'admin' && (
                    <Link to="/admin" className="block px-6 py-3 hover:bg-gray-700">
                      Trang Admin
                    </Link>
                  )}
                   {authUser.role === 'manager' && (
                    <Link to="/manager" className="block px-6 py-3 hover:bg-gray-700">
                      Trang manager
                    </Link>
                  )}
                  <button
                    onClick={logoutMutation}
                    className="block w-full text-left px-6 py-3 text-red-400 hover:bg-gray-700"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1 sm:px-6 sm:py-2 bg-red-600 hover:bg-red-700 transition rounded-full font-medium cursor-pointer text-white"
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
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer text-white"
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

export default Header;