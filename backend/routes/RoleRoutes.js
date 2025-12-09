import express from 'express';
import { changeManagerToEmployeeWithCinema, changeUserRole, checkUserStatus, deleteUser, getAllManagersAndEmployees, getAvailableCinemas, getManagerCinemas, getUserDetail, toggleUserStatus } from '../controller/roleController.js';

const RoleRoute = express.Router();

// Tất cả routes đều yêu cầu đăng nhập và có role admin


// Lấy danh sách tất cả manager và employee
RoleRoute.get('/users', getAllManagersAndEmployees);

// Lấy thông tin chi tiết một user
RoleRoute.get('/users/:userId', getUserDetail);

// Lấy danh sách rạp mà manager đang quản lý
RoleRoute.get('/users/:userId/cinemas', getManagerCinemas);

// Thay đổi vai trò user (tự động - dùng cho employee sang manager)
RoleRoute.put('/users/:userId/change-role', changeUserRole);

// Thay đổi manager sang employee với cinema cụ thể
RoleRoute.put('/users/:userId/change-to-employee', changeManagerToEmployeeWithCinema);

// Vô hiệu hóa/Kích hoạt tài khoản
RoleRoute.put('/users/:userId/toggle-status', toggleUserStatus);

// Kiểm tra trạng thái tài khoản
RoleRoute.get('/users/:userId/status', checkUserStatus);
RoleRoute.get('/cinemas/available', getAvailableCinemas);
// Xóa vĩnh viễn tài khoản
RoleRoute.delete('/users/:userId', deleteUser);

export default RoleRoute;