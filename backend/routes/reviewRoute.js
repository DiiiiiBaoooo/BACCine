// routes/reviewRoutes.js
import express from 'express';
import { checkReviewEligibility, deleteReview, getMovieReviews, getUserReview, submitReview, updateReview } from '../controller/reviewController.js';
import { protectRoute } from '../middleware/protectRoute.js';


const router = express.Router();

// Check if user can review
router.get('/eligibility/:orderId', protectRoute, checkReviewEligibility);

// Submit new review
router.post('/', protectRoute, submitReview);

// Get all reviews for a movie
router.get('/movie/:movieId', getMovieReviews);

// Get user's review for a specific order
router.get('/user/:orderId', protectRoute, getUserReview);

// Update review
router.put('/:reviewId', protectRoute, updateReview);

// Delete review
router.delete('/:reviewId', protectRoute, deleteReview);

export default router;