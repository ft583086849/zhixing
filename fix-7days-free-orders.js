require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fix7DaysFreeOrders() {
  console.log('=' .repeat(80));
  console.log('修复7天免费试用订单');
  console.log('=' .repeat(80));
  
  // 需要修复的TR用户名列表
  const trUsernames = [
    'huodong423', 'yyt8341', 'yyT8341', 'n1374y5mg0', 'huguogu99', 
    'coshou008', 'qq2721', 'jiangmc42', 'tax15574681086', 'zy7711006-jue',
    'qiyue-jue', 'wujie520133638', 'rr9652264', 'piaopiao4858', 
    'importantAnaly81922', 'ruiqi666go', 'liuyixss', 'JY131419',
    'jiujing110', 'beiken666', 'qiyuec'
  ];
  
  console.log(`\n准备修复 ${trUsernames.length} 个用户的订单`);
  console.log('用户列表:', trUsernames.join(', '));
  
  // 1. 先查询这些订单的当前状态
  console.log('\n1. 查询当前订单状态...');
  const { data: currentOrders, error: queryError } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, duration, effective_time, expiry_time')
    .in('tradingview_username', trUsernames)
    .eq('amount', 100);
  
  if (queryError) {
    console.error('查询失败:', queryError);
    return;
  }
  
  console.log(`找到 ${currentOrders.length} 个订单需要修复`);
  
  // 2. 修改orders_optimized表
  console.log('\n2. 开始修改orders_optimized表...');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const order of currentOrders) {
    // 计算新的到期时间（生效时间+7天）
    let newExpiryTime = null;
    if (order.effective_time) {
      const effectiveDate = new Date(order.effective_time);
      const expiryDate = new Date(effectiveDate);
      expiryDate.setDate(expiryDate.getDate() + 7);
      newExpiryTime = expiryDate.toISOString();
    } else {
      // 如果没有生效时间，使用创建时间+7天
      const createDate = new Date();
      createDate.setDate(createDate.getDate() + 7);
      newExpiryTime = createDate.toISOString();
    }
    
    const updateData = {
      duration: '7天',
      amount: 0,
      actual_payment_amount: 0,
      expiry_time: newExpiryTime,
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await supabase
      .from('orders_optimized')
      .update(updateData)
      .eq('id', order.id);
    
    if (updateError) {
      console.error(`  ❌ 订单 ${order.id} (${order.tradingview_username}) 更新失败:`, updateError.message);
      failCount++;
    } else {
      console.log(`  ✅ 订单 ${order.id} (${order.tradingview_username}) 更新成功`);
      successCount++;
    }
  }
  
  console.log(`\norders_optimized表修改完成: ${successCount} 成功, ${failCount} 失败`);
  
  // 3. 修改orders表
  console.log('\n3. 开始修改orders表...');
  
  const orderIds = currentOrders.map(o => o.id);
  successCount = 0;
  failCount = 0;
  
  for (const order of currentOrders) {
    // 计算新的到期时间
    let newExpiryTime = null;
    if (order.effective_time) {
      const effectiveDate = new Date(order.effective_time);
      const expiryDate = new Date(effectiveDate);
      expiryDate.setDate(expiryDate.getDate() + 7);
      newExpiryTime = expiryDate.toISOString();
    } else {
      const createDate = new Date();
      createDate.setDate(createDate.getDate() + 7);
      newExpiryTime = createDate.toISOString();
    }
    
    const updateData = {
      duration: '7天',
      amount: 0,
      actual_payment_amount: 0,
      expiry_time: newExpiryTime,
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);
    
    if (updateError) {
      console.error(`  ❌ 订单 ${order.id} 更新失败:`, updateError.message);
      failCount++;
    } else {
      console.log(`  ✅ 订单 ${order.id} 更新成功`);
      successCount++;
    }
  }
  
  console.log(`\norders表修改完成: ${successCount} 成功, ${failCount} 失败`);
  
  // 4. 验证修改结果
  console.log('\n4. 验证修改结果...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, duration, effective_time, expiry_time')
    .in('tradingview_username', trUsernames);
  
  if (verifyData) {
    console.log('\n修改后的订单状态:');
    console.log('用户名 | 金额 | 时长 | 到期时间');
    console.log('-'.repeat(60));
    
    verifyData.forEach(order => {
      const expiryDate = order.expiry_time ? new Date(order.expiry_time).toLocaleDateString('zh-CN') : 'N/A';
      console.log(`${order.tradingview_username} | $${order.amount} | ${order.duration} | ${expiryDate}`);
    });
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('修复完成！');
}

fix7DaysFreeOrders();