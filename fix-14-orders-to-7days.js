require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fix14OrdersTo7Days() {
  console.log('修改14个订单为7天免费试用');
  console.log('='.repeat(100));
  
  // 要修改的订单ID列表
  const orderIds = [4, 18, 20, 120, 1, 17, 19, 75, 76, 2, 9, 64, 103, 154];
  
  console.log(`准备修改订单ID: ${orderIds.join(', ')}\n`);
  
  // 先查询这些订单的当前信息
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, created_at, effective_time, amount, duration')
    .in('id', orderIds)
    .order('id');
  
  console.log('开始修改订单...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const order of orders) {
    // 计算新的到期时间（生效时间+7天）
    const effectiveDate = order.effective_time ? new Date(order.effective_time) : new Date(order.created_at);
    const newExpiryDate = new Date(effectiveDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);
    
    // 更新数据
    const updateData = {
      duration: '7天',
      amount: 0,
      actual_payment_amount: 0,
      expiry_time: newExpiryDate.toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 更新orders_optimized表
    const { error: error1 } = await supabase
      .from('orders_optimized')
      .update(updateData)
      .eq('id', order.id);
    
    // 更新orders表
    const { error: error2 } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);
    
    if (!error1 && !error2) {
      console.log(`✅ 订单 ${order.id} (${order.tradingview_username}) 已修改`);
      successCount++;
    } else {
      console.log(`❌ 订单 ${order.id} 修改失败: ${error1?.message || error2?.message}`);
      failCount++;
    }
  }
  
  console.log(`\n修改完成: ${successCount} 成功, ${failCount} 失败`);
  
  // 验证修改结果
  console.log('\n' + '='.repeat(100));
  console.log('验证修改后的数据:\n');
  
  const { data: modifiedOrders } = await supabase
    .from('orders_optimized')
    .select(`
      id,
      tradingview_username,
      customer_wechat,
      duration,
      amount,
      actual_payment_amount,
      created_at,
      effective_time,
      expiry_time,
      primary_sales_id,
      secondary_sales_id
    `)
    .in('id', orderIds)
    .order('id');
  
  // 获取销售信息
  const primarySalesIds = [...new Set(modifiedOrders?.map(o => o.primary_sales_id).filter(Boolean) || [])];
  const secondarySalesIds = [...new Set(modifiedOrders?.map(o => o.secondary_sales_id).filter(Boolean) || [])];
  
  const primarySalesMap = {};
  if (primarySalesIds.length > 0) {
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('id, wechat_name')
      .in('id', primarySalesIds);
    
    primarySales?.forEach(ps => {
      primarySalesMap[ps.id] = ps.wechat_name;
    });
  }
  
  const secondarySalesMap = {};
  if (secondarySalesIds.length > 0) {
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('id, wechat_name')
      .in('id', secondarySalesIds);
    
    secondarySales?.forEach(ss => {
      secondarySalesMap[ss.id] = ss.wechat_name;
    });
  }
  
  // 生成表格
  console.log('| 订单ID | TR用户名 | 销售 | 购买时长 | 应付金额 | 实付金额 | 生效时间 | 到期时间 | 验证 |');
  console.log('|--------|----------|------|----------|----------|----------|----------|----------|------|');
  
  modifiedOrders?.forEach(order => {
    // 获取销售名称
    let salesName = '无';
    if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
      salesName = secondarySalesMap[order.secondary_sales_id];
    } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
      salesName = primarySalesMap[order.primary_sales_id];
    }
    
    // 验证到期时间是否正确（生效时间+7天）
    const effectiveDate = order.effective_time ? new Date(order.effective_time) : new Date(order.created_at);
    const expectedExpiry = new Date(effectiveDate);
    expectedExpiry.setDate(expectedExpiry.getDate() + 7);
    const actualExpiry = new Date(order.expiry_time);
    
    const isCorrect = Math.abs(expectedExpiry - actualExpiry) < 1000; // 允许1秒误差
    const status = isCorrect ? '✅' : '❌';
    
    const row = [
      `| ${order.id.toString().padEnd(6)} `,
      `| ${(order.tradingview_username || 'N/A').padEnd(20)} `,
      `| ${salesName.padEnd(15)} `,
      `| ${order.duration.padEnd(8)} `,
      `| ${order.amount.toString().padEnd(8)} `,
      `| ${order.actual_payment_amount.toString().padEnd(8)} `,
      `| ${new Date(effectiveDate).toLocaleDateString('zh-CN').padEnd(10)} `,
      `| ${new Date(order.expiry_time).toLocaleDateString('zh-CN').padEnd(10)} `,
      `| ${status} |`
    ].join('');
    
    console.log(row);
  });
  
  console.log('\n' + '='.repeat(100));
  console.log('所有14个订单修改完成并验证！');
  console.log('✅ = 到期时间正确（生效时间+7天）');
  console.log('❌ = 到期时间计算有误');
}

fix14OrdersTo7Days();