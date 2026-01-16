'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth, accessToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check auth on mount
  useEffect(() => {
    if (isHydrated && accessToken) {
      checkAuth();
    }
  }, [isHydrated, accessToken, checkAuth]);

  // Redirect logic
  useEffect(() => {
    if (!isHydrated) return;

    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    if (!isLoading) {
      if (!isAuthenticated && !isPublicPath) {
        router.push('/login');
      } else if (isAuthenticated && isPublicPath) {
        router.push('/dashboard');
      }
    }
  }, [isHydrated, isAuthenticated, isLoading, pathname, router]);

  // Show loading while hydrating or checking auth
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Show loading for protected routes while checking auth
  if (!isPublicPath && (isLoading || !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
