const fs = require('fs');
const path = require('path');

console.log('🔍 知行财库系统优化分析\n');

// 分析结果
const analysisResults = {
  categories: {
    performance: { score: 0, issues: [], suggestions: [] },
    security: { score: 0, issues: [], suggestions: [] },
    userExperience: { score: 0, issues: [], suggestions: [] },
    codeQuality: { score: 0, issues: [], suggestions: [] },
    accessibility: { score: 0, issues: [], suggestions: [] }
  }
};

function analyzePerformance() {
  console.log('⚡ 1. 性能分析');
  
  // 检查前端构建优化
  const clientPackageJson = JSON.parse(fs.readFileSync('./client/package.json', 'utf8'));
  const hasReactScripts = clientPackageJson.dependencies['react-scripts'];
  
  if (hasReactScripts) {
    analysisResults.categories.performance.suggestions.push('✅ 使用React Scripts，支持生产环境优化');
    analysisResults.categories.performance.score += 20;
  }
  
  // 检查图片优化
  const uploadsDir = './server/uploads';
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    
    // 检查是否有图片优化配置
    const hasImageOptimization = fs.existsSync('./client/src/config/imageOptimization.js') ||
                                fs.existsSync('./client/src/components/common/LazyImage.js');
    
    if (imageFiles.length > 0 && hasImageOptimization) {
      analysisResults.categories.performance.suggestions.push('✅ 图片优化配置已实现');
      analysisResults.categories.performance.score += 5;
    } else if (imageFiles.length > 0) {
      analysisResults.categories.performance.suggestions.push('📸 发现图片文件，建议添加图片压缩');
      analysisResults.categories.performance.issues.push('图片未压缩，可能影响加载速度');
    }
  }
  
  // 检查代码分割
  const appJs = fs.readFileSync('./client/src/App.js', 'utf8');
  if (appJs.includes('React.lazy') || appJs.includes('Suspense')) {
    analysisResults.categories.performance.suggestions.push('✅ 已实现代码分割');
    analysisResults.categories.performance.score += 15;
  } else {
    analysisResults.categories.performance.issues.push('未实现代码分割，建议添加懒加载');
  }
  
  // 检查API缓存
  const apiService = fs.readFileSync('./client/src/services/api.js', 'utf8');
  const hasCDNConfig = fs.existsSync('./client/src/config/cdn.js');
  const hasAdvancedCache = fs.existsSync('./server/config/advancedCache.js');
  
  if (apiService.includes('cache') || apiService.includes('memoize') || hasCDNConfig || hasAdvancedCache) {
    analysisResults.categories.performance.suggestions.push('✅ 已实现API缓存和CDN配置');
    analysisResults.categories.performance.score += 15;
  } else {
    analysisResults.categories.performance.issues.push('未实现API缓存，建议添加响应缓存');
  }
  
  console.log(`   性能评分: ${analysisResults.categories.performance.score}/50`);
}

function analyzeSecurity() {
  console.log('\n🔒 2. 安全性分析');
  
  // 检查输入验证
  const serverRoutes = fs.readdirSync('./server/routes');
  const serverMiddleware = fs.existsSync('./server/middleware') ? fs.readdirSync('./server/middleware') : [];
  let hasValidation = false;
  
  // 检查路由文件中的验证
  serverRoutes.forEach(route => {
    if (route.endsWith('.js')) {
      const routeContent = fs.readFileSync(`./server/routes/${route}`, 'utf8');
      if (routeContent.includes('express-validator') || routeContent.includes('joi') || routeContent.includes('validation')) {
        hasValidation = true;
      }
    }
  });
  
  // 检查中间件文件中的验证
  serverMiddleware.forEach(middleware => {
    if (middleware.endsWith('.js')) {
      const middlewareContent = fs.readFileSync(`./server/middleware/${middleware}`, 'utf8');
      if (middlewareContent.includes('express-validator') || middlewareContent.includes('validation')) {
        hasValidation = true;
      }
    }
  });
  
  if (hasValidation) {
    analysisResults.categories.security.suggestions.push('✅ 已实现输入验证');
    analysisResults.categories.security.score += 20;
  } else {
    analysisResults.categories.security.issues.push('缺少输入验证，建议添加数据验证库');
  }
  
  // 检查文件上传安全
  const serverIndex = fs.readFileSync('./server/index.js', 'utf8');
  if (serverIndex.includes('fileFilter') || serverIndex.includes('mimetype') || serverIndex.includes('securityMiddleware')) {
    analysisResults.categories.security.suggestions.push('✅ 已实现文件上传安全检查');
    analysisResults.categories.security.score += 15;
  } else {
    analysisResults.categories.security.issues.push('文件上传安全检查不完整');
  }
  
  // 检查CORS配置
  if (serverIndex.includes('cors') || serverIndex.includes('corsOptions')) {
    analysisResults.categories.security.suggestions.push('✅ 已配置CORS');
    analysisResults.categories.security.score += 10;
  } else {
    analysisResults.categories.security.issues.push('未配置CORS策略');
  }
  
  // 检查JWT安全
  if (serverIndex.includes('JWT_SECRET') && !serverIndex.includes('your_jwt_secret') || serverIndex.includes('enhancedAuthMiddleware')) {
    analysisResults.categories.security.suggestions.push('✅ JWT密钥已配置');
    analysisResults.categories.security.score += 5;
  } else {
    analysisResults.categories.security.issues.push('JWT密钥需要更新');
  }
  
  console.log(`   安全评分: ${analysisResults.categories.security.score}/50`);
}

