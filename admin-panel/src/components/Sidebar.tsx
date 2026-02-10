'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  EnvelopeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Properties', href: '/properties', icon: BuildingOfficeIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Inquiries', href: '/inquiries', icon: EnvelopeIcon },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-50 w-64 bg-admin-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <BuildingOfficeIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MyBaliVilla</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={classNames(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-admin-sidebar-active text-white'
                      : 'text-slate-300 hover:bg-admin-sidebar-hover hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">MyBaliVilla Admin v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
