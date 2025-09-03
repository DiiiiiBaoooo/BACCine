import React, { useState } from 'react';
import { FilmIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; // npm install react-icons
import axios from 'axios';
import useLogin from '../hooks/useLogin';
const Login = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const {isPending,error,loginMutation}=useLogin()
  const handleLogin = (e)=>{
    e.preventDefault();
    loginMutation(loginData);
    
  }

  // Demo function login with Google
  const handleGoogleLogin = () => {
    alert("Đăng nhập bằng Google (demo)"); 
    // Sau này gọi API hoặc dùng OAuth flow ở đây
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Form - Left */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <FilmIcon className='text-red-600 size-8' />
            <span className="text-3xl font-bold tracking-tight text-red-600">
              BAC Cinema
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-black mb-2">Đăng nhập</h2>
          <p className="text-base text-gray-600 mb-8">
            Trở lại BAC Cinema để tận hưởng những bộ phim đỉnh cao
          </p>

          {/* Error Message */}
           {/* error message  */}
{error && (
  <div className="alert alert-error mb-4 text-red-600">
    <span>
      {error.response?.data?.error || error.response?.data?.message || error.message}
    </span>
  </div>
)}
          {/* Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Địa chỉ email"
                className="w-full p-3 bg-white border border-gray-600 rounded-lg text-black text-base focus:outline-none focus:ring-2 focus:ring-red-600"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-3 bg-white border border-gray-600 rounded-lg text-black text-base focus:outline-none focus:ring-2 focus:ring-red-600"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>

            {/* Submit */}
            <button type='submit' className='btn bg-red-600 w-full rounded-lg p-5 ' disabled={isPending}>
                    {isPending? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Signing in...
                      </>
                    ):(
                      "Sign in"
                    )}
                  </button>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 mt-2 bg-white border border-gray-400 text-black font-medium text-lg rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FcGoogle size={24} /> Đăng nhập với Google
            </button>

            {/* Link to SignUp */}
            <p className="text-base text-center text-gray-600 mt-4">
              Chưa có tài khoản?{' '}
              <Link
                to="/signup"
                className="text-red-600 font-semibold hover:underline"
              >
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
            <h3 className="text-2xl font-semibold text-black mb-3">
              Khám phá thế giới điện ảnh cùng BAC Cinema
            </h3>
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
