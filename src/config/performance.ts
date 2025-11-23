// PRODUCTION PERFORMANCE OPTIMIZATIONS

// API Configuration
export const API_CONFIG = {
  // Faster timeout for better UX
  timeout: 3000, // 3 seconds
  
  // Retry failed requests
  retries: 2,
  retryDelay: 500, // ms
  
  // Enable compression
  compress: true,
  
  // Cache strategy
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
  }
}

// Route prefetch configuration
export const ROUTE_PREFETCH = {
  // Prefetch these routes on login
  admin: ['/admin', '/admin/products'],
  fisher: ['/dashboard', '/fisher-data'],
  consumer: ['/dashboard', '/verify'],
}

// Performance monitoring
export const PERF_CONFIG = {
  // Log slow operations
  slowThreshold: 1000, // ms
  
  // Enable performance marks
  enableMarks: true,
}

// Bundle optimization
export const BUNDLE_CONFIG = {
  // Lazy load threshold (kb)
  lazyLoadThreshold: 50,
  
  // Preload critical resources
  preloadImages: false, // Load on demand
  
  // Enable tree shaking
  treeShaking: true,
}

export default {
  API_CONFIG,
  ROUTE_PREFETCH,
  PERF_CONFIG,
  BUNDLE_CONFIG,
}
