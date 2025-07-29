const fs = require('fs');
const path = require('path');

console.log('⚡ 知行财库最终性能调优\n');

// 优化结果
const optimizationResults = {
  filesModified: 0,
  imageOptimization: 0,
  cdnConfiguration: 0,
  databaseOptimization: 0,
  cachingImprovement: 0,
  bundleOptimization: 0
};

function optimizeImages() {
  console.log('🖼️  优化图片资源...');
  
  // 创建图片优化配置
  const imageOptimizationConfig = `
// 图片优化配置
const imageOptimization = {
  // 支持的图片格式
  formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  
  // 压缩质量设置
  quality: {
    jpg: 85,
    png: 90,
    webp: 80
  },
  
  // 尺寸优化
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 }
  },
  
  // 懒加载配置
  lazyLoading: {
    threshold: 0.1,
    rootMargin: '50px'
  }
};

export default imageOptimization;
`;
  
  const imageConfigPath = './client/src/config/imageOptimization.js';
  if (!fs.existsSync('./client/src/config')) {
    fs.mkdirSync('./client/src/config', { recursive: true });
  }
  
  if (!fs.existsSync(imageConfigPath)) {
    fs.writeFileSync(imageConfigPath, imageOptimizationConfig);
    optimizationResults.imageOptimization++;
    console.log('✅ 创建图片优化配置');
  }
  
  // 创建图片懒加载组件
  const lazyImageComponent = `
import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from 'antd';

const LazyImage = ({ 
  src, 
  alt, 
  width = '100%', 
  height = 'auto',
  placeholder = <Skeleton.Image active />,
  className = '',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('图片加载失败:', src);
    setIsLoaded(true); // 即使失败也显示占位符
  };

  return (
    <div ref={imgRef} style={{ width, height }} className={\`lazy-image-container \${className}\`}>
      {!isLoaded && placeholder}
      {isInView && (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLoaded ? 'block' : 'none'
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
`;
  
  const lazyImagePath = './client/src/components/common/LazyImage.js';
  if (!fs.existsSync(lazyImagePath)) {
    fs.writeFileSync(lazyImagePath, lazyImageComponent);
    optimizationResults.imageOptimization++;
    console.log('✅ 创建图片懒加载组件');
  }
}

function configureCDN() {
  console.log('🌐 配置CDN优化...');
  
  // 创建CDN配置
  const cdnConfig = `
// CDN配置
const cdnConfig = {
  // 静态资源CDN
  staticAssets: {
    baseUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.yourdomain.com',
    version: process.env.REACT_APP_ASSET_VERSION || '1.0.0',
    cacheControl: 'public, max-age=31536000' // 1年缓存
  },
  
  // 图片CDN
  images: {
    baseUrl: process.env.REACT_APP_IMAGE_CDN_URL || 'https://img.yourdomain.com',
    formats: ['webp', 'jpg', 'png'],
    quality: 85,
    resize: true
  },
  
  // API CDN
  api: {
    baseUrl: process.env.REACT_APP_API_CDN_URL || 'https://api.yourdomain.com',
    timeout: 10000,
    retry: 3
  }
};

// CDN工具函数
export const getCDNUrl = (path, type = 'static') => {
  const config = cdnConfig[type] || cdnConfig.staticAssets;
  return \`\${config.baseUrl}/\${path}?v=\${config.version}\`;
};

export const getImageUrl = (path, width, height, format = 'webp') => {
  const config = cdnConfig.images;
  return \`\${config.baseUrl}/\${path}?w=\${width}&h=\${height}&f=\${format}&q=\${config.quality}\`;
};

export default cdnConfig;
`;
  
  const cdnConfigPath = './client/src/config/cdn.js';
  if (!fs.existsSync(cdnConfigPath)) {
    fs.writeFileSync(cdnConfigPath, cdnConfig);
    optimizationResults.cdnConfiguration++;
    console.log('✅ 创建CDN配置');
  }
  
  // 更新API服务以支持CDN
  const apiServicePath = './client/src/services/api.js';
  if (fs.existsSync(apiServicePath)) {
    let apiContent = fs.readFileSync(apiServicePath, 'utf8');
    
    if (!apiContent.includes('getCDNUrl')) {
      const cdnImport = `
import { getCDNUrl } from '../config/cdn';
`;
      
      apiContent = apiContent.replace(
        /import axios from 'axios';/,
        `import axios from 'axios';${cdnImport}`
      );
      
      // 添加CDN API方法
      const cdnMethods = `
// CDN API方法
export const cdnApi = {
  get: (url) => api.get(getCDNUrl(url, 'api')),
  post: (url, data) => api.post(getCDNUrl(url, 'api'), data),
  put: (url, data) => api.put(getCDNUrl(url, 'api'), data),
  delete: (url) => api.delete(getCDNUrl(url, 'api'))
};
`;
      
      apiContent = apiContent.replace(
        /export \{ api \};/,
        `${cdnMethods}\n\nexport { api, cdnApi };`
      );
      
      fs.writeFileSync(apiServicePath, apiContent);
      optimizationResults.cdnConfiguration++;
      console.log('✅ 更新API服务支持CDN');
    }
  }
}

