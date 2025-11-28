import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import useAuthUser from "../hooks/useAuthUser";
import { createEventRequest } from "../lib/api";
import axios from "axios"; // Thêm dòng này nếu chưa import

const EventRequestForm = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [cinemas, setCinemas] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  const [formData, setFormData] = useState({
    cinema_id: "",
    movie_id: "",
    event_date: "",
    start_time: "",
    guest_count: 50,
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    special_requirements: "",
  });

  // Tự động điền thông tin user
  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        contact_name: authUser.name || authUser.fullname || "",
        contact_phone: authUser.phone || "",
        contact_email: authUser.email || "",
      }));
    }
  }, [authUser]);

  // Mutation gửi yêu cầu
  const mutation = useMutation({
    mutationFn: createEventRequest,
    onSuccess: () => {
      toast.success("Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ trong 24h");
      setFormData((prev) => ({
        cinema_id: "",
        movie_id: "",
        event_date: "",
        start_time: "",
        guest_count: 50,
        contact_name: authUser?.name || authUser?.fullname || prev.contact_name,
        contact_phone: authUser?.phone || prev.contact_phone,
        contact_email: authUser?.email || prev.contact_email,
        special_requirements: "",
      }));
      setMovies([]);
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Gửi thất bại");
    },
  });

  // Lấy danh sách rạp – SỬA CHỖ NÀY
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await axios.get("/api/cinemas");
        // API trả về: { success: true, cinemas: [...] }
        if (res.data.success && Array.isArray(res.data.cinemas)) {
          setCinemas(res.data.cinemas);
        } else {
          setCinemas([]);
          toast.error("Dữ liệu rạp không hợp lệ");
        }
      } catch (err) {
        console.error("Lỗi tải rạp:", err);
        toast.error("Không tải được danh sách rạp");
        setCinemas([]);
      }
    };
    fetchCinemas();
  }, []);

  // Lấy phim theo rạp
  const fetchMoviesByCinema = async (cinemaId) => {
    if (!cinemaId) {
      setMovies([]);
      return;
    }
    setLoadingMovies(true);
    try {
      const res = await axios.get(`/api/cinemas/planmovies/${cinemaId}`);
      const allMovies = res.data.plans?.flatMap(p => p.movies || []) || [];
      const unique = Array.from(new Map(allMovies.map(m => [m.movie_id, m])).values());
      setMovies(unique);
    } catch (err) {
      toast.error("Không tải được danh sách phim");
      setMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleCinemaChange = (e) => {
    const cinemaId = e.target.value;
    setFormData({ ...formData, cinema_id: cinemaId, movie_id: "" });
    fetchMoviesByCinema(cinemaId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cinema_id) return toast.error("Vui lòng chọn rạp");
    if (!formData.movie_id) return toast.error("Vui lòng chọn phim");

    const payload = {
      ...formData,
      movie_id: Number(formData.movie_id),
      guest_count: Number(formData.guest_count),
      ...(authUser && { user_id: authUser.id }),
    };

    mutation.mutate(payload);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-center flex-shrink-0">
        <h3 className="text-2xl md:text-3xl font-bold text-white">ĐẶT SUẤT CHIẾU RIÊNG</h3>
        <p className="text-red-100 text-xs md:text-sm mt-1">
          {authUser ? `Xin chào, ${authUser.name || authUser.fullname}!` : "Nhận báo giá nhanh trong 24h"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* RẠP & PHIM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Chọn rạp *</label>
            <select
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none transition text-xs md:text-sm"
              value={formData.cinema_id}
              onChange={handleCinemaChange}
            >
              <option value="">-- Chọn rạp --</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cinema_name} {/* SỬA CHỖ NÀY: dùng cinema_name, không dùng c.name */}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Chọn phim *</label>
            <select
              required
              disabled={!formData.cinema_id || loadingMovies}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none disabled:opacity-50 text-xs md:text-sm"
              value={formData.movie_id}
              onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })}
            >
              <option value="">
                {loadingMovies ? "Đang tải phim..." : "-- Chọn phim --"}
              </option>
              {movies.length === 0 && formData.cinema_id && !loadingMovies && (
                <option disabled>Không có phim đang chiếu</option>
              )}
              {movies.map((m) => (
                <option key={m.movie_id} value={m.movie_id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Các phần còn lại giữ nguyên... */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-2">
            <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Ngày chiếu *</label>
            <input
              type="date"
              required
              min={today}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none text-xs md:text-sm"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Giờ *</label>
            <input
              type="time"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none text-xs md:text-sm"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Khách</label>
            <input
              type="number"
              min="10"
              max="500"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none text-xs md:text-sm"
              value={formData.guest_count}
              onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
            />
          </div>
        </div>

        {/* Thông tin liên hệ + yêu cầu đặc biệt + nút gửi */}
        {/* (giữ nguyên như cũ, không cần sửa) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Họ tên *</label>
            <input type="text" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none text-xs md:text-sm" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Số điện thoại *</label>
            <input type="tel" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none text-xs md:text-sm" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Email *</label>
          <input type="email" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none text-xs md:text-sm" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} />
        </div>

        <div>
          <label className="block text-red-400 font-semibold mb-1.5 text-xs md:text-sm">Yêu cầu đặc biệt (tùy chọn)</label>
          <textarea rows="2" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none resize-none text-xs md:text-sm" placeholder="Trang trí sinh nhật, đồ ăn riêng, karaoke..." value={formData.special_requirements} onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })} />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || loadingMovies}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-70 text-sm md:text-base uppercase tracking-wider shadow-lg"
        >
          {mutation.isPending ? "Đang gửi..." : "Gửi yêu cầu ngay"}
        </button>
      </form>

      <div className="bg-black/70 px-5 py-3 text-center border-t border-gray-800 flex-shrink-0">
        <p className="text-gray-300 text-xs">
          Hotline: <span className="text-red-400 font-bold">1900 1234</span> (24/7)
        </p>
      </div>
    </div>
  );
};

export default EventRequestForm;