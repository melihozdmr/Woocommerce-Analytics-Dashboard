'use client';

import { useEffect, useState } from 'react';
import { Check, X, Zap, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { usePricingStore, Plan } from '@/stores/pricingStore';
import { cn } from '@/lib/utils';

const planIcons = {
  FREE: Zap,
  PRO: Sparkles,
  ENTERPRISE: Building2,
};

const planColors = {
  FREE: 'border-gray-200',
  PRO: 'border-blue-500 ring-2 ring-blue-500/20',
  ENTERPRISE: 'border-purple-500',
};

const featureLabels: Record<string, string> = {
  csvExport: 'CSV Dışa Aktarma',
  pdfExport: 'PDF Dışa Aktarma',
  emailReports: 'E-posta Raporları',
  apiAccess: 'API Erişimi',
  prioritySupport: 'Öncelikli Destek',
};

function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function PlanCard({
  plan,
  isCurrentPlan,
  isYearly,
  onSelect,
}: {
  plan: Plan;
  isCurrentPlan: boolean;
  isYearly: boolean;
  onSelect: () => void;
}) {
  const Icon = planIcons[plan.name];
  const price = isYearly ? plan.priceYearly : plan.priceMonthly;
  const monthlyEquivalent = isYearly ? plan.priceYearly / 12 : plan.priceMonthly;
  const savings = isYearly && plan.priceMonthly > 0
    ? ((plan.priceMonthly * 12 - plan.priceYearly) / (plan.priceMonthly * 12) * 100).toFixed(0)
    : 0;

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card p-6 transition-all hover:shadow-lg',
        planColors[plan.name],
        isCurrentPlan && 'ring-2 ring-green-500/50'
      )}
    >
      {plan.name === 'PRO' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            Popüler
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            Mevcut Plan
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <div className={cn(
          'inline-flex items-center justify-center w-12 h-12 rounded-full mb-4',
          plan.name === 'FREE' ? 'bg-gray-100' :
          plan.name === 'PRO' ? 'bg-blue-100' : 'bg-purple-100'
        )}>
          <Icon className={cn(
            'h-6 w-6',
            plan.name === 'FREE' ? 'text-gray-600' :
            plan.name === 'PRO' ? 'text-blue-600' : 'text-purple-600'
          )} />
        </div>

        <h3 className="text-xl font-bold">{plan.displayName}</h3>

        <div className="mt-4">
          <span className="text-4xl font-bold">
            {price === 0 ? 'Ücretsiz' : `${formatPrice(monthlyEquivalent)} TL`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground">/ay</span>
          )}
        </div>

        {isYearly && Number(savings) > 0 && (
          <p className="text-sm text-green-600 mt-1">
            %{savings} tasarruf (Yıllık {formatPrice(price)} TL)
          </p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>
            <strong>{plan.storeLimit}</strong> Mağaza
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>
            <strong>{plan.refreshInterval}</strong> dk güncelleme
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>
            <strong>{plan.historyDays}</strong> gün geçmiş veri
          </span>
        </div>

        <hr className="my-3" />

        {Object.entries(featureLabels).map(([key, label]) => {
          const hasFeature = plan.features[key as keyof typeof plan.features];
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              {hasFeature ? (
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <span className={hasFeature ? '' : 'text-muted-foreground'}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Button
        className="w-full"
        variant={isCurrentPlan ? 'outline' : plan.name === 'PRO' ? 'default' : 'outline'}
        disabled={isCurrentPlan}
        onClick={onSelect}
      >
        {isCurrentPlan ? 'Mevcut Planınız' : 'Planı Seç'}
      </Button>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-center mb-6">
        <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-24 mx-auto mb-4" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-full mt-6" />
    </div>
  );
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const {
    plans,
    myPlan,
    usage,
    isPlansLoading,
    fetchPlans,
    fetchMyPlan,
    fetchUsage,
    requestUpgrade,
  } = usePricingStore();

  useEffect(() => {
    fetchPlans();
    fetchMyPlan();
    fetchUsage();
  }, [fetchPlans, fetchMyPlan, fetchUsage]);

  const handleSelectPlan = async (planName: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    if (planName === myPlan?.plan.name) return;

    // TODO: In production, redirect to payment flow for paid plans
    const success = await requestUpgrade(planName);
    if (success) {
      // Plan upgraded successfully
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Fiyatlandırma</h1>
        <p className="text-muted-foreground">
          İşletmenize uygun planı seçin
        </p>

        {/* Usage Info */}
        {usage && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
            <span className="text-sm">
              Mevcut Kullanım: <strong>{usage.storeCount}</strong> / {usage.storeLimit === 999 ? '∞' : usage.storeLimit} Mağaza
            </span>
            {usage.isNearLimit && !usage.isAtLimit && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Limite Yakın
              </span>
            )}
            {usage.isAtLimit && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                Limit Doldu
              </span>
            )}
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={cn('text-sm font-medium', !isYearly && 'text-foreground', isYearly && 'text-muted-foreground')}>
          Aylık
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <span className={cn('text-sm font-medium', isYearly && 'text-foreground', !isYearly && 'text-muted-foreground')}>
          Yıllık
          <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            %17 Tasarruf
          </span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isPlansLoading ? (
          <>
            <PlanSkeleton />
            <PlanSkeleton />
            <PlanSkeleton />
          </>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={myPlan?.plan.name === plan.name}
              isYearly={isYearly}
              onSelect={() => handleSelectPlan(plan.name)}
            />
          ))
        )}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tüm planlar 14 gün ücretsiz deneme içerir. İstediğiniz zaman iptal edebilirsiniz.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Sorularınız mı var?{' '}
          <a href="mailto:destek@example.com" className="text-primary hover:underline">
            Bizimle iletişime geçin
          </a>
        </p>
      </div>
    </div>
  );
}
