// 在浏览器控制台运行，检查Top5销售数据

console.log('=== 检查Top5销售数据 ===');

// 1. 检查React组件状态
console.log('\n1. 检查组件状态:');
if (window.React) {
  // 尝试获取AdminOverview组件的top5Sales状态
  const root = document.querySelector('#root');
  if (root && root._reactInternalFiber) {
    console.log('React组件树存在，但需要手动检查top5Sales状态');
  }
}

// 2. 直接调用API获取销售数据
console.log('\n2. 直接调用销售API:');
AdminAPI.getSales({ timeRange: 'all' }).then(result => {
  console.log('API返回的销售数据:', result);
  
  if (result && result.length > 0) {
    console.log(`\n销售数据总数: ${result.length}`);
    
    // 模拟Top5逻辑
    const allSales = [...result].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
    const top5 = allSales.slice(0, 5);
    
    console.log('\nTop5销售数据处理:');
    top5.forEach((sale, index) => {
      console.log(`${index + 1}. ID: ${sale.id}`);
      console.log(`   wechat_name: "${sale.wechat_name}"`);
      console.log(`   name: "${sale.name}"`);
      console.log(`   sales_type: "${sale.sales_type}"`);
      console.log(`   parent_sales_name: "${sale.parent_sales_name}"`);
      console.log(`   primary_sales_name: "${sale.primary_sales_name}"`);
      console.log(`   total_amount: ${sale.total_amount}`);
      
      // 模拟前端逻辑
      const sales_name = sale.wechat_name || sale.name || '-';
      const primary_sales_name = sale.parent_sales_name || sale.primary_sales_name || '-';
      
      console.log(`   → 显示名称: "${sales_name}"`);
      console.log(`   → 所属一级: "${primary_sales_name}"`);
      console.log('');
    });
  } else {
    console.log('❌ 没有销售数据');
  }
}).catch(error => {
  console.error('API调用失败:', error);
});

// 3. 检查Redux store中的数据
console.log('\n3. 检查Redux中的销售数据:');
if (window.store) {
  const state = window.store.getState();
  const salesData = state.admin?.sales;
  console.log('Redux中的销售数据:', salesData);
  
  if (salesData && salesData.length > 0) {
    console.log(`Redux中有 ${salesData.length} 条销售数据`);
    const top3 = salesData.slice(0, 3).map(s => ({
      wechat_name: s.wechat_name,
      name: s.name,
      total_amount: s.total_amount
    }));
    console.log('前3名销售:', top3);
  }
} else {
  console.log('Redux store不可用');
}