import express from 'express';
import { AddWorkScheduleInCine, getWorkScheduleInCine, UpdateWorkScheduleInCine } from '../controller/WorkSchedule.js';

const WorkScheduleRoute = express.Router();

// Fetch schedules for a cinema cluster within a date range
WorkScheduleRoute.get('/:cinemaClusterId', getWorkScheduleInCine);

// Add or update schedule entries for a cinema cluster
WorkScheduleRoute.post('/:cinemaClusterId', AddWorkScheduleInCine);

// Update start_time and end_time for a schedule entry (attendance tracking)
WorkScheduleRoute.patch('/attendance/:scheduleId', UpdateWorkScheduleInCine);

export default WorkScheduleRoute;