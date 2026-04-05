import React, { Suspense, lazy, useState } from 'react';
import AdminLayout from './AdminLayout';

// Lazy load components for code splitting
const AdminOrders = lazy(() => import('./AdminOrders.optimized'));
const AdminProducts = lazy(() => import('./AdminProducts'));
const AdminOverview = lazy(() => import('./AdminOverview'));
const AdminNotifications = lazy(() => import('./AdminNotifications'));
const AdminCoupons = lazy(() => import('./AdminCoupons'));

const AdminDashboard = () => {
  const [currentSection, setCurrentSection] = useState('dashboard');

  return (
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
  );
};

export default AdminDashboard;