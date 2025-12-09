import React, { useState } from 'react';
import { FilmIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import useLogin from '../hooks/useLogin';
import { toast } from 'react-toastify';

const Login = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const { isPending, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const token = credentialResponse.credential;
    const decoded = jwtDecode(token);

    try {
      const response = await axios.post(
        "/api/auth/google",
        { token },
        { withCredentials: true }
      );

      localStorage.setItem("jwt", response.data.token);
      
      toast.success("Đăng nhập Google thành công!", {
        position: "top-right",
        autoClose: 2000,
      });

      // Chờ 500ms để user thấy toast rồi mới chuyển trang
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (error) {
      console.error("Google login error:", error);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Đăng nhập Google thất bại!";
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8 flex items-center gap-3">
            <FilmIcon className="text-red-600 size-8" />
            <span className="text-3xl font-bold tracking-tight text-red-600">BAC Cinema</span>
          </div>

          <h2 className="text-3xl font-bold text-black mb-2">Đăng nhập</h2>
          <p className="text-base text-gray-600 mb-8">
            Trở lại BAC Cinema để tận hưởng những bộ phim đỉnh cao
          </p>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label className="block text-base font-medium text-black mb-2">Email</label>
              <input
                type="email"
                placeholder="Địa chỉ email"
                className="w-full p-3 border border-gray-600 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-medium text-black mb-2">Mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-3 border border-gray-600 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              className="w-full py-3 bg-red-600 text-white font-semibold text-lg rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors" 
              disabled={isPending}
            >
              {isPending ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-600">Hoặc đăng nhập với</span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  toast.error("Đăng nhập Google thất bại!", {
                    position: "top-right",
                    autoClose: 3000,
                  });
                }}
                useOneTap
              />
            </div>

            <p className="text-base text-center text-gray-600 mt-4">
              Chưa có tài khoản?{" "}
              <Link to="/signup" className="text-red-600 font-semibold hover:underline">
                Tạo tài khoản
              </Link>
            </p>
          </form>
        </div>

        {/* Right side - Banner */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-gray-100 items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <div className="bg-gray-300 h-48 rounded-xl shadow-md mb-6 flex items-center justify-center">
              <span className="text-gray-600 text-lg">Hình ảnh rạp chiếu phim</span>
            </div>
            <h3 className="text-2xl font-semibold text-black mb-3">Khám phá thế giới điện ảnh cùng BAC Cinema</h3>
            <p className="text-base text-gray-600">
              Đặt vé dễ dàng, trải nghiệm phim bom tấn và ghế ngồi thoải mái tại các rạp hàng đầu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;