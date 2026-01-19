'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Store,
  DollarSign,
  RotateCcw,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyStore } from '@/stores/companyStore';
import { useStoreStore } from '@/stores/storeStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useProfitStore } from '@/stores/profitStore';
import { useRefundStore } from '@/stores/refundStore';
import { cn } from '@/lib/utils';

// Sample chart data
const salesChartData = [
  { month: 'Oca', sales: 0 },
  { month: 'Şub', sales: 0 },
  { month: 'Mar', sales: 0 },
  { month: 'Nis', sales: 0 },
  { month: 'May', sales: 0 },
  { month: 'Haz', sales: 0 },
];

const ordersChartData = [
  { month: 'Oca', orders: 0 },
  { month: 'Şub', orders: 0 },
  { month: 'Mar', orders: 0 },
  { month: 'Nis', orders: 0 },
  { month: 'May', orders: 0 },
  { month: 'Haz', orders: 0 },
];

const salesChartConfig = {
  sales: {
    label: 'Satış',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const ordersChartConfig = {
  orders: {
    label: 'Sipariş',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

function SetupAlert() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-green-600 text-white">
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4" />
        <span className="text-sm font-medium">
          İlk mağazanızı bağlayın
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => router.push(`/${companySlug}/stores`)}
      >
        Mağaza Bağla
      </Button>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString('tr-TR');
}

function formatCurrency(num: number): string {
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' TL';
}

export default function DashboardPage() {
  const { currentCompany } = useCompanyStore();
  const { stores, fetchStores, isLoading: isStoresLoading } = useStoreStore();
  const { summary, isLoading, fetchSummary } = useInventoryStore();
  const {
    summary: profitSummary,
    isSummaryLoading: isProfitLoading,
    fetchSummary: fetchProfitSummary,
  } = useProfitStore();
  const {
    summary: refundSummary,
    isSummaryLoading: isRefundLoading,
    fetchSummary: fetchRefundSummary,
  } = useRefundStore();

  // Fetch stores, inventory, profit and refund on mount
  useEffect(() => {
    if (currentCompany?.id) {
      fetchStores(currentCompany.id);
      fetchSummary(currentCompany.id);
      fetchProfitSummary(currentCompany.id);
      fetchRefundSummary(currentCompany.id);
    }
  }, [currentCompany?.id, fetchStores, fetchSummary, fetchProfitSummary, fetchRefundSummary]);

  // Don't show "no stores" alert while loading or before company/stores are loaded
  const hasStores = !currentCompany?.id || isStoresLoading || stores.length > 0;

  const stats = [
    {
      name: 'Net Kar (30 Gün)',
      value: profitSummary ? formatCurrency(profitSummary.netProfit) : '-',
      icon: DollarSign,
      loading: isProfitLoading,
      positive: profitSummary && profitSummary.netProfit >= 0,
      negative: profitSummary && profitSummary.netProfit < 0,
      change: profitSummary?.profitChange,
    },
    {
      name: 'Kar Marjı',
      value: profitSummary ? `%${profitSummary.profitMargin}` : '-',
      icon: TrendingUp,
      loading: isProfitLoading,
      positive: profitSummary && profitSummary.profitMargin >= 20,
      alert: profitSummary && profitSummary.profitMargin < 20 && profitSummary.profitMargin >= 0,
      negative: profitSummary && profitSummary.profitMargin < 0,
    },
    {
      name: 'İade Oranı',
      value: refundSummary ? `%${refundSummary.refundRate}` : '-',
      icon: RotateCcw,
      loading: isRefundLoading,
      positive: refundSummary && refundSummary.refundRate < 5,
      alert: refundSummary && refundSummary.refundRate >= 5 && refundSummary.refundRate < 10,
      negative: refundSummary && refundSummary.refundRate >= 10,
      change: refundSummary?.refundCountChange,
      invertChange: true, // İade için artış kötü
    },
    {
      name: 'Kritik Stok',
      value: summary ? String(summary.criticalStockCount) : '-',
      icon: AlertTriangle,
      loading: isLoading,
      alert: summary && summary.criticalStockCount > 0,
    },
  ];

  return (
    <>
      {/* Setup Alert - show only if no store connected */}
      {!hasStores && <SetupAlert />}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className={`p-4 ${index < stats.length - 1 ? 'border-r' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </span>
              <stat.icon className={cn(
                'h-5 w-5',
                stat.positive ? 'text-green-500' :
                stat.negative ? 'text-red-500' :
                stat.alert ? 'text-orange-500' : 'text-muted-foreground'
              )} />
            </div>
            <div className="flex items-baseline gap-2">
              {stat.loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <span className={cn(
                    'text-2xl font-bold',
                    stat.positive ? 'text-green-600' :
                    stat.negative ? 'text-red-600' :
                    stat.alert ? 'text-orange-500' :
                    hasStores ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {stat.value}
                  </span>
                  {stat.change !== undefined && stat.change !== 0 && (
                    <span className={cn(
                      'flex items-center text-xs font-medium',
                      (stat.invertChange ? stat.change < 0 : stat.change > 0) ? 'text-green-600' : 'text-red-600'
                    )}>
                      {stat.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      )}
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts - Single Column with Alternating Backgrounds */}
      {/* Sales Chart - White */}
      <div className="border-t">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Satış Trendi</h3>
        </div>
        <div className="p-4">
        <ChartContainer config={salesChartConfig} className="h-48 w-full">
          <AreaChart data={salesChartData} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="var(--color-sales)"
              fillOpacity={0.2}
              stroke="var(--color-sales)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        </div>
      </div>

      {/* Orders Chart - Gray */}
      <div className="border-t">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Sipariş Trendi</h3>
        </div>
        <div className="p-4 bg-muted/50">
        <ChartContainer config={ordersChartConfig} className="h-48 w-full">
          <AreaChart data={ordersChartData} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="orders"
              type="natural"
              fill="var(--color-orders)"
              fillOpacity={0.2}
              stroke="var(--color-orders)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        </div>
      </div>

      {/* Revenue Chart - White */}
      <div className="border-t">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Gelir</h3>
        </div>
        <div className="p-4">
        <ChartContainer config={salesChartConfig} className="h-48 w-full">
          <AreaChart data={salesChartData} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="var(--color-sales)"
              fillOpacity={0.2}
              stroke="var(--color-sales)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        </div>
      </div>

      {/* Stock Chart - Gray */}
      <div className="border-t">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Stok Durumu</h3>
        </div>
        <div className="p-4 bg-muted/50">
        <ChartContainer config={ordersChartConfig} className="h-48 w-full">
          <AreaChart data={ordersChartData} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="orders"
              type="natural"
              fill="var(--color-orders)"
              fillOpacity={0.2}
              stroke="var(--color-orders)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        </div>
      </div>
    </>
  );
}
