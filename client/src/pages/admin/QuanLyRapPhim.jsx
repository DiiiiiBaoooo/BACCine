import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
import { dateFormat } from "../../lib/dateFormat";
// Initialize Socket.IO client
const socket = io("https://bac-cine.vercel.app/", {
  cors: {
    origin: "*",
  },
  transports: ['polling', 'websocket'], // Try polling first
  upgrade: false // Prevent automatic upgrade to WebSocket
});

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-200">
      {children}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-100">{value}</span>
    </div>
  );
}

function DetailDrawer({ open, onClose, cinema, onSuccess, onOpenPlanModal }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [rooms, setRooms] = useState(1);
  const [managerId, setManagerId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plans, setPlans] = useState([]);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [managers, setManagers] = useState([]);

  // Fetch provinces and managers
  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/v1/p/").then((res) => {
      setProvinces(res.data);
    });
    axios.get("/api/cinemas/managers").then((res) => setManagers(res.data.managers));
  }, []);

  // Fetch districts based on selected province (edit mode) or cinema province_code (view mode)
  useEffect(() => {
    const provinceCode = isEditMode ? province : cinema?.province_code;
    if (provinceCode) {
      axios.get("https://provinces.open-api.vn/api/v1/d/").then((res) => {
        setDistricts(res.data.filter((d) => d.province_code === Number(provinceCode)));
        if (isEditMode && province !== cinema?.province_code) {
          setDistrict("");
        }
      });
    } else {
      setDistricts([]);
      setDistrict("");
    }
  }, [cinema?.province_code, province, isEditMode]);

  // Fetch plans for the cinema
  useEffect(() => {
    if (open && cinema?.id) {
      axios
        .get(`/api/cinemas/getPlanMovie/${cinema.id}`)
        .then((res) => setPlans(res.data.plans || []))
        .catch((err) => console.error("Lỗi tải kế hoạch:", err.message));
    }
  }, [open, cinema?.id]);

  // Initialize form with cinema data when entering edit mode
  useEffect(() => {
    if (cinema && isEditMode) {
      setName(cinema.cinema_name || "");
      setDescription(cinema.description || "");
      setProvince(cinema.province_code || "");
      setDistrict(cinema.district_code || "");
      setAddressDetail(cinema.address || "");
      setRooms(cinema.rooms || 1);
      setManagerId(cinema.manager_id || "");
      setPhone(cinema.phone || "");
      setEmail(cinema.email || "");
    }
  }, [cinema, isEditMode]);

  // Handle form submission for updating cinema
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/cinemas/update/${cinema.id}`, {
        name,
        description,
        manager_id: managerId,
        phone,
        email,
        province_code: province,
        district_code: district,
        address_details: addressDetail,
        rooms,
      });
      setIsEditMode(false);
      onSuccess?.();
    } catch (error) {
      console.error("Lỗi cập nhật rạp:", error.message);
    }
  };

  if (!open || !cinema) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <section className="absolute right-0 top-0 h-full w-full sm:w-[720px] bg-gray-900 shadow-2xl p-6 overflow-y-auto text-gray-100">
        <header className="flex items-start justify-between gap-4 border-b border-gray-700 pb-4">
          <div>
            <h2 className="text-xl font-bold">{cinema.cinema_name}</h2>
            <div className="mt-1 text-sm text-gray-400">{cinema.address}</div>
          </div>
          <div className="flex gap-2">
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="rounded-full border border-gray-600 px-3 py-1 text-sm hover:bg-gray-800"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={() => onOpenPlanModal(cinema.id)}
              className="rounded-full border border-gray-600 px-3 py-1 text-sm hover:bg-gray-800"
            >
              Gửi kế hoạch
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-gray-600 px-3 py-1 text-sm hover:bg-gray-800"
            >
              Đóng
            </button>
          </div>
        </header>

        {isEditMode ? (
          <form onSubmit={handleUpdate} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm">Tên rạp</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm">Mô tả</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-sm">Hotline</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm">Thành phố</span>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                required
              >
                <option value="">-- Chọn thành phố --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm">Quận/Huyện</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                disabled={!province}
                required
              >
                <option value="">-- Chọn quận/huyện --</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm">Địa chỉ chi tiết</span>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm">Quản lý</span>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                required
              >
                <option value="">-- Chọn quản lý --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm">Số phòng chiếu</span>
              <input
                type="number"
                min="1"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              />
            </label>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="rounded-lg border border-gray-600 px-4 py-2 hover:bg-gray-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-500"
              >
                Lưu
              </button>
            </div>
          </form>
        ) : (
          <>
            <img
              src="../../../public/rapphim.jpg"
              alt={cinema.cinema_name}
              className="mt-4 aspect-[16/9] w-full rounded-xl object-cover"
            />

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Thành phố" value={cinema.province_name || "N/A"} />
              <Stat label="Quận/Huyện" value={cinema.district_name || "N/A"} />
              <Stat label="Trạng thái" value={cinema.status} />
              <Stat label="Phòng chiếu" value={cinema.rooms} />
              <Stat label="Nhân viên" value={cinema.staffCount} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div>
                <span className="font-medium">Hotline: </span>
                <a href={`tel:${cinema.phone}`} className="text-blue-400 underline">
                  {cinema.phone}
                </a>
              </div>
              <div>
                <span className="font-medium">Email: </span>
                <a
                  href={`mailto:${cinema.email}`}
                  className="text-blue-400 underline"
                >
                  {cinema.email}
                </a>
              </div>
              <div>
                <span className="font-medium">Quản lý rạp: </span>
                {cinema.manager_name}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">Kế hoạch đã gửi</h3>
              {plans.length > 0 ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-700 bg-gray-800 text-sm">
                    <thead>
                      <tr className="bg-gray-700">
                        <th className="border border-gray-600 px-4 py-2 text-left font-medium text-gray-200">ID</th>
                        <th className="border border-gray-600 px-4 py-2 text-left font-medium text-gray-200">Mô tả</th>
                        <th className="border border-gray-600 px-4 py-2 text-left font-medium text-gray-200">Ngày bắt đầu</th>
                        <th className="border border-gray-600 px-4 py-2 text-left font-medium text-gray-200">Ngày kết thúc</th>
                        <th className="border border-gray-600 px-4 py-2 text-left font-medium text-gray-200">Số phim</th>
                        <th className="border border-gray-600 px-4 py-2 text-left font-medium text-gray-200">Danh sách phim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan.plan_id} className="hover:bg-gray-700">
                          <td className="border border-gray-600 px-4 py-2 text-gray-100">{plan.plan_id}</td>
                          <td className="border border-gray-600 px-4 py-2 text-gray-100">{plan.description}</td>
                          <td className="border border-gray-600 px-4 py-2 text-gray-100">{dateFormat(plan.start_date)}</td>
                          <td className="border border-gray-600 px-4 py-2 text-gray-100">{dateFormat(plan.end_date)}</td>
                          <td className="border border-gray-600 px-4 py-2 text-gray-100">{plan.total_movies}</td>
                          <td className="border border-gray-600 px-4 py-2 text-gray-100">{plan.movie_list}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">
                  Chưa có kế hoạch nào được gửi.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}


function AddCinemaModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [rooms, setRooms] = useState(1);
  const [managerId, setManagerId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/v1/p/").then((res) => {
      setProvinces(res.data);
    });
    axios.get("/api/cinemas/managers").then((res) => setManagers(res.data.managers));
  }, []);

  useEffect(() => {
    if (province) {
      axios.get("https://provinces.open-api.vn/api/v1/d/").then((res) => {
        setDistricts(res.data.filter((d) => d.province_code === Number(province)));
      });
    } else {
      setDistricts([]);
      setDistrict("");
    }
  }, [province]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/cinemas/add", {
        name,
        description,
        manager_id: managerId,
        phone,
        email,
        province_code: province,
        district_code: district,
        address_details: addressDetail,
        rooms,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Lỗi thêm rạp:", error.message);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 p-6 text-gray-100 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Thêm Cụm Rạp</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm">Tên rạp</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm">Mô tả</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-sm">Hotline</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm">Thành phố</span>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              required
            >
              <option value="">-- Chọn thành phố --</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Quận/Huyện</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              disabled={!province}
              required
            >
              <option value="">-- Chọn quận/huyện --</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Địa chỉ chi tiết</span>
            <input
              type="text"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm">Quản lý</span>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              required
            >
              <option value="">-- Chọn quản lý --</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Số phòng chiếu</span>
            <input
              type="number"
              min="1"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
            />
          </label>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-600 px-4 py-2 hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-500"
            >
              Thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SendPlanModal({ open, onClose, cinemaId, onSuccess }) {
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);

  // Fetch movies when modal opens
  useEffect(() => {
    if (open) {
      axios.get("/api/movies").then((res) => setMovies(res.data.movies));
    }
  }, [open]);

  const toggleMovie = (id) => {
    setSelectedMovies((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/cinemas/sendPlan/${cinemaId}`, {
        description,
        start_date: startDate,
        end_date: endDate,
        movie_id: selectedMovies,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Lỗi gửi kế hoạch:", err.message);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 p-6 text-gray-100 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Gửi kế hoạch cho rạp</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm">Mô tả</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-sm">Ngày bắt đầu</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm">Ngày kết thúc</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                required
              />
            </label>
          </div>

          <div>
            <span className="text-sm">Chọn phim</span>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-2">
              {movies.map((movie) => (
                <label
                  key={movie.id}
                  className="flex items-center gap-2 py-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMovies.includes(movie.id)}
                    onChange={() => toggleMovie(movie.id)}
                  />
                  <span>{movie.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-600 px-4 py-2 hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-500"
            >
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function QuanLyRapPhim() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [selected, setSelected] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);

  // Fetch cinemas, provinces, and districts on mount
  async function fetchCinemas() {
    try {
      const res = await axios.get("/api/cinemas");
      setCinemas(res.data.cinemas);
    } catch (err) {
      console.error("Lỗi tải dữ liệu rạp:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCinemas();
    axios.get("https://provinces.open-api.vn/api/v1/p/")
      .then((res) => setProvinces(res.data))
      .catch((err) => console.error("Lỗi tải tỉnh/thành phố:", err.message));
    axios.get("https://provinces.open-api.vn/api/v1/d/")
      .then((res) => setAllDistricts(res.data))
      .catch((err) => console.error("Lỗi tải quận/huyện:", err.message));
  }, []);

  // Filter districts for the city filter dropdown
  const filteredDistricts = useMemo(() => {
    return city
      ? allDistricts.filter((d) => d.province_code === Number(city))
      : [];
  }, [city, allDistricts]);

  // WebSocket listeners
  useEffect(() => {
    socket.on("cinemaAdded", (newCinema) => {
      setCinemas((prevCinemas) => [
        ...prevCinemas,
        {
          ...newCinema,
          province_name: provinces.find((p) => p.code === Number(newCinema.province_code))?.name || "N/A",
          district_name: allDistricts.find((d) => d.code === Number(newCinema.district_code))?.name || "N/A",
        },
      ]);
    });

    socket.on("cinemaUpdated", (updatedCinema) => {
      setCinemas((prevCinemas) =>
        prevCinemas.map((cinema) =>
          cinema.id === updatedCinema.id
            ? {
                ...updatedCinema,
                province_name: provinces.find((p) => p.code === Number(updatedCinema.province_code))?.name || "N/A",
                district_name: allDistricts.find((d) => d.code === Number(updatedCinema.district_code))?.name || "N/A",
              }
            : cinema
        )
      );
      if (selected?.id === updatedCinema.id) {
        setSelected({
          ...updatedCinema,
          province_name: provinces.find((p) => p.code === Number(updatedCinema.province_code))?.name || "N/A",
          district_name: allDistricts.find((d) => d.code === Number(updatedCinema.district_code))?.name || "N/A",
        });
      }
    });

    return () => {
      socket.off("cinemaAdded");
      socket.off("cinemaUpdated");
    };
  }, [selected, provinces, allDistricts]);

  // Filter cinemas with province and district names
  const filtered = useMemo(() => {
    return cinemas
      .map((c) => ({
        ...c,
        province_name: provinces.find((p) => p.code === Number(c.province_code))?.name || "N/A",
        district_name: allDistricts.find((d) => d.code === Number(c.district_code))?.name || "N/A",
      }))
      .filter((c) => {
        const matchText = `${c.cinema_name} ${c.address}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchCity = !city || c.province_code === Number(city);
        const matchDistrict = !district || c.district_code === Number(district);
        const matchStatus = status === "Tất cả" || c.status === status;
        return matchText && matchCity && matchDistrict && matchStatus;
      });
  }, [query, city, district, status, cinemas, provinces, allDistricts]);

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 text-gray-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Rạp</h1>
            <p className="text-sm text-gray-400">
              Xem danh sách rạp theo dạng thẻ, click để xem chi tiết.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOpenModal(true)}
              className="rounded-xl bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
            >
              + Thêm rạp
            </button>
            <button className="rounded-xl border border-gray-600 px-4 py-2 hover:bg-gray-800">
              Nhập/Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Tìm rạp theo tên, địa chỉ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả thành phố</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!city}
          >
            <option value="">Tất cả quận/huyện</option>
            {filteredDistricts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["Tất cả", "Active", "Inactive"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-12 text-center text-gray-400">
            Đang tải dữ liệu...
          </div>
        ) : filtered.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <article
                key={c.id}
                onClick={() => setSelected(c)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-sm transition hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src="../../../public/rapphim.jpg"
                    alt={c.cinema_name}
                    className="h-40 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute bottom-2 left-2 hidden gap-2 group-hover:flex">
                    <Pill>{c.province_name}</Pill>
                    <Pill>{c.district_name}</Pill>
                    <Pill>{c.status}</Pill>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-1 text-base font-semibold text-gray-100">
                    {c.cinema_name}
                  </h3>
                  <p className="line-clamp-1 text-sm text-gray-400">
                    {c.address}
                  </p>
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <div className="flex gap-4">
                      <span>🪑 {c.rooms} phòng</span>
                      <span>👥 {c.staffCount} NV</span>
                    </div>
                    <span
                      className={classNames(
                        "rounded-full px-2 py-0.5 text-xs",
                        c.status === "Active"
                          ? "bg-emerald-900 text-emerald-300 border border-emerald-700"
                          : "bg-amber-900 text-amber-300 border border-amber-700"
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-gray-700 bg-gray-800 p-8 text-center text-sm text-gray-400">
            Không tìm thấy rạp phù hợp với bộ lọc.
          </div>
        )}
      </div>

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        cinema={selected}
        onSuccess={fetchCinemas}
        onOpenPlanModal={(cinemaId) => {
          setSelectedCinemaId(cinemaId);
          setOpenPlanModal(true);
        }}
      />
      <AddCinemaModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={fetchCinemas}
      />
      <SendPlanModal
        open={openPlanModal}
        onClose={() => {
          setOpenPlanModal(false);
          setSelectedCinemaId(null);
        }}
        cinemaId={selectedCinemaId}
        onSuccess={() => {
          console.log("Kế hoạch đã gửi thành công");
        }}
      />
    </div>
  );
}