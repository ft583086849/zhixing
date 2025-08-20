// 检查订单统计数据是否正确
console.log('🔍 检查订单统计数据...\n');

const supabase = window.supabaseClient;

async function debugOrderStatistics() {
  console.log('📊 步骤1: 检查orders_optimized表的订单状态分布');
  console.log('=' .repeat(60));
  
  // 1. 查询所有订单状态分布
  const { data: allOrders, error } = await supabase
    .from('orders_optimized')
    .select('id, status, amount, created_at');
  
  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }
  
  console.log(`✅ 总订单数: ${allOrders.length}`);
  
  // 统计各种状态的订单
  const statusCounts = {};
  let totalAmount = 0;
  let validOrdersCount = 0;
  let rejectedCount = 0;
  
  allOrders.forEach(order => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    const amount = parseFloat(order.amount || 0);
    totalAmount += amount;
    
    // 计算生效订单（通常是confirmed_payment, confirmed_config, active等状态）
    if (['confirmed_payment', 'confirmed_config', 'active', 'confirmed'].includes(status)) {
      validOrdersCount++;
    }
    
    // 计算拒绝订单
    if (status === 'rejected') {
      rejectedCount++;
    }
  });
  
  console.log('\n📈 订单状态分布:');
  Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    const percentage = ((count / allOrders.length) * 100).toFixed(1);
    console.log(`  ${status}: ${count} 个 (${percentage}%)`);
  });
  
  console.log('\n💰 订单统计汇总:');
  console.log(`  总订单数: ${allOrders.length}`);
  console.log(`  生效订单数: ${validOrdersCount}`);
  console.log(`  拒绝订单数: ${rejectedCount}`);
  console.log(`  总金额: ¥${totalAmount.toFixed(2)}`);
  
  // 2. 对比当前Redux中的统计数据
  console.log('\n📦 步骤2: 对比Redux中的统计数据');
  console.log('=' .repeat(60));
  
  if (window.store) {
    const state = window.store.getState();
    const stats = state.admin?.stats;
    
    if (stats) {
      console.log('Redux中的订单统计:');
      console.log(`  total_orders: ${stats.total_orders}`);
      console.log(`  valid_orders: ${stats.valid_orders}`);
      console.log(`  rejected_orders: ${stats.rejected_orders}`);
      console.log(`  pending_payment_orders: ${stats.pending_payment_orders}`);
      console.log(`  pending_config_orders: ${stats.pending_config_orders}`);
      console.log(`  confirmed_config_orders: ${stats.confirmed_config_orders}`);
      
      console.log('\n🔍 数据对比:');
      console.log(`  数据库总订单: ${allOrders.length} vs Redux: ${stats.total_orders}`);
      console.log(`  数据库生效订单: ${validOrdersCount} vs Redux: ${stats.valid_orders}`);
      console.log(`  数据库拒绝订单: ${rejectedCount} vs Redux: ${stats.rejected_orders || 0}`);
      
      // 检查是否有不一致
      if (allOrders.length !== stats.total_orders) {
        console.log('⚠️ 总订单数不匹配！');
      }
      if (validOrdersCount !== stats.valid_orders) {
        console.log('⚠️ 生效订单数不匹配！');
      }
      if (stats.total_orders === stats.valid_orders) {
        console.log('❌ 发现问题: 总订单数 = 生效订单数，这是不正确的');
        console.log('   原因: API计算逻辑可能有问题，没有正确分类订单状态');
      }
    }
  }
  
  // 3. 检查AdminOverview组件显示的数据
  console.log('\n📱 步骤3: 检查页面显示');
  console.log('=' .repeat(60));
  
  // 查找页面上的统计数据显示
  const statisticElements = document.querySelectorAll('.ant-statistic');
  
  statisticElements.forEach(element => {
    const title = element.querySelector('.ant-statistic-title');
    const value = element.querySelector('.ant-statistic-content-value');
    
    if (title && value) {
      const titleText = title.textContent;
      const valueText = value.textContent;
      
      if (titleText.includes('生效订单数') || titleText.includes('总订单') || titleText.includes('订单数')) {
        console.log(`📊 ${titleText}: ${valueText}`);
      }
    }
  });
  
  // 4. 诊断和建议
  console.log('\n🎯 问题诊断:');
  console.log('=' .repeat(60));
  
  console.log(`实际情况:`);
  console.log(`  - 数据库总订单: ${allOrders.length}`);
  console.log(`  - 数据库生效订单: ${validOrdersCount}`);
  console.log(`  - 差异订单: ${allOrders.length - validOrdersCount} (应该是待处理+拒绝)`);
  
  if (allOrders.length > validOrdersCount) {
    console.log(`✅ 这才是正确的: 总订单数 > 生效订单数`);
  }
  
  console.log('\n💡 建议检查:');
  console.log('1. AdminAPI.getStats() 中的订单状态分类逻辑');
  console.log('2. valid_orders 的计算条件是否正确');
  console.log('3. 是否有订单状态没有被正确统计');
  
  // 5. 显示具体的订单状态定义
  console.log('\n📋 订单状态说明:');
  console.log('生效订单应该包括: confirmed_payment, confirmed_config, active');
  console.log('非生效订单包括: pending_payment, pending_config, rejected, cancelled');
}

debugOrderStatistics();