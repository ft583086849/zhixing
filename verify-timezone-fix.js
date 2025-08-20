const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function verifyTimezoneFix() {
  console.log('🕐 验证时区修复...\n');
  
  // 使用修复后的时区计算（中国时区 UTC+8）
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), -8, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 59, 59);
  
  console.log('📅 修复后的时间范围:');
  console.log('  UTC开始时间:', todayStart.toISOString());
  console.log('  UTC结束时间:', todayEnd.toISOString());
  console.log('  对应北京时间开始:', new Date(todayStart.getTime() + 8*3600000).toLocaleString('zh-CN'));
  console.log('  对应北京时间结束:', new Date(todayEnd.getTime() + 8*3600000).toLocaleString('zh-CN'));
  
  // 查询今日订单（包括所有销售）
  const { data: todayOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .gte('payment_time', todayStart.toISOString())
    .lte('payment_time', todayEnd.toISOString())
    .in('status', ['confirmed_config', 'active'])
    .order('payment_time', { ascending: false });
    
  if (todayOrders && todayOrders.length > 0) {
    console.log('\n✅ 找到今日订单:', todayOrders.length, '个\n');
    
    // 筛选PRI17547241780648255相关的订单
    const relevantOrders = todayOrders.filter(o => {
      return o.sales_code === 'PRI17547241780648255' || 
             o.sales_code === 'SEC17548302753741835' ||
             o.sales_code?.startsWith('SEC');
    });
    
    console.log('PRI17547241780648255相关的订单:\n');
    let totalCommission = 0;
    
    relevantOrders.forEach(order => {
      const amount = order.actual_payment_amount || order.amount || 0;
      console.log('订单号:', order.order_number);
      console.log('  销售代码:', order.sales_code);
      console.log('  金额: $', amount);
      console.log('  佣金: $', order.commission_amount || 0);
      console.log('  一级分成: $', order.primary_commission_amount || 0);
      console.log('  付款时间:', new Date(order.payment_time).toLocaleString('zh-CN'));
      
      // 计算PRI17547241780648255的收益
      if (order.sales_code === 'PRI17547241780648255') {
        totalCommission += (order.commission_amount || 0);
      } else if (order.sales_code === 'SEC17548302753741835') {
        // 这是他的二级销售，获得一级分成
        totalCommission += (order.primary_commission_amount || 0);
      }
      console.log('---');
    });
    
    console.log('\n📊 PRI17547241780648255 今日佣金总计: $', totalCommission);
    
    // 特别检查$188订单
    const order188 = todayOrders.find(o => o.order_number === 'ORD1755596580373');
    if (order188) {
      console.log('\n✅ 找到$188订单（ORD1755596580373）在今日范围内！');
      console.log('  一级分成: $', order188.primary_commission_amount);
    }
    
  } else {
    console.log('❌ 今日没有订单');
  }
}

verifyTimezoneFix();
