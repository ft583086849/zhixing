const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYi111111Orders() {
  console.log('=== 检查 Yi111111 的订单数据 ===\n');
  
  // 1. 先获取 Yi111111 的销售信息
  const { data: sales } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('wechat_name', 'Yi111111____');
  
  if (sales && sales.length > 0) {
    const sale = sales[0];
    console.log('销售信息:');
    console.log('- 销售代码:', sale.sales_code);
    console.log('- 销售类型:', sale.sales_type);
    
    // 2. 获取该销售的所有订单
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', sale.sales_code);
    
    console.log('\n订单统计:');
    console.log('- 总订单数:', orders.length);
    
    // 过滤有效订单（排除rejected）
    const validOrders = orders.filter(o => o.status !== 'rejected');
    console.log('- 有效订单数:', validOrders.length);
    
    // 统计有金额的订单（收费订单）
    const paidOrders = validOrders.filter(o => {
      const amount = parseFloat(o.amount || 0);
      const actualAmount = parseFloat(o.actual_payment_amount || 0);
      return amount > 0 || actualAmount > 0;
    });
    console.log('- 收费订单数:', paidOrders.length);
    
    // 统计免费订单
    const freeOrders = validOrders.filter(o => {
      const amount = parseFloat(o.amount || 0);
      const actualAmount = parseFloat(o.actual_payment_amount || 0);
      return amount === 0 && actualAmount === 0;
    });
    console.log('- 免费订单数:', freeOrders.length);
    
    console.log('\n订单详情:');
    validOrders.forEach((order, index) => {
      const amount = parseFloat(order.amount || 0);
      const actualAmount = parseFloat(order.actual_payment_amount || 0);
      console.log(`${index + 1}. 订单号: ${order.order_number}`);
      console.log(`   状态: ${order.status}`);
      console.log(`   时长: ${order.duration}`);
      console.log(`   金额: ${amount}, 实付: ${actualAmount}`);
      console.log(`   类型: ${amount > 0 || actualAmount > 0 ? '收费订单' : '免费订单'}`);
      console.log('');
    });
    
    console.log('转化率计算:');
    const conversionRate = validOrders.length > 0 
      ? (paidOrders.length / validOrders.length * 100).toFixed(2) 
      : 0;
    console.log(`转化率: ${paidOrders.length}/${validOrders.length} = ${conversionRate}%`);
    
  } else {
    console.log('未找到 Yi111111____ 的销售信息');
  }
}

checkYi111111Orders();