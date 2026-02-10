'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import { logout } from '@/lib/api';
import { AdminUser } from '@/lib/types';
import { getInitials } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // Invalid user data
      }
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-admin-bg">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-admin-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.role}</p>
                </div>
              </div>
            )}

            <div className="h-6 w-px bg-admin-border mx-1" />

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
