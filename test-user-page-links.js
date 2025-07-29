#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

console.log('🔗 测试用户页面链接...\n');

const baseURL = 'http://localhost:3000/#';

// 测试页面链接
const testPages = [
  {
    name: '销售页面',
    path: '/sales',
    description: '创建收款链接的页面'
  },
  {
    name: '用户购买页面',
    path: '/purchase/test-link-123',
    description: '用户通过链接访问的购买页面'
  },
  {
    name: '销售对账页面',
    path: '/sales-reconciliation',
    description: '销售专用对账页面'
  },
  {
    name: '管理员登录页面',
    path: '/admin',
    description: '管理员登录入口'
  },
  {
    name: '认证测试页面',
    path: '/auth-test',
    description: '认证功能测试页面'
  }
];

async function testPageAccess(page) {
  try {
    console.log(`📄 测试 ${page.name}...`);
    console.log(`   路径: ${page.path}`);
    console.log(`   描述: ${page.description}`);
    
    const response = await axios.get(`${baseURL}${page.path}`, {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500; // 接受所有非服务器错误的响应
      }
    });
    
    if (response.status === 200) {
      console.log(`   ✅ 状态: ${response.status} - 页面可访问`.green);
      
      // 检查页面内容
      const content = response.data;
      if (content.includes('知行财库')) {
        console.log('   ✅ 页面标题正确'.green);
      }
      if (content.includes('root')) {
        console.log('   ✅ React应用根元素存在'.green);
      }
    } else {
      console.log(`   ⚠️  状态: ${response.status} - 页面可能需要认证或重定向`.yellow);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ 错误: 无法连接到服务器，请确保React开发服务器正在运行'.red);
    } else if (error.code === 'ENOTFOUND') {
      console.log('   ❌ 错误: 服务器地址未找到'.red);
    } else {
      console.log(`   ❌ 错误: ${error.message}`.red);
    }
  }
  
  console.log('');
}

async function testAdminRoutes() {
  console.log('🔐 测试管理员路由...\n');
  
  const adminRoutes = [
    '/admin/dashboard',
    '/admin/orders', 
    '/admin/sales',
    '/admin/customers',
    '/admin/lifetime-limit',
    '/admin/payment-config'
  ];
  
  for (const route of adminRoutes) {
    try {
      console.log(`📄 测试管理员路由: ${route}`);
      
      const response = await axios.get(`${baseURL}${route}`, {
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.status === 200) {
        console.log(`   ✅ 状态: ${response.status} - 路由可访问`.green);
      } else if (response.status === 302 || response.status === 301) {
        console.log(`   🔄 状态: ${response.status} - 重定向到登录页面（正常行为）`.yellow);
      } else {
        console.log(`   ⚠️  状态: ${response.status}`.yellow);
      }
      
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`.red);
    }
    
    console.log('');
  }
}

async function testPurchaseLinkGeneration() {
  console.log('🔗 测试购买链接生成...\n');
  
  // 模拟一个购买链接
  const testLinkCode = 'test-link-' + Date.now();
  const purchaseURL = `${baseURL}/purchase/${testLinkCode}`;
  
  console.log(`📄 测试购买链接: ${purchaseURL}`);
  
  try {
    const response = await axios.get(purchaseURL, {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    if (response.status === 200) {
      console.log(`   ✅ 状态: ${response.status} - 购买链接可访问`.green);
      
      const content = response.data;
      if (content.includes('知行财库')) {
        console.log('   ✅ 页面标题正确'.green);
      }
    } else {
      console.log(`   ⚠️  状态: ${response.status}`.yellow);
    }
    
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`.red);
  }
  
  console.log('');
}

async function runTests() {
  console.log('🚀 开始测试用户页面链接...\n');
  
  // 测试基本页面访问
  for (const page of testPages) {
    await testPageAccess(page);
  }
  
  // 测试管理员路由
  await testAdminRoutes();
  
  // 测试购买链接生成
  await testPurchaseLinkGeneration();
  
  console.log('✨ 测试完成！');
  console.log('\n📋 总结:');
  console.log('   • 销售页面: /sales - 创建收款链接');
  console.log('   • 用户购买页面: /purchase/:linkCode - 用户通过链接访问');
  console.log('   • 销售对账页面: /sales-reconciliation - 销售专用页面');
  console.log('   • 管理员登录: /admin - 管理员入口');
  console.log('   • 管理员后台: /admin/* - 需要认证的管理功能');
  console.log('\n🔧 如果遇到问题:');
  console.log('   1. 确保React开发服务器正在运行 (npm start)');
  console.log('   2. 检查浏览器控制台是否有错误');
  console.log('   3. 验证所有组件都已正确导入');
}

// 运行测试
runTests().catch(console.error); 