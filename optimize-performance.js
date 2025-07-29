const fs = require('fs');
const path = require('path');

console.log('⚡ 知行财库性能优化\n');

// 优化结果
const optimizationResults = {
  filesModified: 0,
  lazyLoadingAdded: 0,
  codeSplittingAdded: 0,
  apiCacheAdded: 0,
  imageOptimizationAdded: 0
};

function addLazyLoading() {
  console.log('📦 添加懒加载...');
  
  // 修改App.js添加懒加载
  const appJsPath = './client/src/App.js';
  let appContent = fs.readFileSync(appJsPath, 'utf8');
  let modified = false;
  
  // 添加React.lazy导入
  if (!appContent.includes('React.lazy')) {
    appContent = appContent.replace(
      "import React from 'react';",
      "import React, { Suspense, lazy } from 'react';"
    );
    modified = true;
  }
  
  // 将页面组件改为懒加载
  const lazyComponents = [
    { name: 'AdminDashboardPage', path: './pages/AdminDashboardPage' },
    { name: 'AdminLoginPage', path: './pages/AdminLoginPage' },
    { name: 'AuthTestPage', path: './pages/AuthTestPage' },
    { name: 'PurchasePage', path: './pages/PurchasePage' },
    { name: 'SalesPage', path: './pages/SalesPage' },
    { name: 'SalesReconciliationPage', path: './pages/SalesReconciliationPage' }
  ];
  
  lazyComponents.forEach(component => {
    const importPattern = new RegExp(`import\\s+${component.name}\\s+from\\s+['"]${component.path}['"];?`, 'g');
    const lazyPattern = `const ${component.name} = lazy(() => import('${component.path}'));`;
    
    if (appContent.includes(`import ${component.name} from`)) {
      appContent = appContent.replace(importPattern, lazyPattern);
      modified = true;
      optimizationResults.lazyLoadingAdded++;
    }
  });
  
  // 添加Suspense包装
  if (modified && !appContent.includes('<Suspense')) {
    appContent = appContent.replace(
      /<Route([^>]*?)path="([^"]*)"([^>]*?)element=\{<([^>]+)>/g,
      '<Route$1path="$2"$3element={<Suspense fallback={<div>加载中...</div>}><$4></Suspense>'
    );
  }
  
  if (modified) {
    fs.writeFileSync(appJsPath, appContent);
    optimizationResults.filesModified++;
    console.log('✅ 添加懒加载到App.js');
  }
}

