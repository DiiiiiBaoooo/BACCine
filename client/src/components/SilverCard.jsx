import React from "react";

const SilverCard = ({
  name = "NGUYEN VAN A",
  memberSince = "10/21",
  validThrough = "10/26",
  hotline = "866 88 8686",
  logoUrl = "/logo.jpg", // có thể đổi logo theo props
}) => {
  return (
    <div className="w-[500px] h-[300px] bg-gradient-to-tr from-gray-200 to-gray-400 rounded-xl shadow-2xl p-6 relative overflow-hidden text-black font-sans">
      {/* Tier */}
      <div className="text-3xl font-extrabold tracking-wide mb-4">SILVER</div>

      {/* Hotline */}
      <div className="text-2xl font-bold mb-6">{hotline}</div>

      {/* Member Info */}
      <div className="absolute bottom-10 left-6 text-sm">
        <div className="font-semibold">Tên thành viên: {name}</div>
        <div className="mt-1">Ngày đăng ký: {memberSince}</div>
      </div>

      {/* Valid */}
      <div className="absolute bottom-10 right-6 text-sm">
        <div className="font-semibold">Hạn thẻ</div>
        <div className="mt-1">{validThrough}</div>
      </div>

      {/* Logo */}
      <div className="absolute top-6 right-6 w-28">
        <img src={logoUrl} alt="Logo" className="object-contain rounded-full" />
      </div>

      {/* Chip (fake) */}
      {/* <div className="absolute top-20 right-10 w-12 h-10 bg-yellow-400 rounded-md shadow-md"></div> */}
    </div>
  );
};

export default SilverCard;
