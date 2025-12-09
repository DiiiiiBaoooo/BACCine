import React, { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home';
import AdminLayout from './pages/admin/AdminLayout';
import QuanLyPhim from './pages/admin/QuanLyPhim';
import Dashboard from './pages/admin/Dashboard';
import QuanLyRapPhim from './pages/admin/QuanLyRapPhim';
import QuanLyKhuyenMai from './pages/admin/QuanLyKhuyenMai';
import QuanLyTheTV from './pages/admin/QuanLyTheTV';
import QuanLyThuVienPhim from './pages/admin/QuanLyThuVienPhim';
import QuanLyPhanQuyen from './pages/admin/QuanLyPhanQuyen';

import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import QuanLyGiaVe from './pages/manager/QuanLyGiaVe';
import QuanLyUngVien from './pages/manager/QuanLyUngVien';
import QuanLyTuyenDung from './pages/manager/QuanLyTuyenDung';
import QuanLyBaiViet from './pages/manager/QuanLyBaiViet';
import CreatePost from './pages/manager/CreatePost';
import EmployeeManagement from './pages/manager/EmployeeManagement';
import QuanLyDichVu from './pages/manager/QuanLyDichVu';
import QuanLyLichLamViec from './pages/manager/QuanLyLichLamViec';
import EventRequest from './pages/manager/EventRequest';
import QuanLyPhongChieu from './pages/projectionist/QuanLyPhongChieu';
import QuanLyLichChieu from './pages/projectionist/QuanLyLichChieu';
import AttendanceHistory from './pages/manager/AttendanceHistory';

import EmployeeLayout from './pages/Employee/EmployeeLayout';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import DatVe from './pages/Employee/DatVe';
import ChonGhe from './pages/Employee/ChonGhe';
import ChonDichVu from './pages/Employee/ChonDichVu';
import ThanhToan from './pages/Employee/ThanhToan';
import LichLamViec from './pages/Employee/LichLamViec';
import InVe from './pages/Employee/InVe';
import FaceCheckin from './pages/Employee/FaceCheckin';
import FaceCheckOut from './pages/Employee/FaceCheckOut';

import Header from './components/Header';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import UpdateProfile from './pages/UpdateProfile';
import useAuthUser from './hooks/useAuthUser';
import Profile from './pages/Account/Profile';
import Recruiments from './pages/Recruiments';
import Blog from './pages/blogs/Blog';
import BlogDetail from './pages/blogs/BlogDetail';
import EditBlog from './pages/blogs/EditBlog';
import ThongTinDatCho from './pages/ThongTinDatCho';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import RapPhim from './pages/RapPhim';
import Membership from './pages/Membership';
import PaymentSelection from './pages/PaymentSelection';
import QRPayment from './pages/Payment/QRPayment';
import MyTicket from './pages/MyTicket';
import TicketDetails from './pages/TicketDetails';
import PrintTicket from './pages/PrintTicket';
import FaceRegister from './components/FaceRegister';
import Event from './pages/Event';
import ChatWidget from './components/Chat/ChatWidget';
import './components/Chat/Chat.css';
import XemPhim from './pages/XemPhim';
import ThuVienPhim from './pages/ThuVienPhim';
import PaymentFail from './pages/Payment/PaymentFail';
import VideoPurchasePage from './pages/VideoPurchasePage';
import VideoQRPayment from './pages/VideoQRPayment';
import MyEvent from './pages/MyEvent';
import EventQRPayment from './pages/EventQRPayment';
import MyUuDai from './pages/MyUuDai';
import OpenAIChatbot from './components/OpenAIChatbot';

// ==================== PROTECTED ROUTES ====================

// 1. Bảo vệ role + update profile
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoading, authUser } = useAuthUser();
  const navigate = useNavigate();

  if (isLoading) return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.isUpdateProfile === 0) return <Navigate to="/update-profile" replace />;

  if (requiredRole && authUser.role !== requiredRole) {
    toast.error(`Chỉ ${requiredRole === 'admin' ? 'Admin' : 'Manager'} mới được truy cập!`, { theme: 'dark' });
    return <Navigate to="/" replace />;
  }

  return children;
};

