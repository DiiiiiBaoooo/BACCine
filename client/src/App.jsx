import React, { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
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

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin');
  const isManagerRoute = useLocation().pathname.startsWith('/manager');

  const navigate = useNavigate();
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const isUpdateProfile = authUser?.isUpdateProfile; // 0 hoặc 1

  // Redirect to Home after login, regardless of isUpdateProfile
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true }); // Always redirect to Home
    }
  }, [isLoading, isAuthenticated, navigate]);

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
      {!isAdminRoute && !isManagerRoute && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="qlphim" element={<QuanLyPhim />} />
          <Route path="qlrap" element={<QuanLyRapPhim />} />
          <Route path="qlkm" element={<QuanLyKhuyenMai />} />
          <Route path="qlttv" element={<QuanLyTheTV />} />
        </Route>

        <Route path="/manager/*" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboard />} />
          <Route path="qlgv" element={<QuanLyGiaVe cinemaId={5} />} />
        </Route>

        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
      </Routes>
    </>
  );
};

export default App;