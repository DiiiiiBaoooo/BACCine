// backend/routes/adminRoutes.js
import express from 'express';
const adminRoutes = express.Router();
import { 
  getAdminStats, 
  getRevenueByCinema,
  getMonthlyRevenue, 
  getShowtimesByMovie,
  getShowtimesByCinema,
  getOccupancyByCinema,
  getTopMovies 
} from '../controller/adminController.js';

// GET tổng quan stats
adminRoutes.get('/stats', getAdminStats);

// GET doanh thu theo rạp
adminRoutes.get('/revenue-by-cinema', getRevenueByCinema);

// GET doanh thu theo tháng (12 months)
adminRoutes.get('/revenue-monthly', getMonthlyRevenue);

// GET suất chiếu theo phim
adminRoutes.get('/showtimes-by-movie', getShowtimesByMovie);

// GET suất chiếu theo rạp
adminRoutes.get('/showtimes-by-cinema', getShowtimesByCinema);

// GET tỷ lệ lấp đầy ghế theo rạp
adminRoutes.get('/occupancy-by-cinema', getOccupancyByCinema);

// GET top phim doanh thu cao
adminRoutes.get('/top-movies', getTopMovies);

export default adminRoutes;