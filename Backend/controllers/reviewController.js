const Review = require('../models/Review');
const jwt = require('jsonwebtoken');

class ReviewController {
  async submitReview(req, res) {
    try {
  const { name, email, productPurchased, rating, review } = req.body;

  // Coerce rating to a number to avoid string comparisons
  const parsedRating = Number(rating);

      // Validation
      if (!name || !email || (!rating && rating !== 0) || !review) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (review.length < 20) {
        return res.status(400).json({ message: 'Review must be at least 20 characters long' });
      }

      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Create new review in database with pending status
      const newReview = new Review({
        name,
        email,
        productPurchased: productPurchased || '',
        rating: parsedRating,
        review,
        status: 'pending'
      });

      const saved = await newReview.save();
      // Helpful server-side log for debugging persistence
      console.info('New review saved with id:', saved._id);

      res.status(201).json({ 
        message: 'Review submitted successfully! It will appear after admin approval.',
        success: true
      });

    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ 
        message: 'Failed to submit review. Please try again later.',
        error: error.message 
      });
    }
  }

  // Get all approved reviews (public)
  async getApprovedReviews(req, res) {
    try {
      // If client requests pending reviews (for QA), allow it only when an admin JWT is provided
      const includePending = req.query.includePending === '1' || req.query.includePending === 'true';

  let filter = { status: 'approved' };
  let allowStatusField = false;
  if (includePending) {
        // Try to verify admin token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          try {
            jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            filter = { status: { $in: ['approved', 'pending'] } };
            allowStatusField = true;
          } catch (e) {
            // Invalid token — ignore includePending and proceed with approved only
            console.warn('includePending requested but JWT invalid:', e.message);
          }
        } else if (process.env.NODE_ENV !== 'production') {
          // In non-production (local dev) allow includePending without token for convenience
          filter = { status: { $in: ['approved', 'pending'] } };
          allowStatusField = true;
        }
      }

      // Only return public-safe fields for the public endpoint; use lean() to avoid Mongoose document overhead
      const projection = allowStatusField ? 'name rating review productPurchased createdAt status' : 'name rating review productPurchased createdAt';

      const reviews = await Review.find(filter)
        .sort({ createdAt: -1 })
        .select(projection)
        .lean();

      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
    }
  }

  // Admin: Get all reviews
  async getAllReviews(req, res) {
    try {
      // Admin needs full details (including email), but use lean to reduce memory overhead
      const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .select('-__v')
        .lean();

      res.json(reviews);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
    }
  }

  // Admin: Approve review
  async approveReview(req, res) {
    try {
      const { id } = req.params;
      
      const review = await Review.findByIdAndUpdate(
        id,
        { status: 'approved' },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      res.json({ message: 'Review approved successfully', review });
    } catch (error) {
      console.error('Error approving review:', error);
      res.status(500).json({ message: 'Failed to approve review', error: error.message });
    }
  }

  // Admin: Reject review
  async rejectReview(req, res) {
    try {
      const { id } = req.params;
      
      const review = await Review.findByIdAndUpdate(
        id,
        { status: 'rejected' },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      res.json({ message: 'Review rejected successfully', review });
    } catch (error) {
      console.error('Error rejecting review:', error);
      res.status(500).json({ message: 'Failed to reject review', error: error.message });
    }
  }

  // Admin: Delete review
  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      
      const review = await Review.findByIdAndDelete(id);

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ message: 'Failed to delete review', error: error.message });
    }
  }
}

module.exports = ReviewController;