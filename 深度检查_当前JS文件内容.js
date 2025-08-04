/**
 * 深度检查 - 当前JavaScript文件内容
 * 详细分析当前引用的JS文件是否包含我们的修复
 */

const axios = require('axios');
const https = require('https');

console.log('🔬 深度检查 - 当前JavaScript文件内容');
console.log('=' .repeat(50));

const baseURL = 'https://zhixing-seven.vercel.app';
const currentJSFile = 'main.0b832513.js'; // 页面实际引用的文件

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function deepAnalyzeCurrentJS() {
  console.log('🔍 步骤1: 深度分析当前JavaScript文件');
  console.log('-' .repeat(30));
  
  try {
    const jsURL = `${baseURL}/static/js/${currentJSFile}`;
    console.log(`📄 分析文件: ${jsURL}`);
    
    const response = await axios.get(jsURL, {
      httpsAgent,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    const jsCode = response.data;
    console.log(`📊 文件大小: ${(jsCode.length / 1024).toFixed(1)} KB`);
    
    // 检查各种可能的公式形式（考虑压缩和混淆）
    console.log('\n🔍 检查佣金比率计算相关代码:');
    
    // 检查关键数字和模式
    const patterns = [
      // 新公式相关
      { name: '新公式：40减去二级销售比率', pattern: /40.*-.*\*.*100/, desc: '40 - rate * 100' },
      { name: '40%小数表示', pattern: /\.40\b/, desc: '0.40' },
      { name: '40减法运算', pattern: /40\s*-\s*/, desc: '40 -' },
      { name: '除以100', pattern: /\/\s*100\b/, desc: '/ 100' },
      
      // 旧公式相关  
      { name: '旧公式：1减去', pattern: /1\s*-\s*.*rate/i, desc: '1 - rate' },
      
      // 业务逻辑相关
      { name: '配置确认过滤', pattern: /config_confirmed.*true/i, desc: 'config_confirmed === true' },
      { name: '一级销售类型判断', pattern: /primary.*sales/i, desc: 'primary sales' },
      { name: '二级销售订单', pattern: /secondary.*sales/i, desc: 'secondary sales' },
      { name: '佣金比率计算', pattern: /commission.*rate/i, desc: 'commission rate' },
      
      // 边界处理
      { name: '返回40', pattern: /return\s+40\b/, desc: 'return 40' },
      { name: '总金额为0', pattern: /amount.*===?\s*0/, desc: 'amount === 0' },
      
      // 压缩后可能的形式
      { name: '压缩变量名', pattern: /[a-z]\*\.4/, desc: 'var * 0.4' },
      { name: '压缩函数名', pattern: /[a-z]{1,3}\(.*40/, desc: 'func(40)' }
    ];
    
    const foundPatterns = [];
    const missingPatterns = [];
    
    patterns.forEach(pattern => {
      const found = pattern.pattern.test(jsCode);
      console.log(`   ${found ? '✅' : '❌'} ${pattern.name}: ${found ? '存在' : '不存在'}`);
      
      if (found) {
        foundPatterns.push(pattern);
        
        // 提取匹配的代码片段
        const matches = jsCode.match(pattern.pattern);
        if (matches && matches[0]) {
          console.log(`      💡 匹配: "${matches[0]}"`);
        }
      } else {
        missingPatterns.push(pattern);
      }
    });
    
    console.log(`\n📊 模式匹配结果: ${foundPatterns.length}/${patterns.length}`);
    
    // 查找包含"40"的所有代码片段
    console.log('\n🔍 查找所有包含"40"的代码片段:');
    const fortyMatches = jsCode.match(/.{0,50}40.{0,50}/g);
    if (fortyMatches && fortyMatches.length > 0) {
      console.log(`   发现 ${fortyMatches.length} 个包含"40"的片段:`);
      fortyMatches.slice(0, 5).forEach((match, index) => {
        console.log(`   ${index + 1}. "${match.trim()}"`);
      });
      if (fortyMatches.length > 5) {
        console.log(`   ... 还有 ${fortyMatches.length - 5} 个片段`);
      }
    } else {
      console.log('   ❌ 未找到包含"40"的代码片段');
    }
    
    // 查找佣金相关的代码
    console.log('\n🔍 查找佣金相关代码:');
    const commissionMatches = jsCode.match(/.{0,30}commission.{0,30}/gi);
    if (commissionMatches && commissionMatches.length > 0) {
      console.log(`   发现 ${commissionMatches.length} 个佣金相关片段:`);
      commissionMatches.slice(0, 3).forEach((match, index) => {
        console.log(`   ${index + 1}. "${match.trim()}"`);
      });
    } else {
      console.log('   ❌ 未找到佣金相关代码');
    }
    
    return {
      success: true,
      file: currentJSFile,
      size: jsCode.length,
      foundPatterns: foundPatterns.length,
      totalPatterns: patterns.length,
      hasFortyReferences: fortyMatches && fortyMatches.length > 0,
      hasCommissionLogic: commissionMatches && commissionMatches.length > 0,
      fortyMatches: fortyMatches || [],
      commissionMatches: commissionMatches || []
    };
    
  } catch (error) {
    console.log(`❌ 分析失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function forceRefreshHTML() {
  console.log('\n🔄 步骤2: 强制刷新HTML页面');
  console.log('-' .repeat(30));
  
  try {
    console.log('🔄 发送强制刷新请求...');
    
    const response = await axios.get(baseURL, {
      httpsAgent,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-None-Match': '*',
        'If-Modified-Since': 'Mon, 01 Jan 1990 00:00:00 GMT',
        'User-Agent': `ForceClearCache-${Date.now()}`
      }
    });
    
    const html = response.data;
    console.log(`📊 HTML大小: ${(html.length / 1024).toFixed(1)} KB`);
    
    // 检查新的JS文件引用
    const jsMatches = html.matchAll(/static\/js\/main\.([a-f0-9]+)\.js/g);
    const jsFiles = [];
    
    for (const match of jsMatches) {
      jsFiles.push(match[1]);
    }
    
    console.log(`📄 当前引用的JS文件哈希: ${jsFiles.join(', ')}`);
    
    if (jsFiles.includes('498e67a1') || jsFiles.includes('498e67a')) {
      console.log('✅ 找到新的JS文件引用！');
      return { success: true, hasNewJS: true, jsFiles };
    } else if (jsFiles.includes('0b832513')) {
      console.log('⚠️  仍然引用旧的JS文件');
      return { success: true, hasNewJS: false, jsFiles };
    } else {
      console.log(`❓ 引用未知的JS文件: ${jsFiles.join(', ')}`);
      return { success: true, hasNewJS: false, jsFiles };
    }
    
  } catch (error) {
    console.log(`❌ 刷新失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function generateDeepAnalysisReport(jsAnalysis, htmlRefresh) {
  console.log('\n' + '=' .repeat(50));
  console.log('📊 深度分析报告');
  console.log('=' .repeat(50));
  
  console.log(`🔍 当前引用文件: ${jsAnalysis.file}`);
  console.log(`📊 文件大小: ${(jsAnalysis.size / 1024).toFixed(1)} KB`);
  console.log(`📈 模式匹配: ${jsAnalysis.foundPatterns}/${jsAnalysis.totalPatterns}`);
  console.log(`🔢 包含"40": ${jsAnalysis.hasFortyReferences ? '是' : '否'}`);
  console.log(`💰 包含佣金逻辑: ${jsAnalysis.hasCommissionLogic ? '是' : '否'}`);
  
  if (htmlRefresh.success && htmlRefresh.hasNewJS) {
    console.log('\n🎉 HTML已更新，引用新的JS文件！');
    console.log('✅ 佣金比率修复应该已经生效');
    
    console.log('\n📋 最终验证指南:');
    console.log('1. 清除浏览器缓存 (Cmd+Shift+Delete)');
    console.log('2. 访问: https://zhixing-seven.vercel.app/sales/commission');
    console.log('3. 强制刷新页面 (Cmd+Shift+R)');
    console.log('4. 确认佣金比率显示 ~37.7% (不是70%或42.4%)');
    
  } else if (jsAnalysis.foundPatterns >= 3) {
    console.log('\n✅ 当前文件包含足够的业务逻辑特征');
    console.log('🎯 修复可能已经在当前文件中');
    
    console.log('\n📋 用户验证建议:');
    console.log('1. 直接访问页面验证佣金比率显示');
    console.log('2. 如果仍显示70%，强制刷新浏览器缓存');
    
  } else {
    console.log('\n⚠️  当前文件缺少预期的业务逻辑特征');
    console.log('❌ 佣金比率修复可能未正确部署');
    
    console.log('\n📋 建议行动:');
    console.log('1. 等待5-10分钟让Vercel完全部署');
    console.log('2. 检查Vercel Dashboard的部署状态');
    console.log('3. 如有必要，手动触发重新部署');
  }
  
  return {
    currentFile: jsAnalysis.file,
    hasNewJS: htmlRefresh.hasNewJS,
    likelyDeployed: htmlRefresh.hasNewJS || jsAnalysis.foundPatterns >= 3,
    needsManualVerification: true
  };
}

// 主分析函数
async function runDeepAnalysis() {
  console.log('🚀 开始深度分析...\n');
  
  try {
    const jsAnalysis = await deepAnalyzeCurrentJS();
    const htmlRefresh = await forceRefreshHTML();
    
    const report = await generateDeepAnalysisReport(jsAnalysis, htmlRefresh);
    
    return report;
    
  } catch (error) {
    console.log(`❌ 分析过程出错: ${error.message}`);
    return null;
  }
}

// 执行分析
runDeepAnalysis().catch(console.error);