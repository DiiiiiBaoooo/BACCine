import React, { useEffect, useState } from 'react';
import useAuthUser from '../../hooks/useAuthUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { completeOnboarding } from '../../lib/api';
import { CameraIcon, ShuffleIcon, LoaderIcon, UserIcon, PhoneIcon, MapPinIcon, SaveIcon } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [formState, setFormState] = useState({
    name: authUser?.name || '',
    phone: authUser?.phone || '',
    province_code: authUser?.province_code || '',
    district_code: authUser?.district_code || '',
    profilePicture: authUser?.profilePicture || '',
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công 🎉');
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    },
  });

  useEffect(() => {
    if (authUser) {
      setFormState({
        name: authUser.name || '',
        phone: authUser.phone || '',
        province_code: authUser.province_code || '',
        district_code: authUser.district_code || '',
        profilePicture: authUser.profilePicture || '',
      });
    }
  }, [authUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  // Load provinces on mount
  useEffect(() => {
    axios
      .get('https://provinces.open-api.vn/api/p/')
      .then((res) => setProvinces(res.data))
      .catch((err) => {
        console.error(err);
        toast.error('Không thể tải danh sách tỉnh/thành phố');
      });
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (formState.province_code) {
      setLoadingDistricts(true);
      axios
        .get(`https://provinces.open-api.vn/api/p/${formState.province_code}?depth=2`)
        .then((res) => {
          setDistricts(res.data.districts || []);
          setLoadingDistricts(false);
        })
        .catch((err) => {
          console.error(err);
          setDistricts([]);
          setLoadingDistricts(false);
          toast.error('Không thể tải danh sách quận/huyện');
        });
    } else {
      setDistricts([]);
    }
  }, [formState.province_code]);

  const handleProvinceChange = (e) => {
    const newProvinceCode = e.target.value;
    setFormState({
      ...formState,
      province_code: newProvinceCode,
      district_code: '', // Reset district khi đổi tỉnh
    });
  };

  const handleRandomAvatar = () => {
    const seed = Math.floor(Math.random() * 99) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${seed}`;
    setFormState({ ...formState, profilePicture: randomAvatar });
    toast.success('Đã tạo avatar ngẫu nhiên!');
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Thông tin cá nhân
          </h1>
          <p className="text-gray-400">Quản lý và cập nhật thông tin của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-red-500/30 shadow-2xl shadow-red-500/10 sticky top-8">
              <div className="text-center space-y-6">
                {/* Avatar */}
                <div className="relative inline-block">
                  <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-red-500 to-orange-500 p-1">
                    <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden">
                      {formState.profilePicture ? (
                        <img
                          src={formState.profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-800">
                          <CameraIcon className="w-16 h-16 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-600 transition-colors">
                    <CameraIcon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* User Info Preview */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {formState.name || 'Chưa có tên'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {formState.phone || 'Chưa có số điện thoại'}
                  </p>
                </div>

                {/* Random Avatar Button */}
                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg"
                >
                  <ShuffleIcon className="w-4 h-4" />
                  Tạo Avatar Ngẫu Nhiên
                </button>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-800">
                  <div className="bg-black/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Thành viên</p>
                    <p className="text-sm font-semibold text-green-400">Đã xác thực</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Điểm tích lũy</p>
                    <p className="text-sm font-semibold text-yellow-400">0 điểm</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 sm:p-8 border border-red-500/30 shadow-2xl shadow-red-500/10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <UserIcon className="w-4 h-4 text-red-400" />
                    Họ và tên
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full bg-black/50 text-white border border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 p-4 pl-12 rounded-xl focus:outline-none transition-all duration-200"
                      placeholder="Nhập họ và tên của bạn"
                    />
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <PhoneIcon className="w-4 h-4 text-red-400" />
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      className="w-full bg-black/50 text-white border border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 p-4 pl-12 rounded-xl focus:outline-none transition-all duration-200"
                      placeholder="Nhập số điện thoại"
                    />
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <MapPinIcon className="w-4 h-4 text-red-400" />
                    Địa chỉ
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Province */}
                    <div className="relative">
                      <select
                        value={formState.province_code}
                        onChange={handleProvinceChange}
                        className="w-full bg-black/50 text-white border border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 p-4 rounded-xl focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code} className="bg-gray-900">
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <MapPinIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>

                    {/* District */}
                    <div className="relative">
                      <select
                        value={formState.district_code}
                        onChange={(e) =>
                          setFormState({ ...formState, district_code: e.target.value })
                        }
                        className="w-full bg-black/50 text-white border border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 p-4 rounded-xl focus:outline-none transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!formState.province_code || loadingDistricts}
                      >
                        <option value="">
                          {loadingDistricts 
                            ? 'Đang tải...' 
                            : !formState.province_code 
                              ? 'Vui lòng chọn tỉnh trước'
                              : 'Chọn Quận/Huyện'
                          }
                        </option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.code} className="bg-gray-900">
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {loadingDistricts ? (
                        <LoaderIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none animate-spin" />
                      ) : (
                        <MapPinIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  {/* Helper text */}
                  {!formState.province_code && (
                    <p className="text-xs text-yellow-500 flex items-center gap-1">
                      <span>⚠️</span>
                      Vui lòng chọn Tỉnh/Thành phố trước để hiển thị danh sách Quận/Huyện
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  className="w-full flex items-center justify-center bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl shadow-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-8 transform hover:scale-[1.02]"
                  disabled={isPending}
                  type="submit"
                >
                  {!isPending ? (
                    <>
                      <SaveIcon className="w-5 h-5 mr-2" />
                      Lưu thông tin
                    </>
                  ) : (
                    <>
                      <LoaderIcon className="animate-spin w-5 h-5 mr-2" />
                      Đang lưu...
                    </>
                  )}
                </button>
              </form>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
                <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-xs text-blue-300 mb-1">🔒 Bảo mật</p>
                  <p className="text-xs text-gray-400">Thông tin được mã hóa và bảo vệ</p>
                </div>
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-4">
                  <p className="text-xs text-green-300 mb-1">✓ Xác thực</p>
                  <p className="text-xs text-gray-400">Tài khoản đã được xác minh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;