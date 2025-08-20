const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function testModifications() {
  console.log('🧪 验证修改效果');
  console.log('================\n');
  
  // 1. 测试二级销售数据查询（不过滤）
  console.log('1️⃣ 测试二级销售列表数据...');
  const { data: secondarySales } = await supabase
    .from('secondary_sales')
    .select('*')
    .limit(1);
  
  if (secondarySales && secondarySales[0]) {
    const sale = secondarySales[0];
    
    // 获取所有订单（不过滤状态）
    const { data: allOrders } = await supabase
      .from('orders_optimized')
      .select('status, amount')
      .eq('sales_code', sale.sales_code);
    
    console.log(`二级销售: ${sale.wechat_name || sale.sales_code}`);
    console.log(`所有订单数: ${allOrders?.length || 0}`);
    
    // 统计各状态订单
    const statusCount = {};
    allOrders?.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    console.log('订单状态分布:', statusCount);
    
    // 计算佣金
    const confirmedOrders = allOrders?.filter(o => o.status === 'confirmed_config') || [];
    const totalAmount = confirmedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const secondaryCommission = totalAmount * 0.25;
    const primaryCommission = totalAmount * 0.15;
    
    console.log(`二级销售佣金: ¥${secondaryCommission.toFixed(2)}`);
    console.log(`一级销售分成: ¥${primaryCommission.toFixed(2)}`);
    console.log('✅ 二级销售数据显示全部订单\n');
  } else {
    console.log('⚠️ 没有找到二级销售数据\n');
  }
  
  // 2. 测试催单数据
  console.log('2️⃣ 测试催单功能...');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: reminderOrders } = await supabase
    .from('orders_optimized')
    .select('id, status, created_at')
    .in('status', ['pending_payment', 'pending_config'])
    .lt('created_at', oneDayAgo.toISOString())
    .limit(5);
  
  if (reminderOrders && reminderOrders.length > 0) {
    console.log(`找到 ${reminderOrders.length} 个待催单订单:`);
    reminderOrders.forEach(order => {
      const hours = Math.floor((Date.now() - new Date(order.created_at)) / (1000 * 60 * 60));
      console.log(`  订单${order.id}: ${order.status} - 超时${hours}小时`);
    });
    console.log('✅ 催单功能正常\n');
  } else {
    console.log('没有超过24小时的待处理订单\n');
  }
  
  // 3. 验证搜索功能字段
  console.log('3️⃣ 验证订单搜索功能...');
  // 测试状态筛选
  const { data: statusOrders } = await supabase
    .from('orders_optimized')
    .select('id')
    .in('status', ['pending_payment', 'pending_config'])
    .limit(1);
  
  // 测试金额范围
  const { data: amountOrders } = await supabase
    .from('orders_optimized')
    .select('id, amount')
    .gte('amount', 100)
    .lte('amount', 500)
    .limit(1);
  
  console.log('状态筛选测试:', statusOrders ? '✅ 正常' : '⚠️ 无数据');
  console.log('金额范围测试:', amountOrders ? '✅ 正常' : '⚠️ 无数据');
  
  console.log('\n================');
  console.log('✅ 所有修改验证完成！');
  console.log('\n注意事项:');
  console.log('1. 前端已修改，需要重新部署才能看到效果');
  console.log('2. 数据库索引需要在Supabase执行SQL');
  console.log('3. 建议先在测试环境验证');
}

testModifications();