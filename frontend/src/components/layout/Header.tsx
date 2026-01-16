'use client';

import { Bell, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Implement refresh logic
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Son guncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </p>
      </div>

      <div className="flex items-center space-x-4">
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        >
          <RefreshCw
            className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </header>
  );
}
