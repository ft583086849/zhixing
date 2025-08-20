// 调试 AdminAPI.getStats() 方法的具体执行过程
console.log('🔍 开始调试 getStats() 方法...\n');

// 模拟getStats方法的计算过程
async function debugGetStats() {
  const supabase = window.supabaseClient;
  
  console.log('📊 步骤1: 获取orders_optimized数据');
  console.log('=' .repeat(50));
  
  const { data: orders, error: orderError } = await supabase
    .from('orders_optimized')
    .select('*');
  
  if (orderError) {
    console.error('❌ 订单查询失败:', orderError);
    return;
  }
  
  console.log(`✅ 获取到 ${orders.length} 个订单`);
  
  // 检查订单状态分布
  const statusCount = {};
  orders.forEach(order => {
    const status = order.status || 'unknown';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  console.log('📈 订单状态分布:');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} 个`);
  });
  
  console.log('\n📊 步骤2: 获取sales_optimized数据');
  console.log('=' .repeat(50));
  
  const { data: sales, error: salesError } = await supabase
    .from('sales_optimized')
    .select('*');
  
  if (salesError) {
    console.error('❌ 销售查询失败:', salesError);
    return;
  }
  
  console.log(`✅ 获取到 ${sales.length} 个销售`);
  
  // 计算销售佣金汇总
  let totalCommissionFromSales = 0;
  let paidCommissionFromSales = 0;
  
  console.log('\n销售佣金详情:');
  sales.forEach((sale, index) => {
    const commission = sale.total_commission || 0;
    const paid = sale.paid_commission || 0;
    
    if (commission > 0 || paid > 0) {
      console.log(`${index + 1}. ${sale.wechat_name}:`);
      console.log(`   total_commission: $${commission}`);
      console.log(`   paid_commission: $${paid}`);
    }
    
    totalCommissionFromSales += commission;
    paidCommissionFromSales += paid;
  });
  
  console.log(`\n💰 销售表汇总:`);
  console.log(`  应返佣金总额: $${totalCommissionFromSales.toFixed(2)}`);
  console.log(`  已返佣金总额: $${paidCommissionFromSales.toFixed(2)}`);
  
  console.log('\n📊 步骤3: 模拟getStats中的时间过滤');
  console.log('=' .repeat(50));
  
  // 检查时间过滤是否过滤掉了所有订单
  const now = new Date();
  const today = now.toLocaleDateString();
  
  console.log(`当前时间: ${now.toISOString()}`);
  console.log(`今天日期: ${today}`);
  
  // 检查订单的时间字段
  const sampleOrder = orders[0];
  console.log('\n样本订单的时间字段:');
  console.log(`  created_at: ${sampleOrder.created_at}`);
  console.log(`  updated_at: ${sampleOrder.updated_at}`);
  console.log(`  payment_time: ${sampleOrder.payment_time}`);
  
  console.log('\n📊 步骤4: 检查时间范围筛选逻辑');
  console.log('=' .repeat(50));
  
  // 模拟不同时间范围的筛选
  const timeRanges = ['today', 'week', 'month', 'all'];
  
  timeRanges.forEach(timeRange => {
    let filteredOrders = orders;
    
    if (timeRange === 'today') {
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const orderDateString = orderDate.toLocaleDateString();
        return orderDateString === today;
      });
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= weekAgo;
      });
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthAgo;
      });
    }
    
    console.log(`${timeRange}: ${filteredOrders.length} 个订单`);
  });
  
  console.log('\n📊 步骤5: 检查AdminAPI.getSales()返回的数据格式');
  console.log('=' .repeat(50));
  
  // 直接调用AdminAPI.getSales看返回格式
  try {
    // 尝试通过全局AdminAPI调用
    if (window.AdminAPI) {
      const salesResponse = await window.AdminAPI.getSales();
      console.log('AdminAPI.getSales()返回:');
      console.log(`  success: ${salesResponse.success}`);
      console.log(`  data类型: ${typeof salesResponse.data}`);
      console.log(`  data长度: ${salesResponse.data ? salesResponse.data.length : 'null'}`);
    } else {
      console.log('❌ 未找到全局AdminAPI对象');
    }
  } catch (error) {
    console.error('❌ 调用AdminAPI.getSales失败:', error);
  }
}

debugGetStats();