function analyzeUserExperience() {
  console.log('\n👥 3. 用户体验分析');
  
  // 检查响应式设计
  const indexCss = fs.readFileSync('./client/src/index.css', 'utf8');
  if (indexCss.includes('@media') || indexCss.includes('responsive')) {
    analysisResults.categories.userExperience.suggestions.push('✅ 已实现响应式设计');
    analysisResults.categories.userExperience.score += 15;
  } else {
    analysisResults.categories.userExperience.issues.push('缺少响应式设计，移动端体验不佳');
  }
  
  // 检查加载状态
  const components = fs.readdirSync('./client/src/components');
  let hasLoadingStates = false;
  
  components.forEach(component => {
    if (component.endsWith('.js')) {
      const componentContent = fs.readFileSync(`./client/src/components/${component}`, 'utf8');
      if (componentContent.includes('loading') || componentContent.includes('LoadingSpinner')) {
        hasLoadingStates = true;
      }
    }
  });
  
  if (hasLoadingStates) {
    analysisResults.categories.userExperience.suggestions.push('✅ 已实现加载状态');
    analysisResults.categories.userExperience.score += 10;
  } else {
    analysisResults.categories.userExperience.issues.push('缺少加载状态提示');
  }
  
  // 检查错误处理
  const pages = fs.readdirSync('./client/src/pages');
  let hasErrorHandling = false;
  
  pages.forEach(page => {
    if (page.endsWith('.js')) {
      const pageContent = fs.readFileSync(`./client/src/pages/${page}`, 'utf8');
      if (pageContent.includes('ErrorBoundary') || pageContent.includes('try-catch')) {
        hasErrorHandling = true;
      }
    }
  });
  
  if (hasErrorHandling) {
    analysisResults.categories.userExperience.suggestions.push('✅ 已实现错误边界');
    analysisResults.categories.userExperience.score += 10;
  } else {
    analysisResults.categories.userExperience.issues.push('缺少错误边界处理');
  }
  
  // 检查操作反馈
  const store = fs.readFileSync('./client/src/store/index.js', 'utf8');
  const pageFiles = fs.readdirSync('./client/src/pages');
  let hasFeedback = false;
  
  // 检查页面文件中的反馈
  pageFiles.forEach(page => {
    if (page.endsWith('.js')) {
      const pageContent = fs.readFileSync(`./client/src/pages/${page}`, 'utf8');
      if (pageContent.includes('message.success') || pageContent.includes('message.error')) {
        hasFeedback = true;
      }
    }
  });
  
  if (store.includes('message') || store.includes('notification') || hasFeedback) {
    analysisResults.categories.userExperience.suggestions.push('✅ 已实现操作反馈');
    analysisResults.categories.userExperience.score += 10;
  } else {
    analysisResults.categories.userExperience.issues.push('缺少操作成功/失败反馈');
  }
  
  // 检查帮助文档
  if (fs.existsSync('./README.md') && fs.existsSync('./支付管理系统需求文档.md')) {
    analysisResults.categories.userExperience.suggestions.push('✅ 已有帮助文档');
    analysisResults.categories.userExperience.score += 5;
  } else {
    analysisResults.categories.userExperience.issues.push('缺少用户帮助文档');
  }
  
  console.log(`   用户体验评分: ${analysisResults.categories.userExperience.score}/50`);
}

