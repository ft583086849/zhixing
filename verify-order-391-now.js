const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function verifyOrder391() {
  console.log('========== 验证订单391的当前数据 ==========\n');
  console.log('验证时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('');
  
  const { data: order, error } = await supabase
    .from('orders_optimized')
    .select('id, order_number, customer_name, amount, total_amount, commission_amount, commission_rate, status, sales_code, updated_at')
    .eq('id', 391)
    .single();
  
  if (error) {
    console.log('查询错误:', error);
    return;
  }
  
  console.log('订单391当前数据:');
  console.log('================');
  console.log('订单ID:', order.id);
  console.log('订单号:', order.order_number);
  console.log('客户:', order.customer_name);
  console.log('销售代码:', order.sales_code);
  console.log('订单状态:', order.status);
  console.log('最后更新:', order.updated_at);
  
  console.log('\n金额信息:');
  console.log('订单金额(amount):', order.amount, '元');
  console.log('总金额(total_amount):', order.total_amount, '元');
  console.log('佣金率:', (order.commission_rate * 100).toFixed(1) + '%');
  console.log('佣金金额:', order.commission_amount, '元');
  
  console.log('\n========== 验证结果 ==========');
  const expectedCommission = order.amount * order.commission_rate;
  console.log('预期佣金 = ' + order.amount + ' × ' + order.commission_rate + ' = ' + expectedCommission.toFixed(2) + '元');
  console.log('实际佣金:', order.commission_amount, '元');
  
  console.log('\n检查项:');
  if (Math.abs(order.commission_amount - 635.2) < 0.01) {
    console.log('✅ 佣金已正确修复为 635.2 元');
  } else {
    console.log('❌ 佣金不正确，当前是:', order.commission_amount, '元，应该是 635.2 元');
  }
  
  if (order.total_amount === 1588) {
    console.log('✅ total_amount 已正确修复为 1588 元');
  } else {
    console.log('❌ total_amount 不正确，当前是:', order.total_amount, '元，应该是 1588 元');
  }
  
  console.log('\n========== 验证完成 ==========');
  process.exit(0);
}

verifyOrder391();