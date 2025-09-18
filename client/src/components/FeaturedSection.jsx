import { ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import BlurCircle from './BlurCircle';
import MovieCard from './MovieCard';

const FeaturedSection = () => {
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Ongoing movies from all cinemas
  const fetchShowtimes = async () => {
    console.log('Fetching Ongoing movies from all cinemas');
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
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden">
      <div className="relative flex items-center justify-between pt-20 pb-10">
        <BlurCircle top="0" right="-80px" />
        <p className="text-gray-300 font-medium text-lg">Now Showing</p>
        <button
          onClick={() => navigate('/movies')}
          className="group cursor-pointer flex items-center gap-2 text-sm text-gray-300"
        >
          View All <ArrowRight className="group-hover:translate-x-0.5 transition w-4.5 h-4.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-300">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : error ? (
        <div className="mt-8 text-center text-red-200">{error}</div>
      ) : shows.length === 0 ? (
        <div className="mt-8 text-center text-gray-400">Không có phim đang chiếu</div>
      ) : (
        <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8">
          {shows.slice(0, 4).map((show) => (
            <MovieCard
              key={show.movie_id} // Use movie_id to avoid duplicates
              movie={{
                movie_id: show.movie_id,
                title: show.title,
                poster_path: show.poster_path,
                vote_average: show.vote_average,
                vote_count: show.vote_count,
                release_date: show.release_date,
                runtime: show.runtime, // Add runtime
            genres: show.genres, // Add genres
              }}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate('/movies');
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show More
        </button>
      </div>
    </div>
  );
};

export default FeaturedSection;