'use client';

import React, { Suspense, lazy, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

// Lazy load components for code splitting
const AdminOrders = lazy(() => import('@/components/admin/AdminOrders.optimized'));
const AdminProducts = lazy(() => import('@/components/admin/AdminProducts'));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const AdminNotifications = lazy(() => import('@/components/admin/AdminNotifications'));
const AdminCoupons = lazy(() => import('@/components/admin/AdminCoupons'));

export default function AdminDashboardPage() {
  const [currentSection, setCurrentSection] = useState('dashboard');

  return (
    <ProtectedRoute>
      <AdminLayout section={currentSection} onSectionChange={setCurrentSection}>
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
              </div>
            }
          >
            {currentSection === 'dashboard' && <AdminOverview onChangeSection={setCurrentSection} />}
            {currentSection === 'products' && <AdminProducts />}
            {currentSection === 'orders' && <AdminOrders />}
            {currentSection === 'notifications' && <AdminNotifications />}
            {currentSection === 'coupons' && <AdminCoupons />}
          </Suspense>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
