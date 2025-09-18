import React from "react";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="wave-loader" />
      <style>{`
        .wave-loader {
          --r1: 154%;
          --r2: 68.5%;
          width: 60px;
          aspect-ratio: 1;
          border-radius: 50%;
          background:
            radial-gradient(var(--r1) var(--r2) at top, #0000 79.5%, #269af2 80%),
            radial-gradient(var(--r1) var(--r2) at bottom, #269af2 79.5%, #0000 80%),
            radial-gradient(var(--r1) var(--r2) at top, #0000 79.5%, #269af2 80%),
            #ccc;
          background-size: 50.5% 220%;
          background-position: -100% 0%, 0% 0%, 100% 0%;
          background-repeat: no-repeat;
          animation: wave-loader 2s infinite linear;
        }

        @keyframes wave-loader {
          33% {
            background-position: 0% 33%, 100% 33%, 200% 33%;
          }
          66% {
            background-position: -100% 66%, 0% 66%, 100% 66%;
          }
          100% {
            background-position: 0% 100%, 100% 100%, 200% 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;
