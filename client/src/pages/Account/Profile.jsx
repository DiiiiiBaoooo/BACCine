import React, { useState } from 'react'
import useAuthUser from '../hooks/useAuthUser'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "react-toastify";
import { completeOnboarding } from '../lib/api';
import { CameraIcon, MapPinIcon, ShipWheelIcon, ShuffleIcon } from 'lucide-react';

const Profile = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    name: authUser?.name || "",
    phone: authUser?.phone || "",
    province_code: authUser?.province_code || "",
    district_code: authUser?.district_code || "",
    profilePicture: authUser?.profilePicture || "",
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile updated successfully 🎉");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Update failed");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 10);
    const randomAvatar = `https://robohash.org/${seed}.png`;
    setFormState({ ...formState, profilePicture: randomAvatar });
    toast.success("Random profile picture generated!");
  };

  return (
    <div className='min-h-screen bg-base-100 flex items-center justify-center p-4'>
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8 ">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Cập nhật thông tin cá nhân
          </h1>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="size-32 rounded-full bg-base-300 overflow-hidden">
                {formState.profilePicture ? (
                  <img 
                    src={formState.profilePicture}
                    alt="Profile Avatar"
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CameraIcon className='size-12 text-base-content opacity-40' />
                  </div>
                )}
              </div>

              <button 
                type='button' 
                onClick={handleRandomAvatar} 
                className='btn btn-accent flex items-center'
              >
                <ShuffleIcon className='size-4 mr-2' />
                Generate Random Avatar
              </button>
            </div>

            {/* Họ tên */}
            <div className="form-control">
              <label className='label'>
                <span className="label-text">Họ và tên</span>
              </label>
              <input 
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className='input input-bordered w-full'
                placeholder='Nhập họ và tên'
              />
            </div>

            {/* Số điện thoại */}
            <div className="form-control">
              <label className='label'>
                <span className="label-text">Số điện thoại</span>
              </label>
              <input 
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className='input input-bordered w-full'
                placeholder='Nhập số điện thoại'
              />
            </div>

            {/* Location (province + district) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tỉnh/Thành phố</span>
                </label>
                <input 
                  type="text"
                  value={formState.province_code}
                  onChange={(e) => setFormState({ ...formState, province_code: e.target.value })}
                  className='input input-bordered w-full'
                  placeholder='Mã tỉnh/thành phố'
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Quận/Huyện</span>
                </label>
                <input 
                  type="text"
                  value={formState.district_code}
                  onChange={(e) => setFormState({ ...formState, district_code: e.target.value })}
                  className='input input-bordered w-full'
                  placeholder='Mã quận/huyện'
                />
              </div>
            </div>

            {/* Submit */}
            <button className='btn btn-primary w-full' disabled={isPending} type='submit'>
              {!isPending ? (
                <>
                  <ShipWheelIcon className='size-5 mr-2' />
                  Hoàn tất cập nhật
                </>
              ) : (
                <>
                  <LoaderIcon className='animate-spin size-5 mr-2' />
                  Đang cập nhật...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile
