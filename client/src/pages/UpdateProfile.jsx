import React, { useState,useEffect } from 'react';
import useAuthUser from '../hooks/useAuthUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { completeOnboarding } from '../lib/api';
import axios from 'axios';
import { CameraIcon, MapPinIcon, ShipWheelIcon, ShuffleIcon, LoaderIcon } from 'lucide-react';

const UpdateProfile = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
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
      toast.success('Profile updated successfully 🎉');
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });
 // Lấy danh sách tỉnh/thành
 useEffect(() => {
  axios
    .get('https://provinces.open-api.vn/api/v1/p/')
    .then((res) => setProvinces(res.data))
    .catch((err) => console.error(err));
}, []);

// Lấy danh sách quận/huyện theo province_code
useEffect(() => {
  if (formState.province_code) {
    axios
      .get(`https://provinces.open-api.vn/api/v1/d/?p=${formState.province_code}`)
      .then((res) => setDistricts(res.data))
      .catch((err) => console.error(err));
  } else {
    setDistricts([]);
  }
}, [formState.province_code]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 10);
    const randomAvatar = `https://robohash.org/${seed}.png`;
    setFormState({ ...formState, profilePicture: randomAvatar });
    toast.success('Random profile picture generated!');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="card bg-gray-800 w-full max-w-3xl shadow-2xl border border-gray-700 rounded-xl overflow-hidden">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-white tracking-wide">
            Cập nhật thông tin cá nhân
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="size-32 rounded-full bg-gray-700 overflow-hidden border-4 border-red-600 relative">
                {formState.profilePicture ? (
                  <img
                    src={formState.profilePicture}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-600">
                    <CameraIcon className="size-12 text-gray-300" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleRandomAvatar}
                className="btn border border-red-500 text-red-500 hover:bg-red-600 hover:text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <ShuffleIcon className="size-4" />
                Tạo Avatar Ngẫu Nhiên
              </button>
            </div>

            {/* Họ tên */}
            <div className="form-control relative">
              <label
                className="label absolute left-3 -top-2 bg-gray-800 text-gray-300 text-sm font-medium px-1 transition-all duration-200
                  pointer-events-none transform scale-75 origin-top-left"
              >
                Họ và tên
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="input input-bordered w-full bg-gray-900 text-white border-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/50
                  placeholder-transparent p-3 rounded-lg focus:outline-none transition-all duration-200"
                placeholder="Nhập họ và tên"
              />
            </div>

            {/* Số điện thoại */}
            <div className="form-control relative">
              <label
                className="label absolute left-3 -top-2 bg-gray-800 text-gray-300 text-sm font-medium px-1 transition-all duration-200
                  pointer-events-none transform scale-75 origin-top-left"
              >
                Số điện thoại
              </label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className="input input-bordered w-full bg-gray-900 text-white border-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/50
                  placeholder-transparent p-3 rounded-lg focus:outline-none transition-all duration-200"
                placeholder="Nhập số điện thoại"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Province */}
                  <div className="form-control relative">
                    <label
                      className="label absolute left-3 -top-2 bg-gray-800 text-gray-300 text-sm font-medium px-1 transition-all duration-200
                        pointer-events-none transform scale-75 origin-top-left"
                    >
                      Tỉnh/Thành phố
                    </label>
                    <select
                      value={formState.province_code}
                      onChange={(e) =>
                        setFormState({ ...formState, province_code: e.target.value, district_code: '' })
                      }
                      className="select select-bordered w-full bg-gray-900 text-white border-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/50
                        rounded-lg p-3 appearance-none transition-all duration-200"
                    >
                      <option value="" className="text-gray-500">Chọn Tỉnh/Thành phố</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code} className="text-white">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div className="form-control relative">
                    <label
                      className="label absolute left-3 -top-2 bg-gray-800 text-gray-300 text-sm font-medium px-1 transition-all duration-200
                        pointer-events-none transform scale-75 origin-top-left"
                    >
                      Quận/Huyện
                    </label>
                    <select
                      value={formState.district_code}
                      onChange={(e) =>
                        setFormState({ ...formState, district_code: e.target.value })
                      }
                      className="select select-bordered w-full bg-gray-900 text-white border-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/50
                        rounded-lg p-3 appearance-none transition-all duration-200"
                      disabled={!formState.province_code}
                    >
                      <option value="" className="text-gray-500">Chọn Quận/Huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code} className="text-white">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>


            {/* Submit */}
            <button
              className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-md
                disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isPending}
              type="submit"
            >
              {!isPending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Hoàn tất cập nhật
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Đang cập nhật...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;