'use client';

import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const stats = [
  {
    name: 'Toplam Stok',
    value: '12.450',
    change: '+4.75%',
    changeType: 'positive',
    icon: Package,
  },
  {
    name: 'Bugünün Satışı',
    value: '4.250 ₺',
    change: '+12.5%',
    changeType: 'positive',
    icon: ShoppingCart,
  },
  {
    name: 'Toplam Kâr',
    value: '850 ₺',
    change: '+8.2%',
    changeType: 'positive',
    icon: TrendingUp,
  },
  {
    name: 'Kritik Stok',
    value: '23',
    change: '-2',
    changeType: 'negative',
    icon: AlertTriangle,
  },
];

const recentOrders = [
  {
    id: '#1234',
    store: 'E-Shop TR',
    amount: '250 ₺',
    status: 'Tamamlandı',
    statusType: 'success',
    date: '16.01.2026 10:30',
  },
  {
    id: '#1235',
    store: 'ModaStore',
    amount: '180 ₺',
    status: 'Beklemede',
    statusType: 'warning',
    date: '16.01.2026 10:25',
  },
  {
    id: '#1236',
    store: 'TechWorld',
    amount: '520 ₺',
    status: 'Tamamlandı',
    statusType: 'success',
    date: '16.01.2026 10:15',
  },
  {
    id: '#1237',
    store: 'E-Shop TR',
    amount: '95 ₺',
    status: 'İptal',
    statusType: 'destructive',
    date: '16.01.2026 09:45',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Mağaza performansınıza genel bakış</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Satış Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md bg-muted">
              <p className="text-muted-foreground">Grafik burada gösterilecek</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mağaza Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md bg-muted">
              <p className="text-muted-foreground">Grafik burada gösterilecek</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Son Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Mağaza</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.store}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.statusType === 'success'
                          ? 'default'
                          : order.statusType === 'warning'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
