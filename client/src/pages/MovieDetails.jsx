import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import BlurCircle from '../components/BlurCircle';
import { CheckCircle, Heart, MessageSquare, PlayCircleIcon, StarIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import DateSelect from '../components/DateSelect';
import CineSelect from '../components/CineSelect';
import MovieCard from '../components/MovieCard';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import { dateFormat } from '../lib/dateFormat';

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
Xem trailer            </button>
            <a
              href="#cineSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
Đặt vé
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
      
      <p className="text-lg font-medium mt-20">Diễn viên </p>
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
            <p className="text-yellow-800 mb-2">Phim hiện đang không có lịch chiếu </p>
            <p className="text-yellow-600 text-sm"></p>
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
      {/* ===== PHẦN ĐÁNH GIÁ TỪ KHÁN GIẢ - HIỂN THỊ TỪ ĐẦU (theo movie_id) ===== */}
<div className="mt-20">
  <h2 className="text-2xl font-bold text-white mb-8">Đánh giá từ khán giả</h2>

  {/* Nếu chưa có đánh giá */}
  {!show.reviews || show.reviews.length === 0 ? (
    <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
      <MessageSquare className="w-16 h-16 mx-auto text-gray-600 mb-4" />
      <p className="text-gray-400 text-lg">Chưa có đánh giá nào cho bộ phim này</p>
      <p className="text-gray-500 text-sm mt-2">Hãy là người đầu tiên chia sẻ cảm nhận sau khi xem!</p>
    </div>
  ) : (
    <>
      {/* Thống kê tổng quan */}
      <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-gray-400 text-sm">Đánh giá trung bình từ khán giả</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-8 h-8 ${
                      star <= Math.round(show.average_rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-3xl font-bold text-yellow-400">
                {show.average_rating > 0 ? show.average_rating.toFixed(1) : "Chưa có"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold text-white">
              {show.review_count || 0}
            </p>
            <p className="text-gray-400">lượt đánh giá</p>
          </div>
        </div>
      </div>

      {/* Danh sách đánh giá (mới nhất trước, 5 sao trước) */}
      <div className="space-y-6">
        {show.reviews.map((review) => (
          <div
            key={review.review_id}
            className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {review.user_name?.[0]?.toUpperCase() || "K"}
                </div>
                <div>
                  <p className="font-medium text-white">{review.user_name || "Khán giả"}</p>
                  <p className="text-xs text-gray-500">
                    {dateFormat(review.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-5 h-5 ${
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-gray-300 leading-relaxed mt-3 pl-1">{review.comment}</p>
            )}
            {/* Badge verified nếu có vé thật */}
            {review.is_verified_viewer && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                <CheckCircle className="w-4 h-4" />
                Đã xem tại rạp
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nút xem thêm nếu có nhiều */}
      {show.review_count > show.reviews.length && (
        <div className="text-center mt-10">
          <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition">
            Xem thêm đánh giá
          </button>
        </div>
      )}
    </>
  )}
</div>
      <p className="text-lg font-medium mt-20 mb-8">Bạn cũng có thể thích </p>
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
Xem thêm        </button>
      </div>
    </div>
  );
};

export default MovieDetails;