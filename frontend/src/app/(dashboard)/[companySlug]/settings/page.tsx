'use client';

import { Settings, Building2, Users, CreditCard, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompany } from '@/components/providers/CompanyProvider';

const settingsSections = [
  {
    title: 'Şirket Bilgileri',
    description: 'Şirket adı, logo ve genel ayarlar',
    icon: Building2,
    href: 'settings/company',
  },
  {
    title: 'Takım Üyeleri',
    description: 'Kullanıcıları ve rollerini yönetin',
    icon: Users,
    href: 'settings/team',
  },
  {
    title: 'Abonelik',
    description: 'Plan ve ödeme bilgileriniz',
    icon: CreditCard,
    href: 'settings/billing',
  },
  {
    title: 'Bildirimler',
    description: 'E-posta ve uygulama bildirimleri',
    icon: Bell,
    href: 'settings/notifications',
  },
];

export default function SettingsPage() {
  const { company } = useCompany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
        <p className="text-muted-foreground">
          {company?.name} - Şirket ve hesap ayarlarınızı yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.title} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <section.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
