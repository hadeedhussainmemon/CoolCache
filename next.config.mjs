/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Enable better hydration for CSS modules
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'sonner'],
  },
  // Handle rewrites for SEO compatibility if needed, though App Router is preferred
  async rewrites() {
    return [
      {
        source: '/backend-images/:path*',
        destination: '/images/:path*',
      },
    ];
  },
};

export default nextConfig;
