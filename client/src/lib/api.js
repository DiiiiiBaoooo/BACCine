import axios from "axios";
import { axiosInstance } from "./axios";
export const login =async (loginData)=>{
    const response = await axiosInstance.post("/api/auth/login",loginData);
    return response.data;
}
export const getAuthUser = async ()=>{
    try {
        const res = await axiosInstance.get("/api/auth/me");
        return res.data;
    } catch (error) {
      console.log("error in getauth user",error);
      
      return null
    }
  }

  export const completeOnboarding = async (userData)=>{
    const res= await axiosInstance.post("/api/auth/onboarding",userData);
    return res.data;
}
export const logout = async () =>{
  const response = await axiosInstance.post("/api/auth/logout");
  return response.data;
}
export const getMyTickets = async () => {
  const response = await axiosInstance.get('/api/user/tickets');
  return response.data;
};
export const getTicketByOrderId = async (orderId) => {
  const response = await axiosInstance.get(`/api/user/tickets/${orderId}`);
  return response.data;
};

/**
 * Check if user can submit review for an order
 * @param {number|string} orderId - Order ID
 * @returns {Promise<{success: boolean, canReview: boolean, message: string}>}
 */
export const checkReviewEligibility = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/api/reviews/eligibility/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Check review eligibility error:', error);
    throw error;
  }
};

/**
 * Submit a new review
 * @param {Object} reviewData - Review data
 * @param {number} reviewData.orderId - Order ID
 * @param {number} reviewData.movieId - Movie ID
 * @param {number} reviewData.showtimeId - Showtime ID
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} [reviewData.comment] - Optional comment
 * @returns {Promise<{success: boolean, message: string, reviewId: number}>}
 */
export const submitReview = async (reviewData) => {
  try {
    const response = await axiosInstance.post('/api/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error('Submit review error:', error);
    throw error;
  }
};

/**
 * Get user's review for a specific order
 * @param {number|string} orderId - Order ID
 * @returns {Promise<{success: boolean, review: Object|null}>}
 */
export const getUserReview = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/api/reviews/user/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get user review error:', error);
    throw error;
  }
};

/**
 * Update an existing review
 * @param {number} reviewId - Review ID
 * @param {Object} reviewData - Updated review data
 * @param {number} [reviewData.rating] - New rating (1-5)
 * @param {string} [reviewData.comment] - New comment
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await axiosInstance.put(`/api/reviews/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Update review error:', error);
    throw error;
  }
};

/**
 * Delete a review
 * @param {number} reviewId - Review ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteReview = async (reviewId) => {
  try {
    const response = await axiosInstance.delete(`/api/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error('Delete review error:', error);
    throw error;
  }
};

/**
 * Get all reviews for a movie with pagination
 * @param {number} movieId - Movie ID
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @param {string} [params.sortBy='created_at'] - Sort by (created_at|helpful)
 * @returns {Promise<{success: boolean, reviews: Array, pagination: Object, stats: Object}>}
 */
