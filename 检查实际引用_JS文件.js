/**
 * 检查实际引用 - JavaScript文件
 * 查看页面实际引用哪个JS文件，以及所有可用的JS文件
 */

const axios = require('axios');
const https = require('https');

console.log('🔍 检查实际引用 - JavaScript文件');
console.log('=' .repeat(50));

const baseURL = 'https://zhixing-seven.vercel.app';
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function checkActualJSReferences() {
  console.log('🔍 步骤1: 检查页面实际引用的JS文件');
  console.log('-' .repeat(30));
  
  const pages = [
    { name: '主页', url: baseURL },
    { name: '一级销售对账页面', url: `${baseURL}/sales/commission` },
    { name: '管理员页面', url: `${baseURL}/admin/sales` }
  ];
  
  const jsFileReferences = new Set();
  
  for (const page of pages) {
    try {
      console.log(`📄 检查: ${page.name}`);
      
      const response = await axios.get(page.url, {
        httpsAgent,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      const html = response.data;
      
      // 提取所有JavaScript文件引用
      const jsMatches = html.matchAll(/static\/js\/([^"]+\.js)/g);
      
      for (const match of jsMatches) {
        const jsFile = match[1];
        jsFileReferences.add(jsFile);
        console.log(`   📄 引用JS文件: ${jsFile}`);
      }
      
      // 检查HTML大小
      console.log(`   📊 HTML大小: ${(html.length / 1024).toFixed(1)} KB`);
      
    } catch (error) {
      console.log(`   ❌ 检查失败: ${error.message}`);
    }
  }
  
  return Array.from(jsFileReferences);
}

async function checkAllJSFiles(jsFiles) {
  console.log('\n🔍 步骤2: 检查所有发现的JS文件');
  console.log('-' .repeat(30));
  
  const fileDetails = [];
  
  for (const jsFile of jsFiles) {
    try {
      console.log(`📄 检查文件: ${jsFile}`);
      
      const jsURL = `${baseURL}/static/js/${jsFile}`;
      const response = await axios.get(jsURL, {
        httpsAgent,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      const jsCode = response.data;
      const sizeKB = (jsCode.length / 1024).toFixed(1);
      
      console.log(`   📊 文件大小: ${sizeKB} KB`);
      
      // 检查是否包含React代码
      const hasReact = jsCode.includes('React') || jsCode.includes('createElement');
      console.log(`   ⚛️  包含React: ${hasReact ? '是' : '否'}`);
      
      // 检查是否包含我们的关键词
      const hasOurLogic = jsCode.includes('commission') || 
                         jsCode.includes('primary') || 
                         jsCode.includes('secondary');
      console.log(`   🎯 包含业务逻辑: ${hasOurLogic ? '是' : '否'}`);
      
      // 检查是否包含修复后的公式
      const hasNewFormula = jsCode.includes('40 - averageSecondaryRate * 100') ||
                           jsCode.includes('((40 - ') ||
                           jsCode.includes('40-') && jsCode.includes('100');
      console.log(`   🔧 包含新公式: ${hasNewFormula ? '是' : '否'}`);
      
      // 检查是否包含旧的错误公式
      const hasOldFormula = jsCode.includes('1 - averageSecondaryRate') && 
                           !jsCode.includes('40 - averageSecondaryRate');
      console.log(`   ❌ 包含旧公式: ${hasOldFormula ? '是' : '否'}`);
      
      fileDetails.push({
        file: jsFile,
        size: parseFloat(sizeKB),
        hasReact,
        hasOurLogic,
        hasNewFormula,
        hasOldFormula,
        isMainApp: sizeKB > 100 // 主应用文件通常很大
      });
      
    } catch (error) {
      console.log(`   ❌ 检查失败: ${error.message}`);
      fileDetails.push({
        file: jsFile,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  return fileDetails;
}

async function identifyMainAppFile(fileDetails) {
  console.log('🎯 步骤3: 识别主应用文件');
  console.log('-' .repeat(30));
  
  // 找到最大的包含React的文件
  const mainFiles = fileDetails.filter(f => 
    f.size > 100 && f.hasReact && f.hasOurLogic
  );
  
  if (mainFiles.length > 0) {
    const mainFile = mainFiles.reduce((prev, current) => 
      prev.size > current.size ? prev : current
    );
    
    console.log(`✅ 主应用文件: ${mainFile.file}`);
    console.log(`   📊 文件大小: ${mainFile.size} KB`);
    console.log(`   🔧 包含新公式: ${mainFile.hasNewFormula ? '是' : '否'}`);
    console.log(`   ❌ 包含旧公式: ${mainFile.hasOldFormula ? '是' : '否'}`);
    
    return mainFile;
    
  } else {
    console.log('❌ 未找到主应用文件');
    
    // 显示所有文件信息
    console.log('\n📊 所有文件概览:');
    fileDetails.forEach(file => {
      if (!file.error) {
        console.log(`   ${file.file}: ${file.size}KB, React:${file.hasReact}, 业务:${file.hasOurLogic}`);
      }
    });
    
    return null;
  }
}

async function generateJSCheckReport(jsFiles, fileDetails, mainFile) {
  console.log('\n' + '=' .repeat(50));
  console.log('📊 JavaScript文件检查报告');
  console.log('=' .repeat(50));
  
  console.log(`🔍 发现的JS文件数量: ${jsFiles.length}`);
  console.log(`📄 文件列表: ${jsFiles.join(', ')}`);
  
  if (mainFile) {
    console.log(`\n✅ 主应用文件: ${mainFile.file}`);
    console.log(`📊 文件大小: ${mainFile.size} KB`);
    
    if (mainFile.hasNewFormula) {
      console.log('🎉 新的佣金比率计算公式已部署！');
      console.log('✅ 佣金比率修复成功部署');
      
      console.log('\n📋 用户验证指南:');
      console.log('1. 访问: https://zhixing-seven.vercel.app/sales/commission');
      console.log('2. 强制刷新页面 (Cmd+Shift+R)');
      console.log('3. 确认佣金比率显示 ~37.7% (不是70%或42.4%)');
      
    } else if (mainFile.hasOldFormula) {
      console.log('⚠️  仍包含旧的错误公式');
      console.log('❌ 佣金比率修复未完全部署');
      
    } else {
      console.log('❓ 无法确定公式状态，需要进一步检查');
    }
    
  } else {
    console.log('\n❌ 未找到有效的主应用文件');
    console.log('⚠️  可能存在部署问题或文件结构异常');
  }
  
  return {
    jsFiles,
    fileDetails,
    mainFile,
    deploymentSuccess: mainFile && mainFile.hasNewFormula,
    hasOldFormula: mainFile && mainFile.hasOldFormula
  };
}

// 主检查函数
async function runJSFileCheck() {
  console.log('🚀 开始JavaScript文件检查...\n');
  
  try {
    const jsFiles = await checkActualJSReferences();
    const fileDetails = await checkAllJSFiles(jsFiles);
    const mainFile = await identifyMainAppFile(fileDetails);
    
    const report = await generateJSCheckReport(jsFiles, fileDetails, mainFile);
    
    return report;
    
  } catch (error) {
    console.log(`❌ 检查过程出错: ${error.message}`);
    return null;
  }
}

// 执行检查
runJSFileCheck().catch(console.error);