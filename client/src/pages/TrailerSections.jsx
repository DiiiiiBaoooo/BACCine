"use client";

import React, { useState } from "react";
import { dummyTrailers } from "../assets/assets";
import ReactPlayer from "react-player";
import BlurCircle from "../components/BlurCircle";
import { PlayCircleIcon } from "lucide-react";

const TrailerSection = () => {
    const [currentTrailer, setCurrentTrailer] = useState(null);
  
    return (
      <div className="relative z-0 px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden min-h-screen">
        {/* Title */}
        <div className="relative flex items-center justify-between mb-8">
          <p className="text-gray-300 font-medium text-lg md:text-xl">Trailers Mới Nhất</p>
          <BlurCircle top="10px" right="-80px" size="w-64 h-64" />
        </div>
  
        {/* Video Player */}
        <div className="relative mt-6 mb-12 flex justify-center">
          {currentTrailer ? (
            <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeID(currentTrailer.videoUrl)}?autoplay=1&modestbranding=1&rel=0`}
                title={currentTrailer.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl aspect-video bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <PlayCircleIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Chọn một trailer để xem</p>
              </div>
            </div>
          )}
        </div>
  
        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            <BlurCircle left="155px" />
          {dummyTrailers.map((trailer, index) => {
            const isActive = currentTrailer?.id === trailer.id;
  
            return (
              <button
                key={trailer.id}
                onClick={() => setCurrentTrailer(trailer)}
                className={`
                  relative group overflow-hidden rounded-xl transition-all duration-300
                  ${isActive ? "ring-4 ring-red-500 shadow-lg shadow-red-500/20" : ""}
                  hover:ring-4 hover:ring-red-500/50 hover:shadow-xl hover:shadow-red-500/10
                  hover:-translate-y-1 active:scale-95
                `}
              >
                {/* Thumbnail Image */}
                <img
                  src={trailer.image}
                  alt={trailer.title}
                  className="w-full h-48 md:h-56 object-cover brightness-75 group-hover:brightness-100 transition-all duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/640x360/1a1a1a/666666?text=No+Image';
                  }}
                />
  
                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <PlayCircleIcon
                    className={`
                      w-10 h-10 md:w-14 md:h-14 transition-all duration-300
                      ${isActive ? "text-red-500 scale-110" : "text-white/80 group-hover:text-white group-hover:scale-110"}
                    `}
                  />
                </div>
  
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3">
                  <p className="text-white text-xs md:text-sm font-medium line-clamp-2">
                    {trailer.title}
                  </p>
                </div>
  
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    PLAYING
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Helper function để extract YouTube video ID
  function extractYouTubeID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }
  
  export default TrailerSection;