function analyzeCodeQuality() {
  console.log('\n📝 4. 代码质量分析');
  
  // 检查代码结构
  const hasProperStructure = fs.existsSync('./client/src/components') && 
                           fs.existsSync('./client/src/pages') && 
                           fs.existsSync('./client/src/services') &&
                           fs.existsSync('./client/src/store');
  
  if (hasProperStructure) {
    analysisResults.categories.codeQuality.suggestions.push('✅ 代码结构清晰');
    analysisResults.categories.codeQuality.score += 15;
  } else {
    analysisResults.categories.codeQuality.issues.push('代码结构需要优化');
  }
  
  // 检查组件复用性
  const components = fs.readdirSync('./client/src/components');
  const commonComponents = fs.existsSync('./client/src/components/common') ? 
    fs.readdirSync('./client/src/components/common') : [];
  
  const reusableComponents = components.filter(comp => 
    comp.includes('Button') || comp.includes('Modal') || comp.includes('Form')
  );
  
  if (reusableComponents.length > 0 || commonComponents.length > 0) {
    analysisResults.categories.codeQuality.suggestions.push('✅ 有可复用组件');
    analysisResults.categories.codeQuality.score += 10;
  } else {
    analysisResults.categories.codeQuality.issues.push('缺少可复用组件');
  }
  
  // 检查状态管理
  const storeFiles = fs.readdirSync('./client/src/store/slices');
  if (storeFiles.length > 0) {
    analysisResults.categories.codeQuality.suggestions.push('✅ 使用Redux Toolkit管理状态');
    analysisResults.categories.codeQuality.score += 15;
  } else {
    analysisResults.categories.codeQuality.issues.push('状态管理需要优化');
  }
  
  // 检查API封装
  const apiService = fs.readFileSync('./client/src/services/api.js', 'utf8');
  if (apiService.includes('axios') && apiService.includes('interceptors')) {
    analysisResults.categories.codeQuality.suggestions.push('✅ API服务封装良好');
    analysisResults.categories.codeQuality.score += 10;
  } else {
    analysisResults.categories.codeQuality.issues.push('API服务需要更好的封装');
  }
  
  console.log(`   代码质量评分: ${analysisResults.categories.codeQuality.score}/50`);
}

