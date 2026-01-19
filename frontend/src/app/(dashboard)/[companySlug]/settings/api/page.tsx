'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Ban,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiKeyStore, ApiKey } from '@/stores/apiKeyStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useCompany } from '@/components/providers/CompanyProvider';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ApiSettingsPage() {
  const router = useRouter();
  const { company } = useCompany();
  const {
    apiKeys,
    newKeySecret,
    isLoading,
    isCreating,
    error,
    fetchApiKeys,
    createApiKey,
    deleteApiKey,
    revokeApiKey,
    rotateApiKey,
    clearNewKeySecret,
  } = useApiKeyStore();

  const { myPlan, hasFeature, fetchMyPlan, isPricingEnabled } = usePricingStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [writePermission, setWritePermission] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Check for Enterprise access
  const hasApiAccess = hasFeature('apiAccess');

  useEffect(() => {
    fetchMyPlan();
  }, [fetchMyPlan]);

  useEffect(() => {
    if (hasApiAccess) {
      fetchApiKeys();
    }
  }, [hasApiAccess, fetchApiKeys]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    const result = await createApiKey(newKeyName, {
      read: true,
      write: writePermission,
    });

    if (result) {
      setNewKeyName('');
      setWritePermission(false);
      // Keep dialog open to show the key
    }
  };

  const handleCopyKey = async () => {
    if (newKeySecret) {
      await navigator.clipboard.writeText(newKeySecret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCloseCreateDialog = () => {
    setIsCreateOpen(false);
    clearNewKeySecret();
    setShowSecret(false);
    setCopiedKey(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: tr,
    });
  };

  // Enterprise plan required screen
  if (!hasApiAccess && isPricingEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Erişimi</h1>
          <p className="text-muted-foreground">
            Harici API erişimi ve API anahtarı yönetimi
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Enterprise Plan Gerekli</h3>
            <p className="mt-2 text-center text-muted-foreground max-w-md">
              Harici API erişimi ve API anahtarı yönetimi Enterprise plan ile
              kullanılabilir. Plan yükseltmek için fiyatlandırma sayfasını
              ziyaret edin.
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push(`/${company?.slug}/pricing`)}
            >
              Planları Görüntüle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Erişimi</h1>
          <p className="text-muted-foreground">
            Harici API erişimi için API anahtarlarınızı yönetin
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni API Anahtarı
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {newKeySecret ? 'API Anahtarı Oluşturuldu' : 'Yeni API Anahtarı'}
              </DialogTitle>
              <DialogDescription>
                {newKeySecret
                  ? 'API anahtarınız oluşturuldu. Bu anahtarı güvenli bir yerde saklayın, tekrar gösterilmeyecektir.'
                  : 'Harici API erişimi için yeni bir API anahtarı oluşturun.'}
              </DialogDescription>
            </DialogHeader>

            {newKeySecret ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Dikkat!</AlertTitle>
                  <AlertDescription>
                    Bu API anahtarı sadece bir kez gösterilecektir. Lütfen
                    güvenli bir yerde saklayın.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>API Anahtarı</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      value={newKeySecret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyKey}
                    >
                      {copiedKey ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog}>Tamam</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Anahtar Adı</Label>
                  <Input
                    id="name"
                    placeholder="Örn: Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yazma İzni</Label>
                    <p className="text-sm text-muted-foreground">
                      Bu anahtar veri değişikliği yapabilsin mi?
                    </p>
                  </div>
                  <Switch
                    checked={writePermission}
                    onCheckedChange={setWritePermission}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || isCreating}
                  >
                    {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* API Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Dokümantasyonu</CardTitle>
          <CardDescription>
            API kullanımı hakkında detaylı bilgi için Swagger dokümantasyonuna
            bakabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                <strong>Base URL:</strong>{' '}
                <code className="bg-muted px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_API_URL}/api/v1
                </code>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/docs`,
                  '_blank'
                )
              }
            >
              Swagger Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Anahtarları</CardTitle>
          <CardDescription>
            Mevcut API anahtarlarınızı görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                Henüz API anahtarı yok
              </h3>
              <p className="mt-2 text-center text-muted-foreground">
                Harici API erişimi için bir API anahtarı oluşturun.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Anahtar</TableHead>
                  <TableHead>İzinler</TableHead>
                  <TableHead>Son Kullanım</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <ApiKeyRow
                    key={apiKey.id}
                    apiKey={apiKey}
                    onDelete={deleteApiKey}
                    onRevoke={revokeApiKey}
                    onRotate={rotateApiKey}
                    formatDate={formatDate}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">100 istek/dakika</p>
                <p className="text-sm text-muted-foreground">
                  API key başına limit
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">60 saniye</p>
                <p className="text-sm text-muted-foreground">
                  Limit sıfırlama süresi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">X-RateLimit-*</p>
                <p className="text-sm text-muted-foreground">
                  Response header&apos;ları
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Separate component for each API key row
function ApiKeyRow({
  apiKey,
  onDelete,
  onRevoke,
  onRotate,
  formatDate,
}: {
  apiKey: ApiKey;
  onDelete: (id: string) => Promise<boolean>;
  onRevoke: (id: string) => Promise<boolean>;
  onRotate: (id: string) => Promise<any>;
  formatDate: (date: string | null) => string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedKey, setRotatedKey] = useState<string | null>(null);
  const [showRotatedKey, setShowRotatedKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(apiKey.id);
    setIsDeleting(false);
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    await onRevoke(apiKey.id);
    setIsRevoking(false);
  };

  const handleRotate = async () => {
    setIsRotating(true);
    const result = await onRotate(apiKey.id);
    if (result?.key) {
      setRotatedKey(result.key);
    }
    setIsRotating(false);
  };

  const handleCopyRotatedKey = async () => {
    if (rotatedKey) {
      await navigator.clipboard.writeText(rotatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{apiKey.name}</TableCell>
      <TableCell>
        <code className="bg-muted px-2 py-1 rounded text-sm">
          {apiKey.keyPrefix}...
        </code>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Badge variant="outline">Okuma</Badge>
          {apiKey.permissions?.write && (
            <Badge variant="secondary">Yazma</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(apiKey.lastUsedAt)}
      </TableCell>
      <TableCell>
        {apiKey.isActive ? (
          <Badge variant="default" className="bg-green-500">
            Aktif
          </Badge>
        ) : (
          <Badge variant="secondary">İptal Edildi</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {/* Rotate Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!apiKey.isActive}
                title="Yenile"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {rotatedKey ? 'Anahtar Yenilendi' : 'API Anahtarını Yenile'}
                </DialogTitle>
                <DialogDescription>
                  {rotatedKey
                    ? 'Yeni API anahtarınız oluşturuldu. Eski anahtar artık geçersiz.'
                    : 'Bu işlem mevcut anahtarı geçersiz kılacak ve yeni bir anahtar oluşturacaktır.'}
                </DialogDescription>
              </DialogHeader>

              {rotatedKey ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Bu anahtar sadece bir kez gösterilecektir.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Input
                      type={showRotatedKey ? 'text' : 'password'}
                      value={rotatedKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowRotatedKey(!showRotatedKey)}
                    >
                      {showRotatedKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyRotatedKey}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => setRotatedKey(null)}>Tamam</Button>
                  </DialogFooter>
                </div>
              ) : (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRotatedKey(null)}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleRotate} disabled={isRotating}>
                    {isRotating ? 'Yenileniyor...' : 'Yenile'}
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>

          {/* Revoke Button */}
          {apiKey.isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="İptal Et">
                  <Ban className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>API Anahtarını İptal Et</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu API anahtarı iptal edilecek ve artık kullanılamayacak.
                    İsterseniz daha sonra silebilirsiniz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRevoke}
                    disabled={isRevoking}
                  >
                    {isRevoking ? 'İptal Ediliyor...' : 'İptal Et'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Sil">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>API Anahtarını Sil</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. API anahtarı kalıcı olarak
                  silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? 'Siliniyor...' : 'Sil'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
