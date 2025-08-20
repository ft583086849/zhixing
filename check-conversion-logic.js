const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConversionLogic() {
  const salesCode = 'PRI17548273477088006';
  console.log(`=== 检查销售代码 ${salesCode} 的订单数据 ===\n`);
  
  // 1. 获取该销售的所有订单
  const { data: orders, error } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', salesCode)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('查询错误:', error);
    return;
  }
  
  if (!orders) {
    console.log('没有找到订单数据');
    return;
  }
  
  console.log('订单统计:');
  console.log('- 总订单数:', orders.length);
  
  // 过滤有效订单（排除rejected）
  const validOrders = orders.filter(o => o.status !== 'rejected');
  console.log('- 有效订单数（排除rejected）:', validOrders.length);
  
  // 统计有金额的订单（收费订单）
  const paidOrders = validOrders.filter(o => {
    const amount = parseFloat(o.amount || 0);
    const actualAmount = parseFloat(o.actual_payment_amount || 0);
    return amount > 0 || actualAmount > 0;
  });
  console.log('- 收费订单数（amount > 0）:', paidOrders.length);
  
  // 统计免费订单（7天试用）
  const freeOrders = validOrders.filter(o => {
    const amount = parseFloat(o.amount || 0);
    const actualAmount = parseFloat(o.actual_payment_amount || 0);
    return amount === 0 && actualAmount === 0;
  });
  console.log('- 免费订单数（amount = 0）:', freeOrders.length);
  
  console.log('\n订单详情:');
  console.log('收费订单列表:');
  paidOrders.forEach((order, index) => {
    const amount = parseFloat(order.amount || 0);
    const actualAmount = parseFloat(order.actual_payment_amount || 0);
    console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
    console.log(`     客户: ${order.customer_wechat}`);
    console.log(`     状态: ${order.status}`);
    console.log(`     时长: ${order.duration}`);
    console.log(`     金额: $${amount}, 实付: $${actualAmount}`);
  });
  
  console.log('\n免费订单列表:');
  freeOrders.forEach((order, index) => {
    console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
    console.log(`     客户: ${order.customer_wechat}`);
    console.log(`     状态: ${order.status}`);
    console.log(`     时长: ${order.duration}`);
  });
  
  console.log('\n转化率计算:');
  const conversionRate = validOrders.length > 0 
    ? (paidOrders.length / validOrders.length * 100).toFixed(2) 
    : 0;
  console.log(`正确的转化率公式: 收费订单数 / 有效订单数`);
  console.log(`转化率: ${paidOrders.length} / ${validOrders.length} = ${conversionRate}%`);
  
  console.log('\n❌ 当前代码错误的地方:');
  console.log('- 把confirmed_config_orders当作收费订单（错误）');
  console.log('- 应该统计amount > 0的订单作为收费订单（正确）');
}

checkConversionLogic();