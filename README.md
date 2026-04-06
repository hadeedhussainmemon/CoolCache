# 💎 CoolCache — Project Documentation

🚀 **Announcing the new CoolCache storefront experience!**

We’ve just launched a faster, more modern, and visually polished shopping experience for CoolCache—built on a unified Next.js 15.1.0 monolithic architecture.

## 🧱 Overview

CoolCache is a premium e-commerce platform for trending electronics, jewelry, and gifts. This project has been migrated from a split Vite/Express architecture to a **unified Next.js 15 Monolith**, providing:
- **Server-Side Rendering (SSR)** and Static Site Generation (SSG) for elite performance and SEO.
- **Unified API Routes**: Backend logic is now integrated directly into the Next.js app via Route Handlers (src/app/api).
- **Enhanced Security**: Mongoose/MongoDB integration with JWT-based authentication for the admin panel.
- **Modern UI**: Built with React 19 and Tailwind CSS, featuring glassmorphism and premium micro-interactions.

---

## 🎨 System Design

### **Frontend & Architecture**
The application is built with **Next.js 15.1.0** and **React 19**.
- **App Router**: Leveraging the latest Next.js 15 features for layouts, nested routing, and suspense boundaries.
- **Styling**: Tailwind CSS for a clean, responsive, and luxury-feeling UI.
- **State Management**: Redux Toolkit for cart and global state.
- **Data Fetching**: integrated TanStack Query for efficient client-side caching and synchronization.

### **Backend & Data**
- **Monolithic API**: All Express.js endpoints have been migrated to Next.js API routes.
- **Database**: Mongoose (MongoDB) for persistent product and admin data.
- **Authentication**: JWT-secured admin routes for managing the storefront.
- **Media**: Integrated Cloudinary support for high-performance image hosting and optimization.

---

## 📁 Project Architecture

```text
CoolCache/
├── src/
│   ├── app/                # Next.js 15 App Router (Pages & API)
│   ├── components/         # Reusable UI components
│   ├── context/            # React Context providers (Cart, Wishlist)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Shared utilities, database models, and services
│   ├── store/              # Redux Toolkit store and slices
│   └── utils/              # Helper functions (Image handling, etc.)
├── public/                 # Static assets
├── next.config.mjs         # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md
```

---

## ⚙️ Development & Testing

### **Scripts**
- npm run dev: Starts the Next.js development server.
- npm run build: Creates a production-optimized build.
- npm test: Runs the test suite using Vitest.

### **Testing Stabilization**
The project features a stabilized test suite using Vitest and JSDOM, updated to mock Next.js 15 navigation and environment configurations. Legacy react-router-dom dependencies have been removed and replaced with modern Next.js patterns.

---

## 🔒 Security & Performance
- **JWT-based Auth**: Secure admin panel.
- **Rate Limiting**: Integrated via Next.js middleware patterns.
- **SSR-Safe**: All browser-side logic is guarded for hydration safety.

---

## 🌐 Deployment
Optimized for zero-config deployment on **Vercel**, leveraging edge functions and serverless architecture.

---

## 🪙 Credits
Modernized by Antigravity - Advanced Agentic Coding.
Developed for a premium commerce experience.
