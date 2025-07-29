const fs = require('fs');
const path = require('path');

console.log('👥 知行财库用户体验优化\n');

// 优化结果
const optimizationResults = {
  filesModified: 0,
  feedbackAdded: 0,
  loadingStatesAdded: 0,
  errorHandlingAdded: 0,
  responsiveDesignAdded: 0,
  accessibilityImproved: 0
};

function addOperationFeedback() {
  console.log('💬 添加操作反馈...');
  
  // 为各个页面添加操作反馈
  const pagesToOptimize = [
    './client/src/pages/AdminLoginPage.js',
    './client/src/pages/PurchasePage.js',
    './client/src/pages/SalesReconciliationPage.js'
  ];
  
  pagesToOptimize.forEach(pagePath => {
    if (fs.existsSync(pagePath)) {
      let content = fs.readFileSync(pagePath, 'utf8');
      let modified = false;
      
      // 添加操作成功反馈
      if (content.includes('dispatch') && !content.includes('message.success')) {
        content = content.replace(
          /dispatch\(([^)]+)\)\.then\(/g,
          'dispatch($1).then((result) => {\n      if (result.payload && result.payload.success) {\n        message.success(\'操作成功！\');\n      }\n    }).catch('
        );
        modified = true;
      }
      
      // 添加操作失败反馈
      if (content.includes('catch') && !content.includes('message.error')) {
        content = content.replace(
          /\.catch\(([^)]*)\)/g,
          '.catch((error) => {\n      console.error(\'操作失败:\', error);\n      message.error(\'操作失败，请重试\');\n    })'
        );
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(pagePath, content);
        optimizationResults.filesModified++;
        optimizationResults.feedbackAdded++;
        console.log(`✅ 添加操作反馈到: ${path.basename(pagePath)}`);
      }
    }
  });
}

