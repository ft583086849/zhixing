const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkOrderDetail() {
  console.log('📋 查询订单 ORD1755520005819 的详细信息...\n');
  
  const { data: order } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('order_number', 'ORD1755520005819')
    .single();
    
  if (order) {
    console.log('订单号:', order.order_number);
    console.log('销售代码:', order.sales_code);
    console.log('订单金额:', order.amount);
    console.log('实付金额:', order.actual_payment_amount);
    console.log('状态:', order.status);
    console.log('佣金率:', order.commission_rate);
    console.log('佣金金额:', order.commission_amount);
    console.log('一级佣金:', order.primary_commission_amount);
    console.log('二级佣金:', order.secondary_commission_amount);
    console.log('付款时间:', order.payment_time);
    
    // 如果是二级销售的订单，一级应该获得分成
    if (order.sales_code && order.sales_code.startsWith('SEC')) {
      console.log('\n⚠️ 这是二级销售的订单');
      const amount = order.actual_payment_amount || order.amount || 0;
      if (amount > 0) {
        const expectedPrimaryShare = amount * 0.15; // 一级应得15%
        console.log('订单金额: $', amount);
        console.log('一级应得分成(15%): $', expectedPrimaryShare);
        console.log('实际一级分成: $', order.primary_commission_amount || 0);
        
        if (!order.primary_commission_amount || order.primary_commission_amount === 0) {
          console.log('\n❌ 问题：一级分成字段为0，可能是触发器没有正确设置');
        }
      } else {
        console.log('\n订单金额为0，所以没有佣金');
      }
    }
  }
}

checkOrderDetail();