require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function traceDirectOrdersSource() {
  console.log('追踪directOrders的来源和内容');
  console.log('='.repeat(80));
  
  // 获取WML的销售信息
  const { data: primarySale } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  console.log('销售代码:', primarySale.sales_code);
  console.log('一级销售ID:', primarySale.id);
  console.log('');
  
  // 模拟salesCache.js第114行的逻辑
  console.log('模拟salesCache.js的directOrders获取逻辑:');
  console.log('const saleOrders = ordersBySalesCode.get(sale.sales_code) || []');
  console.log('');
  
  // 获取所有订单
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('id, order_number, amount, status, sales_code, primary_sales_id, secondary_sales_id, tradingview_username');
  
  // 模拟ordersBySalesCode的索引
  const ordersBySalesCode = new Map();
  allOrders?.forEach(order => {
    if (order.sales_code) {
      if (!ordersBySalesCode.has(order.sales_code)) {
        ordersBySalesCode.set(order.sales_code, []);
      }
      ordersBySalesCode.get(order.sales_code).push(order);
    }
  });
  
  // 获取WML的directOrders（按salesCache.js的逻辑）
  const directOrders = ordersBySalesCode.get(primarySale.sales_code) || [];
  
  console.log(`通过sales_code '${primarySale.sales_code}' 获取到的订单:`);
  console.log('总数:', directOrders.length, '个');
  console.log('');
  
  // 分析这些订单
  const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
  let totalInDirectOrders = 0;
  let confirmedInDirectOrders = 0;
  let hasSecondaryCount = 0;
  
  console.log('详细分析directOrders中的订单:');
  console.log('-'.repeat(80));
  directOrders.forEach(order => {
    const isConfirmed = confirmedStatuses.includes(order.status);
    if (isConfirmed) {
      totalInDirectOrders += order.amount;
      confirmedInDirectOrders += order.amount;
      
      if (order.secondary_sales_id) {
        hasSecondaryCount++;
        console.log(`！！问题订单 ID ${order.id}: ${order.amount}元, 有二级销售ID=${order.secondary_sales_id}`);
      } else if (order.amount > 0) {
        console.log(`  正常订单 ID ${order.id}: ${order.amount}元, 用户=${order.tradingview_username}`);
      }
    }
  });
  
  console.log('');
  console.log('统计结果:');
  console.log(`- directOrders中确认订单总金额: ${confirmedInDirectOrders}元`);
  console.log(`- 有二级销售的订单数: ${hasSecondaryCount}个`);
  console.log('');
  
  // 查找团队订单是否被错误包含
  const { data: teamMembers } = await supabase
    .from('secondary_sales')
    .select('id, wechat_name, sales_code')
    .eq('primary_sales_id', primarySale.id);
  
  console.log('团队成员的sales_code:');
  teamMembers?.forEach(member => {
    console.log(`  ${member.wechat_name}: ${member.sales_code}`);
    
    // 检查这个二级销售的订单是否被错误地包含在directOrders中
    const memberOrders = directOrders.filter(o => o.sales_code === member.sales_code);
    if (memberOrders.length > 0) {
      console.log(`    ！！错误：发现${memberOrders.length}个团队成员的订单被包含在directOrders中！`);
    }
  });
  
  console.log('');
  console.log('='.repeat(80));
  console.log('结论:');
  console.log('1. directOrders是通过sales_code索引获取的');
  console.log('2. 这些订单的确认金额总和是:', confirmedInDirectOrders, '元');
  console.log('3. 676元 vs', confirmedInDirectOrders, '元的差异可能是因为某些订单状态或其他过滤条件');
  console.log('4. 佣金计算基数2503.5元可能来自其他地方的错误累加');
}

traceDirectOrdersSource();