import React from "react";


const MembershipCard = () => {
 

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-900 p-6">
      {/* Card Wrapper */}
      <div className="w-[500px] h-[300px] rounded-xl shadow-2xl relative overflow-hidden bg-black">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-tr from-red-700 via-black to-gray-800 opacity-90" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(45deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "25px 25px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full w-full text-white p-6 flex flex-col">
          {/* Header */}
          <div className="text-2xl md:text-3xl font-bold mb-6">Membership Card</div>

          {/* Member info */}
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div>
              <Label>Tên thành viên</Label>
              <div className="text-xl font-semibold"></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm font-medium">
              <div>
                <Label>Ngày phát hành</Label>
                <div></div>
              </div>
              <div>
                <Label>Hạng</Label>
                <div></div>
              </div>
              <div>
                <Label>Hotline</Label>
                <div></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto">
            <div className="font-semibold"></div>
            <div className="w-16 h-16 flex items-center justify-center">
             (
                <svg
                  viewBox="0 0 64 64"
                  aria-label="cinema logo"
                  className="w-12 h-12 fill-white"
                >
                  <circle cx="20" cy="22" r="8" />
                  <circle cx="44" cy="22" r="8" />
                  <rect x="12" y="30" width="40" height="12" rx="2" />
                  <polygon points="54,36 64,42 64,30" />
                </svg>
              )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MembershipCard
