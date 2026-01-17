'use client';

import { ShoppingCart, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompany } from '@/components/providers/CompanyProvider';

export default function OrdersPage() {
  const { company } = useCompany();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
          <p className="text-muted-foreground">
            {company?.name} - Tüm siparişlerinizi görüntüleyin
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Sipariş ara..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrele
        </Button>
      </div>

      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="text-lg mb-2">Henüz sipariş yok</CardTitle>
        <p className="text-sm text-muted-foreground mb-4">
          Mağazalarınızı bağladığınızda siparişler burada görünecek
        </p>
        <Button variant="outline">Mağaza Bağla</Button>
      </Card>
    </div>
  );
}