// 2. Bảo vệ Manager & Employee: BẮT BUỘC phải có cinemaId
const RequireCinemaAccess = ({ children, role }) => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser && authUser.role === role && !authUser.cinemaId) {
      toast.error("Bạn chưa được phân công quản lý rạp phim nào. Vui lòng liên hệ Admin!", {
        theme: "dark",
        toastId: "no-cinema-access", // Ngăn toast bị lặp
        autoClose: 6000,
      });
      navigate("/", { replace: true });
    }
  }, [authUser, role, navigate]);

  if (!authUser || (authUser.role === role && !authUser.cinemaId)) {
    return null; // Đang redirect
  }

  return children;
};

// =========================================================

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, authUser } = useAuthUser();
  const cinemaId = authUser?.cinemaId;

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isManagerRoute = location.pathname.startsWith('/manager');
  const isEmployeeRoute = location.pathname.startsWith('/employee');
  const isPrintTicket = location.pathname.startsWith('/inve');

  // Redirect sau khi login
  useEffect(() => {
    if (!isLoading && authUser) {
      if (location.pathname === "/login" || location.pathname === "/signup") {
        if (authUser.isUpdateProfile === 0) {
          navigate("/update-profile", { replace: true });
          return;
        }

        if (authUser.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (authUser.role === "manager") {
          if (cinemaId) navigate("/manager", { replace: true });
          else {
            toast.error("Bạn chưa được phân công rạp phim!", { toastId: "login-no-cinema" });
            navigate("/", { replace: true });
          }
        } else if (authUser.role === "employee") {
          if (cinemaId) navigate("/employee", { replace: true });
          else {
            toast.error("Bạn chưa được phân công làm việc tại rạp nào!", { toastId: "login-no-cinema" });
            navigate("/", { replace: true });
          }
        } else {
          navigate("/", { replace: true });
        }
      }
    }
  }, [isLoading, authUser, cinemaId, navigate, location.pathname]);

  // Chat conditions
  const shouldShowChat = authUser && !isPrintTicket && !['/login', '/signup', '/update-profile'].includes(location.pathname);
  const shouldShowCustomerChat = shouldShowChat && authUser?.role === 'user' && !isAdminRoute && !isManagerRoute && !isEmployeeRoute;

  const chatUserType = authUser?.role === 'employee' || authUser?.role === 'manager' ? 'employee' : authUser?.role === 'user' ? 'customer' : null;

  return (
    <>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      {/* Header chỉ hiện ở trang khách */}
      {!isPrintTicket && !isAdminRoute && !isManagerRoute && !isEmployeeRoute && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recruiments" element={<Recruiments />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/profile" element={<Profile />} />

        {/* Public Routes */}
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:cinemaId/:date" element={<SeatLayout />} />
        <Route path="/booking" element={<ThongTinDatCho cinemaId={cinemaId} />} />
        <Route path="/rapchieu" element={<RapPhim />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blogs/:cinema_id/:post_id" element={<BlogDetail />} />
        <Route path="/posts/edit/:id" element={<EditBlog cinemaId={cinemaId} />} />
        <Route path="/events" element={<Event />} />
        <Route path="/my-events" element={<MyEvent />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/payment" element={<PaymentSelection />} />
        <Route path="/qr-payment" element={<QRPayment />} />
        <Route path="/tickets" element={<MyTicket />} />
        <Route path="/ticket-details/:orderId" element={<TicketDetails />} />
        <Route path="/inve/:order_id" element={<PrintTicket />} />
        <Route path="/payment-failed" element={<PaymentFail />} />
        <Route path="/video" element={<ThuVienPhim />} />
        <Route path="/xem-phim/:id" element={<XemPhim />} />
        <Route path="/video-purchase/:id" element={<VideoPurchasePage />} />
        <Route path="/video-purchase/qr-payment" element={<VideoQRPayment />} />
        <Route path="/event-payment/:id/:amount" element={<EventQRPayment />} />
        <Route path="/uudai" element={<MyUuDai />} />
        <Route path="/face-register/:employeeId/:cinemaClusterId" element={<FaceRegister />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="qlphim" element={<QuanLyPhim />} />
          <Route path="qlrap" element={<QuanLyRapPhim />} />
          <Route path="qlkm" element={<QuanLyKhuyenMai />} />
          <Route path="qlttv" element={<QuanLyTheTV />} />
          <Route path="qltvp" element={<QuanLyThuVienPhim />} />
          <Route path="qlpq" element={<QuanLyPhanQuyen />} />
        </Route>

        {/* MANAGER ROUTES - BẮT BUỘC CÓ CINEMA ID */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute requiredRole="manager">
              <RequireCinemaAccess role="manager">
                <ManagerLayout />
              </RequireCinemaAccess>
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboard cinemaId={cinemaId} />} />
          <Route path="qlgv" element={<QuanLyGiaVe cinemaId={cinemaId} />} />
          <Route path="qluv" element={<QuanLyUngVien cinemaId={cinemaId} />} />
          <Route path="qltd" element={<QuanLyTuyenDung cinemaId={cinemaId} />} />
          <Route path="qlbv" element={<QuanLyBaiViet cinemaId={cinemaId} />} />
          <Route path="qlbv/new" element={<CreatePost cinemaId={cinemaId} />} />
          <Route path="qlnv" element={<EmployeeManagement cinemaId={cinemaId} />} />
          <Route path="qldv" element={<QuanLyDichVu cinemaId={cinemaId} />} />
          <Route path="qlllv" element={<QuanLyLichLamViec cinemaClusterId={cinemaId} />} />
          <Route path="qlsk" element={<EventRequest cinemaId={cinemaId} />} />
          <Route path="qlpc" element={<QuanLyPhongChieu cinemaId={cinemaId} />} />
          <Route path="qllc" element={<QuanLyLichChieu cinemaId={cinemaId} />} />
          <Route path="qlcc" element={<AttendanceHistory cinemaClusterId={cinemaId} />} />
        </Route>

        {/* EMPLOYEE ROUTES - BẮT BUỘC CÓ CINEMA ID */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute requiredRole="employee">
              <RequireCinemaAccess role="employee">
                <EmployeeLayout />
              </RequireCinemaAccess>
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeDashboard />} />
          <Route path="datve" element={<DatVe cinemaId={cinemaId} />} />
          <Route path="chon-ghe" element={<ChonGhe />} />
          <Route path="chon-dich-vu" element={<ChonDichVu />} />
          <Route path="thanh-toan" element={<ThanhToan />} />
          <Route path="inve" element={<InVe />} />
          <Route path="llv" element={<LichLamViec cinemaClusterId={cinemaId} />} />
          <Route path="face-checkin/:employeeId/:scheduleId/:cinemaClusterId" element={<FaceCheckin cinemaClusterId={cinemaId} />} />
          <Route path="face-checkout/:employeeId/:scheduleId/:cinemaClusterId" element={<FaceCheckOut cinemaClusterId={cinemaId} />} />
        </Route>
      </Routes>

      {/* Chat Widget */}
      {shouldShowChat && chatUserType === 'employee' && (
        <ChatWidget
          currentUser={{
            id: String(authUser?.user_id || authUser?.id),
            name: authUser?.name || authUser?.full_name || 'Nhân viên',
            type: 'employee',
            cinemaId: cinemaId
          }}
        />
      )}

      {shouldShowChat && chatUserType === 'customer' && (
        <ChatWidget
          currentUser={{
            id: String(authUser?.user_id || authUser?.id),
            name: authUser?.name || authUser?.full_name || 'Khách hàng',
            type: 'customer',
            cinemaId: cinemaId
          }}
        />
      )}

      {shouldShowCustomerChat && (
        <OpenAIChatbot
          currentUser={{
            id: authUser.id || authUser.user_id,
            name: authUser.name || authUser.full_name || 'Khách',
            cinemaId: cinemaId
          }}
        />
      )}
    </>
  );
};

export default App;