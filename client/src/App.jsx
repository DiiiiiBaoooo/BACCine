import React, { useEffect, useState } from 'react';
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
import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import QuanLyGiaVe from './pages/manager/QuanLyGiaVe';
import Header from './components/Header';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import UpdateProfile from './pages/UpdateProfile';
import useAuthUser from './hooks/useAuthUser';
import Profile from './pages/Account/Profile';
import Recruiments from './pages/Recruiments';
import QuanLyUngVien from './pages/manager/QuanLyUngVien';
import QuanLyTuyenDung from './pages/manager/QuanLyTuyenDung';
import QuanLyBaiViet from './pages/manager/QuanLyBaiViet';
import CreatePost from './pages/manager/CreatePost';
import Blog from './pages/blogs/Blog';
import BlogDetail from './pages/blogs/BlogDetail';
import EditBlog from './pages/blogs/EditBlog';
import EmployeeManagement from './pages/manager/EmployeeManagement';
import ThongTinDatCho from './pages/ThongTinDatCho';
import ProjectionistLayout from './pages/projectionist/ProjectionistLayout';
import ProjectionistDashboard from './pages/projectionist/ProjectionistDashboard';
import QuanLyPhongChieu from './pages/projectionist/QuanLyPhongChieu';
import QuanLyLichChieu from './pages/projectionist/QuanLyLichChieu';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import RapPhim from './pages/RapPhim';

import QuanLyDichVu from './pages/manager/QuanLyDichVu';
import Membership from './pages/Membership';
import PaymentSelection from './pages/PaymentSelection';
import QRPayment from './pages/Payment/QRPayment';
import MyTicket from './pages/MyTicket';
import TicketDetails from './pages/TicketDetails';
import PrintTicket from './pages/PrintTicket';
import EmployeeLayout from './pages/Employee/EmployeeLayout';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import DatVe from './pages/Employee/DatVe';
import ChonGhe from './pages/Employee/ChonGhe';
import ChonDichVu from './pages/Employee/ChonDichVu';
import ThanhToan from './pages/Employee/ThanhToan';
import LichLamViec from './pages/Employee/LichLamViec';
import InVe from './pages/Employee/InVe';
import QuanLyLichLamViec from './pages/manager/QuanLyLichLamViec';
import FaceRegister from './components/FaceRegister';
import FaceCheckin from './pages/Employee/FaceCheckin';
import FaceCheckOut from './pages/Employee/FaceCheckOut';

// IMPORT CHAT COMPONENTS
import ChatWidget from './components/Chat/ChatWidget';
import './components/Chat/Chat.css';

// IMPORT RASA CHATBOT
// import RasaChatbot  from "./components/RasaChatBot"
import XemPhim from './pages/XemPhim';
import ThuVienPhim from './pages/ThuVienPhim';
import QuanLyThuVienPhim from './pages/admin/QuanLyThuVienPhim';
import PaymentFail from './pages/Payment/PaymentFail';
import VideoPurchasePage from './pages/VideoPurchasePage';

// ProtectedRoute component to enforce authentication and role-based access
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const isUpdateProfile = authUser?.isUpdateProfile;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isUpdateProfile === 0) {
    return <Navigate to="/update-profile" replace />;
  }

  if (requiredRole && authUser.role !== requiredRole) {
    const message = requiredRole === "admin" ? "Chỉ Admin được truy cập" : "Chỉ Manager được truy cập";
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
    return <Navigate to="/" replace />;
  }

  return children;
};

