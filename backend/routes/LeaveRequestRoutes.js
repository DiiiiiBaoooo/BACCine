import express from 'express';
import {
  createLeaveRequest,
  getLeaveRequests,
  getEmployeeLeaveRequests,
  getLeaveRequestDetail,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveStats
} from '../controller/LeaveRequest.js';

const LeaveRequestRoute = express.Router();

// ============= EMPLOYEE APIs =============
// Tạo đơn xin nghỉ phép
LeaveRequestRoute.post('/create', createLeaveRequest);

// Lấy đơn nghỉ phép của nhân viên
LeaveRequestRoute.get('/employee/:employee_id/:cinema_cluster_id', getEmployeeLeaveRequests);

// Hủy đơn nghỉ phép (bởi nhân viên)
LeaveRequestRoute.patch('/cancel/:leave_request_id', cancelLeaveRequest);

// ============= MANAGER APIs =============
// Lấy tất cả đơn nghỉ phép của cụm rạp
LeaveRequestRoute.get('/cluster/:cinema_cluster_id', getLeaveRequests);

// Lấy chi tiết một đơn nghỉ phép
LeaveRequestRoute.get('/detail/:leave_request_id', getLeaveRequestDetail);

// Duyệt đơn nghỉ phép
LeaveRequestRoute.patch('/approve/:leave_request_id', approveLeaveRequest);

// Từ chối đơn nghỉ phép
LeaveRequestRoute.patch('/reject/:leave_request_id', rejectLeaveRequest);

// ============= STATISTICS APIs =============
// Lấy thống kê nghỉ phép
LeaveRequestRoute.get('/stats/:cinema_cluster_id', getLeaveStats);

export default LeaveRequestRoute;