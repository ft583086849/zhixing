/**
 * 部署验证 - 完整功能测试
 * 验证佣金比率计算逻辑是否正确部署
 */

const axios = require('axios');
const fs = require('fs');

console.log('🔍 部署验证 - 佣金比率计算逻辑生效检查');
console.log('=' .repeat(60));

// 验证配置
const baseURL = 'https://zhixing-seven.vercel.app';
const testPages = [
  {
    name: '一级销售对账页面',
    url: `${baseURL}/sales/commission`,
    expectation: '佣金比率应显示37.8%（不是70%）'
  },
  {
    name: '管理员销售页面', 
    url: `${baseURL}/admin/sales`,
    expectation: '一级销售佣金比率使用新计算逻辑'
  }
];

// 1. 检查JavaScript文件是否更新
async function checkJavaScriptFiles() {
  console.log('\n📄 步骤1: 检查JavaScript文件更新');
  console.log('-' .repeat(40));
  
  try {
    console.log('🔍 获取主页面HTML...');
    const response = await axios.get(baseURL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const html = response.data;
    
    // 提取JavaScript文件名
    const jsFiles = [];
    const jsRegex = /static\/js\/main\.([a-f0-9]+)\.js/g;
    let match;
    
    while ((match = jsRegex.exec(html)) !== null) {
      jsFiles.push({
        filename: match[0],
        hash: match[1]
      });
    }
    
    console.log('📂 发现的JavaScript文件:');
    jsFiles.forEach(file => {
      console.log(`   ${file.filename} (哈希: ${file.hash})`);
      
      // 检查是否还是旧的哈希
      if (file.hash === '8a7a4e3e') {
        console.log('   ⚠️  这仍然是旧版本的哈希！');
      } else {
        console.log('   ✅ 这是新版本的哈希！');
      }
    });
    
    return {
      success: true,
      jsFiles,
      hasNewFiles: jsFiles.some(f => f.hash !== '8a7a4e3e')
    };
    
  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// 2. 检查编译后的JavaScript代码
async function checkCompiledCode() {
  console.log('\n🔍 步骤2: 检查编译后的JavaScript代码');
  console.log('-' .repeat(40));
  
  try {
    const response = await axios.get(baseURL);
    const html = response.data;
    
    // 提取主要的JS文件URL
    const jsMatch = html.match(/static\/js\/main\.([a-f0-9]+)\.js/);
    if (!jsMatch) {
      console.log('❌ 未找到main.js文件');
      return { success: false };
    }
    
    const jsURL = `${baseURL}/static/js/${jsMatch[0]}`;
    console.log(`📄 检查文件: ${jsURL}`);
    
    const jsResponse = await axios.get(jsURL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const jsCode = jsResponse.data;
    
    // 检查新逻辑的关键词
    const newLogicKeywords = [
      'primaryDirectAmount',
      'secondaryTotalAmount', 
      'averageSecondaryRate',
      'calculatePrimaryCommissionRate',
      'config_confirmed'
    ];
    
    console.log('🔍 检查新逻辑关键词:');
    
    const foundKeywords = [];
    const missingKeywords = [];
    
    newLogicKeywords.forEach(keyword => {
      if (jsCode.includes(keyword)) {
        console.log(`   ✅ ${keyword} - 存在`);
        foundKeywords.push(keyword);
      } else {
        console.log(`   ❌ ${keyword} - 不存在`);
        missingKeywords.push(keyword);
      }
    });
    
    // 检查旧逻辑是否还存在
    const oldLogicPattern = /40\s*\+\s*[^)]*commission.*rate/i;
    const hasOldLogic = oldLogicPattern.test(jsCode);
    
    console.log(`\n🔍 旧逻辑检查:`);
    console.log(`   旧逻辑(40% + 平均佣金率): ${hasOldLogic ? '❌ 仍存在' : '✅ 已移除'}`);
    
    return {
      success: true,
      foundKeywords: foundKeywords.length,
      totalKeywords: newLogicKeywords.length,
      missingKeywords,
      hasOldLogic,
      codeLength: jsCode.length
    };
    
  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// 3. 模拟用户访问检查
async function checkPageAccess() {
  console.log('\n🌐 步骤3: 检查页面访问');
  console.log('-' .repeat(40));
  
  const results = [];
  
  for (const page of testPages) {
    console.log(`🔍 检查: ${page.name}`);
    console.log(`   URL: ${page.url}`);
    console.log(`   预期: ${page.expectation}`);
    
    try {
      const response = await axios.get(page.url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log(`   ✅ 页面加载成功 (${response.status})`);
        results.push({
          page: page.name,
          status: 'success',
          statusCode: response.status
        });
      } else {
        console.log(`   ⚠️  页面响应异常 (${response.status})`);
        results.push({
          page: page.name, 
          status: 'warning',
          statusCode: response.status
        });
      }
      
    } catch (error) {
      console.log(`   ❌ 页面访问失败: ${error.message}`);
      results.push({
        page: page.name,
        status: 'error',
        error: error.message
      });
    }
    
    console.log('');
  }
  
  return results;
}

// 4. 强制清除缓存
async function forceClearCache() {
  console.log('\n🧹 步骤4: 强制清除Vercel缓存');
  console.log('-' .repeat(40));
  
  const cacheUrls = [
    `${baseURL}/sales/commission`,
    `${baseURL}/admin/sales`,
    `${baseURL}/static/js/`
  ];
  
  console.log('🔄 发送缓存清除请求...');
  
  for (const url of cacheUrls) {
    try {
      await axios.get(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log(`   ✅ 清除缓存: ${url}`);
    } catch (error) {
      console.log(`   ⚠️  缓存清除失败: ${url} - ${error.message}`);
    }
  }
  
  console.log('\n💡 建议用户也清除浏览器缓存:');
  console.log('   - Chrome/Edge: Ctrl+Shift+R 或 Cmd+Shift+R');
  console.log('   - 或开发者工具 > Network > Disable cache');
}

// 5. 生成验证报告
function generateVerificationReport(jsCheck, codeCheck, pageCheck) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 部署验证报告');
  console.log('=' .repeat(60));
  
  const report = {
    timestamp: new Date().toISOString(),
    deployment: {
      jsFilesUpdated: jsCheck.success && jsCheck.hasNewFiles,
      newLogicDeployed: codeCheck.success && codeCheck.foundKeywords >= 3,
      pagesAccessible: pageCheck.every(p => p.status === 'success')
    },
    details: {
      jsCheck,
      codeCheck, 
      pageCheck
    }
  };
  
  console.log('\n🎯 关键指标:');
  console.log(`✅ JavaScript文件更新: ${report.deployment.jsFilesUpdated ? '是' : '否'}`);
  console.log(`✅ 新逻辑部署成功: ${report.deployment.newLogicDeployed ? '是' : '否'}`);
  console.log(`✅ 页面正常访问: ${report.deployment.pagesAccessible ? '是' : '否'}`);
  
  const allPassed = Object.values(report.deployment).every(v => v === true);
  
  if (allPassed) {
    console.log('\n🎉 部署验证完全成功！新的佣金比率计算逻辑已生效！');
    console.log('\n📋 下一步验证:');
    console.log('1. 手动访问: https://zhixing-seven.vercel.app/sales/commission');
    console.log('2. 强制刷新页面 (Cmd+Shift+R)');
    console.log('3. 确认佣金比率显示 37.8% (不是70%)');
    console.log('4. 验证计算逻辑基于实际订单金额');
  } else {
    console.log('\n⚠️  部署验证存在问题，需要进一步调查！');
    
    if (!report.deployment.jsFilesUpdated) {
      console.log('❌ JavaScript文件未更新 - 可能需要手动触发重新部署');
    }
    if (!report.deployment.newLogicDeployed) {
      console.log('❌ 新逻辑未部署 - 检查代码编译或缓存问题');
    }
    if (!report.deployment.pagesAccessible) {
      console.log('❌ 页面访问异常 - 检查路由或服务器问题');
    }
  }
  
  // 保存报告
  fs.writeFileSync('部署验证报告.json', JSON.stringify(report, null, 2));
  console.log('\n📄 详细报告已保存: 部署验证报告.json');
  
  return report;
}

// 主验证函数
async function runDeploymentVerification() {
  console.log('🚀 开始部署验证...\n');
  
  try {
    // 执行所有验证步骤
    const jsCheck = await checkJavaScriptFiles();
    const codeCheck = await checkCompiledCode();
    const pageCheck = await checkPageAccess();
    
    // 强制清除缓存
    await forceClearCache();
    
    // 生成报告
    const report = generateVerificationReport(jsCheck, codeCheck, pageCheck);
    
    return report;
    
  } catch (error) {
    console.log(`❌ 验证过程出错: ${error.message}`);
    return null;
  }
}

// 执行验证
runDeploymentVerification().catch(console.error);