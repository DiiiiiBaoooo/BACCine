// controllers/reviewController.js
import dbPool from '../config/mysqldb.js';

// Check if user can submit review for this order
export const checkReviewEligibility = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const [result] = await dbPool.query(
      'CALL check_review_eligibility(?, ?, @can_review, @message)',
      [userId, orderId]
    );

    const [[status]] = await dbPool.query(
      'SELECT @can_review as can_review, @message as message'
    );

    res.json({
      success: true,
      canReview: status.can_review === 1,
      message: status.message
    });

  } catch (error) {
    console.error('Check review eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra điều kiện đánh giá'
    });
  }
};

// Submit new review
export const submitReview = async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const { orderId, movieId, showtimeId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!orderId || !movieId || !showtimeId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1-5 sao'
      });
    }

    // Check eligibility using stored procedure
    const [result] = await connection.query(
      'CALL check_review_eligibility(?, ?, @can_review, @message)',
      [userId, orderId]
    );

    const [[status]] = await connection.query(
      'SELECT @can_review as can_review, @message as message'
    );

    if (status.can_review !== 1) {
      return res.status(403).json({
        success: false,
        message: status.message
      });
    }

    // Insert review
    const [insertResult] = await connection.query(
      `INSERT INTO movie_reviews 
       (order_id, user_id, movie_id, showtime_id, rating, comment, is_verified_viewer)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [orderId, userId, movieId, showtimeId, rating, comment || null]
    );

    // Update user_watched_tickets view will be handled by trigger
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Đánh giá đã được gửi thành công',
      reviewId: insertResult.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Submit review error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá phim này rồi'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi đánh giá'
    });
  } finally {
    connection.release();
  }
};

// Get all reviews for a movie with pagination
export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

    // Get reviews
    const [reviews] = await dbPool.query(
      `SELECT 
        mr.review_id,
        mr.rating,
        mr.comment,
        mr.helpful_count,
        mr.created_at,
        mr.updated_at,
        u.name as user_name,
        u.profilePicture as user_avatar
       FROM movie_reviews mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.movie_id = ?
       ORDER BY ${sortBy === 'helpful' ? 'mr.helpful_count' : 'mr.created_at'} DESC
       LIMIT ? OFFSET ?`,
      [movieId, parseInt(limit), offset]
    );

    // Get total count
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM movie_reviews WHERE movie_id = ?',
      [movieId]
    );

    // Get rating stats
    const [stats] = await dbPool.query(
      `SELECT 
        total_reviews,
        average_rating,
        rating_5_count,
        rating_4_count,
        rating_3_count,
        rating_2_count,
        rating_1_count
       FROM movie_rating_stats
       WHERE movie_id = ?`,
      [movieId]
    );

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: stats[0] || null
    });

  } catch (error) {
    console.error('Get movie reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải đánh giá'
    });
  }
};

// Get user's review for specific order
export const getUserReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const [review] = await dbPool.query(
      `SELECT * FROM movie_reviews 
       WHERE order_id = ? AND user_id = ?`,
      [orderId, userId]
    );

    res.json({
      success: true,
      review: review[0] || null
    });

  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải đánh giá'
    });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1-5 sao'
      });
    }

    // Check ownership
    const [review] = await dbPool.query(
      'SELECT * FROM movie_reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (!review.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa'
      });
    }

    // Update review
    const updateFields = [];
    const updateValues = [];

    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }
    if (comment !== undefined) {
      updateFields.push('comment = ?');
      updateValues.push(comment);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin để cập nhật'
      });
    }

    updateValues.push(reviewId, userId);

    await dbPool.query(
      `UPDATE movie_reviews 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE review_id = ? AND user_id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Đánh giá đã được cập nhật'
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật đánh giá'
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [review] = await dbPool.query(
      'SELECT * FROM movie_reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (!review.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa'
      });
    }

    await dbPool.query(
      'DELETE FROM movie_reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    res.json({
      success: true,
      message: 'Đánh giá đã được xóa'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa đánh giá'
    });
  }
};