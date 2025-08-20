require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkOrderDetails() {
  console.log('检查订单详细信息');
  console.log('=' .repeat(80));
  
  // 1. 先查看所有被修改订单的生效时间和到期时间
  console.log('\n1. 所有被修改订单的时间信息:');
  console.log('-'.repeat(80));
  
  const { data: allModified } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, effective_time, expiry_time, created_at')
    .eq('duration', '7天')
    .eq('amount', 0)
    .order('id');
  
  console.log('订单ID | 用户 | 创建时间 | 生效时间 | 到期时间 | 问题');
  console.log('-'.repeat(80));
  
  allModified?.forEach(order => {
    const created = new Date(order.created_at).toLocaleDateString('zh-CN');
    const effective = order.effective_time ? new Date(order.effective_time).toLocaleDateString('zh-CN') : '立即(创建时)';
    const expiry = order.expiry_time ? new Date(order.expiry_time).toLocaleDateString('zh-CN') : 'NULL';
    
    // 检查问题
    let issue = '';
    if (!order.effective_time && expiry === '2025/8/25') {
      issue = '❌ 无生效时间但到期固定为8/25';
    } else if (order.effective_time) {
      const effectiveDate = new Date(order.effective_time);
      const expectedExpiry = new Date(effectiveDate);
      expectedExpiry.setDate(expectedExpiry.getDate() + 7);
      const actualExpiry = order.expiry_time ? new Date(order.expiry_time) : null;
      
      if (actualExpiry && Math.abs(actualExpiry - expectedExpiry) > 86400000) {
        issue = '❌ 到期时间不是生效+7天';
      }
    }
    
    console.log(`${order.id} | ${order.tradingview_username} | ${created} | ${effective} | ${expiry} | ${issue}`);
  });
  
  // 2. 查看多修改的8个订单的历史
  console.log('\n\n2. 多修改的8个订单分析:');
  console.log('-'.repeat(80));
  
  const extraOrderIds = [7, 10, 14, 67, 68, 69, 70, 72];
  
  console.log('\n这8个订单在不同表中的数据对比:');
  console.log('订单ID | orders_optimized表 | orders表');
  console.log('-'.repeat(60));
  
  for (const orderId of extraOrderIds) {
    const { data: opt } = await supabase
      .from('orders_optimized')
      .select('id, amount, duration')
      .eq('id', orderId)
      .single();
    
    const { data: orig } = await supabase
      .from('orders')
      .select('id, amount, duration')
      .eq('id', orderId)
      .single();
    
    if (opt && orig) {
      console.log(`${orderId} | 金额=$${opt.amount}, 时长=${opt.duration} | 金额=$${orig.amount}, 时长=${orig.duration}`);
    }
  }
  
  // 3. 尝试从其他线索推断原始数据
  console.log('\n\n3. 从订单编号和创建模式推断:');
  console.log('-'.repeat(80));
  
  // 查看jiangmc42的所有订单
  const { data: jiangOrders } = await supabase
    .from('orders_optimized')
    .select('id, order_number, amount, duration, created_at, sales_code')
    .eq('tradingview_username', 'jiangmc42')
    .order('created_at');
  
  console.log('\njiangmc42的所有订单:');
  jiangOrders?.forEach(o => {
    console.log(`  ID=${o.id}, 订单号=${o.order_number}, 金额=$${o.amount}, 时长=${o.duration}, 创建=${new Date(o.created_at).toLocaleString('zh-CN')}`);
  });
  
  // 查看yyt8341的所有订单
  const { data: yytOrders } = await supabase
    .from('orders_optimized')
    .select('id, order_number, amount, duration, created_at')
    .eq('tradingview_username', 'yyt8341')
    .order('created_at');
  
  console.log('\nyyt8341的所有订单:');
  yytOrders?.forEach(o => {
    console.log(`  ID=${o.id}, 订单号=${o.order_number}, 金额=$${o.amount}, 时长=${o.duration}, 创建=${new Date(o.created_at).toLocaleString('zh-CN')}`);
  });
  
  // 查看yyT8341的所有订单
  const { data: yyTOrders } = await supabase
    .from('orders_optimized')
    .select('id, order_number, amount, duration, created_at')
    .eq('tradingview_username', 'yyT8341')
    .order('created_at');
  
  console.log('\nyyT8341的所有订单:');
  yyTOrders?.forEach(o => {
    console.log(`  ID=${o.id}, 订单号=${o.order_number}, 金额=$${o.amount}, 时长=${o.duration}, 创建=${new Date(o.created_at).toLocaleString('zh-CN')}`);
  });
}

checkOrderDetails();