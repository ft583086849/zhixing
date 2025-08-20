require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fixExpiryTimeOnly() {
  console.log('修复29个订单的到期时间（只修改expiry_time字段）');
  console.log('=' .repeat(100));
  
  // 需要修复的订单ID列表（从之前的查询得到）
  const orderIds = [6, 7, 8, 10, 11, 14, 21, 24, 26, 27, 44, 66, 67, 68, 69, 70, 72, 80, 83, 84, 87, 93, 96, 97, 104, 107, 108, 110, 114];
  
  console.log(`准备修复 ${orderIds.length} 个订单的到期时间\n`);
  
  // 先查询这些订单的信息
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, created_at, expiry_time')
    .in('id', orderIds)
    .order('id');
  
  let successCount = 0;
  let failCount = 0;
  
  console.log('开始修复...\n');
  
  for (const order of orders) {
    // 计算正确的到期时间（创建时间+7天）
    const createdDate = new Date(order.created_at);
    const correctExpiryDate = new Date(createdDate);
    correctExpiryDate.setDate(correctExpiryDate.getDate() + 7);
    
    // 只更新expiry_time字段
    const { error: updateError1 } = await supabase
      .from('orders_optimized')
      .update({ 
        expiry_time: correctExpiryDate.toISOString()
      })
      .eq('id', order.id);
    
    const { error: updateError2 } = await supabase
      .from('orders')
      .update({ 
        expiry_time: correctExpiryDate.toISOString()
      })
      .eq('id', order.id);
    
    if (!updateError1 && !updateError2) {
      console.log(`✅ 订单 ${order.id} 到期时间已修复为 ${correctExpiryDate.toLocaleDateString('zh-CN')}`);
      successCount++;
    } else {
      console.log(`❌ 订单 ${order.id} 修复失败`);
      failCount++;
    }
  }
  
  console.log(`\n修复完成: ${successCount} 成功, ${failCount} 失败`);
  
  // 验证修复结果并生成表格
  console.log('\n' + '=' .repeat(100));
  console.log('修复后的订单列表：\n');
  
  const { data: fixedOrders } = await supabase
    .from('orders_optimized')
    .select(`
      id,
      tradingview_username,
      created_at,
      expiry_time,
      amount,
      duration,
      primary_sales_id,
      secondary_sales_id
    `)
    .in('id', orderIds)
    .order('created_at')
    .order('id');
  
  // 获取销售信息
  const primarySalesIds = [...new Set(fixedOrders?.map(o => o.primary_sales_id).filter(Boolean) || [])];
  const secondarySalesIds = [...new Set(fixedOrders?.map(o => o.secondary_sales_id).filter(Boolean) || [])];
  
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
  console.log('| 序号 | TR用户名 | 订单ID | 对应销售 | 创建日期 | 到期日期 | 金额 | 时长 |');
  console.log('|------|----------|--------|----------|----------|----------|------|------|');
  
  fixedOrders?.forEach((order, index) => {
    // 获取销售名称
    let salesName = '无';
    if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
      salesName = secondarySalesMap[order.secondary_sales_id];
    } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
      salesName = primarySalesMap[order.primary_sales_id];
    }
    
    const row = [
      `| ${(index + 1).toString().padEnd(4)} `,
      `| ${(order.tradingview_username || 'N/A').padEnd(20)} `,
      `| ${order.id.toString().padEnd(6)} `,
      `| ${salesName.padEnd(14)} `,
      `| ${new Date(order.created_at).toLocaleDateString('zh-CN').padEnd(10)} `,
      `| ${new Date(order.expiry_time).toLocaleDateString('zh-CN').padEnd(10)} `,
      `| $${order.amount.toString().padEnd(4)} `,
      `| ${order.duration} |`
    ].join('');
    
    console.log(row);
  });
  
  console.log('\n' + '=' .repeat(100));
  console.log('所有订单到期时间修复完成！');
}

fixExpiryTimeOnly();