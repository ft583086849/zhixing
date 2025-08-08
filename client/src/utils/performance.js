/**
 * 性能优化工具集
 */

/**
 * 图片压缩
 * @param {File} file - 原始图片文件
 * @param {Object} options - 压缩选项
 * @returns {Promise<Blob>} - 压缩后的图片
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          `image/${format}`,
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} - 节流后的函数
 */
export const throttle = (func, limit = 1000) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 批量请求控制
 * @param {Array} requests - 请求数组
 * @param {number} concurrency - 并发数
 * @returns {Promise<Array>} - 结果数组
 */
export const batchRequest = async (requests, concurrency = 3) => {
  const results = [];
  const executing = [];
  
  for (const request of requests) {
    const promise = Promise.resolve().then(() => request());
    results.push(promise);
    
    if (requests.length >= concurrency) {
      executing.push(promise);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }
  }
  
  return Promise.all(results);
};

/**
 * 懒加载图片
 * @param {string} selector - 图片选择器
 */
export const lazyLoadImages = (selector = 'img[data-src]') => {
  const images = document.querySelectorAll(selector);
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

/**
 * 虚拟滚动配置
 * @param {number} itemHeight - 每项高度
 * @param {number} buffer - 缓冲区大小
 * @returns {Object} - 虚拟滚动配置
 */
export const getVirtualScrollConfig = (itemHeight = 50, buffer = 5) => {
  return {
    itemHeight,
    buffer,
    scroll: {
      y: 600,
      scrollToFirstRowOnChange: true,
      virtual: true
    }
  };
};

/**
 * 缓存策略配置
 */
export const CACHE_CONFIG = {
  // 短期缓存（1分钟）
  SHORT: 60 * 1000,
  // 中期缓存（5分钟）
  MEDIUM: 5 * 60 * 1000,
  // 长期缓存（30分钟）
  LONG: 30 * 60 * 1000,
  // 统计数据缓存（10分钟）
  STATS: 10 * 60 * 1000,
  // 销售数据缓存（5分钟）
  SALES: 5 * 60 * 1000,
  // 订单数据缓存（2分钟）
  ORDERS: 2 * 60 * 1000
};

/**
 * 智能缓存管理器
 */
export class SmartCacheManager {
  static cache = new Map();
  
  static get(key, maxAge = CACHE_CONFIG.MEDIUM) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      console.log(`📦 缓存命中: ${key}`);
      return cached.data;
    }
    console.log(`❌ 缓存未命中或已过期: ${key}`);
    return null;
  }
  
  static set(key, data, ttl = CACHE_CONFIG.MEDIUM) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`💾 数据已缓存: ${key}`);
  }
  
  static remove(key) {
    this.cache.delete(key);
    console.log(`🗑️ 缓存已删除: ${key}`);
  }
  
  static clear(pattern = null) {
    if (pattern) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
      console.log(`🧹 清除匹配模式的缓存: ${pattern}`);
    } else {
      this.cache.clear();
      console.log('🧹 清除所有缓存');
    }
  }
  
  static refresh(key) {
    this.remove(key);
    console.log(`🔄 缓存已刷新: ${key}`);
  }
}
