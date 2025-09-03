import React, { useState, useEffect } from 'react'
import Title from '../../components/Title'
import { StarIcon, CheckIcon, X } from 'lucide-react'
import { kConverter } from '../../lib/kConverter'
import { dateFormat } from '../../lib/dateFormat'
import MovieCardSkeleton from '../../components/MovieCardSkeleton'
import axios from "axios"
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const QuanLyPhim = () => {
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
const [filteredNowPlaying, setFilteredNowPlaying] = useState([]);
const [isLoadingNow, setIsLoadingNow] = useState(true);
const [errorNow, setErrorNow] = useState(null);
const [searchNowTerm, setSearchNowTerm] = useState("");
  const [selectedNewMovie, setSelectedNewMovie] = useState(null)
  const [editingNewMovie, setEditingNewMovie] = useState(null)
  const [upcomingMovies, setUpcomingMovies] = useState([])
  const [searchNewTerm, setSearchNewTerm] = useState("")
  const [filteredNewMovies, setFilteredNewMovies] = useState([])
  const [isLoadingNew, setIsLoadingNew] = useState(true)
  const [error, setError] = useState(null)
  const [importCost,setImportCost] = useState(null);
  const [startDate,setStartDate]= useState(null);
  const [endDate,setEndDate]= useState(null)
  const [addingMovies,setAddingMovies]= useState(false);

  const fetchingUpcomingMovies = async () => {
    try {
      setIsLoadingNew(true);setError(null);
      const {data} = await axios.get("/api/movies/upcoming");
      console.log('API res=',data);
      if(data && data.success && Array.isArray(data.movies)) {
        setUpcomingMovies(data.movies);

        setFilteredNewMovies(data.movies);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Không thể tải danh sách phim. Vui lòng thử lại sau.');
    } finally {
      setIsLoadingNew(false);
    }
  }
  const fetchingNowPlayingMovies = async () => {
    try {
      setIsLoadingNow(true); setErrorNow(null);
      const { data } = await axios.get("/api/movies/");
      if (data && data.success && Array.isArray(data.movies)) {
        setNowPlayingMovies(data.movies);
        setFilteredNowPlaying(data.movies);
      }
    } catch (error) {
      console.error("Error fetching now playing movies:", error);
      setErrorNow("Không thể tải danh sách phim đang chiếu.");
    } finally {
      setIsLoadingNow(false);
    }
  };
  // Fetch movies on component mount
  useEffect(() => {
    fetchingUpcomingMovies();
    fetchingNowPlayingMovies();
  }, []);
  useEffect(() => {
    if (!searchNowTerm.trim()) {
      setFilteredNowPlaying(nowPlayingMovies);
    } else {
      setFilteredNowPlaying(
        nowPlayingMovies.filter((movie) =>
          movie.title.toLowerCase().includes(searchNowTerm.toLowerCase())
        )
      );
    }
  }, [searchNowTerm, nowPlayingMovies]);
  // --- useEffect lọc phim theo searchNewTerm (sắp chiếu) ---
  useEffect(() => {
    if (!searchNewTerm.trim()) {
      setFilteredNewMovies(upcomingMovies)
    } else {
      const result = upcomingMovies.filter((movie) =>
        movie.title.toLowerCase().includes(searchNewTerm.toLowerCase())
      )
      setFilteredNewMovies(result)
    }
  }, [searchNewTerm, upcomingMovies])


  const handleSubmitNew = async (e) => {
    e.preventDefault();
    setAddingMovies(true);
  
    try {
      if (!selectedNewMovie) {
        toast.error("Chưa chọn phim");
        return;
      }
      if (!editingNewMovie.start_date) {
        toast.error("Chưa chọn ngày khởi chiếu");
        return;
      }
      if (!editingNewMovie.end_date) {
        toast.error("Chưa chọn ngày dự kiến kết thúc");
        return;
      }
      if (!editingNewMovie.import_cost) {
        toast.error("Chưa nhập giá nhập phim");
        return;
      }
  
      // Gọi API lưu phim
      const { data } = await axios.post("/api/movies/add-movie", {
        movieId: editingNewMovie.id,
        title: editingNewMovie.title,
        overview: editingNewMovie.overview,
        release_date: editingNewMovie.release_date,
        start_date: editingNewMovie.start_date,
        end_date: editingNewMovie.end_date,
        import_cost: editingNewMovie.import_cost,
        poster_path: editingNewMovie.poster_path,
        backdrop_path: editingNewMovie.backdrop_path,
        original_language: editingNewMovie.original_language,
        vote_average: editingNewMovie.vote_average,
        vote_count: editingNewMovie.vote_count,
      });
  
      if (data.success) {
        toast.success("Lưu phim thành công!");
        setEditingNewMovie(null); // Đóng modal
        fetchingUpcomingMovies(); // Refresh danh sách phim sắp chiếu
        fetchingNowPlayingMovies(); // Refresh danh sách phim đang chiếu
      } else {
        toast.error(data.message || "Không thể lưu phim");
      }
    } catch (error) {
      console.error("Error adding movie:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu phim");
    } finally {
      setAddingMovies(false);
    }
  };

  return (
    <>
      <Title text1="Quản lý" text2="Phim" />

      {/* SEARCH BOX */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-lg font-medium">Danh sách phim sắp chiếu</p>
        <input
          type="text"
          placeholder="Tìm phim theo tên..."
          value={searchNewTerm}
          onChange={(e) => setSearchNewTerm(e.target.value)}
          className="px-4 py-2 w-72 rounded-lg border border-gray-400 focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {error ? (
            <div className="w-full text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={fetchingUpcomingMovies}
                className="px-4 py-2 bg-primary hover:bg-primary-dull text-white rounded-lg transition "
              >
                Thử lại
              </button>
            </div>
          ) : isLoadingNew ? (
            Array.from({ length: 6 }).map((_, index) => (
              <MovieCardSkeleton key={index} delay={index * 0.15} />
            ))
          ) : filteredNewMovies.length > 0 ? (
            filteredNewMovies.map((movie, index) => (
              <div
                key={movie.id}
                onClick={() => {
                  setSelectedNewMovie(movie.id)
                  setEditingNewMovie({ ...movie })
                }}
                className={`relative w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 animate-fade-in-stagger`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={movie.poster_path ? (image_base_url + movie.poster_path) : '/placeholder-poster.jpg'}
                    alt={movie.title}
                    title={movie.title}
                    className="w-full object-cover brightness-90"
                    onError={(e) => {
                      e.target.src = '/placeholder-poster.jpg';
                    }}
                  />
                  <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                    <p className="flex items-center gap-1 text-white ">
                      <StarIcon className="w-4 h-4 text-primary fill-primary" />
                      {movie.vote_average ? (typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : parseFloat(movie.vote_average).toFixed(1)) : 'N/A'}
                    </p>
                    <p className="text-gray-300">
                      {movie.vote_count ? (typeof movie.vote_count === 'number' ? kConverter(movie.vote_count) : kConverter(parseInt(movie.vote_count))) + ' Votes' : 'No votes'}
                    </p>
                  </div>
                </div>
                {selectedNewMovie === movie.id && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                    <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                )}
                <p className="font-medium truncate">{movie.title}</p>
                <p className="text-gray-400 text-sm">
                  {movie.release_date ? dateFormat(movie.release_date) : 'Chưa có ngày'}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 mt-4">Không tìm thấy phim nào.</p>
          )}
        </div>
      </div>

      {/* modal nhập phim giữ nguyên (editingNewMovie) */}
      {editingNewMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setEditingNewMovie(null)}
          />
          {/* modal */}
          <div className="relative w-[92vw] max-w-4xl bg-gray-900 text-white rounded-2xl shadow-2xl p-6 md:p-8 z-10">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
              onClick={() => setEditingNewMovie(null)}
              aria-label="Đóng"
            >
              <X size={22} />
            </button>

            <h2 className="text-2xl font-bold mb-6">Nhập phim</h2>
            {/* giữ nguyên form nhập như bạn viết */}
            <form onSubmit={handleSubmitNew} className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Poster preview */} <div className="md:col-span-1 flex flex-col items-center"> <img src={image_base_url + editingNewMovie.poster_path} alt={editingNewMovie.title} className="w-40 h-60 object-cover rounded-lg shadow" /> <p className="text-sm text-gray-400 mt-2 italic">Poster phim</p> </div> {/* Thông tin nhập */} <div className="md:col-span-2 space-y-4"> {/* Tên phim */} <div> <label className="block text-sm font-medium mb-1">Tên phim</label> <input type="text" value={editingNewMovie.title} onChange={(e) => setEditingNewMovie({ ...editingNewMovie, title: e.target.value }) } className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-green-600" placeholder="Nhập tên phim" required /> </div> {/* Ngày chiếu */} <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-sm font-medium mb-1"> Ngày phát hành </label> <input type="date" value={editingNewMovie.release_date || ""} onChange={(e) => setEditingNewMovie({ ...editingNewMovie, release_date: e.target.value, }) } className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-green-600" /> </div> <div> <label className="block text-sm font-medium mb-1"> Ngày khởi chiếu </label> <input type="date" value={editingNewMovie.start_date || ""} onChange={(e) => setEditingNewMovie({ ...editingNewMovie, start_date: e.target.value, }) } className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-green-600" /> </div> </div> {/* Ngày kết thúc */} <div> <label className="block text-sm font-medium mb-1"> Ngày dự kiến kết thúc </label> <input type="date" value={editingNewMovie.end_date || ""} onChange={(e) => setEditingNewMovie({ ...editingNewMovie, end_date: e.target.value }) } className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-green-600" /> </div> {/* Giá vé + Giá nhập */} <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-sm font-medium mb-1"> Giá nhập phim (VNĐ) </label> <input type="number" value={editingNewMovie.import_cost || ""} onChange={(e) => setEditingNewMovie({ ...editingNewMovie, import_cost: e.target.value, }) } className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-green-600" placeholder="VD: 50000000" /> </div> </div> {/* Mô tả */} <div> <label className="block text-sm font-medium mb-1">Mô tả</label> <textarea value={editingNewMovie.overview || ""} onChange={(e) => setEditingNewMovie({ ...editingNewMovie, overview: e.target.value, }) } rows={4} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-green-600" placeholder="Tóm tắt nội dung phim…" /> </div> </div> </div> {/* Nút hành động */} <div className="flex justify-end gap-3 pt-4"> <button type="button" onClick={() => setEditingNewMovie(null)} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition" > Hủy </button> <button type="submit" className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow transition" > Lưu </button> </div>
            </form>
          </div>
        </div>
      )}
      {/* SEARCH BOX NOW PLAYING */}
<div className="mt-12 flex justify-between items-center">
  <p className="text-lg font-medium">Danh sách phim đang chiếu</p>
  <input
    type="text"
    placeholder="Tìm phim theo tên..."
    value={searchNowTerm}
    onChange={(e) => setSearchNowTerm(e.target.value)}
    className="px-4 py-2 w-72 rounded-lg border border-gray-400 focus:ring-2 focus:ring-green-600 focus:outline-none"
  />
</div>

<div className="overflow-x-auto pb-4">
  <div className="group flex flex-wrap gap-4 mt-4 w-max">
    {errorNow ? (
      <div className="w-full text-center py-8">
        <p className="text-red-400 mb-4">{errorNow}</p>
        <button 
          onClick={fetchingNowPlayingMovies}
          className="px-4 py-2 bg-primary hover:bg-primary-dull text-white rounded-lg transition"
        >
          Thử lại
        </button>
      </div>
    ) : isLoadingNow ? (
      Array.from({ length: 6 }).map((_, index) => (
        <MovieCardSkeleton key={index} delay={index * 0.15} />
      ))
    ) : filteredNowPlaying.length > 0 ? (
      filteredNowPlaying.map((movie, index) => (
        <div
          key={movie.id}
          className={`relative w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 animate-fade-in-stagger`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={movie.poster_path ? (image_base_url + movie.poster_path) : '/placeholder-poster.jpg'}
              alt={movie.title}
              title={movie.title}
              className="w-full object-cover brightness-90"
              onError={(e) => { e.target.src = '/placeholder-poster.jpg' }}
            />
            <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
              <p className="flex items-center gap-1 text-white ">
                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                {movie.vote_average ? Number(movie.vote_average).toFixed(1) : "N/A"}
              </p>
              <p className="text-gray-300">
                {movie.vote_count ? kConverter(movie.vote_count) + " Votes" : "No votes"}
              </p>
            </div>
          </div>
          <p className="font-medium truncate">{movie.title}</p>
          <p className="text-gray-400 text-sm">
            {movie.release_date ? dateFormat(movie.release_date) : "Chưa có ngày"}
          </p>
        </div>
      ))
    ) : (
      <p className="text-gray-500 mt-4">Không tìm thấy phim nào.</p>
    )}
  </div>
</div>
    </>
  )
}

export default QuanLyPhim
