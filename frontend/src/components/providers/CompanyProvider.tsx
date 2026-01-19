'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCompanyStore, Company } from '@/stores/companyStore';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  isLoading: true,
});

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

function CompanyLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r bg-card p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;

  const { companies, currentCompany, fetchCompanies, isLoading: storeLoading } = useCompanyStore();
  const [isValidating, setIsValidating] = useState(true);
  const [validatedCompany, setValidatedCompany] = useState<Company | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const fetchTriggered = useRef(false);

  // Fetch companies on mount - only once
  useEffect(() => {
    if (fetchTriggered.current) return;
    fetchTriggered.current = true;

    fetchCompanies().finally(() => {
      setInitialFetchDone(true);
    });
  }, [fetchCompanies]);

  // Validate company after initial fetch completes
  useEffect(() => {
    // Wait for initial fetch to complete
    if (!initialFetchDone) return;
    // Also wait if store is still loading (e.g., during switchCompany)
    if (storeLoading) return;

    // Find company by slug
    const company = companies.find((c) => c.slug === companySlug);

    if (!company) {
      // Company not found - redirect to first company or setup
      if (companies.length > 0) {
        router.replace(`/${companies[0].slug}`);
      } else {
        router.replace('/setup-company');
      }
      return;
    }

    // Valid company found
    setValidatedCompany(company);
    setIsValidating(false);

    // If this is not the current company, switch to it
    if (currentCompany?.id !== company.id) {
      useCompanyStore.getState().setCurrentCompany(company);
    }
  }, [companySlug, companies, storeLoading, currentCompany, router, initialFetchDone]);

  // Show loading until initial fetch is done and validation completes
  if (!initialFetchDone || storeLoading || isValidating) {
    return <CompanyLoadingSkeleton />;
  }

  if (!validatedCompany) {
    return <CompanyLoadingSkeleton />;
  }

  return (
    <CompanyContext.Provider value={{ company: validatedCompany, isLoading: false }}>
      {children}
    </CompanyContext.Provider>
  );
}
