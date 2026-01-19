import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../database/prisma.service';

const PRICING_ENABLED_CACHE_KEY = 'pricing:enabled';
const CACHE_TTL = 60 * 1000; // 1 minute

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Check if pricing system is enabled
   * Returns cached value if available
   */
  async isPricingEnabled(): Promise<boolean> {
    // Check cache first
    const cached = await this.cacheManager.get<boolean>(PRICING_ENABLED_CACHE_KEY);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    // Fetch from database
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'pricing_enabled' },
    });

    const isEnabled = setting?.value === 'true';

    // Cache the result
    await this.cacheManager.set(PRICING_ENABLED_CACHE_KEY, isEnabled, CACHE_TTL);

    return isEnabled;
  }

  /**
   * Toggle pricing system on/off
   * Only accessible by admin users
   */
  async togglePricing(enabled: boolean): Promise<boolean> {
    await this.prisma.setting.upsert({
      where: { key: 'pricing_enabled' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'pricing_enabled', value: enabled ? 'true' : 'false' },
    });

    // Invalidate cache
    await this.cacheManager.del(PRICING_ENABLED_CACHE_KEY);

    return enabled;
  }

  /**
   * Get current pricing status
   */
  async getPricingStatus(): Promise<{ enabled: boolean }> {
    const enabled = await this.isPricingEnabled();
    return { enabled };
  }
}
