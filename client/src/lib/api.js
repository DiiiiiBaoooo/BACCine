import { axiosInstance } from "./axios";
export const login =async (loginData)=>{
    const response = await axiosInstance.post("/auth/login",loginData);
    return response.data;
}
export const getAuthUser = async ()=>{
    try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
    } catch (error) {
      console.log("error in getauth user",error);
      
      return null
    }
  }

  export const completeOnboarding = async (userData)=>{
    const res= await axiosInstance.post("/auth/onboarding",userData);
    return res.data;
}
export const logout = async () =>{
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
}
export const getMyTickets = async () => {
  const response = await axiosInstance.get('/user/tickets');
  return response.data;
};
export const getTicketByOrderId = async (orderId) => {
  const response = await axiosInstance.get(`/user/tickets/${orderId}`);
  return response.data;
};

/**
 * Check if user can submit review for an order
 * @param {number|string} orderId - Order ID
 * @returns {Promise<{success: boolean, canReview: boolean, message: string}>}
 */
export const checkReviewEligibility = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/reviews/eligibility/${orderId}`);
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
    const response = await axiosInstance.post('/reviews', reviewData);
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
    const response = await axiosInstance.get(`/reviews/user/${orderId}`);
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
    const response = await axiosInstance.put(`/reviews/${reviewId}`, reviewData);
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
    const response = await axiosInstance.delete(`/reviews/${reviewId}`);
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
    const response = await axiosInstance.get(`/reviews/movie/${movieId}`, {
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
    const response = await axiosInstance.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  } catch (error) {
    console.error('Mark review helpful error:', error);
    throw error;
  }
};