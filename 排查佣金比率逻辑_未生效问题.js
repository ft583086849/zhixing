/**
 * 排查佣金比率计算逻辑未生效的问题
 * 
 * 检查：前端缓存、代码分支、部署状态
 */

const https = require('https');
const fs = require('fs');

console.log('🔍 排查佣金比率计算逻辑未生效问题');
console.log('=' .repeat(60));

// 1. 检查前端JavaScript文件
async function checkJavaScriptFiles() {
  console.log('\n🔍 步骤1: 检查前端JavaScript文件');
  console.log('-' .repeat(40));
  
  try {
    // 获取主页面
    const mainPageContent = await makeRequest('https://zhixing-seven.vercel.app/');
    console.log('✅ 主页面加载成功');
    
    // 提取JavaScript文件路径
    const jsFileMatches = mainPageContent.match(/src="([^"]*\.js[^"]*)"/g) || [];
    const jsFiles = jsFileMatches.map(match => {
      const src = match.match(/src="([^"]*)"/)[1];
      return src.startsWith('http') ? src : `https://zhixing-seven.vercel.app${src}`;
    });
    
    console.log(`📦 找到 ${jsFiles.length} 个JavaScript文件:`);
    jsFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    // 检查主要的JS文件
    if (jsFiles.length > 0) {
      const mainJsFile = jsFiles[0];
      console.log(`\n🔍 检查主要JS文件: ${mainJsFile}`);
      
      const jsContent = await makeRequest(mainJsFile);
      const fileSize = (jsContent.length / 1024).toFixed(1);
      console.log(`📏 文件大小: ${fileSize}KB`);
      
      // 检查关键词
      const newLogicKeywords = [
        '一级销售的用户下单金额',
        'primaryDirectAmount * 0.40',
        'secondaryTotalAmount * (1 - averageSecondaryRate)',
        'calculatePrimaryCommissionRate'
      ];
      
      const oldLogicKeywords = [
        '40% - 二级销售分佣比率平均值',
        '40 - averageSecondaryRate'
      ];
      
      console.log('\n🔍 新逻辑关键词检查:');
      newLogicKeywords.forEach(keyword => {
        const found = jsContent.includes(keyword);
        console.log(`  ${found ? '✅' : '❌'} ${keyword}`);
      });
      
      console.log('\n🔍 旧逻辑关键词检查:');
      oldLogicKeywords.forEach(keyword => {
        const found = jsContent.includes(keyword);
        console.log(`  ${found ? '⚠️' : '✅'} ${keyword} ${found ? '(仍存在)' : '(已移除)'}`);
      });
      
      // 检查文件哈希或时间戳
      const hashMatch = mainJsFile.match(/main\.([a-f0-9]+)\.js/);
      if (hashMatch) {
        console.log(`\n📋 文件哈希: ${hashMatch[1]}`);
        console.log('💡 如果哈希值没有变化，说明文件没有更新');
      }
      
      return {
        fileExists: true,
        fileSize: fileSize,
        hasNewLogic: newLogicKeywords.some(keyword => jsContent.includes(keyword)),
        hasOldLogic: oldLogicKeywords.some(keyword => jsContent.includes(keyword)),
        fileHash: hashMatch ? hashMatch[1] : null
      };
    }
    
  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
    return { fileExists: false, error: error.message };
  }
}

// 2. 检查代码分支逻辑
async function checkCodeBranching() {
  console.log('\n🔍 步骤2: 检查代码分支逻辑');
  console.log('-' .repeat(40));
  
  // 检查本地源码
  const primarySalesFile = 'client/src/pages/PrimarySalesSettlementPage.js';
  const adminSalesFile = 'client/src/components/admin/AdminSales.js';
  
  try {
    if (fs.existsSync(primarySalesFile)) {
      const content = fs.readFileSync(primarySalesFile, 'utf8');
      
      console.log('📄 检查 PrimarySalesSettlementPage.js:');
      
      // 检查新的计算逻辑
      const hasNewCalculation = content.includes('一级销售的用户下单金额×40%');
      const hasSecondaryCalculation = content.includes('二级销售订单总金额-二级销售分佣比率平均值');
      const hasConfigFilter = content.includes('config_confirmed === true');
      const hasBoundaryHandling = content.includes('return 40');
      
      console.log(`  ${hasNewCalculation ? '✅' : '❌'} 新的计算公式注释`);
      console.log(`  ${hasSecondaryCalculation ? '✅' : '❌'} 二级销售计算逻辑`);
      console.log(`  ${hasConfigFilter ? '✅' : '❌'} 配置确认过滤`);
      console.log(`  ${hasBoundaryHandling ? '✅' : '❌'} 边界处理(return 40)`);
      
      // 检查可能的条件分支问题
      const conditionalLogic = [
        'if (!primarySalesOrders?.data',
        'if (confirmedOrders.length === 0)',
        'if (totalOrderAmount === 0)',
        'primaryDirectAmount * 0.40',
        'secondaryTotalAmount * (1 - averageSecondaryRate)'
      ];
      
      console.log('\n  🔍 关键条件分支检查:');
      conditionalLogic.forEach(logic => {
        const found = content.includes(logic);
        console.log(`    ${found ? '✅' : '❌'} ${logic}`);
      });
      
      return {
        fileExists: true,
        hasNewLogic: hasNewCalculation && hasSecondaryCalculation,
        hasProperBranching: conditionalLogic.every(logic => content.includes(logic))
      };
    } else {
      console.log('❌ 源文件不存在');
      return { fileExists: false };
    }
    
  } catch (error) {
    console.log(`❌ 检查源码失败: ${error.message}`);
    return { fileExists: false, error: error.message };
  }
}

