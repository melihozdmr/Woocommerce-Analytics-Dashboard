'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCompanyStore } from '@/stores/companyStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ExternalLink,
  Package,
  ImageIcon,
} from 'lucide-react';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui/data-table';

export default function ProductDetailPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const productId = params.productId as string;

  const { currentCompany } = useCompanyStore();
  const {
    selectedProduct,
    isLoading,
    error,
    fetchProduct,
    clearSelectedProduct,
  } = useInventoryStore();

  useEffect(() => {
    if (currentCompany?.id && productId) {
      fetchProduct(currentCompany.id, productId);
    }

    return () => {
      clearSelectedProduct();
    };
  }, [currentCompany?.id, productId, fetchProduct, clearSelectedProduct]);

  // Wait for company to load
  if (!currentCompany) {
    return <ProductDetailSkeleton />;
  }

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Ürün bulunamadı</div>
      </div>
    );
  }

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Stok Yok</Badge>;
    }
    if (quantity <= 5) {
      return <Badge className="bg-orange-100 text-orange-800">Kritik</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Stokta</Badge>;
  };

  const isSimpleProduct = selectedProduct.productType === 'simple';
  const hasVariations = selectedProduct.variations.length > 0;

  // Calculate total stock for variable products
  const totalStock = hasVariations
    ? selectedProduct.variations.reduce((sum, v) => sum + v.stockQuantity, 0)
    : selectedProduct.stockQuantity;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${companySlug}/inventory`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{selectedProduct.name}</h1>
            <Badge
              className={
                selectedProduct.isActive
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {selectedProduct.isActive ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a
            href={`${selectedProduct.store.url}/wp-admin/post.php?post=${selectedProduct.wcProductId}&action=edit`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            WooCommerce'de Aç
          </a>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px]">
          {/* Left Column - Main Content */}
          <div className="border-r">
            {/* Product Info Section */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-4">
                {/* Product Image */}
                <div className="shrink-0">
                  {selectedProduct.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <Image
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-medium truncate">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>SKU: {selectedProduct.sku || '-'}</span>
                    <span>|</span>
                    <span>
                      {selectedProduct.productType === 'simple'
                        ? 'Basit Ürün'
                        : `Değişken Ürün (${selectedProduct.variations.length} varyant)`}
                    </span>
                  </div>
                </div>
                {/* Price - Right Side */}
                <div className="shrink-0 text-right">
                  <span className="text-2xl font-semibold">
                    ₺{selectedProduct.price.toFixed(2)}
                  </span>
                  {selectedProduct.purchasePrice && (
                    <p className="text-sm text-muted-foreground">
                      Maliyet: ₺{selectedProduct.purchasePrice.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Management Section */}
            <div>
              <div className="flex items-center justify-between px-6 py-3 border-b">
                <h3 className="font-medium">Stok Yönetimi</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Toplam Stok:</span>
                  <span className="font-semibold">{totalStock}</span>
                </div>
              </div>

              <DataTable>
                <DataTableHeader>
                  <DataTableRow className="hover:bg-transparent">
                    <DataTableHead className="pl-6">
                      {hasVariations ? 'Varyant' : 'Ürün'}
                    </DataTableHead>
                    <DataTableHead>SKU</DataTableHead>
                    <DataTableHead className="text-center">Durum</DataTableHead>
                    <DataTableHead className="text-center">Stok</DataTableHead>
                    <DataTableHead className="text-center pr-6 w-20"></DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {/* For simple products, show single row */}
                  {isSimpleProduct && !hasVariations && (
                    <DataTableRow>
                      <DataTableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {selectedProduct.name}
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-muted-foreground">
                          {selectedProduct.sku || '-'}
                        </span>
                      </DataTableCell>
                      <DataTableCell className="text-center">
                        {getStockBadge(selectedProduct.stockQuantity)}
                      </DataTableCell>
                      <DataTableCell className="text-center pr-6">
                        <span className="font-medium">{selectedProduct.stockQuantity}</span>
                      </DataTableCell>
                    </DataTableRow>
                  )}

                  {/* For variable products, show variations */}
                  {hasVariations &&
                    selectedProduct.variations.map((variation) => (
                      <DataTableRow key={variation.id}>
                        <DataTableCell className="pl-6">
                          <span className="text-sm">
                            {variation.attributeString || 'Varsayılan'}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-muted-foreground">
                            {variation.sku || '-'}
                          </span>
                        </DataTableCell>
                        <DataTableCell className="text-center">
                          {getStockBadge(variation.stockQuantity)}
                        </DataTableCell>
                        <DataTableCell className="text-center pr-6">
                          <span className="font-medium">{variation.stockQuantity}</span>
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                </DataTableBody>
              </DataTable>
            </div>

            {/* Stock Value Info */}
            {selectedProduct.purchasePrice && (
              <div className="grid grid-cols-3 border-b">
                <div className="px-6 py-4 border-r">
                  <p className="text-sm text-muted-foreground">Stok Değeri</p>
                  <p className="text-xl font-semibold mt-1">
                    ₺{(selectedProduct.purchasePrice * totalStock).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="px-6 py-4 border-r">
                  <p className="text-sm text-muted-foreground">Tahmini Gelir</p>
                  <p className="text-xl font-semibold mt-1">
                    ₺{(selectedProduct.price * totalStock).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">Kar Marjı</p>
                  <p className="text-xl font-semibold mt-1 text-green-600">
                    ₺{((selectedProduct.price - selectedProduct.purchasePrice) * totalStock).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="border-t lg:border-t-0">
            {/* Status Section */}
            <div className="border-b">
              <div className="px-6 py-3">
                <h3 className="font-medium">Durum</h3>
              </div>
              <div className="px-6 pb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ürün Durumu</span>
                  <Badge
                    className={
                      selectedProduct.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {selectedProduct.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stok Durumu</span>
                  {getStockBadge(totalStock)}
                </div>
              </div>
            </div>

            {/* Store Section */}
            <div className="border-b">
              <div className="px-6 py-3">
                <h3 className="font-medium">Mağaza</h3>
              </div>
              <div className="px-6 pb-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Mağaza Adı</p>
                  <p className="text-sm font-medium">{selectedProduct.store.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">URL</p>
                  <a
                    href={selectedProduct.store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedProduct.store.url}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">WooCommerce ID</p>
                  <p className="text-sm font-mono">#{selectedProduct.wcProductId}</p>
                </div>
              </div>
            </div>

            {/* Sync Section */}
            <div className="border-b">
              <div className="px-6 py-3">
                <h3 className="font-medium">Senkronizasyon</h3>
              </div>
              <div className="px-6 pb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Son Güncelleme</p>
                  <p className="text-sm">
                    {new Date(selectedProduct.syncedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px]">
          <div className="border-r">
            <div className="px-6 py-4 border-b">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-8 w-32 mt-2" />
                </div>
              </div>
            </div>
            <div className="border-b">
              <div className="px-6 py-3 border-b">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="p-6">
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
          <div>
            <div className="border-b">
              <div className="px-6 py-3 border-b">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="px-6 py-4 space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
            <div className="border-b">
              <div className="px-6 py-3 border-b">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="px-6 py-4 space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
