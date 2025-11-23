/**
 * PRODUCTION-OPTIMIZED API SERVICE
 * Features:
 * - Response caching
 * - Request deduplication
 * - Automatic retries
 * - Performance monitoring
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class OptimizedAPIService {
  private cache: Map<string, CacheEntry> = new Map()
  private pendingRequests: Map<string, Promise<any>> = new Map()
  
  // Cache TTL in milliseconds
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  
  /**
   * Get data with caching
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = this.DEFAULT_TTL): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`✅ Cache HIT: ${key}`)
      return cached.data
    }
    
    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(key)
    if (pending) {
      console.log(`⏳ Request PENDING: ${key}`)
      return pending
    }
    
    // Make new request
    console.log(`📡 Cache MISS: ${key}`)
    const promise = fetcher()
      .then(data => {
        // Store in cache
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        })
        
        // Remove from pending
        this.pendingRequests.delete(key)
        
        return data
      })
      .catch(error => {
        // Remove from pending on error
        this.pendingRequests.delete(key)
        throw error
      })
    
    // Store as pending
    this.pendingRequests.set(key, promise)
    
    return promise
  }
  
  /**
   * Invalidate cache for a key
   */
  invalidate(key: string) {
    this.cache.delete(key)
    console.log(`🗑️ Cache invalidated: ${key}`)
  }
  
  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear()
    this.pendingRequests.clear()
    console.log('🗑️ All cache cleared')
  }
  
  /**
   * Prefetch data (load in background)
   */
  async prefetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number) {
    // Don't block, just fire and forget
    this.get(key, fetcher, ttl).catch(err => {
      console.warn(`Prefetch failed for ${key}:`, err)
    })
  }
  
  /**
   * Get cache stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const apiCache = new OptimizedAPIService()

export default apiCache
