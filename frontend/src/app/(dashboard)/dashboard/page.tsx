'use client';

import { Package, ShoppingCart, CreditCard, TrendingUp } from 'lucide-react';

const stats = [
  {
    name: 'Toplam Stok',
    value: '12,450',
    change: '+4.75%',
    changeType: 'positive',
    icon: Package,
  },
  {
    name: 'Bugunun Satisi',
    value: '4,250 TL',
    change: '+12.5%',
    changeType: 'positive',
    icon: ShoppingCart,
  },
  {
    name: 'Toplam Kar',
    value: '850 TL',
    change: '+8.2%',
    changeType: 'positive',
    icon: TrendingUp,
  },
  {
    name: 'Kritik Stok',
    value: '23',
    change: '-2',
    changeType: 'negative',
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Magaza performansiniza genel bakis</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Satis Trendi</h3>
          <div className="mt-4 h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Grafik burada gosterilecek</p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Magaza Dagilimi</h3>
          <div className="mt-4 h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Grafik burada gosterilecek</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Son Siparisler</h3>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Siparis No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Magaza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  #1234
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  E-Shop TR
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  250 TL
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                    Tamamlandi
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  16.01.2026 10:30
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  #1235
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  ModaStore
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  180 TL
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                    Beklemede
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  16.01.2026 10:25
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
