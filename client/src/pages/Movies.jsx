"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { ChevronDown } from "lucide-react";

const Movies = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch phim
  const fetchShowtimes = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/showtimes/all");
      if (response.data.success) {
        setShows(response.data.showtimes);
        setError("");
      } else {
        setError(response.data.message || "Không thể tải danh sách phim");
        toast.error(response.data.message || "Không thể tải danh sách phim");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Lỗi kết nối";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowtimes();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchShowtimes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tách thể loại
  const genres = useMemo(() => {
    const genreSet = new Set();
    shows.forEach((movie) => {
      let genreList = [];
      if (Array.isArray(movie.genres)) {
        genreList = movie.genres;
      } else if (typeof movie.genres === "string") {
        genreList = movie.genres.split(" | ").map((g) => g.trim());
      }
      genreList.forEach((g) => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }, [shows]);

  // Lọc phim
  const filteredShows = useMemo(() => {
    if (selectedGenre === "all") return shows;
    return shows.filter((movie) => {
      if (Array.isArray(movie.genres)) return movie.genres.includes(selectedGenre);
      if (typeof movie.genres === "string") return movie.genres.includes(selectedGenre);
      return false;
    });
  }, [shows, selectedGenre]);

  const currentLabel = selectedGenre === "all" ? "Tất cả thể loại" : selectedGenre;

  return (
    <div className="relative mb-60    px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      {/* Tiêu đề + Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 my-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Đang chiếu</h1>

        {/* Glass Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
              bg-white/10 backdrop-blur-md border border-white/20 text-white
              hover:bg-white/20 hover:shadow-lg hover:shadow-white/5
              transition-all duration-300 group
            `}
          >
            <span>{currentLabel}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => {
                  setSelectedGenre("all");
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-5 py-3 text-sm font-medium transition-all duration-200
                  ${selectedGenre === "all" ? "bg-red-600/20 text-red-400" : "text-gray-300 hover:bg-white/10 hover:text-white"}
                `}
              >
                Tất cả thể loại
              </button>
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setSelectedGenre(genre);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-5 py-3 text-sm font-medium transition-all duration-200
                    ${selectedGenre === genre ? "bg-red-600/20 text-red-400" : "text-gray-300 hover:bg-white/10 hover:text-white"}
                  `}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nội dung */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="mt-8 text-center text-red-400 font-medium">{error}</div>
      ) : filteredShows.length === 0 ? (
        <div className="mt-8 text-center text-gray-400">
          {selectedGenre === "all"
            ? "Không có phim đang chiếu"
            : `Không có phim thể loại "${selectedGenre}"`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredShows.map((movie) => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Movies;