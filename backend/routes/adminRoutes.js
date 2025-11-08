// backend/routes/adminRoutes.js
import express from 'express';
const adminRoutes = express.Router();
import { getAdminStats, getMonthlyRevenue, getTopMovies } from '../controller/adminController.js';

// GET tổng quan stats
adminRoutes.get('/stats', getAdminStats);

// GET doanh thu theo tháng (last 6 months)
adminRoutes.get('/revenue-monthly', getMonthlyRevenue);

// GET top phim doanh thu cao (top 3)
adminRoutes.get('/top-movies', getTopMovies);

export default adminRoutes;