'use client';

import { CompanyProvider } from '@/components/providers/CompanyProvider';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompanyProvider>{children}</CompanyProvider>;
}
