import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const validateToken = () => {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      try {
        // Basic JWT validation (check structure and expiration)
        const parts = token.split('.');
        if (parts.length !== 3) {
          localStorage.removeItem('adminToken');
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }

        // Decode payload (base64url)
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        
        // Check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expired
          localStorage.removeItem('adminToken');
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }

        // Token is valid
        setIsAuthenticated(true);
        setIsValidating(false);
      } catch (error) {
        // Invalid token format
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;