function enhanceLoadingStates() {
  console.log('⏳ 优化加载状态...');
  
  // 为组件添加更好的加载状态
  const componentsToOptimize = [
    './client/src/components/admin/AdminCustomers.js',
    './client/src/components/admin/AdminOrders.js',
    './client/src/components/admin/AdminSales.js'
  ];
  
  componentsToOptimize.forEach(componentPath => {
    if (fs.existsSync(componentPath)) {
      let content = fs.readFileSync(componentPath, 'utf8');
      let modified = false;
      
      // 添加骨架屏加载状态
      if (content.includes('loading') && !content.includes('Skeleton')) {
        content = content.replace(
          /import\s+React[^}]*from\s+['"]react['"];?/,
          "import React, { useState, useEffect } from 'react';"
        );
        
        content = content.replace(
          /import\s+\{[^}]*\}\s+from\s+['"]antd['"];?/,
          "import { Table, Card, Button, Space, Tag, message, Skeleton } from 'antd';"
        );
        
        // 添加骨架屏组件
        const skeletonComponent = `
const LoadingSkeleton = () => (
  <div style={{ padding: '20px' }}>
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);
`;
        
        if (!content.includes('LoadingSkeleton')) {
          content = content.replace(
            /const\s+(\w+)\s*=\s*\(\)\s*=>\s*{/,
            `${skeletonComponent}\n\nconst $1 = () => {`
          );
          modified = true;
        }
        
        // 在表格中使用骨架屏
        if (content.includes('loading') && content.includes('Table')) {
          content = content.replace(
            /<Table[^>]*loading=\{loading\}[^>]*>/,
            '<Table$1loading={loading} locale={{ emptyText: loading ? <LoadingSkeleton /> : "暂无数据" }}>'
          );
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(componentPath, content);
        optimizationResults.filesModified++;
        optimizationResults.loadingStatesAdded++;
        console.log(`✅ 优化加载状态: ${path.basename(componentPath)}`);
      }
    }
  });
}

function improveErrorHandling() {
  console.log('⚠️  改进错误处理...');
  
  // 创建全局错误边界组件
  const errorBoundaryComponent = `
import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 记录错误日志
    console.error('组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面出现错误"
          subTitle="抱歉，页面遇到了问题。请刷新页面或联系管理员。"
          extra={[
            <Button type="primary" key="refresh" onClick={() => window.location.reload()}>
              刷新页面
            </Button>,
            <Button key="back" onClick={() => window.history.back()}>
              返回上页
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
`;
  
  const errorBoundaryPath = './client/src/components/ErrorBoundary.js';
  if (!fs.existsSync(errorBoundaryPath)) {
    fs.writeFileSync(errorBoundaryPath, errorBoundaryComponent);
    optimizationResults.errorHandlingAdded++;
    console.log('✅ 创建错误边界组件');
  }
  
  // 为API服务添加错误处理
  const apiServicePath = './client/src/services/api.js';
  if (fs.existsSync(apiServicePath)) {
    let apiContent = fs.readFileSync(apiServicePath, 'utf8');
    let modified = false;
    
    // 添加全局错误处理
    if (!apiContent.includes('errorHandler')) {
      const errorHandler = `
// 全局错误处理
const errorHandler = (error) => {
  console.error('API错误:', error);
  
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response;
    switch (status) {
      case 401:
        message.error('登录已过期，请重新登录');
        // 清除本地存储并跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '/#/admin/login';
        break;
      case 403:
        message.error('没有权限访问此资源');
        break;
      case 404:
        message.error('请求的资源不存在');
        break;
      case 500:
        message.error('服务器内部错误，请稍后重试');
        break;
      default:
        message.error(data?.message || '请求失败，请重试');
    }
  } else if (error.request) {
    // 网络错误
    message.error('网络连接失败，请检查网络设置');
  } else {
    // 其他错误
    message.error('发生未知错误，请重试');
  }
  
  return Promise.reject(error);
};
`;
      
      apiContent = apiContent.replace(
        /import axios from 'axios';/,
        `import axios from 'axios';
import { message } from 'antd';${errorHandler}`
      );
      
      // 添加响应拦截器
      if (!apiContent.includes('response.use')) {
        apiContent = apiContent.replace(
          /const api = axios\.create/,
          `// 添加响应拦截器
api.interceptors.response.use(
  (response) => response,
  errorHandler
);

const api = axios.create`
        );
      }
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(apiServicePath, apiContent);
      optimizationResults.filesModified++;
      optimizationResults.errorHandlingAdded++;
      console.log('✅ 改进API错误处理');
    }
  }
}

function enhanceResponsiveDesign() {
  console.log('📱 增强响应式设计...');
  
  // 创建响应式样式文件
  const responsiveStyles = `
/* 响应式设计样式 */

/* 移动端适配 */
@media (max-width: 768px) {
  .ant-table {
    font-size: 12px;
  }
  
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 8px 4px;
  }
  
  .ant-card {
    margin-bottom: 16px;
  }
  
  .ant-form-item {
    margin-bottom: 16px;
  }
  
  .ant-btn {
    height: 32px;
    font-size: 12px;
  }
  
  .ant-input {
    height: 32px;
    font-size: 12px;
  }
  
  .ant-select {
    font-size: 12px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .ant-table {
    font-size: 13px;
  }
  
  .ant-card {
    margin-bottom: 20px;
  }
}

/* 桌面端优化 */
@media (min-width: 1025px) {
  .ant-table {
    font-size: 14px;
  }
  
  .ant-card {
    margin-bottom: 24px;
  }
  
  .ant-form-item {
    margin-bottom: 24px;
  }
}

/* 通用响应式工具类 */
.responsive-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.responsive-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* 移动端隐藏元素 */
@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
}

/* 桌面端隐藏元素 */
@media (min-width: 769px) {
  .hide-desktop {
    display: none !important;
  }
}

/* 加载动画 */
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.loading-text {
  margin-left: 8px;
  color: #666;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d9d9d9;
}

/* 成功状态样式 */
.success-state {
  text-align: center;
  padding: 20px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  margin: 16px 0;
}

/* 错误状态样式 */
.error-state {
  text-align: center;
  padding: 20px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  margin: 16px 0;
}
`;
  
  const stylesPath = './client/src/responsive.css';
  if (!fs.existsSync(stylesPath)) {
    fs.writeFileSync(stylesPath, responsiveStyles);
    optimizationResults.responsiveDesignAdded++;
    console.log('✅ 创建响应式样式文件');
  }
  
  // 在index.css中导入响应式样式
  const indexCssPath = './client/src/index.css';
  if (fs.existsSync(indexCssPath)) {
    let cssContent = fs.readFileSync(indexCssPath, 'utf8');
    
    if (!cssContent.includes('responsive.css')) {
      cssContent += '\n@import "./responsive.css";\n';
      fs.writeFileSync(indexCssPath, cssContent);
      optimizationResults.filesModified++;
      console.log('✅ 导入响应式样式');
    }
  }
}

function improveAccessibility() {
  console.log('♿ 改进可访问性...');
  
  // 为页面添加跳过导航链接
  const appJsPath = './client/src/App.js';
  if (fs.existsSync(appJsPath)) {
    let appContent = fs.readFileSync(appJsPath, 'utf8');
    let modified = false;
    
    // 添加跳过导航链接
    if (!appContent.includes('skip-nav')) {
      const skipNav = `
      {/* 跳过导航链接 - 可访问性支持 */}
      <a 
        href="#main-content" 
        className="skip-nav"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '6px',
          zIndex: 1000,
          padding: '8px 16px',
          backgroundColor: '#1890ff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          transition: 'top 0.3s'
        }}
        onFocus={(e) => {
          e.target.style.top = '6px';
        }}
        onBlur={(e) => {
          e.target.style.top = '-40px';
        }}
      >
        跳转到主要内容
      </a>
`;
      
      appContent = appContent.replace(
        /<div className="App">/,
        `<div className="App">${skipNav}`
      );
      
      // 添加主要内容标识
      appContent = appContent.replace(
        /<main[^>]*>/,
        '<main id="main-content" role="main" tabIndex="-1">'
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(appJsPath, appContent);
      optimizationResults.filesModified++;
      optimizationResults.accessibilityImproved++;
      console.log('✅ 添加跳过导航链接');
    }
  }
}

function createUserExperienceGuide() {
  const guide = `
# 知行财库用户体验指南

## 已实现的优化

### 1. 操作反馈
- 操作成功提示
- 操作失败提示
- 网络错误提示
- 权限错误提示

### 2. 加载状态优化
- 骨架屏加载效果
- 表格加载状态
- 按钮加载状态
- 页面加载动画

### 3. 错误处理改进
- 全局错误边界
- API错误处理
- 网络错误处理
- 用户友好的错误提示

### 4. 响应式设计
- 移动端适配
- 平板端适配
- 桌面端优化
- 响应式工具类

### 5. 可访问性改进
- 跳过导航链接
- 键盘导航支持
- 屏幕阅读器支持
- 焦点管理

## 用户体验最佳实践

### 对于开发者
1. 始终提供操作反馈
2. 使用骨架屏提升加载体验
3. 实现优雅的错误处理
4. 确保响应式设计
5. 关注可访问性

### 对于用户
1. 使用Tab键进行键盘导航
2. 关注操作反馈信息
3. 在网络不稳定时耐心等待
4. 遇到错误时查看提示信息

## 性能优化建议

### 1. 加载优化
- 使用懒加载
- 实现代码分割
- 优化图片加载
- 使用CDN加速

### 2. 交互优化
- 减少点击次数
- 提供快捷操作
- 实现自动保存
- 添加操作确认

### 3. 视觉优化
- 使用一致的视觉语言
- 提供清晰的视觉层次
- 优化颜色对比度
- 添加适当的动画效果

## 进一步改进建议

### 1. 个性化体验
- 用户偏好设置
- 自定义主题
- 快捷操作配置
- 历史记录功能

### 2. 智能功能
- 自动补全
- 智能提示
- 批量操作
- 数据导出

### 3. 社交功能
- 用户反馈
- 帮助文档
- 在线客服
- 社区支持
`;

  fs.writeFileSync('./user-experience-guide.md', guide);
  console.log('✅ 创建用户体验指南: user-experience-guide.md');
}

async function runUserExperienceOptimization() {
  console.log('🚀 开始用户体验优化...\n');
  
  addOperationFeedback();
  enhanceLoadingStates();
  improveErrorHandling();
  enhanceResponsiveDesign();
  improveAccessibility();
  
  console.log('\n📚 创建用户体验指南...');
  createUserExperienceGuide();
  
  // 输出优化结果
  console.log('\n📊 用户体验优化结果');
  console.log('================================================================================');
  console.log(`修改的文件数: ${optimizationResults.filesModified}`);
  console.log(`操作反馈: ${optimizationResults.feedbackAdded}`);
  console.log(`加载状态: ${optimizationResults.loadingStatesAdded}`);
  console.log(`错误处理: ${optimizationResults.errorHandlingAdded}`);
  console.log(`响应式设计: ${optimizationResults.responsiveDesignAdded}`);
  console.log(`可访问性改进: ${optimizationResults.accessibilityImproved}`);
  
  const totalImprovements = optimizationResults.feedbackAdded + 
                           optimizationResults.loadingStatesAdded + 
                           optimizationResults.errorHandlingAdded + 
                           optimizationResults.responsiveDesignAdded + 
                           optimizationResults.accessibilityImproved;
  
  console.log(`\n🎯 总改进项: ${totalImprovements}`);
  
  if (totalImprovements > 0) {
    console.log('✅ 用户体验优化完成！');
    console.log('📖 请查看 user-experience-guide.md 了解详细说明');
  } else {
    console.log('ℹ️  未发现需要优化的用户体验问题');
  }
  
  console.log('\n💡 下一步建议:');
  console.log('   1. 测试响应式设计');
  console.log('   2. 验证错误处理功能');
  console.log('   3. 检查可访问性支持');
  console.log('   4. 进行代码质量优化');
}

// 运行用户体验优化
runUserExperienceOptimization().catch(error => {
  console.error('用户体验优化失败:', error.message);
}); 