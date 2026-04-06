import { Inter } from 'next/font/google';
import '@/index.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'CoolCache Pakistan | Trending Electronics & Premium Gifts',
    template: '%s | CoolCache Pakistan'
  },
  description: 'Shop trending electronics, premium gifts, and customizable accessories at CoolCache Pakistan. Fast delivery and open-box delivery in Karachi.',
  keywords: ['CoolCache', 'Pakistan', 'Electronics', 'Gifts', 'Watches', 'Karachi', 'Ecommerce'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.coolcache.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://www.coolcache.app',
    siteName: 'CoolCache Pakistan',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CoolCache Pakistan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoolCache Pakistan',
    description: 'Trending Electronics & Premium Gifts',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#9333ea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
