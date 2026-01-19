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
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`p-4 ${i < 3 ? 'border-r' : ''}`}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      {/* Chart sections */}
      <div className="border-b">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-4">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
      <div className="border-b">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-4 bg-muted/50">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </>
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
