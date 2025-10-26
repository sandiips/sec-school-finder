// src/lib/cache.ts
import NodeCache from 'node-cache';
import { RankSchoolsParams, SchoolResult } from './ai-tools';

// Create in-memory cache with 24-hour TTL
const cache = new NodeCache({
  stdTTL: 24 * 60 * 60, // 24 hours in seconds
  checkperiod: 60 * 60, // Check for expired keys every hour
  useClones: false, // Better performance for read-heavy workload
});

export interface CachedRankingResult {
  schools: SchoolResult[];
  summary: string;
  metadata: Record<string, any>;
  cached: boolean;
  cacheKey: string;
}

// Generate deterministic cache key from parameters
export function generateCacheKey(params: RankSchoolsParams): string {
  // Normalize arrays by sorting them
  const normalized = {
    ...params,
    sports_selected: [...params.sports_selected].sort(),
    ccas_selected: [...params.ccas_selected].sort(),
    culture_selected: [...params.culture_selected].sort()
  };

  // Create deterministic string representation
  const keyString = JSON.stringify(normalized, Object.keys(normalized).sort());

  // Use base64 encoding for cleaner keys
  const cacheKey = `ai_rank:${Buffer.from(keyString).toString('base64')}`;

  return cacheKey;
}

// Get cached ranking result
export async function getCachedRanking(
  params: RankSchoolsParams
): Promise<CachedRankingResult | null> {
  try {
    const cacheKey = generateCacheKey(params);
    const cached = cache.get<Omit<CachedRankingResult, 'cached' | 'cacheKey'>>(cacheKey);

    if (cached) {
      // Update cache hit metrics
      trackCacheHit(cacheKey, true);

      return {
        ...cached,
        cached: true,
        cacheKey
      };
    }

    // Track cache miss
    trackCacheHit(cacheKey, false);
    return null;

  } catch (error) {
    console.error('Error getting cached ranking:', error);
    return null;
  }
}

// Set cached ranking result
export async function setCachedRanking(
  params: RankSchoolsParams,
  result: {
    schools: SchoolResult[];
    summary: string;
    metadata: Record<string, any>;
  }
): Promise<string> {
  try {
    const cacheKey = generateCacheKey(params);

    // Add cache metadata
    const cacheData = {
      ...result,
      metadata: {
        ...result.metadata,
        cachedAt: new Date().toISOString(),
        cacheKey
      }
    };

    // Store in cache
    cache.set(cacheKey, cacheData);

    // Track cache set operation
    trackCacheSet(cacheKey, result.schools.length);

    return cacheKey;

  } catch (error) {
    console.error('Error setting cached ranking:', error);
    throw error;
  }
}

// Invalidate cache for specific parameters or all
export function invalidateCache(params?: RankSchoolsParams): void {
  try {
    if (params) {
      const cacheKey = generateCacheKey(params);
      cache.del(cacheKey);
      console.log(`Cache invalidated for key: ${cacheKey}`);
    } else {
      cache.flushAll();
      console.log('All cache invalidated');
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

// Get cache statistics
export function getCacheStats() {
  const stats = cache.getStats();
  const keys = cache.keys();

  return {
    hits: stats.hits,
    misses: stats.misses,
    keys: stats.keys,
    ksize: stats.ksize,
    vsize: stats.vsize,
    hitRate: stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0,
    totalKeys: keys.length,
    sampleKeys: keys.slice(0, 5) // Show first 5 keys for debugging
  };
}

// Simple analytics tracking (in-memory)
const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  totalSchoolsServed: 0,
  lastReset: new Date().toISOString()
};

function trackCacheHit(cacheKey: string, isHit: boolean): void {
  if (isHit) {
    cacheMetrics.hits++;
  } else {
    cacheMetrics.misses++;
  }
}

function trackCacheSet(cacheKey: string, schoolCount: number): void {
  cacheMetrics.sets++;
  cacheMetrics.totalSchoolsServed += schoolCount;
}

export function getCacheMetrics() {
  const hitRate = cacheMetrics.hits > 0
    ? (cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)) * 100
    : 0;

  return {
    ...cacheMetrics,
    hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
    totalRequests: cacheMetrics.hits + cacheMetrics.misses
  };
}

export function resetCacheMetrics(): void {
  cacheMetrics.hits = 0;
  cacheMetrics.misses = 0;
  cacheMetrics.sets = 0;
  cacheMetrics.totalSchoolsServed = 0;
  cacheMetrics.lastReset = new Date().toISOString();
}

// Middleware for cache warming (optional)
export async function warmCache(): Promise<void> {
  console.log('Cache warming not implemented - would pre-populate common queries');
  // This could be implemented to pre-populate cache with common queries
  // For example: popular AL scores + major postal codes + common preferences
}

// Cache key validation and debugging
export function validateCacheKey(params: RankSchoolsParams): {
  isValid: boolean;
  key: string;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate AL score
  if (params.al_score < 4 || params.al_score > 30) {
    errors.push('Invalid AL score range');
  }

  // Validate postal code
  if (!/^\d{6}$/.test(params.postal_code)) {
    errors.push('Invalid postal code format');
  }

  // Validate primary school
  if (!params.primary_school || params.primary_school.trim().length === 0) {
    errors.push('Missing primary school');
  }

  const key = generateCacheKey(params);

  return {
    isValid: errors.length === 0,
    key,
    errors
  };
}

export { cache as cacheInstance };