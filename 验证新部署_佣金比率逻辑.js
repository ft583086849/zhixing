/**
 * 验证新部署 - 佣金比率逻辑
 * 检查新的JavaScript文件是否包含修复后的计算逻辑
 */

const axios = require('axios');
const https = require('https');

console.log('🎯 验证新部署 - 佣金比率逻辑');
console.log('=' .repeat(50));

const baseURL = 'https://zhixing-seven.vercel.app';
const newJsFile = 'main.498e67a1.js'; // 新发现的文件

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function checkNewJavaScriptFile() {
  console.log('🔍 步骤1: 检查新的JavaScript文件');
  console.log('-' .repeat(30));
  
  try {
    const jsURL = `${baseURL}/static/js/${newJsFile}`;
    console.log(`📄 检查文件: ${jsURL}`);
    
    const response = await axios.get(jsURL, {
      httpsAgent,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    const jsCode = response.data;
    console.log(`📊 文件大小: ${(jsCode.length / 1024).toFixed(1)} KB`);
    
    // 检查修复后的关键特征
    const fixedLogicFeatures = [
      // 修复后的公式
      '40 - averageSecondaryRate * 100',
      '((40 - ', // 修复后公式的开始
      ') / 100)', // 修复后公式的结束
      
      // 基本计算逻辑
      '0.40', // 40%的小数表示
      'config_confirmed',
      'primaryDirectAmount',
      'secondaryTotalAmount',
      'averageSecondaryRate',
      
      // 边界处理
      'return 40',
      'totalOrderAmount === 0',
      
      // 管理员页面逻辑
      'calculatePrimaryCommissionRate',
      'sales_type.*primary',
      
      // 注释文本
      '一级销售直接用户佣金',
      '二级销售获得的佣金'
    ];
    
    console.log('\n🔍 检查修复后的逻辑特征:');
    
    let foundFeatures = 0;
    const missingFeatures = [];
    
    fixedLogicFeatures.forEach((feature, index) => {
      const isRegex = feature.includes('.*') || feature.includes('[') || feature.includes('^');
      let found = false;
      
      if (isRegex) {
        const regex = new RegExp(feature);
        found = regex.test(jsCode);
      } else {
        found = jsCode.includes(feature);
      }
      
      console.log(`   ${found ? '✅' : '❌'} ${feature}`);
      
      if (found) {
        foundFeatures++;
      } else {
        missingFeatures.push(feature);
      }
    });
    
    console.log(`\n📊 特征检测结果: ${foundFeatures}/${fixedLogicFeatures.length}`);
    
    // 特别检查修复后的公式
    const hasNewFormula = jsCode.includes('40 - averageSecondaryRate * 100');
    const hasOldWrongFormula = jsCode.includes('1 - averageSecondaryRate') && !jsCode.includes('40 - averageSecondaryRate');
    
    console.log('\n🎯 关键公式检查:');
    console.log(`   ✅ 新的正确公式: ${hasNewFormula ? '存在' : '不存在'}`);
    console.log(`   ❌ 旧的错误公式: ${hasOldWrongFormula ? '仍存在' : '已移除'}`);
    
    // 检查文件版本信息
    const hasCommitReference = jsCode.includes('498e67a') || jsCode.includes('修复佣金比率');
    console.log(`   📋 包含提交信息: ${hasCommitReference ? '是' : '否'}`);
    
    return {
      success: true,
      foundFeatures,
      totalFeatures: fixedLogicFeatures.length,
      hasNewFormula,
      hasOldWrongFormula: !hasOldWrongFormula, // 反转逻辑，false表示好
      missingFeatures,
      fileSize: jsCode.length
    };
    
  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPageAccessibility() {
  console.log('\n🌐 步骤2: 测试页面可访问性');
  console.log('-' .repeat(30));
  
  const testPages = [
    { name: '一级销售对账页面', url: `${baseURL}/sales/commission` },
    { name: '管理员销售页面', url: `${baseURL}/admin/sales` }
  ];
  
  const results = [];
  
  for (const page of testPages) {
    try {
      console.log(`🔍 测试: ${page.name}`);
      
      const response = await axios.get(page.url, {
        httpsAgent,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'User-Agent': 'DeploymentVerification/1.0'
        },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log(`   ✅ 加载成功 (${response.status})`);
        
        // 检查是否引用了新的JS文件
        const html = response.data;
        if (html.includes(newJsFile)) {
          console.log(`   ✅ 引用新JS文件: ${newJsFile}`);
        } else {
          console.log(`   ⚠️  仍引用旧JS文件`);
        }
        
        results.push({ page: page.name, status: 'success', usesNewJS: html.includes(newJsFile) });
      } else {
        console.log(`   ⚠️  异常状态: ${response.status}`);
        results.push({ page: page.name, status: 'warning', statusCode: response.status });
      }
      
    } catch (error) {
      console.log(`   ❌ 访问失败: ${error.message}`);
      results.push({ page: page.name, status: 'error', error: error.message });
    }
  }
  
  return results;
}

async function generateVerificationReport(jsCheck, pageCheck) {
  console.log('\n' + '=' .repeat(50));
  console.log('📊 新部署验证报告');
  console.log('=' .repeat(50));
  
  const report = {
    timestamp: new Date().toISOString(),
    commitHash: '498e67a',
    jsFile: newJsFile,
    verification: {
      jsLogicDeployed: jsCheck.success && jsCheck.foundFeatures >= 8,
      correctFormulaPresent: jsCheck.hasNewFormula,
      oldFormulaRemoved: jsCheck.hasOldWrongFormula,
      pagesAccessible: pageCheck.every(p => p.status === 'success')
    },
    details: { jsCheck, pageCheck }
  };
  
  console.log('🎯 关键验证指标:');
  console.log(`✅ JavaScript逻辑部署: ${report.verification.jsLogicDeployed ? '成功' : '失败'}`);
  console.log(`✅ 正确公式存在: ${report.verification.correctFormulaPresent ? '是' : '否'}`);
  console.log(`✅ 错误公式移除: ${report.verification.oldFormulaRemoved ? '是' : '否'}`);
  console.log(`✅ 页面正常访问: ${report.verification.pagesAccessible ? '是' : '否'}`);
  
  const allPassed = Object.values(report.verification).every(v => v === true);
  
  if (allPassed) {
    console.log('\n🎉 新部署验证完全成功！');
    console.log('🎯 佣金比率计算逻辑已正确部署！');
    console.log('\n📋 最终用户验证指南:');
    console.log('1. 访问: https://zhixing-seven.vercel.app/sales/commission');
    console.log('2. 强制刷新页面 (Cmd+Shift+R)');
    console.log('3. 确认佣金比率显示 ~37.7% (不是70%或42.4%)');
    console.log('4. 验证计算逻辑: 一级从二级获得 = 订单金额×(40%-二级佣金率)');
    
    console.log('\n🎯 预期变化:');
    console.log('- 修复前: 70% (旧逻辑)');
    console.log('- 第一次修复: 42.4% (公式错误)');
    console.log('- 最终修复: 37.7% (公式正确) ✅');
    
  } else {
    console.log('\n⚠️  部分验证项未通过，需要进一步调查');
    
    if (!report.verification.jsLogicDeployed) {
      console.log('❌ JavaScript逻辑部署不完整');
    }
    if (!report.verification.correctFormulaPresent) {
      console.log('❌ 正确公式未发现');
    }
    if (!report.verification.oldFormulaRemoved) {
      console.log('❌ 错误公式仍然存在');
    }
    if (!report.verification.pagesAccessible) {
      console.log('❌ 页面访问异常');
    }
  }
  
  console.log(`\n📊 检测统计:`);
  console.log(`- JS特征匹配: ${jsCheck.foundFeatures}/${jsCheck.totalFeatures}`);
  console.log(`- 页面可访问: ${pageCheck.filter(p => p.status === 'success').length}/${pageCheck.length}`);
  
  return report;
}

// 主验证函数
async function runNewDeploymentVerification() {
  console.log('🚀 开始新部署验证...\n');
  
  try {
    const jsCheck = await checkNewJavaScriptFile();
    const pageCheck = await testPageAccessibility();
    
    const report = await generateVerificationReport(jsCheck, pageCheck);
    
    return report;
    
  } catch (error) {
    console.log(`❌ 验证过程出错: ${error.message}`);
    return null;
  }
}

// 执行验证
runNewDeploymentVerification().catch(console.error);