// 3. 检查部署状态
async function checkDeploymentStatus() {
  console.log('\n🔍 步骤3: 检查部署状态');
  console.log('-' .repeat(40));
  
  try {
    // 检查git状态
    console.log('📋 当前git状态:');
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      exec('git log --oneline -5', (error, stdout, stderr) => {
        if (error) {
          console.log(`❌ Git检查失败: ${error.message}`);
          resolve({ gitStatus: false });
          return;
        }
        
        console.log('最近5次提交:');
        stdout.split('\n').filter(line => line.trim()).forEach((line, index) => {
          console.log(`  ${index + 1}. ${line}`);
        });
        
        // 检查最新提交是否包含佣金比率相关修改
        const hasCommissionCommit = stdout.includes('佣金比率') || stdout.includes('commission');
        console.log(`\n${hasCommissionCommit ? '✅' : '❌'} 最近提交包含佣金比率修改`);
        
        // 检查分支状态
        exec('git status --porcelain', (error2, stdout2) => {
          const hasUncommittedChanges = stdout2.trim().length > 0;
          console.log(`${hasUncommittedChanges ? '⚠️' : '✅'} ${hasUncommittedChanges ? '有未提交的修改' : '工作区干净'}`);
          
          resolve({
            gitStatus: true,
            hasCommissionCommit,
            hasUncommittedChanges,
            latestCommits: stdout.split('\n').slice(0, 3)
          });
        });
      });
    });
    
  } catch (error) {
    console.log(`❌ 检查部署状态失败: ${error.message}`);
    return { gitStatus: false, error: error.message };
  }
}

// 4. 检查Vercel部署日志
async function checkVercelDeployment() {
  console.log('\n🔍 步骤4: 检查Vercel部署状态');
  console.log('-' .repeat(40));
  
  try {
    // 检查健康状态
    const healthResponse = await makeRequest('https://zhixing-seven.vercel.app/api/health');
    console.log('✅ API健康检查通过');
    
    // 检查主页响应头
    const response = await makeRequestWithHeaders('https://zhixing-seven.vercel.app/');
    
    if (response.headers['x-vercel-cache']) {
      console.log(`📋 Vercel缓存状态: ${response.headers['x-vercel-cache']}`);
    }
    
    if (response.headers['x-vercel-id']) {
      console.log(`📋 Vercel部署ID: ${response.headers['x-vercel-id']}`);
    }
    
    return { vercelStatus: true, headers: response.headers };
    
  } catch (error) {
    console.log(`❌ Vercel检查失败: ${error.message}`);
    return { vercelStatus: false, error: error.message };
  }
}

// 辅助函数
async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function makeRequestWithHeaders(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, headers: res.headers }));
    }).on('error', reject);
  });
}

// 主函数
async function runDiagnosis() {
  console.log('🚀 开始全面排查...\n');
  
  const results = {
    jsFiles: await checkJavaScriptFiles(),
    codeBranching: await checkCodeBranching(),
    deployment: await checkDeploymentStatus(),
    vercel: await checkVercelDeployment()
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 排查结果总结');
  console.log('=' .repeat(60));
  
  // 分析问题
  console.log('\n🎯 问题分析:');
  
  if (!results.jsFiles.hasNewLogic) {
    console.log('❌ 前端JS文件缺少新的计算逻辑');
    console.log('   可能原因: 代码没有正确编译或部署');
  }
  
  if (results.jsFiles.hasOldLogic) {
    console.log('⚠️  前端JS文件仍包含旧的计算逻辑');
    console.log('   可能原因: 代码没有完全替换');
  }
  
  if (!results.codeBranching.hasProperBranching) {
    console.log('❌ 源码条件分支不完整');
    console.log('   可能原因: 代码修改不彻底');
  }
  
  if (results.deployment.hasUncommittedChanges) {
    console.log('⚠️  有未提交的代码修改');
    console.log('   可能原因: 最新修改没有推送到线上');
  }
  
  console.log('\n💡 建议解决方案:');
  console.log('1. 强制清除浏览器缓存');
  console.log('2. 检查最新代码是否正确提交和推送');
  console.log('3. 手动触发Vercel重新部署');
  console.log('4. 验证编译后的代码是否包含新逻辑');
  
  return results;
}

// 执行排查
runDiagnosis().catch(console.error);