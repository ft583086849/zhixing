const axios = require('axios');

const baseURL = 'https://zhixing-seven.vercel.app';

// 所有需要检查的页面链接
const pagesToCheck = [
  // 主页面
  { path: '/', name: '主页面' },
  
  // 管理员页面
  { path: '/admin', name: '管理员登录页面' },
  { path: '/admin/dashboard', name: '管理员概览页面' },
  { path: '/admin/overview', name: '管理员概览页面(别名)' },
  { path: '/admin/payment-config', name: '支付配置页面' },
  { path: '/admin/users', name: '用户管理页面' },
  { path: '/admin/orders', name: '订单管理页面' },
  { path: '/admin/sales', name: '销售管理页面' },
  { path: '/admin/export', name: '数据导出页面' },
  
  // 一级销售页面
  { path: '/primary-sales', name: '一级销售页面' },
  { path: '/primary-sales/register', name: '一级销售注册页面' },
  { path: '/primary-sales/list', name: '一级销售列表页面' },
  { path: '/primary-sales/settlement', name: '一级销售结算页面' },
  { path: '/primary-sales/orders', name: '一级销售订单管理页面' },
  { path: '/primary-sales/reminders', name: '一级销售催单管理页面' },
  
  // 二级销售页面
  { path: '/secondary-sales', name: '二级销售页面' },
  { path: '/secondary-sales/register', name: '二级销售注册页面' },
  { path: '/secondary-sales/list', name: '二级销售列表页面' },
  { path: '/secondary-sales/orders', name: '二级销售订单管理页面' },
  { path: '/secondary-sales/reminders', name: '二级销售催单管理页面' },
  
  // 用户购买页面
  { path: '/purchase', name: '用户购买页面' },
  { path: '/user/orders', name: '用户订单页面' },
  
  // 其他页面
  { path: '/sales', name: '销售页面' },
  { path: '/sales-reconciliation', name: '销售对账页面' },
  { path: '/auth-test', name: '认证测试页面' }
];

async function checkPage(url, name) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // 接受所有非500错误
      }
    });
    
    const status = response.status;
    const contentLength = response.headers['content-length'] || 'unknown';
    const contentType = response.headers['content-type'] || 'unknown';
    
    if (status === 200) {
      // 检查内容是否为空或只有基本HTML结构
      const content = response.data;
      const isEmpty = content.length < 1000; // 小于1KB可能有问题
      const hasReactApp = content.includes('id="root"') && content.includes('main.');
      
      if (isEmpty || !hasReactApp) {
        return { status: '⚠️', message: `页面可能为空或有问题 (${contentLength} bytes)` };
      } else {
        return { status: '✅', message: `正常 (${contentLength} bytes)` };
      }
    } else if (status === 404) {
      return { status: '❌', message: '页面不存在 (404)' };
    } else if (status === 403) {
      return { status: '🔒', message: '需要认证 (403)' };
    } else {
      return { status: '❌', message: `HTTP ${status}` };
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return { status: '⏰', message: '请求超时' };
    } else if (error.code === 'ENOTFOUND') {
      return { status: '❌', message: '域名不存在' };
    } else {
      return { status: '❌', message: error.message };
    }
  }
}

async function checkAllPages() {
  console.log('🔍 检查所有页面链接状态...\n');
  
  const results = [];
  
  for (const page of pagesToCheck) {
    const url = `${baseURL}${page.path}`;
    console.log(`检查 ${page.name} (${url})...`);
    
    const result = await checkPage(url, page.name);
    results.push({
      name: page.name,
      path: page.path,
      url: url,
      ...result
    });
    
    console.log(`  ${result.status} ${result.message}\n`);
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 输出总结
  console.log('📊 检查结果总结:');
  console.log('=' * 50);
  
  const statusCounts = {};
  results.forEach(result => {
    statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
  });
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`${status}: ${count} 个页面`);
  });
  
  console.log('\n📋 详细结果:');
  console.log('=' * 50);
  
  results.forEach(result => {
    console.log(`${result.status} ${result.name}`);
    console.log(`   路径: ${result.path}`);
    console.log(`   状态: ${result.message}`);
    console.log('');
  });
  
  // 检查API端点
  console.log('🔧 检查API端点...');
  try {
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ API健康检查: 正常');
  } catch (error) {
    console.log('❌ API健康检查: 失败');
  }
}

checkAllPages(); 