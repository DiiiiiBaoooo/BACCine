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
import InVe from './pages/Employee/InVe';
import QuanLyLichLamViec from './pages/manager/QuanLyLichLamViec';
// ProtectedRoute component to enforce authentication and role-based access
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const isUpdateProfile = authUser?.isUpdateProfile;

  if (isLoading) {
    return <div>Loading...</div>; // Optional: Add a loading state
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
    return <Navigate to="/" replace />; // Redirect to home if role doesn't match
  }

  return children;
};
// ProtectedRoute component to enforce authentication and role-based access
const ProtecteEmployeeRoute = ({ children, requiredRole, requiredPosition }) => {
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const isUpdateProfile = authUser?.isUpdateProfile;

  if (isLoading) {
    return <div>Loading...</div>; // Optional: Add a loading state
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isUpdateProfile === 0) {
    return <Navigate to="/update-profile" replace />;
  }

  // Kiểm tra role
  if (requiredRole && authUser.role !== requiredRole) {
    toast.error(`Chỉ ${requiredRole} được truy cập`, { theme: "dark" });
    return <Navigate to="/" replace />;
  }

  // Kiểm tra position (ví dụ Projectionist)
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
        }
        else if(authUser.role==='employee'){
          navigate("/employee", { replace: true });
        } else {
          navigate("/", { replace: true }); // role = user
        }
      }
    }
  }, [isLoading, isAuthenticated, isUpdateProfile, navigate, location.pathname, authUser]);

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
{!Inve && !IsEmployee &&!isAdminRoute && !isManagerRoute && !isProjectionist && <Header />}

      <Routes >
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
          <Route  index element={<Dashboard />} />
          <Route path="qlphim" element={<QuanLyPhim />} />
          <Route path="qlrap" element={<QuanLyRapPhim />} />
          <Route path="qlkm" element={<QuanLyKhuyenMai />} />
          <Route path="qlttv" element={<QuanLyTheTV />} />
        </Route>
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute requiredRole="employee" requiredPosition="staff">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route path='datve' element={<DatVe cinemaId={cinema_Id} /> } />
          <Route path="chon-ghe" element={<ChonGhe />} />
  <Route path="chon-dich-vu" element={<ChonDichVu />} />
  <Route path="thanh-toan" element={<ThanhToan />} />
  <Route path="inve" element={<InVe />} />

          <Route  index element={<EmployeeDashboard />} />
      
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
          <Route index element={<ManagerDashboard />} />
          <Route path="qlgv" element={<QuanLyGiaVe cinemaId={cinema_Id} />} />
          <Route path ="qluv" element={<QuanLyUngVien cinemaId={cinema_Id} />} />
          <Route path='qltd' element={<QuanLyTuyenDung cinemaId={cinema_Id} />} />
          <Route path='qlbv' element={<QuanLyBaiViet cinemaId={cinema_Id} />} />
          <Route path="qlbv/new" element={<CreatePost cinemaId={cinema_Id} />} />
          <Route path='qlnv' element={<EmployeeManagement cinemaId={cinema_Id} />} />
          <Route path='qldv' element={<QuanLyDichVu cinemaId={cinema_Id} />} />
          <Route path='qlllv' element={<QuanLyLichLamViec cinemaClusterId={cinema_Id} />} />

        </Route>

        <Route path="/signup" element={<SignUp />} />
        <Route path ='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movies/:id/:cinemaId/:date' element={<SeatLayout />} />
        <Route path='/booking' element={<ThongTinDatCho cinemaId={cinema_Id} />} />

        <Route path="/login" element={<Login />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/blog" element={<Blog />} />
        <Route path='/membership' element={<Membership />} />
        <Route path='/payment' element={<PaymentSelection />} />
        <Route path="/blogs/:cinema_id/:post_id" element={<BlogDetail />} />
        <Route path="/qr-payment" element={<QRPayment />} />
        <Route path="/posts/edit/:id" element={<EditBlog cinemaId={cinema_Id} />} />
<Route path='/tickets' element={<MyTicket />} />
<Route path="/ticket-details/:orderId" element={<TicketDetails />} />
<Route path="/inve/:order_id" element={<PrintTicket />} />

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
    </>
  );
};

export default App;