// ProtectedRoute component to enforce authentication and role-based access
const ProtecteEmployeeRoute = ({ children, requiredRole, requiredPosition }) => {
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const isUpdateProfile = authUser?.isUpdateProfile;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isUpdateProfile === 0) {
    return <Navigate to="/update-profile" replace />;
  }

  if (requiredRole && authUser.role !== requiredRole) {
    toast.error(`Chỉ ${requiredRole} được truy cập`, { theme: "dark" });
    return <Navigate to="/" replace />;
  }

  if (requiredPosition && authUser.position !== requiredPosition) {
    toast.error(`Chỉ ${requiredPosition} được truy cập`, { theme: "dark" });
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin');
  const Inve = useLocation().pathname.startsWith('/inve');
  const IsEmployee = useLocation().pathname.startsWith('/employee');
  const isManagerRoute = useLocation().pathname.startsWith('/manager');
  const isProjectionist = useLocation().pathname.startsWith('/projectionist');
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const cinema_Id = authUser?.cinemaId;
  const isUpdateProfile = authUser?.isUpdateProfile;

  // State để kiểm soát hiển thị chat
  const [showChat, setShowChat] = useState(false);

  // Redirect to appropriate page after login
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (location.pathname === "/login" || location.pathname === "/signup") {
        if (isUpdateProfile === 0) {
          navigate("/update-profile", { replace: true });
          return;
        }

        if (authUser.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (authUser.role === "manager") {
          navigate("/manager", { replace: true });
        } else if (authUser.role === 'employee') {
          navigate("/employee", { replace: true });
        } else {
          navigate("/", { replace: true }); // role = user
        }
      }
    }
  }, [isLoading, isAuthenticated, isUpdateProfile, navigate, location.pathname, authUser]);

  // Kiểm tra xem có nên hiển thị chat widget không (cho employee/manager)
  const shouldShowChat = isAuthenticated && 
    !Inve && 
    location.pathname !== '/login' && 
    location.pathname !== '/signup' && 
    location.pathname !== '/update-profile' &&
    !location.pathname.startsWith('/inve/');

  // Kiểm tra có nên hiển thị RASA chatbot không (chỉ cho user thường)
  const shouldShowRasaChat = isAuthenticated && 
    !Inve && 
    !isAdminRoute &&
    !isManagerRoute &&
    !isProjectionist &&
    !IsEmployee &&
    authUser?.role === 'user' &&
    location.pathname !== '/login' && 
    location.pathname !== '/signup' && 
    location.pathname !== '/update-profile' &&
    !location.pathname.startsWith('/inve/');

  // Xác định user type cho chat (ChatWidget - cho employee/manager)
  const getChatUserType = () => {
    if (!authUser) return null;
    
    // Employee (staff) và Manager có thể nhận chat từ khách hàng
    if (authUser.role === 'employee' ) {
      return 'employee';
    }
    if (authUser.role === 'manager') {
      return 'employee'; // Manager cũng có thể support
    }
    
    // User bình thường
    if (authUser.role === 'user') {
      return 'customer';
    }
    
    return null; // Admin, Projectionist không dùng chat
  };

  const chatUserType = getChatUserType();

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {!Inve && !IsEmployee && !isAdminRoute && !isManagerRoute && !isProjectionist && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='/recruiments' element={<Recruiments />} />

        {/* Admin Routes */}
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
          <Route path='qltvp' element={<QuanLyThuVienPhim />} />
        </Route>

        {/* Employee Routes */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute requiredRole="employee" requiredPosition="staff">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route path='datve' element={<DatVe cinemaId={cinema_Id} />} />
          <Route path="chon-ghe" element={<ChonGhe />} />
          <Route path="chon-dich-vu" element={<ChonDichVu />} />
          <Route path="thanh-toan" element={<ThanhToan />} />
          <Route path="inve" element={<InVe />} />
          <Route path="llv" element={<LichLamViec cinemaClusterId={cinema_Id} />} />
          <Route path="face-checkin/:employeeId/:scheduleId/:cinemaClusterId" element={<FaceCheckin cinemaClusterId={cinema_Id} />} />
          <Route path="face-checkout/:employeeId/:scheduleId/:cinemaClusterId" element={<FaceCheckOut cinemaClusterId={cinema_Id} />} />
          <Route index element={<EmployeeDashboard />} />
        </Route>

        {/* Manager Routes */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute requiredRole="manager">
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboard cinemaId={cinema_Id} />} />
          <Route path="qlgv" element={<QuanLyGiaVe cinemaId={cinema_Id} />} />
          <Route path="qluv" element={<QuanLyUngVien cinemaId={cinema_Id} />} />
          <Route path='qltd' element={<QuanLyTuyenDung cinemaId={cinema_Id} />} />
          <Route path='qlbv' element={<QuanLyBaiViet cinemaId={cinema_Id} />} />
          <Route path="qlbv/new" element={<CreatePost cinemaId={cinema_Id} />} />
          <Route path='qlnv' element={<EmployeeManagement cinemaId={cinema_Id} />} />
          <Route path='qldv' element={<QuanLyDichVu cinemaId={cinema_Id} />} />
          <Route path='qlllv' element={<QuanLyLichLamViec cinemaClusterId={cinema_Id} />} />
        </Route>

        <Route path="/signup" element={<SignUp />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movies/:id/:cinemaId/:date' element={<SeatLayout />} />
        <Route path='/booking' element={<ThongTinDatCho cinemaId={cinema_Id} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/rapchieu" element={<RapPhim />} />

        <Route path='/membership' element={<Membership />} />
        <Route path='/payment' element={<PaymentSelection />} />
        <Route path="/blogs/:cinema_id/:post_id" element={<BlogDetail />} />
        <Route path="/qr-payment" element={<QRPayment />} />
        <Route path="/posts/edit/:id" element={<EditBlog cinemaId={cinema_Id} />} />
        <Route path='/tickets' element={<MyTicket />} />
        <Route path="/ticket-details/:orderId" element={<TicketDetails />} />
        <Route path="/inve/:order_id" element={<PrintTicket />} />
        <Route path='/payment-failed' element={<PaymentFail />} />
        <Route path="/face-register/:employeeId/:cinemaClusterId" element={<FaceRegister />} />
        <Route path="/video" element={<ThuVienPhim />} />
        <Route path="/xem-phim/:id" element={<XemPhim />} />
        <Route path="/video-purchase/:id" element={<VideoPurchasePage />} />

         
        {/* Projectionist Routes */}
        <Route
          path="/projectionist/*"
          element={
            <ProtecteEmployeeRoute requiredRole="employee" requiredPosition="Projectionist">
              <ProjectionistLayout />
            </ProtecteEmployeeRoute>
          }
        >
          <Route index element={<ProjectionistDashboard />} />
          <Route path='qlpc' element={<QuanLyPhongChieu cinemaId={cinema_Id} />} />
          <Route path='qllc' element={<QuanLyLichChieu cinemaId={cinema_Id} />} />
        </Route>
      </Routes>

      {/* CHAT WIDGET - Hiển thị cho employee/manager */}
      {shouldShowChat && chatUserType === 'employee' && (
        <ChatWidget
          currentUser={{
            id: String(authUser.user_id || authUser.id),
            name: authUser.name || authUser.full_name || 'User',
            type: chatUserType,
            cinemaId: cinema_Id
          }}
        />
      )}
       {/* CHAT WIDGET - Hiển thị cho employee/manager */}
       {shouldShowChat && chatUserType === 'customer' && (
        <ChatWidget
          currentUser={{
            id: String(authUser.user_id || authUser.id),
            name: authUser.name || authUser.full_name || 'User',
            type: chatUserType,
            cinemaId: cinema_Id
          }}
        />
      )}

      {/* {shouldShowRasaChat && authUser && (
        <RasaChatbot
          currentUser={{
            id: authUser.id || authUser.user_id,
            name: authUser.name || authUser.full_name || 'User',
            cinemaId: cinema_Id
          }}
        />
      )} */}
    </>
  );
};

export default App;