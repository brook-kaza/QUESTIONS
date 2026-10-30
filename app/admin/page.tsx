'use client';

import React, { useState, useEffect } from 'react';
import AdminPinGate from '@/components/AdminPinGate';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check session storage on client load
    const saved = sessionStorage.getItem('mikre_abew_admin_session');
    setIsAuthenticated(saved === 'true');
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('mikre_abew_admin_session');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#faf9f6]">
        <AdminPinGate onSuccess={() => setIsAuthenticated(true)} />
      </main>
    );
  }

  return (
    <main>
      <AdminDashboard onLogout={handleLogout} />
    </main>
  );
}

