const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkDirtyDataAndUnusualAmounts() {
  console.log('=== 检查脏数据 ===\n');
  
  // 定义脏数据用户
  const dirtyUsers = [
    { username: 'vindudu', order_id: '154' },
    { username: 'lublvexh41', order_id: '120' },
    { username: 'JY131419', order_id: '110' },
    { username: 'ruiqi666go', order_id: '107' },
    { username: 'beiken666', order_id: '97' },
    { username: 'piaopiao4858', order_id: '96' },
    { username: 'rr9652264', order_id: '93' }
  ];
  
  // 1. 检查orders_optimized表中的脏数据
  console.log('1. orders_optimized表中的脏数据：');
  for (const user of dirtyUsers) {
    const { data: optimizedData, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('tradingview_username', user.username)
      .eq('id', user.order_id);
    
    if (optimizedData && optimizedData.length > 0) {
      console.log(`  - ${user.username} (订单${user.order_id}): 找到 ${optimizedData.length} 条记录`);
    }
  }
  
  // 2. 检查orders表中的脏数据
  console.log('\n2. orders表中的脏数据：');
  for (const user of dirtyUsers) {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('tradingview_username', user.username)
      .eq('id', user.order_id);
    
    if (ordersData && ordersData.length > 0) {
      console.log(`  - ${user.username} (订单${user.order_id}): 找到 ${ordersData.length} 条记录`);
    }
  }
  
  console.log('\n=== 查询非标准金额订单 ===\n');
  
  // 3. 查询orders_optimized表中非标准金额的订单
  const standardAmounts = [188, 488, 688, 1588];
  
  const { data: unusualOrders, error: unusualError } = await supabase
    .from('orders_optimized')
    .select(`
      username,
      user_wechat,
      sales_wechat,
      primary_sales,
      secondary_sales,
      order_id,
      effective_time,
      amount,
      actual_payment_amount,
      status
    `)
    .not('amount', 'in', `(${standardAmounts.join(',')})`)
    .not('status', 'eq', 'rejected')
    .order('effective_time', { ascending: false });
  
  if (unusualError) {
    console.error('查询错误:', unusualError);
    return;
  }
  
  console.log(`找到 ${unusualOrders.length} 个非标准金额订单：\n`);
  
  // 输出详细信息
  console.log('用户TR名 | 用户微信 | 销售微信 | 一级销售 | 二级销售 | 订单编号 | 生效时间 | 应付金额 | 实付金额');
  console.log('-'.repeat(120));
  
  for (const order of unusualOrders) {
    console.log(
      `${order.username || '-'} | ` +
      `${order.user_wechat || '-'} | ` +
      `${order.sales_wechat || '-'} | ` +
      `${order.primary_sales || '-'} | ` +
      `${order.secondary_sales || '-'} | ` +
      `${order.order_id || '-'} | ` +
      `${order.effective_time || '-'} | ` +
      `${order.amount || 0} | ` +
      `${order.actual_payment_amount || 0}`
    );
  }
  
  // 统计非标准金额分布
  console.log('\n=== 非标准金额分布统计 ===');
  const amountDistribution = {};
  for (const order of unusualOrders) {
    const amount = order.amount || 0;
    if (!amountDistribution[amount]) {
      amountDistribution[amount] = 0;
    }
    amountDistribution[amount]++;
  }
  
  console.log('\n金额 | 订单数量');
  console.log('-'.repeat(20));
  for (const [amount, count] of Object.entries(amountDistribution).sort((a, b) => b[1] - a[1])) {
    console.log(`${amount} | ${count}`);
  }
}

checkDirtyDataAndUnusualAmounts().catch(console.error);