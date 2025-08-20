require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTodayOrders() {
  console.log('查询今天的订单317、318、319');
  console.log('='.repeat(100));
  
  // 1. 查询这三个订单的详细信息
  const { data: todayOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .in('id', [317, 318, 319])
    .order('id');
  
  console.log('【订单详细信息】');
  console.log('-'.repeat(100));
  
  todayOrders?.forEach(order => {
    console.log(`\n订单ID: ${order.id}`);
    console.log(`  订单号: ${order.order_number}`);
    console.log(`  用户: ${order.tradingview_username}`);
    console.log(`  金额: $${order.amount}`);
    console.log(`  实付金额: $${order.actual_payment_amount || 0}`);
    console.log(`  状态: ${order.status}`);
    console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
    console.log(`  销售代码: ${order.sales_code}`);
    console.log(`  一级销售ID: ${order.primary_sales_id}`);
    console.log(`  二级销售ID: ${order.secondary_sales_id || '无'}`);
  });
  
  // 2. 获取WML的信息
  const { data: wml } = await supabase
    .from('primary_sales')
    .select('id, wechat_name, sales_code')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  console.log('\n' + '='.repeat(100));
  console.log('【WML792355703的信息】');
  console.log(`  一级销售ID: ${wml.id}`);
  console.log(`  销售代码: ${wml.sales_code}`);
  
  // 3. 分析这些订单与WML的关系
  console.log('\n' + '='.repeat(100));
  console.log('【订单归属分析】');
  console.log('-'.repeat(100));
  
  const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
  let wmlDirectCount = 0;
  let wmlDirectAmount = 0;
  
  todayOrders?.forEach(order => {
    let relationship = '';
    
    // 判断与WML的关系
    if (order.primary_sales_id === wml.id && !order.secondary_sales_id) {
      relationship = '✅ WML直销订单';
      if (confirmedStatuses.includes(order.status)) {
        wmlDirectCount++;
        wmlDirectAmount += order.amount;
      }
    } else if (order.primary_sales_id === wml.id && order.secondary_sales_id) {
      relationship = '📊 WML的团队订单（有二级销售）';
    } else if (order.sales_code === wml.sales_code) {
      relationship = '🔍 销售代码匹配WML';
    } else {
      relationship = '❌ 与WML无关';
    }
    
    console.log(`订单${order.id}: ${relationship}`);
    console.log(`  状态: ${order.status}`);
    console.log(`  是否确认: ${confirmedStatuses.includes(order.status) ? '是' : '否'}`);
  });
  
  console.log('\n' + '='.repeat(100));
  console.log('【统计结果】');
  console.log(`今天这3个订单中：`);
  console.log(`  WML直销确认订单: ${wmlDirectCount}个`);
  console.log(`  WML直销确认金额: $${wmlDirectAmount}`);
  
  // 4. 查询WML所有的确认订单，看看有没有包含今天的
  const { data: allWMLOrders } = await supabase
    .from('orders_optimized')
    .select('id, amount, status, created_at')
    .eq('primary_sales_id', wml.id)
    .is('secondary_sales_id', null)
    .in('status', confirmedStatuses)
    .gt('amount', 0)
    .order('created_at', { ascending: false });
  
  console.log('\n【WML所有确认订单列表】');
  console.log('-'.repeat(100));
  let totalConfirmed = 0;
  allWMLOrders?.forEach(order => {
    const isToday = [317, 318, 319].includes(order.id);
    console.log(`订单${order.id}: $${order.amount} - ${new Date(order.created_at).toLocaleDateString('zh-CN')} ${isToday ? '⭐今天' : ''}`);
    totalConfirmed += order.amount;
  });
  
  console.log(`\n总确认金额: $${totalConfirmed}`);
  console.log('页面显示: $676');
  console.log(`差异: $${totalConfirmed - 676}`);
  
  if (totalConfirmed !== 676) {
    console.log('\n⚠️ 问题：页面显示的金额与实际确认金额不符！');
    console.log('可能原因：');
    console.log('1. 今天的订单还没被统计进去');
    console.log('2. 缓存没有更新');
    console.log('3. 订单状态判断条件不同');
  }
}

checkTodayOrders();