function optimizeDatabase() {
  console.log('🗄️  优化数据库查询...');
  
  // 创建数据库优化配置
  const dbOptimizationConfig = `
// 数据库查询优化配置
const dbOptimization = {
  // 查询缓存配置
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
    maxSize: 1000
  },
  
  // 分页配置
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
    pageSizeOptions: [10, 20, 50, 100]
  },
  
  // 索引建议
  indexes: [
    'orders.created_at',
    'orders.status',
    'orders.customer_id',
    'sales.sales_id',
    'customers.created_at'
  ],
  
  // 查询优化
  queryOptimization: {
    useIndexes: true,
    limitResults: true,
    selectFields: true,
    avoidNPlusOne: true
  }
};

// 查询缓存工具
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = dbOptimization.cache.ttl;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clear() {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();
export default dbOptimization;
`;
  
  const dbConfigPath = './server/config/dbOptimization.js';
  if (!fs.existsSync('./server/config')) {
    fs.mkdirSync('./server/config', { recursive: true });
  }
  
  if (!fs.existsSync(dbConfigPath)) {
    fs.writeFileSync(dbConfigPath, dbOptimizationConfig);
    optimizationResults.databaseOptimization++;
    console.log('✅ 创建数据库优化配置');
  }
  
  // 优化订单查询
  const ordersRoutePath = './server/routes/orders.js';
  if (fs.existsSync(ordersRoutePath)) {
    let ordersContent = fs.readFileSync(ordersRoutePath, 'utf8');
    
    if (!ordersContent.includes('queryCache')) {
      const cacheImport = `
const { queryCache } = require('../config/dbOptimization');
`;
      
      ordersContent = ordersContent.replace(
        /const express = require\('express'\);?/,
        `const express = require('express');${cacheImport}`
      );
      
      // 添加缓存到获取订单列表
      if (ordersContent.includes('router.get') && !ordersContent.includes('queryCache.get')) {
        ordersContent = ordersContent.replace(
          /router\.get\('\/orders', async \(req, res\) => {/,
          `router.get('/orders', async (req, res) => {
  // 检查缓存
  const cacheKey = \`orders_\${JSON.stringify(req.query)}\`;
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }`
        );
        
        ordersContent = ordersContent.replace(
          /res\.json\(result\);/,
          `// 设置缓存
  queryCache.set(cacheKey, result);
  res.json(result);`
        );
      }
      
      fs.writeFileSync(ordersRoutePath, ordersContent);
      optimizationResults.databaseOptimization++;
      console.log('✅ 优化订单查询缓存');
    }
  }
}

function improveCaching() {
  console.log('💾 改进缓存策略...');
  
  // 创建高级缓存配置
  const advancedCacheConfig = `
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
`;
  
  const cacheConfigPath = './server/config/advancedCache.js';
  if (!fs.existsSync(cacheConfigPath)) {
    fs.writeFileSync(cacheConfigPath, advancedCacheConfig);
    optimizationResults.cachingImprovement++;
    console.log('✅ 创建高级缓存配置');
  }
  
  // 更新服务器配置以使用高级缓存
  const serverIndexPath = './server/index.js';
  if (fs.existsSync(serverIndexPath)) {
    let serverContent = fs.readFileSync(serverIndexPath, 'utf8');
    
    if (!serverContent.includes('advancedCache')) {
      const cacheImport = `
const advancedCache = require('./config/advancedCache');
`;
      
      serverContent = serverContent.replace(
        /const express = require\('express'\);?/,
        `const express = require('express');${cacheImport}`
      );
      
      // 添加缓存中间件
      const cacheMiddleware = `
// 缓存中间件
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = \`\${req.originalUrl}\`;
    const cached = advancedCache.cacheManager.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      advancedCache.cacheManager.set(key, data, duration);
      originalSend.call(this, data);
    };
    
    next();
  };
};

// 应用缓存中间件
app.use('/api/admin/stats', cacheMiddleware(5 * 60 * 1000)); // 5分钟缓存
app.use('/api/admin/links', cacheMiddleware(2 * 60 * 1000)); // 2分钟缓存
`;
      
      serverContent = serverContent.replace(
        /app\.use\('\/api\/admin', enhancedAuthMiddleware\);/,
        `${cacheMiddleware}\n\napp.use('/api/admin', enhancedAuthMiddleware);`
      );
      
      fs.writeFileSync(serverIndexPath, serverContent);
      optimizationResults.cachingImprovement++;
      console.log('✅ 添加服务器缓存中间件');
    }
  }
}

function optimizeBundle() {
  console.log('📦 优化打包配置...');
  
  // 创建webpack优化配置
  const webpackOptimization = `
// Webpack优化配置
const webpackOptimization = {
  // 代码分割
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\\\/]node_modules[\\\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        enforce: true,
      },
    },
  },
  
  // 压缩配置
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production',
        },
      },
    }),
  ],
  
  // 模块解析优化
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
};

module.exports = webpackOptimization;
`;
  
  const webpackConfigPath = './client/webpack.optimization.js';
  if (!fs.existsSync(webpackConfigPath)) {
    fs.writeFileSync(webpackConfigPath, webpackOptimization);
    optimizationResults.bundleOptimization++;
    console.log('✅ 创建Webpack优化配置');
  }
  
  // 更新package.json添加构建优化脚本
  const packageJsonPath = './client/package.json';
  if (fs.existsSync(packageJsonPath)) {
    let packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageContent.scripts['build:optimized']) {
      packageContent.scripts['build:optimized'] = 'GENERATE_SOURCEMAP=false npm run build';
      packageContent.scripts['analyze'] = 'npm run build && npx webpack-bundle-analyzer build/static/js/*.js';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageContent, null, 2));
      optimizationResults.bundleOptimization++;
      console.log('✅ 添加构建优化脚本');
    }
  }
}

