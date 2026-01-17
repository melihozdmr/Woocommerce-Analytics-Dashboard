'use client';

import { Package, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompany } from '@/components/providers/CompanyProvider';

export default function InventoryPage() {
  const { company } = useCompany();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stok Yönetimi</h1>
          <p className="text-muted-foreground">
            {company?.name} - Ürün stoklarınızı takip edin
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ürün Ekle
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Ürün ara..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrele
        </Button>
      </div>

      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="text-lg mb-2">Henüz ürün yok</CardTitle>
        <p className="text-sm text-muted-foreground mb-4">
          İlk ürününüzü ekleyerek stok takibine başlayın
        </p>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          İlk Ürününüzü Ekleyin
        </Button>
      </Card>
    </div>
  );
}