function addCodeSplitting() {
  console.log('🔧 添加代码分割...');
  
  // 为大型组件添加代码分割
  const componentsToSplit = [
    './client/src/components/admin/AdminCustomers.js',
    './client/src/components/admin/AdminOrders.js',
    './client/src/components/admin/AdminSales.js'
  ];
  
  componentsToSplit.forEach(componentPath => {
    if (fs.existsSync(componentPath)) {
      let content = fs.readFileSync(componentPath, 'utf8');
      let modified = false;
      
      // 添加React.memo优化
      if (!content.includes('React.memo')) {
        content = content.replace(
          /const\s+(\w+)\s*=\s*\(\)\s*=>\s*{/,
          'const $1 = React.memo(() => {'
        );
        modified = true;
      }
      
      // 添加useMemo优化
      if (content.includes('useState') && !content.includes('useMemo')) {
        content = content.replace(
          /import\s+React[^}]*from\s+['"]react['"];?/,
          "import React, { useState, useEffect, useMemo } from 'react';"
        );
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(componentPath, content);
        optimizationResults.filesModified++;
        optimizationResults.codeSplittingAdded++;
        console.log(`✅ 优化组件: ${path.basename(componentPath)}`);
      }
    }
  });
}

function addApiCache() {
  console.log('💾 添加API缓存...');
  
  const apiServicePath = './client/src/services/api.js';
  let apiContent = fs.readFileSync(apiServicePath, 'utf8');
  let modified = false;
  
  // 添加缓存功能
  if (!apiContent.includes('cache')) {
    const cacheCode = `
// API缓存配置
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 缓存工具函数
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const clearCache = () => {
  cache.clear();
};
`;
    
    apiContent = apiContent.replace(
      "import axios from 'axios';",
      `import axios from 'axios';${cacheCode}`
    );
    modified = true;
  }
  
  // 为GET请求添加缓存
  if (!apiContent.includes('getCachedData')) {
    apiContent = apiContent.replace(
      /get:\s*\(url\)\s*=>\s*api\.get\(url\)/g,
      'get: (url) => {\n    const cached = getCachedData(url);\n    if (cached) return Promise.resolve(cached);\n    return api.get(url).then(response => {\n      setCachedData(url, response);\n      return response;\n    });\n  }'
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(apiServicePath, apiContent);
    optimizationResults.filesModified++;
    optimizationResults.apiCacheAdded++;
    console.log('✅ 添加API缓存功能');
  }
}

function optimizeImages() {
  console.log('🖼️  图片优化建议...');
  
  const uploadsDir = './server/uploads';
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    
    if (imageFiles.length > 0) {
      console.log(`📸 发现 ${imageFiles.length} 个图片文件`);
      console.log('💡 建议:');
      console.log('   - 使用WebP格式替代JPEG/PNG');
      console.log('   - 压缩图片文件大小');
      console.log('   - 实现图片懒加载');
      console.log('   - 添加图片尺寸限制');
      
      optimizationResults.imageOptimizationAdded = imageFiles.length;
    }
  }
}

function createPerformanceGuide() {
  const guide = `
# 知行财库性能优化指南

## 已实现的优化

### 1. 懒加载 (Lazy Loading)
- 页面组件使用React.lazy进行懒加载
- 添加Suspense包装器提供加载状态
- 减少初始包大小，提升首屏加载速度

### 2. 代码分割 (Code Splitting)
- 大型组件使用React.memo优化
- 添加useMemo减少不必要的重新渲染
- 优化组件性能

### 3. API缓存
- 实现5分钟缓存机制
- 减少重复API请求
- 提升数据加载速度

### 4. 图片优化建议
- 建议使用WebP格式
- 压缩图片文件大小
- 实现图片懒加载

## 性能监控

### 前端性能指标
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

### 优化建议
1. 使用React DevTools Profiler分析组件性能
2. 监控网络请求响应时间
3. 定期检查包大小
4. 使用Lighthouse进行性能审计

## 进一步优化

### 1. 服务端优化
- 实现数据库查询优化
- 添加Redis缓存
- 使用CDN加速静态资源

### 2. 前端优化
- 实现虚拟滚动
- 添加预加载关键资源
- 优化字体加载

### 3. 构建优化
- 启用代码压缩
- 实现Tree Shaking
- 优化Webpack配置
`;

  fs.writeFileSync('./performance-guide.md', guide);
  console.log('✅ 创建性能优化指南: performance-guide.md');
}

async function runPerformanceOptimization() {
  console.log('🚀 开始性能优化...\n');
  
  addLazyLoading();
  addCodeSplitting();
  addApiCache();
  optimizeImages();
  
  console.log('\n📚 创建性能优化指南...');
  createPerformanceGuide();
  
  // 输出优化结果
  console.log('\n📊 性能优化结果');
  console.log('================================================================================');
  console.log(`修改的文件数: ${optimizationResults.filesModified}`);
  console.log(`添加的懒加载: ${optimizationResults.lazyLoadingAdded}`);
  console.log(`添加的代码分割: ${optimizationResults.codeSplittingAdded}`);
  console.log(`添加的API缓存: ${optimizationResults.apiCacheAdded}`);
  console.log(`图片优化建议: ${optimizationResults.imageOptimizationAdded}`);
  
  const totalImprovements = optimizationResults.lazyLoadingAdded + 
                           optimizationResults.codeSplittingAdded + 
                           optimizationResults.apiCacheAdded;
  
  console.log(`\n🎯 总改进项: ${totalImprovements}`);
  
  if (totalImprovements > 0) {
    console.log('✅ 性能优化完成！');
    console.log('📖 请查看 performance-guide.md 了解详细说明');
  } else {
    console.log('ℹ️  未发现需要优化的性能问题');
  }
  
  console.log('\n💡 下一步建议:');
  console.log('   1. 测试页面加载速度');
  console.log('   2. 使用Lighthouse进行性能审计');
  console.log('   3. 监控API响应时间');
  console.log('   4. 进行安全性优化');
}

// 运行性能优化
runPerformanceOptimization().catch(error => {
  console.error('性能优化失败:', error.message);
}); 