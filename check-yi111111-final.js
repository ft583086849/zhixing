const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYi111111Final() {
  console.log('=== 验证 Yi111111____ (PRI17548273477088006) 的转化率统计 ===');
  
  // 获取该销售的订单
  const { data: orders, error } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', 'PRI17548273477088006')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('查询错误:', error);
    return;
  }
  
  if (orders && orders.length > 0) {
    // 统计各种订单类型
    const validOrders = orders.filter(o => o.status !== 'rejected');
    const paidOrders = validOrders.filter(o => {
      const amount = parseFloat(o.amount || 0);
      const actualAmount = parseFloat(o.actual_payment_amount || 0);
      return amount > 0 || actualAmount > 0;
    });
    const freeOrders = validOrders.filter(o => {
      const amount = parseFloat(o.amount || 0);
      const actualAmount = parseFloat(o.actual_payment_amount || 0);
      return amount === 0 && actualAmount === 0;
    });
    
    console.log('\n📊 订单统计:');
    console.log('  总订单数:', orders.length);
    console.log('  有效订单数（排除rejected）:', validOrders.length);
    console.log('  收费订单数（amount > 0）:', paidOrders.length);
    console.log('  免费订单数（amount = 0）:', freeOrders.length);
    
    const conversionRate = validOrders.length > 0 
      ? (paidOrders.length / validOrders.length * 100).toFixed(2) 
      : 0;
    console.log('\n✅ 转化率计算:');
    console.log('  公式: 收费订单数 / 有效订单数');
    console.log(`  计算: ${paidOrders.length} / ${validOrders.length} = ${conversionRate}%`);
    
    // 用户说的是：有效订单27笔，3笔收费的
    console.log('\n🔍 验证用户提供的数据:');
    console.log('  用户说: 有效订单27笔，3笔收费的');
    console.log(`  实际: 有效订单${validOrders.length}笔，${paidOrders.length}笔收费的`);
    
    if (validOrders.length === 27 && paidOrders.length === 3) {
      console.log('  ✅ 数据匹配！');
    } else {
      console.log('  ⚠️ 数据不匹配，请检查');
    }
    
    console.log('\n📝 前5个收费订单详情:');
    paidOrders.slice(0, 5).forEach((order, index) => {
      const amount = parseFloat(order.amount || 0);
      const actualAmount = parseFloat(order.actual_payment_amount || 0);
      console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
      console.log(`     金额: $${amount}, 实付: $${actualAmount}`);
      console.log(`     状态: ${order.status}, 时长: ${order.duration}`);
    });
    
    console.log('\n📝 前5个免费订单详情:');
    freeOrders.slice(0, 5).forEach((order, index) => {
      console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
      console.log(`     状态: ${order.status}, 时长: ${order.duration}`);
    });
    
    console.log('\n💡 转化率统计逻辑已修复:');
    console.log('  ✅ 收费订单 = amount > 0 或 actual_payment_amount > 0');
    console.log('  ✅ 有效订单 = 所有订单 - rejected状态的订单');
    console.log('  ✅ 转化率 = 收费订单数 / 有效订单数');
  } else {
    console.log('未找到该销售代码的订单');
  }
}

checkYi111111Final();