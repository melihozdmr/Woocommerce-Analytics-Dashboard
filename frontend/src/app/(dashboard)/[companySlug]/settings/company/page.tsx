'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany } from '@/components/providers/CompanyProvider';
import { useCompanyStore } from '@/stores/companyStore';
import { toast } from 'sonner';

export default function CompanySettingsPage() {
  const router = useRouter();
  const { company, refreshCompany } = useCompany();
  const { updateCompany, isLoading: isUpdating } = useCompanyStore();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setIsLoading(false);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company?.id || !name.trim()) return;

    const result = await updateCompany(company.id, { name: name.trim() });

    if (result) {
      toast.success('Şirket bilgileri güncellendi');
      await refreshCompany();
      // If slug changed, redirect to new URL
      if (result.slug !== company.slug) {
        router.push(`/${result.slug}/settings/company`);
      }
    } else {
      toast.error('Şirket bilgileri güncellenemedi');
    }
  };

  const hasChanges = company && name !== company.name;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push(`/${company?.slug}/settings`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Şirket Bilgileri</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="border-b">
          <div className="grid grid-cols-12 items-center px-4 py-4">
            <div className="col-span-3">
              <label className="text-sm font-medium">Şirket Adı</label>
            </div>
            <div className="col-span-9">
              {isLoading ? (
                <Skeleton className="h-10 w-full max-w-md" />
              ) : (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Şirket adını girin"
                  className="max-w-md"
                />
              )}
            </div>
          </div>
        </div>

        <div className="border-b">
          <div className="grid grid-cols-12 items-center px-4 py-4">
            <div className="col-span-3">
              <label className="text-sm font-medium">Şirket URL</label>
            </div>
            <div className="col-span-9">
              {isLoading ? (
                <Skeleton className="h-5 w-48" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/{company?.slug}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-b">
          <div className="grid grid-cols-12 items-center px-4 py-4">
            <div className="col-span-3">
              <label className="text-sm font-medium">Oluşturulma Tarihi</label>
            </div>
            <div className="col-span-9">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {company?.createdAt
                    ? new Date(company.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-4 py-4">
          <Button type="submit" disabled={!hasChanges || isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
