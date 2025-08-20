const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderStatuses() {
  // 查看所有订单状态的分布
  const { data, error } = await supabase
    .from('orders_optimized')
    .select('status, count:id')
    .limit(1000);
  
  if (error) {
    console.log('查询失败:', error);
    return;
  }
  
  // 统计各种状态
  const statusCount = {};
  data.forEach(order => {
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;
  });
  
  console.log('=== 订单状态分布 ===');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(status + ':', count);
  });
  
  // 查看有佣金的订单的状态
  const { data: ordersWithCommission } = await supabase
    .from('orders_optimized')
    .select('status, commission_amount')
    .gt('commission_amount', 0);
  
  const commissionByStatus = {};
  ordersWithCommission?.forEach(order => {
    if (!commissionByStatus[order.status]) {
      commissionByStatus[order.status] = { count: 0, totalCommission: 0 };
    }
    commissionByStatus[order.status].count++;
    commissionByStatus[order.status].totalCommission += order.commission_amount;
  });
  
  console.log('\n=== 有佣金的订单状态 ===');
  Object.entries(commissionByStatus).forEach(([status, info]) => {
    console.log(status + ':', info.count + '个订单，总佣金$' + info.totalCommission.toFixed(2));
  });
  
  // 查看配置成功的订单样本
  const { data: confirmedOrders } = await supabase
    .from('orders_optimized')
    .select('id, customer_wechat, amount, commission_amount, status')
    .eq('status', 'confirmed_config')
    .limit(5);
  
  console.log('\n=== confirmed_config状态的订单样本 ===');
  confirmedOrders?.forEach(order => {
    console.log('订单' + order.id + ':', '金额$' + order.amount, '佣金$' + (order.commission_amount || 0), '客户:' + order.customer_wechat);
  });
  
  // 查看rejected状态的订单
  const { data: rejectedOrders } = await supabase
    .from('orders_optimized')
    .select('id, customer_wechat, amount, commission_amount, status')
    .eq('status', 'rejected')
    .limit(5);
  
  console.log('\n=== rejected状态的订单样本 ===');
  rejectedOrders?.forEach(order => {
    console.log('订单' + order.id + ':', '金额$' + order.amount, '佣金$' + (order.commission_amount || 0), '客户:' + order.customer_wechat);
  });
}

checkOrderStatuses();