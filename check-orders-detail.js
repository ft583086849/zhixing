const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersDetail() {
  // 1. 查看有金额的订单
  const { data: ordersWithAmount, error } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, customer_wechat, amount, commission_rate, commission_amount, secondary_commission_amount, status, created_at')
    .gt('amount', 0)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.log('查询失败:', error);
    return;
  }
  
  console.log('=== 有金额的订单（最近20条） ===');
  console.log('总数:', ordersWithAmount.length);
  console.log('\n详细数据:');
  
  ordersWithAmount.forEach(order => {
    console.log('\n订单ID:', order.id);
    console.log('  客户:', order.customer_wechat);
    console.log('  销售代码:', order.sales_code);
    console.log('  订单金额: $' + order.amount);
    console.log('  佣金率:', order.commission_rate || '空');
    console.log('  佣金金额:', order.commission_amount || '空');
    console.log('  二级分成:', order.secondary_commission_amount || '空');
    console.log('  状态:', order.status);
    console.log('  创建时间:', order.created_at);
  });
  
  // 2. 统计各字段的填充情况
  const { data: allOrders, error: allError } = await supabase
    .from('orders_optimized')
    .select('amount, commission_rate, commission_amount, secondary_commission_amount, status');
  
  if (!allError) {
    const stats = {
      total: allOrders.length,
      hasAmount: allOrders.filter(o => o.amount > 0).length,
      hasCommissionRate: allOrders.filter(o => o.commission_rate > 0).length,
      hasCommissionAmount: allOrders.filter(o => o.commission_amount > 0).length,
      hasSecondaryCommission: allOrders.filter(o => o.secondary_commission_amount > 0).length,
      rejected: allOrders.filter(o => o.status === 'rejected').length
    };
    
    console.log('\n=== 字段填充统计 ===');
    console.log('总订单数:', stats.total);
    console.log('有金额的订单:', stats.hasAmount, '(' + ((stats.hasAmount/stats.total)*100).toFixed(1) + '%)');
    console.log('有commission_rate的订单:', stats.hasCommissionRate, '(' + ((stats.hasCommissionRate/stats.total)*100).toFixed(1) + '%)');
    console.log('有commission_amount的订单:', stats.hasCommissionAmount, '(' + ((stats.hasCommissionAmount/stats.total)*100).toFixed(1) + '%)');
    console.log('有secondary_commission_amount的订单:', stats.hasSecondaryCommission, '(' + ((stats.hasSecondaryCommission/stats.total)*100).toFixed(1) + '%)');
    console.log('被拒绝的订单:', stats.rejected);
  }
  
  // 3. 查看commission_rate不为空的订单
  const { data: ordersWithRate, error: rateError } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, amount, commission_rate, commission_amount')
    .gt('commission_rate', 0)
    .limit(10);
  
  if (!rateError && ordersWithRate) {
    console.log('\n=== 有commission_rate的订单样本 ===');
    ordersWithRate.forEach(order => {
      const expectedCommission = order.amount * order.commission_rate;
      const isCorrect = Math.abs(order.commission_amount - expectedCommission) < 0.01;
      console.log(`订单${order.id}: 金额=$${order.amount}, 佣金率=${order.commission_rate}, 佣金=$${order.commission_amount}, 计算=${expectedCommission.toFixed(2)}, ${isCorrect ? '✓' : '✗'}`);
    });
  }
}

checkOrdersDetail();