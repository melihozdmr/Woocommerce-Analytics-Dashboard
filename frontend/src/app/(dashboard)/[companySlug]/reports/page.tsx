'use client';

import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompany } from '@/components/providers/CompanyProvider';

export default function ReportsPage() {
  const { company } = useCompany();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Raporlar</h1>
          <p className="text-muted-foreground">
            {company?.name} - Satış ve stok raporlarınız
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Rapor İndir
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Satış Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md bg-muted">
              <p className="text-muted-foreground">Grafik burada gösterilecek</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Mağaza Performansı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md bg-muted">
              <p className="text-muted-foreground">Grafik burada gösterilecek</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
