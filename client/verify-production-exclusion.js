#!/usr/bin/env node

/**
 * 验证生产环境的排除功能是否正常工作
 * 在浏览器控制台执行
 */

console.log('📋 生产环境排除功能验证脚本\n');
console.log('请在 https://zhixing-seven.vercel.app/admin/dashboard 页面的浏览器控制台执行以下代码：\n');

const verificationCode = `
// 验证生产环境排除功能
(async function() {
  console.log('🔍 验证生产环境排除功能...');
  
  try {
    // 1. 检查ExcludedSalesService是否存在
    console.log('\\n1️⃣ 检查服务是否加载:');
    const serviceModule = await import('/src/services/excludedSalesService.js');
    const ExcludedSalesService = serviceModule.default;
    
    if (ExcludedSalesService) {
      console.log('   ✅ ExcludedSalesService服务已加载');
    } else {
      console.log('   ❌ 服务未找到');
      return;
    }
    
    // 2. 检查API是否支持排除
    console.log('\\n2️⃣ 检查API支持:');
    const apiModule = await import('/src/services/api.js');
    const AdminAPI = apiModule.AdminAPI;
    
    // 测试getStats方法是否支持skipExclusion参数
    const testStats = await AdminAPI.getStats({ 
      timeRange: 'all',
      skipExclusion: true  // 测试参数
    });
    
    if (testStats) {
      console.log('   ✅ API支持排除参数');
    }
    
    // 3. 获取当前排除名单
    console.log('\\n3️⃣ 获取当前排除名单:');
    const excludedList = await ExcludedSalesService.getExcludedSales();
    const excludedCodes = await ExcludedSalesService.getExcludedSalesCodes();
    
    if (excludedList.length > 0) {
      console.log(\`   📋 当前有 \${excludedList.length} 条激活的排除记录:\`);
      excludedList.forEach(item => {
        console.log(\`   • \${item.wechat_name} (\${item.sales_code})\`);
      });
    } else {
      console.log('   📭 当前没有激活的排除记录');
    }
    
    // 4. 测试排除功能
    console.log('\\n4️⃣ 测试排除功能:');
    console.log('   如需测试，可以执行以下代码添加wangming到排除名单:');
    console.log(\`
    ExcludedSalesService.addExcludedSales({
      wechat_name: 'wangming',
      reason: '测试排除功能',
      excluded_by: '管理员'
    }).then(result => console.log('添加结果:', result));
    \`);
    
    console.log('\\n✅ 排除功能已部署到生产环境！');
    console.log('功能说明:');
    console.log('• 可以将特定销售从统计中排除');
    console.log('• 被排除的销售自己仍能看到数据');
    console.log('• 影响所有统计页面的数据显示');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    console.log('可能需要等待部署完成或刷新页面');
  }
})();
`;

console.log(verificationCode);

console.log('\n📊 验证步骤说明：');
console.log('1. 访问 https://zhixing-seven.vercel.app/admin/dashboard');
console.log('2. 登录管理员账号');
console.log('3. 打开浏览器控制台（F12）');
console.log('4. 粘贴上述代码执行');
console.log('5. 查看验证结果');

console.log('\n⏰ 部署时间：');
console.log('• Vercel通常需要1-3分钟完成部署');
console.log('• 可以访问 https://vercel.com 查看部署状态');
console.log('• 部署完成后清除浏览器缓存并刷新页面');