// 佣金系统v2.0测试脚本
// 在浏览器控制台运行此脚本来验证佣金计算

console.log('========================================');
console.log('   佣金系统v2.0 测试脚本');
console.log('========================================');

// 1. 测试一级销售数据
async function testPrimarySales() {
  console.log('\n📊 测试一级销售佣金计算...');
  
  try {
    // 获取一级销售数据
    const response = await fetch('/api/admin/sales');
    const data = await response.json();
    
    const primarySales = data.data.filter(s => s.sales_type === 'primary');
    
    if (primarySales.length === 0) {
      console.log('❌ 没有找到一级销售数据');
      return;
    }
    
    primarySales.forEach(sale => {
      console.log(`\n一级销售: ${sale.sales?.wechat_name || sale.sales_code}`);
      console.log('-----------------------------------');
      console.log(`基础佣金率: ${(sale.base_commission_rate * 100).toFixed(0)}%`);
      console.log(`一级直销订单金额: $${sale.primary_direct_amount || 0}`);
      console.log(`二级销售订单金额: $${sale.secondary_orders_amount || 0}`);
      console.log(`平均二级佣金率: ${(sale.secondary_avg_rate * 100).toFixed(1)}%`);
      console.log(`一级直销佣金: $${sale.primary_direct_commission || 0}`);
      console.log(`二级分销收益: $${sale.secondary_share_commission || 0}`);
      console.log(`应返佣金总额: $${sale.commission_amount || 0}`);
      
      // 验证计算
      const expectedDirectCommission = sale.primary_direct_amount * 0.4;
      const expectedTotal = sale.primary_direct_commission + sale.secondary_share_commission;
      
      if (Math.abs(expectedDirectCommission - sale.primary_direct_commission) > 0.01) {
        console.log(`⚠️ 直销佣金计算可能有误`);
      }
      
      if (Math.abs(expectedTotal - sale.commission_amount) > 0.01) {
        console.log(`⚠️ 总佣金计算可能有误`);
      }
      
      console.log('✅ 数据结构完整');
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 2. 测试二级销售数据
async function testSecondarySales() {
  console.log('\n📊 测试二级销售佣金计算...');
  
  try {
    const response = await fetch('/api/admin/sales');
    const data = await response.json();
    
    const secondarySales = data.data.filter(s => 
      s.sales_type === 'secondary' || s.sales_type === 'independent'
    );
    
    if (secondarySales.length === 0) {
      console.log('❌ 没有找到二级销售数据');
      return;
    }
    
    secondarySales.slice(0, 3).forEach(sale => {
      console.log(`\n二级销售: ${sale.sales?.wechat_name || sale.sales_code}`);
      console.log('-----------------------------------');
      console.log(`销售类型: ${sale.sales_type}`);
      console.log(`佣金率: ${sale.commission_rate}%`);
      console.log(`订单金额: $${sale.confirmed_amount || 0}`);
      console.log(`二级分销收益: $${sale.secondary_share_commission || 0}`);
      console.log(`应返佣金额: $${sale.commission_amount || 0}`);
      
      // 验证二级销售的字段
      if (sale.secondary_share_commission !== sale.commission_amount) {
        console.log(`⚠️ 二级分销收益应该等于佣金总额`);
      }
      
      console.log('✅ 数据结构完整');
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 3. 测试一级销售对账页面数据
async function testSettlementPage() {
  console.log('\n📊 测试一级销售对账页面数据...');
  
  // 这需要在一级销售对账页面执行
  if (!window.location.pathname.includes('primary-sales-settlement')) {
    console.log('⚠️ 请在一级销售对账页面执行此测试');
    return;
  }
  
  // 尝试获取Redux store中的数据
  const store = window.store || window.__REDUX_DEVTOOLS_EXTENSION__?.();
  if (store) {
    const state = store.getState();
    const stats = state.sales?.primarySalesStats;
    
    if (stats) {
      console.log('一级销售统计数据:');
      console.log('-----------------------------------');
      console.log(`直销佣金: $${stats.direct_commission || 0}`);
      console.log(`平均二级佣金率: ${(stats.secondary_avg_rate * 100).toFixed(1)}%`);
      console.log(`二级分销收益: $${stats.secondary_share_commission || 0}`);
      console.log(`二级订单总额: $${stats.secondary_orders_amount || 0}`);
      console.log(`总佣金: $${stats.total_commission || 0}`);
      console.log('✅ 对账页面数据完整');
    }
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('\n🚀 开始运行所有测试...\n');
  
  await testPrimarySales();
  await testSecondarySales();
  await testSettlementPage();
  
  console.log('\n========================================');
  console.log('   测试完成');
  console.log('========================================');
  console.log('\n如果发现问题，请截图并报告给开发团队');
}

// 执行测试
runAllTests();
