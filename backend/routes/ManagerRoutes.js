import express from 'express';
const ManagerRoute = express.Router();
import { getManagerDashboard } from '../controller/ManagerController.js';

// GET /api/manager/dashboard?cinemaId=2
ManagerRoute.get('/dashboard', getManagerDashboard);

export default ManagerRoute;