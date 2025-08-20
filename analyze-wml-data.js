const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function analyzeWMLData() {
  console.log('🔍 分析用户 WML792355703 的数据问题');
  console.log('======================================\n');
  
  // 1. 查找该用户的销售记录
  const { data: salesData } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', 'WML792355703');
    
  if (!salesData || salesData.length === 0) {
    console.log('❌ 未找到销售员 WML792355703');
    return;
  }
  
  const sale = salesData[0];
  console.log('1️⃣ 销售员基本信息:');
  console.log('销售代码:', sale.sales_code);
  console.log('销售类型:', sale.sales_type);
  console.log('佣金率:', sale.commission_rate);
  console.log('上级销售:', sale.parent_sales_code);
  console.log();
  
  // 2. 查找该销售员的所有订单
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', 'WML792355703');
    
  console.log('2️⃣ 该销售员的订单数据:');
  console.log('订单总数:', orders?.length || 0);
  
  if (orders && orders.length > 0) {
    // 按状态分组
    const statusStats = {};
    let totalAmount = 0;
    let confirmedAmount = 0;
    
    orders.forEach(order => {
      statusStats[order.status] = (statusStats[order.status] || 0) + 1;
      totalAmount += order.amount || 0;
      if (order.status === 'confirmed_config') {
        confirmedAmount += order.amount || 0;
      }
    });
    
    console.log('订单状态统计:', statusStats);
    console.log('订单总金额:', totalAmount);
    console.log('确认订单金额:', confirmedAmount);
    console.log();
    
    // 显示订单详情
    console.log('订单详情:');
    orders.forEach(order => {
      console.log(`  订单${order.id}: ${order.status} - $${order.amount} (佣金: $${order.commission_amount || 0})`);
    });
    console.log();
  }
  
  // 3. 查找该销售员的下级销售
  const { data: secondarySales } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('parent_sales_code', 'WML792355703');
    
  console.log('3️⃣ 下级销售员数据:');
  console.log('下级销售员数量:', secondarySales?.length || 0);
  
  if (secondarySales && secondarySales.length > 0) {
    for (const secondary of secondarySales) {
      console.log(`下级: ${secondary.sales_code} (佣金率: ${secondary.commission_rate})`);
      
      // 查找下级的订单
      const { data: secondaryOrders } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', secondary.sales_code);
        
      console.log(`  订单数: ${secondaryOrders?.length || 0}`);
      if (secondaryOrders && secondaryOrders.length > 0) {
        const confirmedSecondary = secondaryOrders.filter(o => o.status === 'confirmed_config');
        const secondaryAmount = confirmedSecondary.reduce((sum, o) => sum + (o.amount || 0), 0);
        console.log(`  确认订单金额: $${secondaryAmount}`);
        console.log(`  应得分成: $${(secondaryAmount * 0.15).toFixed(2)}`);
      }
    }
  }
  
  // 4. 检查催单数据
  console.log('\n4️⃣ 催单数据检查:');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: reminderOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .in('status', ['pending_payment', 'pending_config'])
    .lt('created_at', oneDayAgo.toISOString());
    
  console.log('全系统待催单订单数:', reminderOrders?.length || 0);
  if (reminderOrders && reminderOrders.length > 0) {
    console.log('催单订单详情:');
    reminderOrders.slice(0, 3).forEach(order => {
      const hours = Math.floor((Date.now() - new Date(order.created_at)) / (1000 * 60 * 60));
      console.log(`  订单${order.id}: ${order.status} - 超时${hours}小时`);
    });
  }
  
  console.log('\n======================================');
  console.log('📋 问题分析总结:');
  console.log('1. 佣金率显示 2500% - 应该是显示逻辑问题');
  console.log('2. 二级销售佣金字段名称需要修改');
  console.log('3. 催单数据统计问题');
  console.log('4. 总佣金计算可能有误');
}

analyzeWMLData();