/**
 * Cache Service - Redis wrapper with fallback to in-memory cache
 * Provides caching layer with TTL support for IPO data
 */

import Redis from 'ioredis'

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  IPO_LIST: 300,           // 5 minutes - IPO listings
  IPO_FILTERED: 180,       // 3 minutes - Filtered results
  STOCK_PRICE: 60,         // 1 minute - Live stock prices
  STOCK_PRICES_BATCH: 120, // 2 minutes - Batch stock updates
  IPO_COUNT: 60,           // 1 minute - Total counts
} as const

interface CacheEntry<T = any> {
  data: T
  timestamp: number
}

class CacheService {
  private redis: Redis | null = null
  private memoryCache: Map<string, CacheEntry> = new Map()
  private enabled: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    const redisUrl = process.env.REDIS_URL

    if (redisUrl && redisUrl.trim() !== '') {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) return null
            return Math.min(times * 100, 3000)
          },
          enableReadyCheck: true,
        })

        this.redis.on('error', (err) => {
          console.warn('Redis connection error, falling back to memory cache:', err.message)
          this.enabled = false
        })

        this.redis.on('ready', () => {
          console.log('✓ Redis cache connected')
          this.enabled = true
        })

        this.enabled = true
      } catch (error) {
        console.warn('Failed to initialize Redis, using memory cache:', error)
      }
    } else {
      console.log('Redis not configured, using in-memory cache')
    }
  }

  /**
   * Generate cache key from parameters (public for custom keys)
   */
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return sortedParams ? `${prefix}:${sortedParams}` : prefix
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.enabled && this.redis) {
      try {
        const cached = await this.redis.get(key)
        if (cached) {
          return JSON.parse(cached) as T
        }
      } catch (error) {
        console.error('Redis get error:', error)
      }
    }

    // Fallback to memory cache
    const entry = this.memoryCache.get(key)
    if (entry) {
      // Check if expired (memory cache entries have timestamp)
      const now = Date.now()
      const age = (now - entry.timestamp) / 1000
      if (age > 600) { // 10 minutes max for memory cache
        this.memoryCache.delete(key)
        return null
      }
      return entry.data as T
    }

    return null
  }

  /**
   * Set cached data with TTL
   */
  async set(key: string, value: any, ttl: number = CACHE_TTL.IPO_LIST): Promise<void> {
    const serialized = JSON.stringify(value)

    if (this.enabled && this.redis) {
      try {
        await this.redis.setex(key, ttl, serialized)
      } catch (error) {
        console.error('Redis set error:', error)
        // Fallback to memory cache
        this.memoryCache.set(key, {
          data: value,
          timestamp: Date.now()
        })
      }
    } else {
      // Use memory cache with expiration check on get
      this.memoryCache.set(key, {
        data: value,
        timestamp: Date.now()
      })

      // Auto-cleanup memory cache after TTL
      setTimeout(() => {
        this.memoryCache.delete(key)
      }, ttl * 1000)
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    if (this.enabled && this.redis) {
      try {
        await this.redis.del(key)
      } catch (error) {
        console.error('Redis del error:', error)
      }
    }
    this.memoryCache.delete(key)
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (this.enabled && this.redis) {
      try {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } catch (error) {
        console.error('Redis delPattern error:', error)
      }
    }

    // Clear matching memory cache entries
    try {
      const patternRegex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      )
      for (const key of this.memoryCache.keys()) {
        if (patternRegex.test(key)) {
          this.memoryCache.delete(key)
        }
      }
    } catch (error) {
      // If pattern matching fails, just clear all memory cache
      console.error('Memory cache pattern matching error, clearing all:', error)
      this.memoryCache.clear()
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    if (this.enabled && this.redis) {
      try {
        await this.redis.flushdb()
      } catch (error) {
        console.error('Redis flush error:', error)
      }
    }
    this.memoryCache.clear()
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.enabled || this.memoryCache.size > 0
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    enabled: boolean
    redisConnected: boolean
    memoryCacheSize: number
  }> {
    return {
      enabled: this.enabled,
      redisConnected: this.redis?.status === 'ready',
      memoryCacheSize: this.memoryCache.size,
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
    this.memoryCache.clear()
  }
}

// Singleton instance
let cacheService: CacheService | null = null

export function getCache(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService()
  }
  return cacheService
}

export { CacheService }
export default getCache
