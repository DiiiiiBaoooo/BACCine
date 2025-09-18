import React from 'react';
import { StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import timeFormat from '../lib/timeFormat';

const MovieCard = ({ movie, isSelected, onSelect }) => {
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;
  const navigate = useNavigate();

  // Log movie data for debugging
  console.log('MovieCard movie prop:', movie);
  console.log('MovieCard genres:', movie?.genres);

  // Ensure actors and genres are arrays, default to empty arrays if undefined or null
  const actors = Array.isArray(movie?.actors) ? movie.actors : [];
  const genres = Array.isArray(movie?.genres) ? movie.genres : [];

  return (
    <div className="flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66">
      <img
        onClick={() => {
          navigate(`/movies/${movie.movie_id}`);
          scrollTo(0, 0);
        }}
        src={movie.poster_path ? `${image_base_url}${movie.poster_path}` : '/placeholder-poster.jpg'}
        alt={movie.title || 'Movie poster'}
        className="rounded-lg h-52 w-full object-cover object-right-bottom cursor-pointer"
      />
      <p className="font-semibold mt-2 truncate">{movie.title || 'Unknown Title'}</p>
      <p className='text-sm text-gray-400 mt-2'>
{
    new Date(movie.release_date).getFullYear()
} ఌ︎ {genres.length > 0 ? genres.slice(0, 2).join(' | ') : 'N/A'} |{' '}ఌ︎ {timeFormat(movie.runtime)}

                </p>
      <div className="flex items-center justify-between mt-4 pb-3">
        <button
          onClick={() => {
            navigate(`/movies/${movie.movie_id}`);
            scrollTo(0, 0);
          }}
          className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
        >
          Buy Tickets
        </button>
      </div>
    </div>
  );
};

export default MovieCard;