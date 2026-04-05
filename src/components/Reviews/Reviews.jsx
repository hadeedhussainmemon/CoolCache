import React from 'react';

const Reviews = () => {
  const insta = import.meta.env.VITE_INSTAGRAM_USERNAME || '';
  const url = `https://www.instagram.com/${insta}`;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <p className="text-gray-600 mb-8">We now keep reviews on our Instagram highlights. Click below to view customer feedback and highlights.</p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 border border-purple-600 text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-150"
        >
          View reviews on Instagram highlights
        </a>
      </div>
    </section>
  );
};

export default Reviews;