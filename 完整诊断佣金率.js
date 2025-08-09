// 🔍 完整的佣金率问题诊断脚本
// 请在 https://zhixing-seven.vercel.app/admin/sales 页面的控制台运行

console.log('🔍 开始完整诊断佣金率更新问题...\n');
console.log('='.repeat(50));

// 1. 检查 Redux store
try {
  const state = window.store?.getState();
  if (!state) {
    console.error('❌ 无法访问 Redux store，请确保在管理员页面运行');
    throw new Error('Store not found');
  }
  
  const sales = state.admin?.sales || [];
  console.log(`\n📊 销售数据概览:`);
  console.log(`- 总记录数: ${sales.length}`);
  
  if (sales.length === 0) {
    console.warn('⚠️ 没有销售数据，请先刷新页面');
  } else {
    // 2. 分析第一条记录的数据结构
    console.log('\n📋 第一条记录的数据结构:');
    const firstSale = sales[0];
    console.log('完整数据:', firstSale);
    
    // 3. 检查关键字段
    console.log('\n🔑 关键字段检查:');
    console.log('- 有 sales 嵌套对象?', !!firstSale.sales);
    console.log('- sales.id =', firstSale.sales?.id);
    console.log('- 直接 id =', firstSale.id);
    console.log('- sales.commission_rate =', firstSale.sales?.commission_rate);
    console.log('- 直接 commission_rate =', firstSale.commission_rate);
    console.log('- sales.sales_type =', firstSale.sales?.sales_type);
    console.log('- 直接 sales_type =', firstSale.sales_type);
    
    // 4. 佣金率格式分析
    console.log('\n💰 佣金率格式分析:');
    const allRates = [];
    sales.forEach((sale, index) => {
      const nestedRate = sale.sales?.commission_rate;
      const directRate = sale.commission_rate;
      
      if (nestedRate !== null && nestedRate !== undefined) {
        allRates.push({
          index,
          salesId: sale.sales?.id || sale.id,
          nestedRate,
          directRate,
          type: sale.sales?.sales_type || sale.sales_type || 'unknown'
        });
      }
    });
    
    console.table(allRates);
    
    // 5. 分析佣金率格式分布
    console.log('\n📈 佣金率格式分布:');
    const nestedRates = allRates.map(r => r.nestedRate).filter(r => r !== null && r !== undefined);
    const smallRates = nestedRates.filter(r => r < 1 && r > 0);
    const percentRates = nestedRates.filter(r => r >= 1);
    const zeroRates = nestedRates.filter(r => r === 0);
    
    console.log(`- 小数格式 (0-1): ${smallRates.length}个, 值:`, smallRates);
    console.log(`- 百分比格式 (>=1): ${percentRates.length}个, 值:`, percentRates);
    console.log(`- 零值: ${zeroRates.length}个`);
    
    // 6. 模拟更新参数提取
    console.log('\n🔧 模拟更新参数提取:');
    const testRecord = sales[0];
    
    // 模拟 AdminSales.js 中的逻辑
    const actualSalesId = testRecord.sales?.id;
    const actualSalesType = testRecord.sales?.sales_type || testRecord.sales_type || 'secondary';
    const currentRate = testRecord.sales?.commission_rate;
    
    console.log('提取的参数:');
    console.log('- actualSalesId:', actualSalesId);
    console.log('- actualSalesType:', actualSalesType);
    console.log('- currentRate:', currentRate);
    
    // 判断是否能成功更新
    if (!actualSalesId) {
      console.error('❌ 无法获取销售ID！sales.id 为空');
    } else {
      console.log('✅ 成功获取销售ID');
    }
    
    // 7. 模拟佣金率转换逻辑
    console.log('\n🔄 佣金率转换逻辑测试:');
    const testNewRate = 25; // 用户输入 25%
    let rateToStore = testNewRate;
    
    console.log(`用户输入: ${testNewRate}%`);
    console.log(`当前数据库值: ${currentRate}`);
    
    if (testNewRate === 0) {
      rateToStore = 0;
      console.log('-> 设置为0，直接存储0');
    } else if (currentRate !== undefined && 
               currentRate !== null && 
               currentRate < 1 && 
               currentRate > 0) {
      rateToStore = testNewRate / 100;
      console.log(`-> 数据库是小数格式，转换: ${testNewRate}% → ${rateToStore}`);
    } else {
      console.log(`-> 数据库是百分比格式或其他，直接存储: ${rateToStore}`);
    }
    
    console.log(`最终存储值: ${rateToStore}`);
  }
  
  // 8. API 检查
  console.log('\n🔌 API 方法检查:');
  console.log('- window.AdminAPI 存在?', !!window.AdminAPI);
  console.log('- window.SalesAPI 存在?', !!window.SalesAPI);
  
  if (window.AdminAPI) {
    console.log('- AdminAPI.updateCommissionRate 存在?', 
      typeof window.AdminAPI.updateCommissionRate === 'function');
  }
  
  if (window.SalesAPI) {
    console.log('- SalesAPI.updateCommissionRate 存在?', 
      typeof window.SalesAPI.updateCommissionRate === 'function');
  }
  
} catch (error) {
  console.error('诊断过程出错:', error);
}

console.log('\n' + '='.repeat(50));
console.log('✅ 诊断完成！请将以上输出截图发送给开发者');
console.log('\n💡 如果看到 "无法获取销售ID" 的错误，说明数据结构有问题');
console.log('💡 如果佣金率格式混乱（同时有小数和百分比），需要统一格式');
