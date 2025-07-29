
// 高级缓存配置
const advancedCache = {
  // 内存缓存
  memory: {
    maxSize: 1000,
    ttl: 10 * 60 * 1000, // 10分钟
    cleanupInterval: 5 * 60 * 1000 // 5分钟清理一次
  },
  
  // Redis缓存配置（生产环境）
  redis: {
    enabled: process.env.NODE_ENV === 'production',
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    ttl: 30 * 60 * 1000 // 30分钟
  },
  
  // 浏览器缓存
  browser: {
    staticAssets: 'public, max-age=31536000', // 1年
    apiResponses: 'private, max-age=300', // 5分钟
    images: 'public, max-age=86400' // 1天
  }
};

// 缓存管理器
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cleanupTimer = null;
    this.startCleanup();
  }

  set(key, value, ttl = advancedCache.memory.ttl) {
    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value;
    }
    this.memoryCache.delete(key);
    return null;
  }

  clear() {
    this.memoryCache.clear();
  }

  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.memoryCache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.memoryCache.delete(key);
        }
      }
    }, advancedCache.memory.cleanupInterval);
  }

  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

export const cacheManager = new CacheManager();
export default advancedCache;
