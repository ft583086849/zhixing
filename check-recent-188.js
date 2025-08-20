const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkRecent188() {
  console.log('🔍 查询最近的$188订单...\n');
  
  // 查询所有$188的订单
  const { data: orders188 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 188)
    .order('payment_time', { ascending: false })
    .limit(10);
    
  if (orders188 && orders188.length > 0) {
    console.log('找到', orders188.length, '个$188订单:\n');
    
    orders188.forEach(order => {
      console.log('订单号:', order.order_number);
      console.log('  销售代码:', order.sales_code);
      console.log('  金额: $', order.amount);
      console.log('  佣金金额: $', order.commission_amount || 0);
      console.log('  一级分成: $', order.primary_commission_amount || 0);
      console.log('  二级分成: $', order.secondary_commission_amount || 0);
      console.log('  状态:', order.status);
      console.log('  付款时间:', order.payment_time ? new Date(order.payment_time).toLocaleString('zh-CN') : '未付款');
      
      // 计算应得佣金
      if (order.sales_code && order.sales_code.startsWith('SEC')) {
        const expectedSecondary = 188 * 0.25; // 47
        const expectedPrimary = 188 * 0.15; // 28.2
        console.log('  ⚠️ 二级销售订单 - 应得:');
        console.log('    二级佣金应为: $', expectedSecondary);
        console.log('    一级分成应为: $', expectedPrimary);
      }
      console.log('---');
    });
  } else {
    console.log('没有找到$188的订单');
  }
}

checkRecent188();