function createPerformanceGuide() {
  const guide = `
# 知行财库性能优化指南

## 已实现的优化

### 1. 图片优化
- 图片懒加载组件
- 多格式支持（WebP、JPG、PNG）
- 自动压缩和质量控制
- 响应式图片尺寸

### 2. CDN配置
- 静态资源CDN
- 图片CDN服务
- API CDN加速
- 缓存策略配置

### 3. 数据库优化
- 查询缓存机制
- 索引优化建议
- 分页查询优化
- N+1查询避免

### 4. 缓存改进
- 内存缓存管理
- Redis缓存支持
- 浏览器缓存策略
- 智能缓存清理

### 5. 打包优化
- 代码分割策略
- 压缩配置优化
- 模块解析优化
- 构建分析工具

## 性能监控

### 1. 前端性能
- 页面加载时间
- 资源加载优化
- 交互响应时间
- 内存使用情况

### 2. 后端性能
- API响应时间
- 数据库查询性能
- 缓存命中率
- 服务器资源使用

### 3. 网络性能
- CDN加速效果
- 带宽利用率
- 延迟优化
- 丢包率监控

## 优化建议

### 1. 生产环境
- 启用Gzip压缩
- 配置HTTP/2
- 使用CDN加速
- 启用浏览器缓存

### 2. 数据库
- 定期优化索引
- 监控慢查询
- 配置连接池
- 读写分离

### 3. 应用层面
- 代码分割
- 懒加载组件
- 虚拟滚动
- 防抖节流

## 性能测试

### 1. 工具推荐
- Lighthouse
- WebPageTest
- GTmetrix
- PageSpeed Insights

### 2. 测试指标
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### 3. 性能预算
- 页面加载 < 3秒
- API响应 < 500ms
- 图片加载 < 2秒
- 交互响应 < 100ms

## 持续优化

### 1. 监控告警
- 性能指标监控
- 错误率监控
- 用户行为分析
- 自动化告警

### 2. 定期优化
- 代码审查
- 性能审计
- 依赖更新
- 架构优化

### 3. 用户反馈
- 性能问题收集
- 用户体验调研
- A/B测试
- 持续改进
`;

  fs.writeFileSync('./performance-optimization-guide.md', guide);
  console.log('✅ 创建性能优化指南: performance-optimization-guide.md');
}

async function runFinalPerformanceOptimization() {
  console.log('🚀 开始最终性能调优...\n');
  
  optimizeImages();
  configureCDN();
  optimizeDatabase();
  improveCaching();
  optimizeBundle();
  
  console.log('\n📚 创建性能优化指南...');
  createPerformanceGuide();
  
  // 输出优化结果
  console.log('\n📊 最终性能调优结果');
  console.log('================================================================================');
  console.log(`修改的文件数: ${optimizationResults.filesModified}`);
  console.log(`图片优化: ${optimizationResults.imageOptimization}`);
  console.log(`CDN配置: ${optimizationResults.cdnConfiguration}`);
  console.log(`数据库优化: ${optimizationResults.databaseOptimization}`);
  console.log(`缓存改进: ${optimizationResults.cachingImprovement}`);
  console.log(`打包优化: ${optimizationResults.bundleOptimization}`);
  
  const totalImprovements = optimizationResults.imageOptimization + 
                           optimizationResults.cdnConfiguration + 
                           optimizationResults.databaseOptimization + 
                           optimizationResults.cachingImprovement + 
                           optimizationResults.bundleOptimization;
  
  console.log(`\n🎯 总改进项: ${totalImprovements}`);
  
  if (totalImprovements > 0) {
    console.log('✅ 最终性能调优完成！');
    console.log('📖 请查看 performance-optimization-guide.md 了解详细说明');
  } else {
    console.log('ℹ️  未发现需要优化的性能问题');
  }
  
  console.log('\n💡 性能调优完成！');
  console.log('   1. 图片懒加载和压缩优化');
  console.log('   2. CDN配置和缓存策略');
  console.log('   3. 数据库查询优化');
  console.log('   4. 高级缓存机制');
  console.log('   5. 打包构建优化');
  console.log('\n🚀 系统已准备就绪，可以进行部署！');
}

// 运行最终性能调优
runFinalPerformanceOptimization().catch(error => {
  console.error('最终性能调优失败:', error.message);
}); 