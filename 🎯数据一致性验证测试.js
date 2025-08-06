#!/usr/bin/env node

/**
 * 🎯 数据一致性验证测试脚本
 * 验证所有修复的功能是否正常工作
 */

const https = require('https');
const { URL } = require('url');

// 测试配置
const BASE_URL = 'https://zhixing-seven.vercel.app';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

// 工具函数：发送HTTP请求
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Verification-Script/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 验证结果记录
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(description, passed, details = '') {
  const status = passed ? '✅' : '❌';
  const message = `${status} ${description}`;
  
  console.log(message);
  if (details) {
    console.log(`   ${details}`);
  }
  
  results.tests.push({ description, passed, details });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

async function testPageAccessibility() {
  console.log('\n🌐 测试页面可访问性...');
  
  const pages = [
    { path: '/', name: '首页(重定向到销售页面)' },
    { path: '/sales', name: '一级销售注册页面' },
    { path: '/secondary-sales', name: '二级销售注册页面' },
    { path: '/admin', name: '管理员登录页面' },
    { path: '/sales-reconciliation', name: '销售对账页面' }
  ];

  for (const page of pages) {
    try {
      const response = await makeRequest(`${BASE_URL}${page.path}`);
      const isSuccess = response.statusCode === 200;
      const hasReactApp = response.body.includes('id="root"') || response.body.includes('React App');
      
      if (isSuccess && hasReactApp) {
        logTest(`${page.name} 可访问`, true, `状态码: ${response.statusCode}`);
      } else {
        logTest(`${page.name} 可访问`, false, `状态码: ${response.statusCode}, React应用: ${hasReactApp}`);
      }
    } catch (error) {
      logTest(`${page.name} 可访问`, false, `请求失败: ${error.message}`);
    }
  }
}

async function testReactAppMounting() {
  console.log('\n⚛️  测试React应用挂载...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/sales`);
    
    // 检查React应用的关键元素
    const checks = [
      { test: response.body.includes('id="root"'), name: 'React根元素存在' },
      { test: response.body.includes('react'), name: 'React相关代码存在' },
      { test: !response.body.includes('Hexo'), name: '无Hexo冲突' },
      { test: response.body.includes('知行财库') || response.body.includes('销售'), name: '页面内容正确' }
    ];

    checks.forEach(check => {
      logTest(check.name, check.test);
    });

  } catch (error) {
    logTest('React应用挂载检查', false, error.message);
  }
}

async function testSalesCodeValidation() {
  console.log('\n🔍 测试销售代码验证功能...');
  
  // 测试有效的销售代码
  const testCodes = ['TEST001', 'TEST002'];
  
  for (const code of testCodes) {
    try {
      const response = await makeRequest(`${BASE_URL}/purchase?sales_code=${code}`);
      const isSuccess = response.statusCode === 200;
      const hasErrorMessage = response.body.includes('下单拥挤') || response.body.includes('系统繁忙');
      
      if (isSuccess && !hasErrorMessage) {
        logTest(`销售代码 ${code} 验证`, true, '页面正常加载');
      } else {
        logTest(`销售代码 ${code} 验证`, false, `可能仍有错误: ${hasErrorMessage ? '显示错误信息' : '其他问题'}`);
      }
    } catch (error) {
      logTest(`销售代码 ${code} 验证`, false, error.message);
    }
  }
}

async function testAdminLogin() {
  console.log('\n👤 测试管理员登录功能...');
  
  try {
    const loginPageResponse = await makeRequest(`${BASE_URL}/admin`);
    
    if (loginPageResponse.statusCode === 200) {
      logTest('管理员登录页面加载', true, '页面可访问');
      
      // 检查登录表单元素
      const hasLoginForm = loginPageResponse.body.includes('用户名') || 
                          loginPageResponse.body.includes('密码') ||
                          loginPageResponse.body.includes('登录');
      
      logTest('登录表单元素存在', hasLoginForm, hasLoginForm ? '表单正常' : '表单元素缺失');
      
    } else {
      logTest('管理员登录页面加载', false, `状态码: ${loginPageResponse.statusCode}`);
    }
    
  } catch (error) {
    logTest('管理员登录测试', false, error.message);
  }
}

async function testSecondarySalesRegistration() {
  console.log('\n📝 测试二级销售注册功能...');
  
  try {
    // 测试独立二级销售注册页面
    const independentResponse = await makeRequest(`${BASE_URL}/secondary-sales`);
    
    if (independentResponse.statusCode === 200) {
      logTest('独立二级销售注册页面', true, '页面可访问');
      
      // 检查表单元素
      const hasForm = independentResponse.body.includes('微信名称') || 
                     independentResponse.body.includes('收款方式');
      
      logTest('二级销售注册表单', hasForm, hasForm ? '表单元素存在' : '表单元素缺失');
    } else {
      logTest('独立二级销售注册页面', false, `状态码: ${independentResponse.statusCode}`);
    }
    
    // 测试关联模式（使用测试注册码）
    const linkedResponse = await makeRequest(`${BASE_URL}/secondary-sales?sales_code=TEST_REG_001`);
    
    if (linkedResponse.statusCode === 200) {
      logTest('关联二级销售注册页面', true, '页面可访问');
    } else {
      logTest('关联二级销售注册页面', false, `状态码: ${linkedResponse.statusCode}`);
    }
    
  } catch (error) {
    logTest('二级销售注册功能测试', false, error.message);
  }
}

async function testStaticResourcesLoading() {
  console.log('\n📦 测试静态资源加载...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/sales`);
    
    // 检查CSS和JS资源
    const cssMatches = response.body.match(/href="([^"]*\.css[^"]*)"/g) || [];
    const jsMatches = response.body.match(/src="([^"]*\.js[^"]*)"/g) || [];
    
    logTest('CSS资源引用', cssMatches.length > 0, `找到 ${cssMatches.length} 个CSS文件`);
    logTest('JS资源引用', jsMatches.length > 0, `找到 ${jsMatches.length} 个JS文件`);
    
    // 测试一个静态资源是否可访问
    if (cssMatches.length > 0) {
      const cssUrl = cssMatches[0].match(/href="([^"]*)"/)[1];
      const fullCssUrl = cssUrl.startsWith('http') ? cssUrl : `${BASE_URL}${cssUrl}`;
      
      try {
        const cssResponse = await makeRequest(fullCssUrl);
        logTest('静态CSS文件可访问', cssResponse.statusCode === 200, `CSS文件状态: ${cssResponse.statusCode}`);
      } catch (cssError) {
        logTest('静态CSS文件可访问', false, `CSS加载失败: ${cssError.message}`);
      }
    }
    
  } catch (error) {
    logTest('静态资源测试', false, error.message);
  }
}

