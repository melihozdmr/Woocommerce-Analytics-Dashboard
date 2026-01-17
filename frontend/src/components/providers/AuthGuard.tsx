'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCompanyStore } from '@/stores/companyStore';
import { Skeleton } from '@/components/ui/skeleton';

// Paths that don't require authentication
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
// Paths that authenticated users without a company can access
const companySetupPaths = ['/setup-company', '/invite'];

function AuthLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm space-y-6 p-6">
        {/* Logo skeleton */}
        <div className="flex justify-center mb-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
        {/* Title skeleton */}
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        {/* Description skeleton */}
        <Skeleton className="h-4 w-64 mx-auto mb-6" />
        {/* Form fields skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full bg-sidebar">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 m-2 ml-0 rounded-xl border bg-background" />
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth, accessToken } = useAuthStore();
  const { companies, currentCompany, fetchCompanies } = useCompanyStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [companiesFetched, setCompaniesFetched] = useState(false);

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

  // Fetch companies when authenticated
  useEffect(() => {
    if (isHydrated && isAuthenticated && !companiesFetched) {
      fetchCompanies().then(() => {
        setCompaniesFetched(true);
      });
    }
  }, [isHydrated, isAuthenticated, companiesFetched, fetchCompanies]);

  // Redirect logic
  useEffect(() => {
    if (!isHydrated || isLoading) return;

    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
    const isCompanySetupPath = companySetupPaths.some((path) => pathname.startsWith(path));

    if (!isAuthenticated && !isPublicPath) {
      // Not authenticated and trying to access protected route
      router.push('/login');
      return;
    }

    // Wait for companies to be fetched before making company-related redirect decisions
    if (isAuthenticated && !companiesFetched) {
      return;
    }

    if (isAuthenticated && isPublicPath) {
      // Authenticated and on login/register pages - redirect based on company status
      if (companies.length === 0) {
        router.push('/setup-company');
      } else if (currentCompany) {
        router.push(`/${currentCompany.slug}`);
      } else if (companies.length > 0) {
        router.push(`/${companies[0].slug}`);
      }
    } else if (isAuthenticated && companies.length === 0 && !isCompanySetupPath && !isPublicPath) {
      // Authenticated but no company and not on setup page - redirect to setup
      router.push('/setup-company');
    } else if (isAuthenticated && companies.length > 0 && isCompanySetupPath) {
      // Authenticated with company but on setup page - redirect to company dashboard
      if (currentCompany) {
        router.push(`/${currentCompany.slug}`);
      } else {
        router.push(`/${companies[0].slug}`);
      }
    } else if (isAuthenticated && pathname === '/') {
      // On root path, redirect to company dashboard or setup
      if (companies.length === 0) {
        router.push('/setup-company');
      } else if (currentCompany) {
        router.push(`/${currentCompany.slug}`);
      } else {
        router.push(`/${companies[0].slug}`);
      }
    }
  }, [isHydrated, isAuthenticated, isLoading, pathname, router, companies, currentCompany, companiesFetched]);

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isCompanySetupPath = companySetupPaths.some((path) => pathname.startsWith(path));
  const isDashboardPath = !isPublicPath && !isCompanySetupPath;

  // Show loading while hydrating or checking auth
  if (!isHydrated) {
    return isDashboardPath ? <DashboardLoadingSkeleton /> : <AuthLoadingSkeleton />;
  }

  // Show loading for protected routes while checking auth or fetching companies
  if (!isPublicPath && (isLoading || !isAuthenticated || (isAuthenticated && !companiesFetched))) {
    return isDashboardPath ? <DashboardLoadingSkeleton /> : <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}
