#!/usr/bin/env node

/**
 * 🧪 测试链接访问情况
 * 验证购买链接和注册链接是否正确指向
 */

const axios = require('axios');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testLinkAccess() {
  console.log(`${colors.blue}🧪 测试链接访问情况${colors.reset}\n`);

  const testCases = [
    {
      name: '用户购买页面',
      url: 'https://zhixing-seven.vercel.app/#/purchase/test123',
      expected: '应显示购买表单页面'
    },
    {
      name: '二级销售注册页面', 
      url: 'https://zhixing-seven.vercel.app/#/secondary-registration/test456',
      expected: '应显示销售注册页面'
    },
    {
      name: '管理员页面',
      url: 'https://zhixing-seven.vercel.app/#/admin',
      expected: '应显示管理员登录页面'
    },
    {
      name: '高阶销售注册页面',
      url: 'https://zhixing-seven.vercel.app/#/sales',
      expected: '应显示高阶销售注册页面'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`${colors.blue}测试: ${testCase.name}${colors.reset}`);
      console.log(`URL: ${testCase.url}`);
      
      const response = await axios.get(testCase.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkTest/1.0)'
        }
      });

      if (response.status === 200) {
        console.log(`${colors.green}✅ HTTP状态: ${response.status}${colors.reset}`);
        
        // 检查内容
        const content = response.data;
        const title = content.match(/<title>(.*?)<\/title>/i);
        if (title) {
          console.log(`页面标题: ${title[1]}`);
        }
        
        // 检查是否包含React应用
        const hasReactApp = content.includes('id="root"') || content.includes('class="App"');
        console.log(`React应用: ${hasReactApp ? '✅ 检测到' : '❌ 未检测到'}`);
        
      } else {
        console.log(`${colors.yellow}⚠️ HTTP状态: ${response.status}${colors.reset}`);
      }
      
    } catch (error) {
      console.log(`${colors.red}❌ 访问失败: ${error.message}${colors.reset}`);
    }
    
    console.log(`期望结果: ${testCase.expected}`);
    console.log('---');
  }

  console.log(`\n${colors.blue}🎯 链接访问测试完成${colors.reset}`);
  console.log('\n💡 如果页面都返回相同内容，说明路由可能有问题');
  console.log('💡 React SPA需要在客户端处理路由，服务器都返回同一个index.html');
}

testLinkAccess().catch(console.error);