"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, CalendarIcon, ClockIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
// Dữ liệu phim
const moviesData = [
  {
    id: 1,
    title: "Guardians of the Galaxy",
    logo: "/guardians-of-the-galaxy-logo.jpg",
    backgroundImage: "/guardians-of-the-galaxy-space-background.jpg",
    genres: "Hành động | Khám phá | Khoa học viễn tưởng",
    year: 2018,
    duration: "2h 8m",
    description:
      "Vệ binh dải Ngân Hà là một bộ phim điện ảnh lấy đề tài siêu anh hùng dựa trên một đội siêu anh hùng giả tưởng cùng tên của của Marvel Comics.",
  },
  {
    id: 2,
    title: "The Avengers",
    logo: "/avengers-logo.jpg",
    backgroundImage: "/avengers-team-background.jpg",
    genres: "Hành động | Phiêu lưu | Siêu anh hùng",
    year: 2019,
    duration: "2h 41m",
    description: "Các siêu anh hùng mạnh nhất trên Trái Đất phải hợp tác để chống lại một mối đe dọa vũ trụ.",
  },
  {
    id: 3,
    title: "Black Panther",
    logo: "{assets.marvelLogo}",
    backgroundImage: "/black-panther-wakanda-background.jpg",
    genres: "Hành động | Phiêu lưu | Kỳ tưởng",
    year: 2018,
    duration: "2h 14m",
    description: "Vua của Wakanda phải bảo vệ quốc gia bí ẩn của mình khỏi những kẻ muốn chiếm quyền lực.",
  },
  {
    id: 4,
    title: "Doctor Strange",
    logo: "marvelLogo.svg",
    backgroundImage: "/doctor-strange-magic-background.jpg",
    genres: "Hành động | Phiêu lưu | Kỳ tưởng",
    year: 2016,
    duration: "1h 55m",
    description: "Một bác sĩ phẫu thuật tài ba khám phá những bí mật của ma thuật và trở thành bảo vệ của Trái Đất.",
  },
  {
    id: 5,
    title: "Thor: Ragnarok",
    logo: "/thor-ragnarok-logo.jpg",
    backgroundImage: "/thor-ragnarok-asgard-background.jpg",
    genres: "Hành động | Phiêu lưu | Kỳ tưởng",
    year: 2017,
    duration: "2h 10m",
    description: "Thor phải ngăn chặn sự hủy diệt của Asgard bằng cách tìm kiếm những đồng minh mạnh mẽ.",
  },
];

const HeroSlider = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const timeoutRef = useRef(null);

  // Auto play
  useEffect(() => {
    if (!isAutoPlay) return;

    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % moviesData.length);
    }, 5000);

    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, isAutoPlay]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + moviesData.length) % moviesData.length);
  }, []);

  const goToNext = useCallback(() => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % moviesData.length);
  }, []);

  const goToSlide = useCallback((index) => {
    setIsAutoPlay(false);
    setCurrentIndex(index);
  }, []);

  const currentMovie = moviesData[currentIndex];

  return (
    <div className="relative   w-full h-screen overflow-hidden">
      {/* Background với zoom-in animation */}
      <div
        key={currentMovie.id}
        className="absolute  z-0 inset-0 bg-cover  bg-center animate-in fade-in zoom-in duration-800"
        style={{
          backgroundImage: `url('${currentMovie.backgroundImage}')`,
        }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative  flex flex-col justify-center h-full px-6 md:px-16 lg:px-36 gap-6 mt-20 lg:mt-0">
        {/* Logo */}
        <img
          src={assets.marvelLogo}
          alt={currentMovie.title}
          className="h-11 w-auto animate-in slide-in-from-top duration-600 delay-100"
        />

        {/* Title */}
        <h1 className="text-5xl md:text-7xl md:leading-tight font-semibold max-w-4xl animate-in slide-in-from-bottom duration-600 delay-200">
          {currentMovie.title.split(" ").map((word, i) => (
            <span key={i}>
              {word}{" "}
              {i === 0 && currentMovie.title.includes("of the") && <br />}
            </span>
          ))}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm animate-in slide-in-from-bottom duration-600 delay-300">
          <span>{currentMovie.genres}</span>
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            {currentMovie.year}
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            {currentMovie.duration}
          </div>
        </div>

        {/* Description */}
        <p className="max-w-xl text-gray-300 leading-relaxed animate-in slide-in-from-bottom duration-600 delay-400">
          {currentMovie.description}
        </p>

        {/* Button */}
        <button
          onClick={() => navigate("/movies")}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer text-sm font-medium rounded-full transition-all duration-300 hover:translate-x-1 hover:shadow-lg w-fit animate-in slide-in-from-bottom duration-600 delay-500"
        >
          Khám phá thêm
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:scale-110"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:scale-110"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {moviesData.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-white rounded-full"
                : "w-3 h-3 bg-white/50 border border-white/70 rounded-full hover:bg-white/80"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;