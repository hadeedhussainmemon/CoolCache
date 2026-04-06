import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
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

  useEffect(() => {
    if (!isValidating && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isValidating, isAuthenticated, router]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Effect will handle redirect
  }

  return children;
};

export default ProtectedRoute;