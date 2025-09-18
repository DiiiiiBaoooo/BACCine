import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import MovieCard from '../components/MovieCard';
import BlurCircle from '../components/BlurCircle';

const Movies = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Ongoing movies from all cinemas
  const fetchShowtimes = async () => {
    console.log('Fetching Ongoing movies for Movies page');
    setLoading(true);
    try {
      const response = await axios.get('/api/showtimes/all');
      console.log('API Response:', response.data);
      if (response.data.success) {
        setShows(response.data.showtimes);
        setError('');
      } else {
        setError(response.data.message || 'Không thể tải danh sách phim đang chiếu');
        toast.error(response.data.message || 'Không thể tải danh sách phim đang chiếu');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách phim đang chiếu';
      console.error('Fetch Error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch showtimes when component mounts
  useEffect(() => {
    fetchShowtimes();
  }, []);

  // Poll every 30 seconds to refresh Ongoing movies
  useEffect(() => {
    console.log('Starting polling for Ongoing movies');
    const interval = setInterval(() => fetchShowtimes(), 30000);
    return () => {
      console.log('Clearing polling interval');
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative  mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      <h1 className="text-lg font-medium my-4">Now Showing</h1>

      {loading ? (
        <div className="">loading</div>
      ) : error ? (
        <div className="mt-8 text-center text-red-200">{error}</div>
      ) : shows.length === 0 ? (
        <div className="mt-8 text-center text-gray-400">Không có phim đang chiếu</div>
      ) : (
        <div className="flex flex-wrap max-sm:justify-center gap-8">
          {shows.map((movie) => (
            <MovieCard
              key={movie.movie_id} // Use movie_id as key
              movie={movie}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Movies;