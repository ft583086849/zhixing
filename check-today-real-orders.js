require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTodayRealOrders() {
  console.log('查询今天（8月18日）的所有订单');
  console.log('='.repeat(100));
  
  // 获取今天的日期范围
  const today = new Date('2025-08-18');
  const tomorrow = new Date('2025-08-19');
  
  // 1. 查询今天创建的所有订单
  const { data: todayOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('id', { ascending: false });
  
  console.log(`今天创建的订单总数: ${todayOrders?.length || 0}个`);
  console.log('');
  
  if (todayOrders && todayOrders.length > 0) {
    console.log('【今天的订单列表】');
    console.log('-'.repeat(100));
    console.log('订单ID | 用户 | 金额 | 状态 | 一级销售ID | 二级销售ID | 创建时间');
    console.log('-'.repeat(100));
    
    todayOrders.forEach(order => {
      console.log(`${order.id} | ${order.tradingview_username || 'N/A'} | $${order.amount} | ${order.status} | ${order.primary_sales_id || '无'} | ${order.secondary_sales_id || '无'} | ${new Date(order.created_at).toLocaleTimeString('zh-CN')}`);
    });
  }
  
  // 2. 获取WML的信息
  const { data: wml } = await supabase
    .from('primary_sales')
    .select('id, wechat_name, sales_code')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  // 3. 筛选出WML相关的订单
  const wmlTodayOrders = todayOrders?.filter(order => 
    order.primary_sales_id === wml.id || 
    order.sales_code === wml.sales_code
  ) || [];
  
  if (wmlTodayOrders.length > 0) {
    console.log('\n【WML今天的订单】');
    console.log('-'.repeat(100));
    
    wmlTodayOrders.forEach(order => {
      const relationship = order.secondary_sales_id ? '团队订单' : '直销订单';
      console.log(`订单${order.id}: ${order.tradingview_username} | $${order.amount} | ${order.status} | ${relationship}`);
    });
    
    const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
    const confirmedAmount = wmlTodayOrders
      .filter(o => confirmedStatuses.includes(o.status) && !o.secondary_sales_id)
      .reduce((sum, o) => sum + o.amount, 0);
    
    console.log(`\nWML今天的直销确认金额: $${confirmedAmount}`);
  } else {
    console.log('\n❌ WML今天没有新订单');
  }
  
  // 4. 查询最近的订单ID
  const { data: recentOrders } = await supabase
    .from('orders_optimized')
    .select('id, created_at')
    .order('id', { ascending: false })
    .limit(10);
  
  console.log('\n【最近的订单ID】');
  console.log('-'.repeat(100));
  recentOrders?.forEach(order => {
    console.log(`订单${order.id}: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
  });
  
  console.log('\n说明：订单317、318、319可能还没有创建，或者在其他表中');
}

checkTodayRealOrders();