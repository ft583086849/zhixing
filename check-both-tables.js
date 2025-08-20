require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkBothTables() {
  console.log('对比orders和orders_optimized两个表的数据');
  console.log('='.repeat(100));
  
  // 1. 查询orders表的最大ID和最近订单
  const { data: ordersLatest } = await supabase
    .from('orders')
    .select('id, tradingview_username, amount, status, created_at')
    .order('id', { ascending: false })
    .limit(10);
  
  console.log('【orders表 - 最近10个订单】');
  console.log('-'.repeat(100));
  ordersLatest?.forEach(order => {
    console.log(`ID: ${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | ${new Date(order.created_at).toLocaleDateString('zh-CN')}`);
  });
  
  // 2. 查询orders_optimized表的最大ID和最近订单
  const { data: optimizedLatest } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, status, created_at')
    .order('id', { ascending: false })
    .limit(10);
  
  console.log('\n【orders_optimized表 - 最近10个订单】');
  console.log('-'.repeat(100));
  optimizedLatest?.forEach(order => {
    console.log(`ID: ${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | ${new Date(order.created_at).toLocaleDateString('zh-CN')}`);
  });
  
  // 3. 查询orders表中ID >= 315的订单
  const { data: ordersNew, count: ordersNewCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .gte('id', 315);
  
  console.log('\n' + '='.repeat(100));
  console.log('【orders表中ID >= 315的订单】');
  console.log(`数量: ${ordersNewCount || 0}个`);
  
  if (ordersNew && ordersNew.length > 0) {
    console.log('-'.repeat(100));
    ordersNew.forEach(order => {
      console.log(`ID: ${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | ${new Date(order.created_at).toLocaleString('zh-CN')}`);
    });
    
    console.log('\n⚠️ 发现问题: orders表中有新订单，但orders_optimized表中没有！');
    console.log('可能原因:');
    console.log('1. 同步触发器失效');
    console.log('2. 手动插入数据没有同步');
    console.log('3. orders_optimized表被单独清理过');
  }
  
  // 4. 检查两个表的总记录数
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
  
  const { count: optimizedCount } = await supabase
    .from('orders_optimized')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n【表记录数对比】');
  console.log('-'.repeat(100));
  console.log(`orders表: ${ordersCount}条记录`);
  console.log(`orders_optimized表: ${optimizedCount}条记录`);
  console.log(`差异: ${ordersCount - optimizedCount}条`);
  
  if (ordersCount !== optimizedCount) {
    console.log('\n⚠️ 两个表的记录数不一致！需要同步数据。');
  }
}

checkBothTables();