import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import DateSelect from '../components/DateSelect';
import CineSelect from '../components/CineSelect';
import MovieCard from '../components/MovieCard';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [relatedShows, setRelatedShows] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/showtimes/movies/${id}`);
      if (data.success) {
        setShow(data);
      } else {
        setError('Failed to load movie details.');
        toast.error('Failed to load movie details.');
      }
    } catch (error) {
      console.error('Error fetching show:', error.response || error.message);
      setError('An error occurred while fetching movie details.');
      toast.error('An error occurred while fetching movie details.');
    }
  };

  useEffect(() => {
    if (id) {
      getShow();
    } else {
      setError('Invalid movie ID.');
      toast.error('Invalid movie ID.');
    }
  }, [id]);

  // Filter showtimes for the selected cinema - Multiple approaches
  const getFilteredDateTime = () => {
    if (!selectedCinema || !show?.dateTime) return [];
    
    // Approach 1: Filter by cinema_id
    let filteredById = show.dateTime.filter(showtime => 
      (showtime.cinema_id || showtime.cinemaId) == selectedCinema.id
    );
    
    // Approach 2: Filter by cinema_name (fallback)
    let filteredByName = [];
    if (filteredById.length === 0) {
      filteredByName = show.dateTime.filter(showtime => 
        showtime.cinema_name === selectedCinema.name
      );
    }
    
    // Approach 3: Try cinema reference
    let filteredByReference = [];
    if (filteredById.length === 0 && filteredByName.length === 0) {
      filteredByReference = show.dateTime.filter(showtime => {
        const showtimeCinemaId = showtime.cinema_id || showtime.cinemaId || showtime.cinema?.id;
        const showtimeCinemaName = showtime.cinema_name || showtime.cinema?.name;
        
        return (
          showtimeCinemaId == selectedCinema.id || 
          showtimeCinemaName === selectedCinema.name
        );
      });
    }
    
    return filteredById.length > 0 ? filteredById : 
           filteredByName.length > 0 ? filteredByName : 
           filteredByReference;
  };

  const filteredDateTime = getFilteredDateTime();

  if (error) {
    return (
      <div className="mt-20 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => navigate('/movies')}
          className="mt-4 px-6 py-2 bg-primary hover:bg-primary-dull rounded-md"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="mt-20">
        <Loading />
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={show.movie.poster_path ? `${image_base_url}${show.movie.poster_path}` : '/placeholder-poster.jpg'}
          className="mx-auto rounded-xl h-104 max-w-70 object-cover"
          alt={show.movie.title || 'Movie poster'}
        />
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">English</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">{show.movie.title}</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {(() => {
    const rating = parseFloat(show.movie.vote_average);
    return isNaN(rating) ? 'N/A' : rating.toFixed(1);
  })()}
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">{show.movie.overview}</p>
          <p>
            {timeFormat(show.movie.runtime)} |{' '}
            {show.movie.genres.length > 0 ? show.movie.genres.slice(0, 2).join(', ') : 'N/A'} |{' '}
            {show.movie.release_date.split('-')[0]}
          </p>
          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95">
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>
            <a
              href="#cineSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </a>
            <button
              onClick={() => {
                /* Implement favorite toggle logic */
              }}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
            >
              <Heart className={`w-5 h-5 ${false ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.actors?.slice(0, 12).map((actor, index) => (
            <div className="flex flex-col items-center text-center" key={actor.id || index}>
              <img
                src={actor.profile_path ? `${image_base_url}${actor.profile_path}` : '/avt.jpg'}
                alt={actor.name}
                className="rounded-full h-20 md:h-20 aspect-square object-cover"
              />
              <p className="font-medium text-xs mt-3">{actor.name}</p>
            </div>
          ))}
        </div>
      </div>
      
      <CineSelect id={show.movie.movie_id} onSelectCinema={setSelectedCinema} />
      
      {/* Show message if no showtimes */}
      {selectedCinema && filteredDateTime.length === 0 && (
        <div className="pt-10">
          <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800 mb-2">No showtimes available</p>
            <p className="text-yellow-600 text-sm">for {selectedCinema.name} on this date</p>
          </div>
        </div>
      )}
      
      {/* DateSelect Component */}
      {selectedCinema && filteredDateTime.length > 0 && (
        <DateSelect 
          dateTime={filteredDateTime} 
          movieId={id} 
          cinemaId={selectedCinema.id}
          cinemaName={selectedCinema.name}
        />
      )}
      
      <p className="text-lg font-medium mt-20 mb-8">You may also like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {relatedShows.slice(0, 4).map((movie) => (
          <MovieCard key={movie.movie_id} movie={movie} />
        ))}
      </div>
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate('/movies');
            window.scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show More
        </button>
      </div>
    </div>
  );
};

export default MovieDetails;