const SupabaseService = require('./client/src/services/supabase.js');

async function checkRealData() {
  console.log('检查实际数据...\n');
  
  const supabase = SupabaseService.supabase;
  
  // 1. 检查订单数据
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*');
  
  if (!ordersError && orders) {
    console.log(`订单总数: ${orders.length}`);
    
    // 统计订单状态
    const statusCount = {};
    const durationCount = {};
    
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      durationCount[order.duration] = (durationCount[order.duration] || 0) + 1;
    });
    
    console.log('订单状态分布:', statusCount);
    console.log('订单时长分布:', durationCount);
    
    // 计算有效订单
    const validOrders = orders.filter(o => o.status !== 'rejected');
    console.log(`有效订单数: ${validOrders.length}`);
    
    // 计算总金额
    const totalAmount = validOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    console.log(`总金额: $${totalAmount}`);
  }
  
  // 2. 检查销售数据
  const { data: primarySales } = await supabase.from('primary_sales').select('*');
  const { data: secondarySales } = await supabase.from('secondary_sales').select('*');
  
  console.log(`\n一级销售数: ${primarySales?.length || 0}`);
  console.log(`二级销售数: ${secondarySales?.length || 0}`);
  
  // 检查独立销售（没有primary_sales_id的二级销售）
  const independentSales = secondarySales?.filter(s => !s.primary_sales_id) || [];
  console.log(`独立销售数: ${independentSales.length}`);
  
  // 3. 检查sales_statistics表
  const { data: salesStats, error: statsError } = await supabase
    .from('sales_statistics')
    .select('*');
  
  if (statsError) {
    console.log('\n销售统计表错误:', statsError.message);
  } else if (salesStats) {
    console.log(`\n销售统计记录数: ${salesStats.length}`);
    
    // 按类型统计
    const byType = {};
    salesStats.forEach(s => {
      byType[s.sales_type] = (byType[s.sales_type] || 0) + 1;
    });
    console.log('按类型统计:', byType);
    
    // 计算总业绩
    const totalPerformance = salesStats.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    console.log(`总业绩: $${totalPerformance}`);
  }
  
  // 4. 检查overview_stats表
  const { data: overviewStats, error: overviewError } = await supabase
    .from('overview_stats')
    .select('*');
  
  if (overviewError) {
    console.log('\n概览统计表错误:', overviewError.message);
  } else if (overviewStats) {
    console.log('\n概览统计记录:', overviewStats);
  }
  
  process.exit(0);
}

checkRealData();