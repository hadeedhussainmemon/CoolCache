import React, { useState, useEffect } from 'react';
import { BarChart3, ShoppingCart, Package, Menu, X, LogOut, Bell, Ticket } from 'lucide-react';

const SidebarLink = ({ children, onClick, active, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${active
      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/50'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
  >
    {Icon && <Icon size={20} />}
    {children}
  </button>
);

const AdminLayout = ({ children, section = 'dashboard', onSectionChange }) => {
  const [currentSection, setCurrentSection] = useState(section);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Remove body padding for admin panel
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  const handleSectionChange = (newSection) => {
    setCurrentSection(newSection);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
    if (onSectionChange) {
      onSectionChange(newSection);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative">
      {/* Mobile Header */}
      <header className="lg:hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 shadow-lg flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">CoolCache</h1>
            <p className="text-[10px] text-slate-400 leading-none">Admin Panel</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg">
          <LogOut size={20} />
        </button>
      </header>

      {/* Mobile Sidebar Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 py-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">CoolCache</h2>
            <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink
            active={currentSection === 'dashboard'}
            onClick={() => handleSectionChange('dashboard')}
            icon={BarChart3}
          >
            Dashboard
          </SidebarLink>
          <SidebarLink
            active={currentSection === 'products'}
            onClick={() => handleSectionChange('products')}
            icon={Package}
          >
            All Products
          </SidebarLink>
          <SidebarLink
            active={currentSection === 'orders'}
            onClick={() => handleSectionChange('orders')}
            icon={ShoppingCart}
          >
            Orders
          </SidebarLink>
          <SidebarLink
            active={currentSection === 'notifications'}
            onClick={() => handleSectionChange('notifications')}
            icon={Bell}
          >
            Notifications
          </SidebarLink>
          <SidebarLink
            active={currentSection === 'coupons'}
            onClick={() => handleSectionChange('coupons')}
            icon={Ticket}
          >
            Coupons
          </SidebarLink>
        </div>

        <div className="p-4 border-t border-slate-700">
          <SidebarLink onClick={handleLogout}>
            <span className="text-rose-400 group-hover:text-rose-300">Logout</span>
          </SidebarLink>
          <div className="mt-4 px-4 text-xs text-slate-500 text-center">v1.2.0 (Mobile Enhanced)</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
