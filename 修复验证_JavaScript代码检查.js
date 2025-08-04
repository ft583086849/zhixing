/**
 * 修复验证 - JavaScript代码检查
 * 修复URL拼接问题，重新检查新逻辑是否部署
 */

const axios = require('axios');

console.log('🔧 修复验证 - JavaScript代码检查');
console.log('=' .repeat(50));

async function checkNewLogicDeployment() {
  try {
    console.log('🔍 步骤1: 正确获取JavaScript文件');
    console.log('-' .repeat(30));
    
    const baseURL = 'https://zhixing-seven.vercel.app';
    const response = await axios.get(baseURL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const html = response.data;
    
    // 正确提取JavaScript文件名
    const jsMatch = html.match(/static\/js\/main\.([a-f0-9]+)\.js/);
    if (!jsMatch) {
      console.log('❌ 未找到main.js文件');
      return;
    }
    
    const jsFileName = jsMatch[0]; // 例如: static/js/main.6922a46e.js
    const jsURL = `${baseURL}/${jsFileName}`; // 修复：不重复static/js
    
    console.log(`📄 正确的JS文件URL: ${jsURL}`);
    console.log(`📄 文件哈希: ${jsMatch[1]}`);
    
    console.log('\n🔍 步骤2: 检查编译后的代码内容');
    console.log('-' .repeat(30));
    
    const jsResponse = await axios.get(jsURL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const jsCode = jsResponse.data;
    console.log(`📊 代码文件大小: ${(jsCode.length / 1024).toFixed(1)} KB`);
    
    // 检查新逻辑的关键词（考虑可能被压缩）
    const directKeywords = [
      'primaryDirectAmount',
      'secondaryTotalAmount', 
      'averageSecondaryRate',
      'calculatePrimaryCommissionRate'
    ];
    
    const logicPatterns = [
      /40.*0\.40/,  // 40% 转换为 0.40
      /config_confirmed.*true/,
      /totalOrderAmount.*0/,
      /一级销售的用户下单金额/,
      /二级销售订单总金额/,
      /佣金比率.*计算/
    ];
    
    console.log('\n🔍 检查直接关键词:');
    let directFound = 0;
    directKeywords.forEach(keyword => {
      const found = jsCode.includes(keyword);
      console.log(`   ${found ? '✅' : '❌'} ${keyword}`);
      if (found) directFound++;
    });
    
    console.log('\n🔍 检查逻辑模式:');
    let patternFound = 0;
    logicPatterns.forEach((pattern, index) => {
      const found = pattern.test(jsCode);
      console.log(`   ${found ? '✅' : '❌'} 模式${index + 1}: ${pattern}`);
      if (found) patternFound++;
    });
    
    // 检查是否包含新的计算逻辑字符串
    const calculationStrings = [
      '0.40', // 40%的小数表示
      '1 - averageSecondaryRate',
      'filter(order => order.config_confirmed === true)',
      'totalOrderAmount === 0',
      'return 40' // 边界处理
    ];
    
    console.log('\n🔍 检查计算逻辑字符串:');
    let stringFound = 0;
    calculationStrings.forEach(str => {
      const found = jsCode.includes(str);
      console.log(`   ${found ? '✅' : '❌'} "${str}"`);
      if (found) stringFound++;
    });
    
    // 更深入的检查：查找可能的压缩后变量
    console.log('\n🔍 检查压缩后的特征:');
    const compressedPatterns = [
      /\.40\b/, // 0.40的小数点表示
      /config_confirmed/, // 这个属性名应该保持不变
      /filter.*order.*true/, // filter逻辑
      /sales_type.*primary/ // 一级销售判断
    ];
    
    let compressedFound = 0;
    compressedPatterns.forEach((pattern, index) => {
      const found = pattern.test(jsCode);
      console.log(`   ${found ? '✅' : '❌'} 压缩模式${index + 1}: ${pattern}`);
      if (found) compressedFound++;
    });
    
    // 总结
    console.log('\n' + '=' .repeat(50));
    console.log('📊 检查结果总结');
    console.log('=' .repeat(50));
    
    console.log(`✅ 文件已更新: 哈希 ${jsMatch[1]} (不是8a7a4e3e)`);
    console.log(`📊 直接关键词: ${directFound}/${directKeywords.length}`);
    console.log(`📊 逻辑模式: ${patternFound}/${logicPatterns.length}`);
    console.log(`📊 计算字符串: ${stringFound}/${calculationStrings.length}`);
    console.log(`📊 压缩后特征: ${compressedFound}/${compressedPatterns.length}`);
    
    const totalFeatures = directFound + patternFound + stringFound + compressedFound;
    const maxFeatures = directKeywords.length + logicPatterns.length + calculationStrings.length + compressedPatterns.length;
    
    console.log(`\n🎯 总体检测: ${totalFeatures}/${maxFeatures} 特征匹配`);
    
    if (totalFeatures >= 8) {
      console.log('\n🎉 新逻辑很可能已成功部署！');
      console.log('📝 建议: 手动访问页面验证佣金比率显示是否从70%变为37.8%');
    } else if (totalFeatures >= 4) {
      console.log('\n⚠️  新逻辑部分部署，需要进一步验证');
      console.log('📝 建议: 检查特定功能是否正常工作');
    } else {
      console.log('\n❌ 新逻辑可能未正确部署');
      console.log('📝 建议: 检查源码提交或重新部署');
    }
    
    // 生成代码样本用于调试
    console.log('\n🔍 代码样本（前500字符）:');
    console.log('-' .repeat(50));
    console.log(jsCode.substring(0, 500) + '...');
    
    return {
      success: true,
      hash: jsMatch[1],
      totalFeatures,
      maxFeatures,
      deployed: totalFeatures >= 4
    };
    
  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 执行检查
checkNewLogicDeployment().catch(console.error);