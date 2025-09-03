import React from "react";

const PlatinumCard = ({ name, memberSince, validThrough }) => {
  return (
    <div className="w-[500px] h-[280px] rounded-xl shadow-2xl relative overflow-hidden bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 p-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-wider text-gray-200">
          PLATINUM
        </h2>
        <img
          src="/logo.jpg"
          alt="logo"
          className="w-24 object-contain rounded-full"
        />
      </div>

      {/* Card Number */}
      <div className="mt-8 text-2xl font-semibold tracking-widest">
        866 88 8686
      </div>

      {/* Info */}
      <div className="mt-8 flex justify-between text-sm font-medium">
        <div>
          <p>NAME: {name}</p>
          <p>MEMBER SINCE: {memberSince}</p>
        </div>
        <div>
          <p>VALID THROUGH</p>
          <p>{validThrough}</p>
        </div>
      </div>
    </div>
  );
};

export default PlatinumCard;
