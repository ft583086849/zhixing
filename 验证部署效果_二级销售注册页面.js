#!/usr/bin/env node

/**
 * 验证部署效果 - 二级销售注册页面
 * 检查线上页面是否符合用户要求
 */

const https = require('https');

// 验证结果记录
const verificationResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

function logTest(testName, status, details, suggestion = '') {
  const result = {
    testName,
    status, // 'PASS' | 'FAIL'
    details,
    suggestion,
    timestamp: new Date().toISOString()
  };
  
  verificationResults.tests.push(result);
  verificationResults.summary.total++;
  
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${testName}] ${details}`);
  if (suggestion) console.log(`   💡 建议: ${suggestion}`);
  
  if (status === 'PASS') {
    verificationResults.summary.passed++;
  } else {
    verificationResults.summary.failed++;
  }
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testPageAccess(url, testName) {
  try {
    console.log(`\n🔍 测试: ${testName}`);
    console.log(`📍 地址: ${url}`);
    
    const response = await fetchPage(url);
    
    if (response.statusCode === 200) {
      logTest(
        `${testName} - 页面可访问`,
        'PASS',
        `HTTP ${response.statusCode} - 页面加载成功`
      );
      return response.body;
    } else {
      logTest(
        `${testName} - 页面可访问`,
        'FAIL',
        `HTTP ${response.statusCode} - 页面加载失败`,
        '检查部署状态或等待Vercel部署完成'
      );
      return null;
    }
  } catch (error) {
    logTest(
      `${testName} - 页面可访问`,
      'FAIL',
      `网络错误: ${error.message}`,
      '检查网络连接或稍后重试'
    );
    return null;
  }
}

function checkPageContent(html, testName) {
  if (!html) return;
  
  console.log(`\n🔍 检查页面内容: ${testName}`);
  
  // 检查页面标题
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1];
    if (title.includes('销售注册')) {
      logTest(
        `${testName} - 页面标题`,
        'PASS',
        `标题正确: "${title}"`
      );
    } else if (title.includes('二级销售注册')) {
      logTest(
        `${testName} - 页面标题`,
        'FAIL',
        `标题仍为旧版: "${title}"`,
        '可能存在缓存问题，建议清理浏览器缓存'
      );
    } else {
      logTest(
        `${testName} - 页面标题`,
        'FAIL',
        `标题未识别: "${title}"`,
        '检查页面是否正确加载'
      );
    }
  }
  
  // 检查是否包含React应用
  if (html.includes('UnifiedSecondarySalesPage') || html.includes('react')) {
    logTest(
      `${testName} - React应用`,
      'PASS',
      '页面包含React应用组件'
    );
  } else {
    logTest(
      `${testName} - React应用`,
      'FAIL',
      '页面可能未正确加载React应用',
      '检查JavaScript是否正常加载'
    );
  }
  
  // 检查是否为错误页面
  if (html.includes('404') || html.includes('Not Found')) {
    logTest(
      `${testName} - 页面状态`,
      'FAIL',
      '页面显示404错误',
      '检查路由配置或等待部署完成'
    );
  } else if (html.includes('注册码无效') && testName.includes('独立注册')) {
    logTest(
      `${testName} - 页面状态`,
      'FAIL',
      '独立注册页面仍显示注册码验证错误',
      '可能是缓存问题或代码未完全部署'
    );
  } else {
    logTest(
      `${testName} - 页面状态`,
      'PASS',
      '页面状态正常'
    );
  }
  
  // 检查表单元素
  const hasForm = html.includes('wechat_name') || html.includes('微信号');
  if (hasForm) {
    logTest(
      `${testName} - 表单内容`,
      'PASS',
      '包含预期的表单元素'
    );
  } else {
    logTest(
      `${testName} - 表单内容`,
      'FAIL',
      '未找到预期的表单元素',
      '检查页面是否完全加载'
    );
  }
}

function generateCacheClearingGuide() {
  console.log('\n🧹 缓存清理指南');
  console.log('='.repeat(50));
  console.log('如果页面显示旧内容，请尝试以下方法：');
  console.log('');
  console.log('📱 浏览器缓存清理：');
  console.log('  1. 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新');
  console.log('  2. 打开开发者工具 (F12)');
  console.log('  3. 右键刷新按钮，选择"清空缓存并硬性重新加载"');
  console.log('  4. 或在地址栏前加上随机参数: ?t=' + Date.now());
  console.log('');
  console.log('🌐 CDN缓存清理：');
  console.log('  1. Vercel缓存通常自动更新，等待5-10分钟');
  console.log('  2. 可以在Vercel控制台触发重新部署');
  console.log('  3. 使用隐身模式/无痕模式测试');
  console.log('');
  console.log('📍 测试链接（带缓存清理参数）：');
  const timestamp = Date.now();
  console.log(`  独立注册: https://zhixing-seven.vercel.app/secondary-sales?t=${timestamp}`);
  console.log(`  关联注册: https://zhixing-seven.vercel.app/secondary-sales?sales_code=SR000001ABCD1234&t=${timestamp}`);
}

async function main() {
  console.log('🔍 开始验证二级销售注册页面部署效果\n');
  console.log('='.repeat(60));
  
  // 测试独立注册页面
  const independentPageHtml = await testPageAccess(
    'https://zhixing-seven.vercel.app/secondary-sales',
    '独立二级销售注册'
  );
  checkPageContent(independentPageHtml, '独立注册');
  
  // 测试关联注册页面
  const linkedPageHtml = await testPageAccess(
    'https://zhixing-seven.vercel.app/secondary-sales?sales_code=SR000001ABCD1234',
    '关联二级销售注册'
  );
  checkPageContent(linkedPageHtml, '关联注册');
  
  // 生成总结报告
  console.log('\n📊 验证结果总结');
  console.log('='.repeat(50));
  console.log(`📊 总测试项: ${verificationResults.summary.total}`);
  console.log(`✅ 通过测试: ${verificationResults.summary.passed}`);
  console.log(`❌ 失败测试: ${verificationResults.summary.failed}`);
  
  const successRate = (verificationResults.summary.passed / verificationResults.summary.total * 100).toFixed(1);
  console.log(`📈 成功率: ${successRate}%`);
  
  if (verificationResults.summary.failed > 0) {
    console.log('\n⚠️ 发现问题，可能的原因：');
    console.log('  1. 🕐 部署尚未完全生效（等待5-10分钟）');
    console.log('  2. 🗄️ 浏览器或CDN缓存（清理缓存）');
    console.log('  3. 🔄 Vercel部署失败（检查部署日志）');
    
    generateCacheClearingGuide();
  } else {
    console.log('\n🎉 所有测试通过！部署成功生效！');
  }
  
  // 保存验证报告
  const reportPath = `部署验证报告_二级销售注册页面_${Date.now()}.json`;
  require('fs').writeFileSync(reportPath, JSON.stringify(verificationResults, null, 2));
  console.log(`\n📝 验证报告已保存: ${reportPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}