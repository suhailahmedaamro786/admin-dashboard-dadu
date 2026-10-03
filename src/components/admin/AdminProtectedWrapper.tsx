import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin.tsx';
import { AdminDashboard } from './AdminDashboard.tsx';
import { Loader2 } from 'lucide-react';

interface AdminProtectedWrapperProps {
  onNavigateHome: () => void;
}

interface AdminUser {
  email: string;
  name: string;
  role: string;
}

export function AdminProtectedWrapper({ onNavigateHome }: AdminProtectedWrapperProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Check active session with server on initial render
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: AdminUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="text-xs text-slate-400">Verifying administrator session...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return (
    <AdminDashboard
      user={user}
      onLogout={handleLogout}
      onNavigateHome={onNavigateHome}
    />
  );
}
