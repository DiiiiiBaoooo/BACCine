"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, XIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { authUser, isLoading } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const { logoutMutation } = useLogout();

  // Hover dropdown với delay
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    let timeoutId;
    const dropdown = dropdownRef.current;
    const avatar = document.querySelector(".avatar-wrapper");

    const showDropdown = () => {
      clearTimeout(timeoutId);
      dropdown?.classList.remove("hidden");
    };

    const hideDropdown = () => {
      timeoutId = setTimeout(() => {
        if (!dropdown?.matches(":hover")) {
          dropdown?.classList.add("hidden");
        }
      }, 200);
    };

    avatar?.addEventListener("mouseenter", showDropdown);
    avatar?.addEventListener("mouseleave", hideDropdown);
    dropdown?.addEventListener("mouseenter", showDropdown);
    dropdown?.addEventListener("mouseleave", hideDropdown);

    return () => {
      avatar?.removeEventListener("mouseenter", showDropdown);
      avatar?.removeEventListener("mouseleave", hideDropdown);
      dropdown?.removeEventListener("mouseenter", showDropdown);
      dropdown?.removeEventListener("mouseleave", hideDropdown);
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isLoading]);

  return (
    <div className=" top-0 left-0 right-0 z-40 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4 md:px-8 lg:px-16 gap-8">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 group">
          <img
            src={assets.logo || "/placeholder.svg"}
            alt="Logo"
            className="w-24 h-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:shadow-3xl flex-1 justify-center">
          {[
            { to: "/", label: "Trang chủ" },
            { to: "/movies", label: "Phim đang chiếu" },
            { to: "/rapchieu", label: "Rạp chiếu" },
            { to: "/recruiments", label: "Tuyển dụng" },
            { to: "/blog", label: "Bài viết" },
            { to: "/video", label: "Thư viện phim" },
            { to: "/membership", label: "Ưu đãi thành viên" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => window.scrollTo(0, 0)}
              className="relative px-4 py-2 text-white font-medium text-base whitespace-nowrap transition-all duration-300 hover:text-red-500"
            >
              {item.label}
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-red-500 to-red-700 -translate-x-1/2 transition-all duration-300 hover:w-4/5"></span>
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4 relative">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <div className="relative avatar-wrapper group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600/30 to-transparent rounded-full animate-pulse pointer-events-none"></div>

                  <img
                    src={authUser.profilePicture || "https://via.placeholder.com/40"}
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    className="relative z-10 w-10 h-10 rounded-full border-2 border-red-500 cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-red-500/40"
                  />

                  {/* DROPDOWN - Z-INDEX CAO NHẤT */}
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full mt-3 w-56 bg-gray-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-2 hidden z-50"
                  >
                    <Link
                      to="/profile"
                      className="block px-6 py-3 text-white hover:bg-white/10 hover:text-red-400 transition-all duration-200 hover:pl-8"
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/tickets"
                      className="block px-6 py-3 text-white hover:bg-white/10 hover:text-red-400 transition-all duration-200 hover:pl-8"
                    >
                      Vé của tôi
                    </Link>
                    {authUser.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-6 py-3 text-white hover:bg-white/10 hover:text-red-400 transition-all duration-200 hover:pl-8"
                      >
                        Trang Admin
                      </Link>
                    )}
                    {authUser.role === "manager" && (
                      <Link
                        to="/manager"
                        className="block px-6 py-3 text-white hover:bg-white/10 hover:text-red-400 transition-all duration-200 hover:pl-8"
                      >
                        Trang Manager
                      </Link>
                    )}
                    <button
                      onClick={logoutMutation}
                      className="w-full text-left px-6 py-3 text-red-400 hover:bg-white/10 hover:text-red-300 transition-all duration-200 hover:pl-8"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold rounded-full shadow-lg transition-all duration-300 hover:shadow-red-500/50 hover:-translate-y-0.5"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="px-6 py-2 bg-transparent text-red-500 border-2 border-red-500 font-semibold rounded-full transition-all duration-300 hover:bg-red-500 hover:text-white hover:-translate-y-0.5"
                  >
                    Đăng ký
                  </button>
                </div>
              )}
            </>
          )}

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 transition-colors hover:text-red-500"
          >
            <MenuIcon className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8 transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 text-white"
        >
          <XIcon className="w-8 h-8" />
        </button>

        {[
          { to: "/", label: "Trang chủ" },
          { to: "/movies", label: "Phim đang chiếu" },
          { to: "/rapchieu", label: "Rạp chiếu" },
          { to: "/recruiments", label: "Tuyển dụng" },
          { to: "/blog", label: "Bài viết" },
          { to: "/video", label: "Thư viện phim" },
          { to: "/membership", label: "Ưu đãi thành viên" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => {
              window.scrollTo(0, 0);
              setIsOpen(false);
            }}
            className="text-2xl font-medium text-white hover:text-red-500 transition-colors px-4 py-2 rounded-lg hover:bg-red-500/10"
          >
            {item.label}
          </Link>
        ))}

        {!isAuthenticated && !isLoading && (
          <div className="flex flex-col gap-4 w-full max-w-xs mt-8">
            <button
              onClick={() => {
                navigate("/login");
                setIsOpen(false);
              }}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                navigate("/signup");
                setIsOpen(false);
              }}
              className="w-full py-3 bg-transparent text-red-500 border-2 border-red-500 font-semibold rounded-full hover:bg-red-500 hover:text-white transition"
            >
              Đăng ký
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;