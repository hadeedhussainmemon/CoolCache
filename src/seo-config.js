export default {
  '/': {
    priority: 1.0,
    changefreq: 'daily'
  },
  '/categories': {
    priority: 0.9,
    changefreq: 'weekly'
  },
  '/category/*': {
    priority: 0.9,
    changefreq: 'daily'
  },
  '/product/*': {
    priority: 0.8,
    changefreq: 'weekly'
  },
  '/faq': {
    priority: 0.6,
    changefreq: 'monthly'
  },
  '/recommendations': {
    priority: 0.7,
    changefreq: 'daily'
  },
  '/wishlist': {
    priority: 0.3,
    changefreq: 'never'
  }
};
