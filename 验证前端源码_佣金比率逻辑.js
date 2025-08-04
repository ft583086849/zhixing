/**
 * 验证前端源码中的佣金比率计算逻辑
 * 
 * 通过访问编译后的JavaScript文件验证新逻辑是否部署
 */

const https = require('https');

console.log('🔍 验证前端源码中的佣金比率计算逻辑');
console.log('=' .repeat(60));

// 获取主页面，从中提取JavaScript文件路径
async function getMainPageContent() {
  return new Promise((resolve, reject) => {
    https.get('https://zhixing-seven.vercel.app/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// 获取JavaScript文件内容
async function getJSContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function verifyDeployment() {
  console.log('\n🔍 步骤1: 获取主页面内容...');
  
  try {
    const mainPageContent = await getMainPageContent();
    console.log('✅ 主页面加载成功');
    
    // 查找JavaScript文件
    const jsFileMatches = mainPageContent.match(/src="([^"]*\.js[^"]*)"/g) || [];
    const jsFiles = jsFileMatches.map(match => {
      const src = match.match(/src="([^"]*)"/)[1];
      return src.startsWith('http') ? src : `https://zhixing-seven.vercel.app${src}`;
    });
    
    console.log(`📦 找到 ${jsFiles.length} 个JavaScript文件`);
    
    if (jsFiles.length === 0) {
      console.log('⚠️  未找到JavaScript文件链接，检查静态资源...');
      
      // 尝试常见的React构建路径
      const commonPaths = [
        'https://zhixing-seven.vercel.app/static/js/main.js',
        'https://zhixing-seven.vercel.app/_next/static/chunks/pages/index.js',
        'https://zhixing-seven.vercel.app/static/js/main.*.js'
      ];
      
      for (const path of commonPaths) {
        jsFiles.push(path);
      }
    }
    
    // 验证关键逻辑是否存在
    const keywordsToCheck = [
      '一级销售的用户下单金额*40%',
      '二级销售订单总金额-二级销售分佣比率平均值',
      'primaryDirectAmount * 0.40',
      'secondaryTotalAmount * (1 - averageSecondaryRate)',
      'calculatePrimaryCommissionRate',
      'config_confirmed === true',
      'return 40'
    ];
    
    console.log('\n🔍 步骤2: 检查JavaScript文件中的关键逻辑...');
    
    let foundKeywords = {};
    let totalFilesChecked = 0;
    
    for (let i = 0; i < Math.min(jsFiles.length, 5); i++) {
      const jsFile = jsFiles[i];
      console.log(`📄 检查文件: ${jsFile}`);
      
      try {
        const jsContent = await getJSContent(jsFile);
        totalFilesChecked++;
        
        console.log(`  📏 文件大小: ${(jsContent.length / 1024).toFixed(1)}KB`);
        
        // 检查关键词
        keywordsToCheck.forEach(keyword => {
          if (jsContent.includes(keyword)) {
            foundKeywords[keyword] = (foundKeywords[keyword] || 0) + 1;
            console.log(`  ✅ 找到关键逻辑: ${keyword}`);
          }
        });
        
        // 等待500ms再检查下一个文件
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`  ❌ 无法访问文件: ${error.message}`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 验证结果总结');
    console.log('=' .repeat(60));
    
    console.log(`检查的JS文件数量: ${totalFilesChecked}`);
    console.log(`找到的关键逻辑数量: ${Object.keys(foundKeywords).length}/${keywordsToCheck.length}`);
    
    if (Object.keys(foundKeywords).length > 0) {
      console.log('\n✅ 找到的关键逻辑:');
      Object.entries(foundKeywords).forEach(([keyword, count]) => {
        console.log(`  - ${keyword} (出现${count}次)`);
      });
    }
    
    // 判断部署状态
    const coreLogicFound = foundKeywords['primaryDirectAmount * 0.40'] && 
                          foundKeywords['secondaryTotalAmount * (1 - averageSecondaryRate)'];
    const chineseDescriptionFound = foundKeywords['一级销售的用户下单金额*40%'];
    const boundaryHandlingFound = foundKeywords['return 40'];
    const configFilterFound = foundKeywords['config_confirmed === true'];
    
    console.log('\n🎯 核心功能验证:');
    console.log(`  ${coreLogicFound ? '✅' : '❌'} 核心计算逻辑`);
    console.log(`  ${chineseDescriptionFound ? '✅' : '❌'} 中文公式描述`);
    console.log(`  ${boundaryHandlingFound ? '✅' : '❌'} 边界处理(40%默认值)`);
    console.log(`  ${configFilterFound ? '✅' : '❌'} 配置确认状态过滤`);
    
    const overallSuccess = coreLogicFound && boundaryHandlingFound;
    
    if (overallSuccess) {
      console.log('\n🎉 验证成功！佣金比率计算逻辑已正确部署！');
      console.log('✅ 新的计算公式在源码中存在');
      console.log('✅ 边界处理逻辑已实现');
      console.log('✅ 部署完全生效');
    } else {
      console.log('\n⚠️  验证结果不完整，可能的原因:');
      console.log('1. 代码可能被压缩/混淆，关键词无法识别');
      console.log('2. 文件路径可能不正确');
      console.log('3. 需要手动访问页面确认功能');
    }
    
    console.log('\n💡 建议手动验证步骤:');
    console.log('1. 访问: https://zhixing-seven.vercel.app/sales/commission');
    console.log('2. 登录一级销售账号');
    console.log('3. 查看佣金比率是否显示为动态计算结果（而非固定40%）');
    console.log('4. 访问: https://zhixing-seven.vercel.app/admin/sales');
    console.log('5. 检查一级销售的佣金比率是否使用新的计算逻辑');
    
  } catch (error) {
    console.log(`❌ 验证过程出错: ${error.message}`);
  }
}

// 运行验证
verifyDeployment();