function analyzeAccessibility() {
  console.log('\n♿ 5. 可访问性分析');
  
  // 检查语义化标签
  const indexHtml = fs.readFileSync('./client/public/index.html', 'utf8');
  if (indexHtml.includes('<main>') || indexHtml.includes('<nav>') || indexHtml.includes('<section>')) {
    analysisResults.categories.accessibility.suggestions.push('✅ 使用语义化HTML标签');
    analysisResults.categories.accessibility.score += 10;
  } else {
    analysisResults.categories.accessibility.issues.push('缺少语义化HTML标签');
  }
  
  // 检查ARIA标签
  const components = fs.readdirSync('./client/src/components');
  let hasAriaLabels = false;
  
  components.forEach(component => {
    if (component.endsWith('.js')) {
      const componentContent = fs.readFileSync(`./client/src/components/${component}`, 'utf8');
      if (componentContent.includes('aria-label') || componentContent.includes('aria-describedby')) {
        hasAriaLabels = true;
      }
    }
  });
  
  if (hasAriaLabels) {
    analysisResults.categories.accessibility.suggestions.push('✅ 使用ARIA标签');
    analysisResults.categories.accessibility.score += 10;
  } else {
    analysisResults.categories.accessibility.issues.push('缺少ARIA标签');
  }
  
  // 检查键盘导航
  const pages = fs.readdirSync('./client/src/pages');
  let hasKeyboardSupport = false;
  
  pages.forEach(page => {
    if (page.endsWith('.js')) {
      const pageContent = fs.readFileSync(`./client/src/pages/${page}`, 'utf8');
      if (pageContent.includes('onKeyDown') || pageContent.includes('tabIndex')) {
        hasKeyboardSupport = true;
      }
    }
  });
  
  if (hasKeyboardSupport) {
    analysisResults.categories.accessibility.suggestions.push('✅ 支持键盘导航');
    analysisResults.categories.accessibility.score += 10;
  } else {
    analysisResults.categories.accessibility.issues.push('缺少键盘导航支持');
  }
  
  // 检查颜色对比度
  const cssFiles = ['./client/src/index.css'];
  let hasGoodContrast = false;
  
  cssFiles.forEach(cssFile => {
    if (fs.existsSync(cssFile)) {
      const cssContent = fs.readFileSync(cssFile, 'utf8');
      if (cssContent.includes('color: #') || cssContent.includes('background-color: #')) {
        hasGoodContrast = true;
      }
    }
  });
  
  if (hasGoodContrast) {
    analysisResults.categories.accessibility.suggestions.push('✅ 有颜色定义');
    analysisResults.categories.accessibility.score += 10;
  } else {
    analysisResults.categories.accessibility.issues.push('需要检查颜色对比度');
  }
  
  // 检查错误提示
  const store = fs.readFileSync('./client/src/store/index.js', 'utf8');
  if (store.includes('error') || store.includes('Error')) {
    analysisResults.categories.accessibility.suggestions.push('✅ 有错误提示机制');
    analysisResults.categories.accessibility.score += 10;
  } else {
    analysisResults.categories.accessibility.issues.push('缺少错误提示机制');
  }
  
  console.log(`   可访问性评分: ${analysisResults.categories.accessibility.score}/50`);
}

function generateOptimizationReport() {
  console.log('\n📊 优化分析报告');
  console.log('================================================================================');
  
  const totalScore = Object.values(analysisResults.categories).reduce((sum, cat) => sum + cat.score, 0);
  const maxScore = 250; // 5个类别 * 50分
  const overallScore = Math.round((totalScore / maxScore) * 100);
  
  console.log(`总体评分: ${overallScore}/100`);
  
  Object.entries(analysisResults.categories).forEach(([category, data]) => {
    const categoryName = {
      performance: '性能',
      security: '安全性',
      userExperience: '用户体验',
      codeQuality: '代码质量',
      accessibility: '可访问性'
    }[category];
    
    console.log(`\n${categoryName} (${data.score}/50):`);
    
    if (data.suggestions.length > 0) {
      console.log('  ✅ 优点:');
      data.suggestions.forEach(suggestion => {
        console.log(`    - ${suggestion}`);
      });
    }
    
    if (data.issues.length > 0) {
      console.log('  ❌ 需要改进:');
      data.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    }
  });
  
  console.log('\n🎯 优化建议优先级:');
  
  // 按分数排序，分数低的优先优化
  const sortedCategories = Object.entries(analysisResults.categories)
    .sort(([,a], [,b]) => a.score - b.score);
  
  sortedCategories.forEach(([category, data], index) => {
    const categoryName = {
      performance: '性能优化',
      security: '安全性增强',
      userExperience: '用户体验改进',
      codeQuality: '代码质量提升',
      accessibility: '可访问性完善'
    }[category];
    
    console.log(`  ${index + 1}. ${categoryName} (当前: ${data.score}/50)`);
  });
  
  console.log('\n💡 下一步行动:');
  if (overallScore >= 80) {
    console.log('   🟢 系统质量良好，可以进行部署');
    console.log('   🔧 建议进行细节优化和性能调优');
  } else if (overallScore >= 60) {
    console.log('   🟡 系统质量一般，建议优化后再部署');
    console.log('   🚀 优先解决高分数的改进项');
  } else {
    console.log('   🔴 系统需要大量优化，不建议部署');
    console.log('   📋 建议按优先级逐步改进');
  }
}

// 运行分析
async function runAnalysis() {
  console.log('🔍 开始系统优化分析...\n');
  
  analyzePerformance();
  analyzeSecurity();
  analyzeUserExperience();
  analyzeCodeQuality();
  analyzeAccessibility();
  
  generateOptimizationReport();
}

// 运行分析
runAnalysis().catch(error => {
  console.error('分析失败:', error.message);
}); 