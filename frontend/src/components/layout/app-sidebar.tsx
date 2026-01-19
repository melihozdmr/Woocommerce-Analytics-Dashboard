'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  Settings,
  LifeBuoy,
  Send,
  BarChart3,
} from 'lucide-react';

import { TeamSwitcher } from '@/components/layout/team-switcher';
import { NavMain } from '@/components/layout/nav-main';
import { NavSecondary } from '@/components/layout/nav-secondary';
import { NavUser } from '@/components/layout/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useCompanyStore } from '@/stores/companyStore';

const navSecondary = [
  {
    title: 'Destek',
    url: '/support',
    icon: LifeBuoy,
  },
  {
    title: 'Geri Bildirim',
    url: '/feedback',
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const { currentCompany } = useCompanyStore();

  const companySlug = currentCompany?.slug || '';

  // Build navigation with company-scoped URLs
  const navMain = [
    {
      title: 'Dashboard',
      url: `/${companySlug}`,
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: 'Mağazalar',
      url: `/${companySlug}/stores`,
      icon: Store,
    },
    {
      title: 'Stoklar',
      url: `/${companySlug}/inventory`,
      icon: Package,
    },
    {
      title: 'Siparişler',
      url: `/${companySlug}/orders`,
      icon: ShoppingCart,
    },
    {
      title: 'Ödemeler',
      url: `/${companySlug}/payments`,
      icon: CreditCard,
    },
    {
      title: 'Raporlar',
      url: `/${companySlug}/reports`,
      icon: BarChart3,
    },
    {
      title: 'İadeler',
      url: `/${companySlug}/refunds`,
      icon: RotateCcw,
    },
    {
      title: 'Ayarlar',
      url: `/${companySlug}/settings`,
      icon: Settings,
      items: [
        { title: 'Genel', url: `/${companySlug}/settings` },
        { title: 'Takım', url: `/${companySlug}/settings/team` },
        { title: 'Faturalandırma', url: `/${companySlug}/settings/billing` },
      ],
    },
  ];

  const userData = {
    name: user?.name || 'Kullanıcı',
    email: user?.email || '',
    avatar: '',
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
