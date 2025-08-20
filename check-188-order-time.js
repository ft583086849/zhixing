const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function check188OrderTime() {
  console.log('🔍 查询订单 ORD1755596580373 的详细时间信息...\n');
  
  const { data: order } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('order_number', 'ORD1755596580373')
    .single();
    
  if (order) {
    console.log('订单号:', order.order_number);
    console.log('销售代码:', order.sales_code, '(SEC17548302753741835)');
    console.log('父级销售:', '需要查询sales_optimized表确认');
    console.log('金额: $', order.amount);
    console.log('一级分成: $', order.primary_commission_amount);
    console.log('\n时间信息:');
    console.log('  payment_time (UTC):', order.payment_time);
    console.log('  payment_time (北京时间):', new Date(order.payment_time).toLocaleString('zh-CN'));
    console.log('  created_at (UTC):', order.created_at);
    console.log('  created_at (北京时间):', new Date(order.created_at).toLocaleString('zh-CN'));
    
    // 查询这个二级销售的父级
    const { data: salesInfo } = await supabase
      .from('sales_optimized')
      .select('parent_sales_code')
      .eq('sales_code', 'SEC17548302753741835')
      .single();
      
    if (salesInfo) {
      console.log('\n父级销售代码:', salesInfo.parent_sales_code);
      if (salesInfo.parent_sales_code === 'PRI17547241780648255') {
        console.log('✅ 这个订单的一级分成确实归属于 PRI17547241780648255');
        
        // 判断是否在今天范围内
        const paymentTime = new Date(order.payment_time);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), -8, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 59, 59);
        
        console.log('\n时区判断:');
        console.log('  今日开始(UTC):', todayStart.toISOString());
        console.log('  今日结束(UTC):', todayEnd.toISOString());
        console.log('  订单时间(UTC):', order.payment_time);
        
        if (paymentTime >= todayStart && paymentTime <= todayEnd) {
          console.log('✅ 订单在今天范围内！');
        } else if (paymentTime > todayEnd) {
          console.log('❌ 订单在明天（付款时间晚于今天结束时间）');
        } else {
          console.log('❌ 订单在昨天或更早');
        }
      }
    }
  }
}

check188OrderTime();
