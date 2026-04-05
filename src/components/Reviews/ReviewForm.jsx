import React, { useState } from 'react';

export default function ReviewForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: '5',
    review: '',
    productPurchased: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.review.length < 20) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Normalize base URL (remove trailing slash)
      const base = (import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '').replace(/\/$/, '');
      // Submit to backend API (saves to database with pending status)
      const response = await fetch(`${base}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          rating: '5',
          review: '',
          productPurchased: ''
        });
      } else {
        const err = await response.json().catch(() => ({ message: 'Failed to submit review' }));
        throw new Error(err.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      // Clear status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-playfair font-bold text-gray-900 mb-2">
          Share Your Experience
        </h3>
        <p className="text-gray-600">
          We'd love to hear about your experience with our jewelry!
        </p>
      </div>

      {submitStatus === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-green-900">Thank you for your review!</p>
            <p className="text-sm text-green-700">We appreciate your feedback and will review it shortly.</p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-red-900">Oops! Something went wrong</p>
            <p className="text-sm text-red-700">Please try again or contact us via email.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="jane@example.com"
            />
          </div>
        </div>

        {/* Product Purchased */}
        <div>
          <label htmlFor="productPurchased" className="block text-sm font-medium text-gray-700 mb-1">
            Product Purchased (Optional)
          </label>
          <input
            type="text"
            id="productPurchased"
            name="productPurchased"
            value={formData.productPurchased}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Beaded Flower Bracelet"
          />
        </div>

        {/* Rating */}
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star.toString() })}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <svg
                  className={`w-8 h-8 ${
                    parseInt(formData.rating) >= star
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  fill={parseInt(formData.rating) >= star ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating} {parseInt(formData.rating) === 1 ? 'star' : 'stars'}
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-1">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review"
            name="review"
            required
            value={formData.review}
            onChange={handleChange}
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Tell us about your experience with our jewelry..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 20 characters ({formData.review.length}/20)
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-800">
            Your review will be sent to us for moderation. We may feature approved reviews on our website and social media.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || formData.review.length < 20}
          className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Submit Review</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
