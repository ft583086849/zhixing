const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkAllToday() {
  // 获取今天的时间范围（中国时区）
  const now = new Date();
  // 调整为中国时间的今天开始
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 0, 0); // UTC时间前一天16:00 = 中国时间今天00:00
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 59, 59); // UTC时间今天15:59 = 中国时间今天23:59
  
  console.log('📅 查询时间范围（北京时间）:');
  console.log('  今天开始:', new Date(todayStart.getTime() + 8*3600000).toLocaleString('zh-CN'));
  console.log('  今天结束:', new Date(todayEnd.getTime() + 8*3600000).toLocaleString('zh-CN'));
  
  // 1. 获取所有二级销售
  const { data: secondarySales } = await supabase
    .from('sales_optimized')
    .select('sales_code, wechat_name')
    .eq('parent_sales_code', 'PRI17547241780648255')
    .eq('sales_type', 'secondary');
    
  const allSalesCodes = ['PRI17547241780648255'];
  if (secondarySales) {
    allSalesCodes.push(...secondarySales.map(s => s.sales_code));
  }
  
  // 2. 查询所有相关订单
  console.log('\n🔍 查询今日所有相关订单...\n');
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .in('sales_code', allSalesCodes)
    .gte('payment_time', todayStart.toISOString())
    .lte('payment_time', todayEnd.toISOString())
    .order('payment_time', { ascending: false });
    
  if (allOrders && allOrders.length > 0) {
    console.log('找到', allOrders.length, '个今日订单:\n');
    
    let totalDirectCommission = 0;
    let totalPrimaryShare = 0;
    
    allOrders.forEach(order => {
      const amount = order.actual_payment_amount || order.amount || 0;
      const isSelf = order.sales_code === 'PRI17547241780648255';
      
      console.log('订单号:', order.order_number);
      console.log('  销售:', order.sales_code, isSelf ? '(一级自己)' : '(二级销售)');
      console.log('  金额: $', amount);
      console.log('  状态:', order.status);
      console.log('  佣金率:', order.commission_rate);
      console.log('  佣金金额: $', order.commission_amount || 0);
      console.log('  一级分成: $', order.primary_commission_amount || 0);
      console.log('  付款时间:', new Date(order.payment_time).toLocaleString('zh-CN'));
      console.log('---');
      
      if (isSelf) {
        totalDirectCommission += (order.commission_amount || 0);
      } else {
        totalPrimaryShare += (order.primary_commission_amount || 0);
      }
    });
    
    console.log('\n📊 今日佣金汇总:');
    console.log('  直销佣金: $', totalDirectCommission);
    console.log('  二级分成: $', totalPrimaryShare);
    console.log('  总计: $', totalDirectCommission + totalPrimaryShare);
    
  } else {
    console.log('❌ 今日没有订单');
  }
}

checkAllToday();