export const getMovieReviews = async (movieId, params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/reviews/movie/${movieId}`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        sortBy: params.sortBy || 'created_at',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Get movie reviews error:', error);
    throw error;
  }
};

/**
 * Mark review as helpful
 * @param {number} reviewId - Review ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const markReviewHelpful = async (reviewId) => {
  try {
    const response = await axiosInstance.post(`/api/reviews/${reviewId}/helpful`);
    return response.data;
  } catch (error) {
    console.error('Mark review helpful error:', error);
    throw error;
  }
};
/**
 * Tạo yêu cầu đặt suất chiếu riêng
 * @param {Object} eventData - Dữ liệu yêu cầu
 * @param {number} eventData.cinema_id - ID rạp
 * @param {number} eventData.movie_id - ID phim
 * @param {string} eventData.event_date - Ngày chiếu (YYYY-MM-DD)
 * @param {string} eventData.start_time - Giờ bắt đầu (HH:mm)
 * @param {number} eventData.guest_count - Số khách dự kiến
 * @param {string} eventData.contact_name - Họ tên người liên hệ
 * @param {string} eventData.contact_phone - SĐT liên hệ
 * @param {string} eventData.contact_email - Email liên hệ
 * @param {string} [eventData.special_requirements] - Yêu cầu đặc biệt (tùy chọn)
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
export const createEventRequest = async (eventData) => {
  try {
    const response = await axiosInstance.post("/api/events", eventData);
    return response.data;
  } catch (error) {
    console.error("Create event request error:", error);
    throw error.response?.data || { message: "Gửi yêu cầu thất bại" };
  }
};

/**
 * Lấy danh sách yêu cầu sự kiện của user hiện tại
 * @param {Object} [params] - Bộ lọc
 * @param {string} [params.status] - pending | quoted | accepted | rejected | cancelled
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export const getMyEventRequests = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/events/my-requests", { params });
    return response.data;
  } catch (error) {
    console.error("Get my events error:", error);
    throw error.response?.data || { message: "Không tải được danh sách yêu cầu" };
  }
};

/**
 * Khách hàng chấp nhận báo giá → tạo suất chiếu riêng
 * @param {number|string} eventId - ID yêu cầu sự kiện
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */

export const acceptEventQuote = async (eventId) => {
  try {
    const response = await axiosInstance.patch(`/api/events/${eventId}/accept`);
    return response.data;
  } catch (error) {
    console.error("Accept quote error:", error);
    throw error.response?.data || { message: "Chấp nhận báo giá thất bại" };
  }
};
/**
 * Khách hàng hủy yêu cầu (chỉ khi còn pending)
 * @param {number|string} eventId - ID yêu cầu
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const cancelEventRequest = async (eventId) => {
  try {
    const response = await axiosInstance.patch(`/api/events/${eventId}/cancel`);
    return response.data;
  } catch (error) {
    console.error("Cancel event error:", error);
    throw error.response?.data || { message: "Hủy yêu cầu thất bại" };
  }
};

/* ===================== MANAGER ENDPOINTS ===================== */

/**
 * [Manager] Lấy tất cả yêu cầu sự kiện (theo rạp mà manager quản lý)
 * @param {Object} [params]
 * @param {string} [params.status] - pending | quoted | accepted | rejected | cancelled
 * @param {number} [params.cinema_id] - Lọc theo rạp cụ thể
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export const getManagerEventRequests = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/events/manager/requests", { params });
    return response.data;
  } catch (error) {
    console.error("Get manager events error:", error);
    throw error.response?.data || { message: "Không tải được danh sách yêu cầu" };
  }
};

/**
 * [Manager] Báo giá cho một yêu cầu
 * @param {number|string} eventId - ID yêu cầu
 * @param {Object} quoteData
 * @param {number} quoteData.quoted_price - Giá báo (VNĐ)
 * @param {string} [quoteData.quote_note] - Ghi chú báo giá
 * @param {number} [quoteData.room_id] - Phòng gợi ý (tùy chọn)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const quoteEventRequest = async (eventId, quoteData) => {
  try {
    const response = await axiosInstance.patch(`/api/events/manager/${eventId}/quote`, quoteData);
    return response.data;
  } catch (error) {
    console.error("Quote event error:", error);
    throw error.response?.data || { message: "Báo giá thất bại" };
  }
};

/**
 * [Manager] Từ chối yêu cầu
 * @param {number|string} eventId - ID yêu cầu
 * @param {Object} [data]
 * @param {string} [data.reason] - Lý do từ chối (tùy chọn)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const rejectEventRequest = async (eventId, data = {}) => {
  try {
    const response = await axiosInstance.patch(`/api/events/manager/${eventId}/reject`, data);
    return response.data;
  } catch (error) {
    console.error("Reject event error:", error);
    throw error.response?.data || { message: "Từ chối yêu cầu thất bại" };
  }
};

/**
 * ⭐ MỚI: Khởi tạo thanh toán cho event (trước khi chấp nhận báo giá)
 * @param {number|string} eventId - ID yêu cầu sự kiện
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
export const initiateEventPayment = async (variables) => {
  try {
    const { eventId } = variables;
    const response = await axiosInstance.post(`/api/events/${eventId}/initiate-payment`);
    return response.data;
  } catch (error) {
    console.error("Initiate event payment error:", error);
    throw error.response?.data || { message: "Khởi tạo thanh toán thất bại" };
  }
};

/**
 * Chấp nhận báo giá (GIỮ LẠI để webhook gọi, KHÔNG gọi trực tiếp từ frontend nữa)
 * @param {number|string} eventId - ID yêu cầu sự kiện
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
// Thêm vào file lib/api.js của bạn

/**
 * Kiểm tra xem vé có thể hủy được không
 * @param {number|string} orderId - Order ID
 * @returns {Promise<{canCancel: boolean, reason?: string, refundAmount?: number, hoursRemaining?: string, movieTitle?: string, showtimeStart?: string}>}
 */
export const checkCancelTicket = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/api/user/check-cancellable/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Check cancel ticket error:', error);
    throw error.response?.data || { message: 'Không thể kiểm tra trạng thái hủy vé' };
  }
};

/**
 * Hủy vé và nhận voucher hoàn tiền
 * @param {number|string} orderId - Order ID
 * @returns {Promise<{success: boolean, message: string, data: {orderId: string, refundAmount: number, voucherCode: string, expiryDate: string}}>}
 */
export const cancelTicket = async (orderId) => {
  try {
    const response = await axiosInstance.post(`/api/user/cancel/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Cancel ticket error:', error);
    throw error.response?.data || { message: 'Hủy vé thất bại' };
  }
};
// lib/api.js
export const getMyVouchers = async (userId) => {
  const response = await axiosInstance.get(`/api/membershiptiers/history/${userId}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Không thể tải ưu đãi');
  }

  return response.data; // { success: true, history: [...] }
};
export const getEmployeeDashboard = async () => {
  const response = await axiosInstance.get(`/api/employee/dashboard`);
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Không thể tải dashboard');
  }

  return response.data.data; // trả về đúng phần data
};