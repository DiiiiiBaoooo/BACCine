import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const SignUp = () => {
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (signupData.password.length < 6) {
      toast.error('Mật khẩu phải dài ít nhất 6 ký tự', {
        position: "top-right",
        autoClose: 3000,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/signup', signupData);
      
      toast.success(response.data.message || 'Đăng ký thành công!', {
        position: "top-right",
        autoClose: 2000,
      });

      setSignupData({ fullName: '', email: '', password: '' });
      
      // Chuyển sang trang login sau 1 giây
      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (err) {
      console.log('Signup error:', err.response?.data);
      
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Đăng ký thất bại, vui lòng thử lại.";

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Form - Left */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <span className="text-3xl font-bold tracking-tight text-red-600">
              BAC Cinema
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-black mb-2">
            Tạo tài khoản
          </h2>
          <p className="text-base text-gray-600 mb-8">
            Tham gia BAC Cinema để tận hưởng những bộ phim đỉnh cao
          </p>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                placeholder="Họ và tên"
                className="w-full p-3 bg-white border border-gray-600 rounded-lg text-black text-base focus:outline-none focus:ring-2 focus:ring-red-600"
                value={signupData.fullName}
                onChange={(e) =>
                  setSignupData({ ...signupData, fullName: e.target.value })
                }
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Địa chỉ email"
                className="w-full p-3 bg-white border border-gray-600 rounded-lg text-black text-base focus:outline-none focus:ring-2 focus:ring-red-600"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
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
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
              />
              <p className="text-sm text-gray-600 mt-2">
                Mật khẩu phải dài ít nhất 6 ký tự
              </p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 text-red-600 border-gray-600 rounded focus:ring-red-600"
                required
              />
              <span className="text-sm text-gray-600">
                Tôi đồng ý với{' '}
                <span className="text-red-600 hover:underline cursor-pointer">
                  điều khoản dịch vụ
                </span>{' '}
                và{' '}
                <span className="text-red-600 hover:underline cursor-pointer">
                  chính sách bảo mật
                </span>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white font-semibold text-lg rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>

            {/* Link to Login */}
            <p className="text-base text-center text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-red-600 font-semibold hover:underline"
              >
                Đăng nhập
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

export default SignUp;