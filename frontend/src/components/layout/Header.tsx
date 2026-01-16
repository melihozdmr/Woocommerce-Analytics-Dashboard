'use client';

import { Bell, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Implement refresh logic
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            className="w-64 pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="mr-4 text-right">
          <p className="text-sm font-medium">Dashboard</p>
          <p className="text-xs text-muted-foreground">
            Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
          </p>
        </div>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}
