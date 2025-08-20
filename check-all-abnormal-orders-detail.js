require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkAllAbnormalOrdersDetail() {
  console.log('所有非标准金额订单详细列表');
  console.log('='.repeat(100));
  
  // 获取300/500/900元订单
  const { data: orders300 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 300)
    .order('id');
  
  const { data: orders500 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 500)
    .order('id');
  
  const { data: orders900 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 900)
    .order('id');
  
  // 合并所有异常订单
  const allAbnormalOrders = [...(orders300 || []), ...(orders500 || []), ...(orders900 || [])];
  
  // 获取这些用户的所有其他订单
  const usernames = [...new Set(allAbnormalOrders.map(o => o.tradingview_username).filter(Boolean))];
  
  const userOrdersMap = {};
  for (const username of usernames) {
    const { data: userOrders } = await supabase
      .from('orders_optimized')
      .select('id, amount, duration, created_at')
      .eq('tradingview_username', username)
      .order('id');
    
    userOrdersMap[username] = userOrders || [];
  }
  
  // 获取销售信息
  const primarySalesIds = [...new Set(allAbnormalOrders.map(o => o.primary_sales_id).filter(Boolean))];
  const secondarySalesIds = [...new Set(allAbnormalOrders.map(o => o.secondary_sales_id).filter(Boolean))];
  
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
  
  // 输出300元订单表格
  console.log('\n【300元订单 - 3个月】');
  console.log('| 订单ID | TR用户名 | 销售信息 | 购买时长 | 生效时间 | 应付金额 | 该用户其他订单ID |');
  console.log('|--------|----------|----------|----------|----------|----------|------------------|');
  
  orders300?.forEach(order => {
    let salesName = '无';
    if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
      salesName = secondarySalesMap[order.secondary_sales_id];
    } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
      salesName = primarySalesMap[order.primary_sales_id];
    }
    
    // 获取该用户其他订单ID
    const otherOrderIds = userOrdersMap[order.tradingview_username]
      ?.filter(o => o.id !== order.id)
      .map(o => o.id)
      .join(', ') || '无';
    
    const effectiveTime = order.effective_time || order.created_at;
    
    console.log(`| ${order.id.toString().padEnd(6)} | ${(order.tradingview_username || 'N/A').padEnd(20)} | ${salesName.padEnd(15)} | ${order.duration.padEnd(8)} | ${new Date(effectiveTime).toLocaleDateString('zh-CN').padEnd(10)} | ${order.amount.toString().padEnd(8)} | ${otherOrderIds} |`);
  });
  
  // 输出500元订单表格
  console.log('\n【500元订单 - 6个月】');
  console.log('| 订单ID | TR用户名 | 销售信息 | 购买时长 | 生效时间 | 应付金额 | 该用户其他订单ID |');
  console.log('|--------|----------|----------|----------|----------|----------|------------------|');
  
  orders500?.forEach(order => {
    let salesName = '无';
    if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
      salesName = secondarySalesMap[order.secondary_sales_id];
    } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
      salesName = primarySalesMap[order.primary_sales_id];
    }
    
    // 获取该用户其他订单ID
    const otherOrderIds = userOrdersMap[order.tradingview_username]
      ?.filter(o => o.id !== order.id)
      .map(o => o.id)
      .join(', ') || '无';
    
    const effectiveTime = order.effective_time || order.created_at;
    
    console.log(`| ${order.id.toString().padEnd(6)} | ${(order.tradingview_username || 'N/A').padEnd(20)} | ${salesName.padEnd(15)} | ${order.duration.padEnd(8)} | ${new Date(effectiveTime).toLocaleDateString('zh-CN').padEnd(10)} | ${order.amount.toString().padEnd(8)} | ${otherOrderIds} |`);
  });
  
  // 输出900元订单表格
  console.log('\n【900元订单 - 1年】');
  console.log('| 订单ID | TR用户名 | 销售信息 | 购买时长 | 生效时间 | 应付金额 | 该用户其他订单ID |');
  console.log('|--------|----------|----------|----------|----------|----------|------------------|');
  
  orders900?.forEach(order => {
    let salesName = '无';
    if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
      salesName = secondarySalesMap[order.secondary_sales_id];
    } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
      salesName = primarySalesMap[order.primary_sales_id];
    }
    
    // 获取该用户其他订单ID
    const otherOrderIds = userOrdersMap[order.tradingview_username]
      ?.filter(o => o.id !== order.id)
      .map(o => o.id)
      .join(', ') || '无';
    
    const effectiveTime = order.effective_time || order.created_at;
    
    console.log(`| ${order.id.toString().padEnd(6)} | ${(order.tradingview_username || 'N/A').padEnd(20)} | ${salesName.padEnd(15)} | ${order.duration.padEnd(8)} | ${new Date(effectiveTime).toLocaleDateString('zh-CN').padEnd(10)} | ${order.amount.toString().padEnd(8)} | ${otherOrderIds} |`);
  });
  
  // 统计汇总
  console.log('\n' + '='.repeat(100));
  console.log('汇总:');
  console.log(`- 300元订单: ${orders300?.length || 0}个`);
  console.log(`- 500元订单: ${orders500?.length || 0}个`);
  console.log(`- 900元订单: ${orders900?.length || 0}个`);
  console.log(`- 总计: ${allAbnormalOrders.length}个`);
  
  // 输出所有订单ID列表
  console.log('\n所有需要处理的订单ID列表:');
  const allIds = allAbnormalOrders.map(o => o.id).sort((a, b) => a - b);
  console.log(allIds.join(', '));
}

checkAllAbnormalOrdersDetail();