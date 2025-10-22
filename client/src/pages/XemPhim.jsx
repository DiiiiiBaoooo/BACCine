import React, { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Hls from "hls.js";

const XemPhim = () => {
  const { id } = useParams();
  const videoRef = useRef(null);

  // Load HLS từ backend NodeJS
  const videoSrc = `http://localhost:3000/api/stream/${id}/master.m3u8`;
  console.log(videoSrc);
  
  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(videoRef.current);
    } else {
      videoRef.current.src = videoSrc;
    }
  }, [videoSrc]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Link to="/" className="text-blue-400 hover:underline">
        ⬅ Quay lại thư viện
      </Link>

      <h1 className="text-2xl font-bold my-4">Đang xem: {id}</h1>

      <div className="flex justify-center">
        <video
          ref={videoRef}
          controls
          autoPlay
          className="w-full md:w-3/4 lg:w-1/2 rounded-lg shadow-xl"
        ></video>
      </div>
    </div>
  );
};

export default XemPhim;
