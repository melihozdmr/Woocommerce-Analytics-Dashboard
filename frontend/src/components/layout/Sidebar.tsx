'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  RotateCcw,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Magazalar', href: '/stores', icon: Store },
  { name: 'Stok', href: '/inventory', icon: Package },
  { name: 'Siparisler', href: '/orders', icon: ShoppingCart },
  { name: 'Odemeler', href: '/payments', icon: CreditCard },
  { name: 'Kar Analizi', href: '/profit', icon: TrendingUp },
  { name: 'Iadeler', href: '/refunds', icon: RotateCcw },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">WC Analytics</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-gray-400">{user?.plan?.name} Plan</p>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <Link
            href="/settings"
            className="flex items-center rounded-md px-2 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Settings className="mr-3 h-4 w-4" />
            Ayarlar
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cikis Yap
          </button>
        </div>
      </div>
    </div>
  );
}
