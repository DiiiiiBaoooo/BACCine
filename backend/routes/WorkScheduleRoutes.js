import express from 'express';
import { AddWorkScheduleInCine, checkFaceDescriptor, faceCheckin, faceCheckout, getWorkScheduleInCine, getWorkScheduleofEmployee, registerFaceDescriptor, UpdateWorkScheduleInCine } from '../controller/WorkSchedule.js';

const WorkScheduleRoute = express.Router();

// Fetch schedules for a cinema cluster within a date range
WorkScheduleRoute.get('/:cinemaClusterId', getWorkScheduleInCine);
WorkScheduleRoute.get('/:cinemaClusterId/:employeeId', getWorkScheduleofEmployee);
WorkScheduleRoute.get('/employee/face/check/:employeeId', checkFaceDescriptor);


// Add or update schedule entries for a cinema cluster
WorkScheduleRoute.post('/:cinemaClusterId', AddWorkScheduleInCine);

// Update start_time and end_time for a schedule entry (attendance tracking)
WorkScheduleRoute.patch('/attendance/:scheduleId', UpdateWorkScheduleInCine);


// Đăng ký descriptor khuôn mặt cho nhân viên
WorkScheduleRoute.post('/employee/face/register', registerFaceDescriptor);


// Chấm công bằng nhận diện khuôn mặt
WorkScheduleRoute.post('/attendance/face-checkin', faceCheckin);
WorkScheduleRoute.post('/attendance/face-checkout', faceCheckout);


export default WorkScheduleRoute;