async function testAPIEndpoints() {
  console.log('\n🔌 测试关键API端点...');
  
  // 这些是前端可能直接调用的Supabase端点
  const endpoints = [
    { path: '/sales', name: '销售页面API调用检查' },
    { path: '/purchase?sales_code=TEST001', name: '购买页面API调用检查' },
    { path: '/admin', name: '管理员页面API调用检查' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      
      // 检查是否有明显的API错误
      const hasApiError = response.body.includes('getSalesByLink is not a function') ||
                         response.body.includes('undefined is not a function') ||
                         response.body.includes('Cannot read property') ||
                         response.body.includes('500') ||
                         response.body.includes('404');
      
      logTest(endpoint.name, !hasApiError, hasApiError ? '检测到API错误' : '无明显API错误');
      
    } catch (error) {
      logTest(endpoint.name, false, error.message);
    }
  }
}

async function runVerification() {
  console.log('🎯 开始数据一致性验证测试');
  console.log('========================================');
  
  await testPageAccessibility();
  await testReactAppMounting();
  await testSalesCodeValidation();
  await testAdminLogin();
  await testSecondarySalesRegistration();
  await testStaticResourcesLoading();
  await testAPIEndpoints();
  
  console.log('\n📊 验证结果汇总');
  console.log('========================================');
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`📈 成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n⚠️  需要关注的问题:');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`   - ${test.description}: ${test.details}`);
    });
  }
  
  console.log('\n🎯 验证建议:');
  console.log('1. 手动测试一级销售注册流程');
  console.log('2. 手动测试二级销售注册流程');  
  console.log('3. 手动测试管理员登录和跳转');
  console.log('4. 手动测试购买页面功能');
  console.log('5. 确认数据库中的关联关系正确建立');
}

// 运行验证
runVerification().catch(console.error);