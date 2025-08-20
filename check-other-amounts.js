require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkOtherAbnormalOrders() {
  console.log('检查其他金额的异常订单');
  console.log('='.repeat(80));
  
  // 检查300元订单
  const { data: orders300, count: count300 } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, customer_wechat, amount, duration, created_at, primary_sales_id, secondary_sales_id', { count: 'exact' })
    .eq('amount', 300);
  
  // 检查500元订单
  const { data: orders500, count: count500 } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, customer_wechat, amount, duration, created_at, primary_sales_id, secondary_sales_id', { count: 'exact' })
    .eq('amount', 500);
  
  // 检查900元订单
  const { data: orders900, count: count900 } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, customer_wechat, amount, duration, created_at, primary_sales_id, secondary_sales_id', { count: 'exact' })
    .eq('amount', 900);
  
  console.log('\n统计结果:');
  console.log('300元订单: ' + count300 + '个');
  console.log('500元订单: ' + count500 + '个');
  console.log('900元订单: ' + count900 + '个');
  console.log('总计: ' + (count300 + count500 + count900) + '个');
  
  // 获取销售信息
  const allOrders = [...(orders300 || []), ...(orders500 || []), ...(orders900 || [])];
  const primarySalesIds = [...new Set(allOrders.map(o => o.primary_sales_id).filter(Boolean))];
  const secondarySalesIds = [...new Set(allOrders.map(o => o.secondary_sales_id).filter(Boolean))];
  
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
  
  // 显示300元订单详情
  if (orders300 && orders300.length > 0) {
    console.log('\n300元订单详情:');
    console.log('-'.repeat(80));
    console.log('订单ID | TR用户名 | 微信名 | 时长 | 创建日期 | 销售');
    console.log('-'.repeat(80));
    orders300.forEach(order => {
      let salesName = '无';
      if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
        salesName = secondarySalesMap[order.secondary_sales_id];
      } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
        salesName = primarySalesMap[order.primary_sales_id];
      }
      
      console.log(`${order.id} | ${order.tradingview_username || 'N/A'} | ${order.customer_wechat || 'N/A'} | ${order.duration || 'N/A'} | ${new Date(order.created_at).toLocaleDateString('zh-CN')} | ${salesName}`);
    });
  }
  
  // 显示500元订单详情
  if (orders500 && orders500.length > 0) {
    console.log('\n500元订单详情:');
    console.log('-'.repeat(80));
    console.log('订单ID | TR用户名 | 微信名 | 时长 | 创建日期 | 销售');
    console.log('-'.repeat(80));
    orders500.forEach(order => {
      let salesName = '无';
      if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
        salesName = secondarySalesMap[order.secondary_sales_id];
      } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
        salesName = primarySalesMap[order.primary_sales_id];
      }
      
      console.log(`${order.id} | ${order.tradingview_username || 'N/A'} | ${order.customer_wechat || 'N/A'} | ${order.duration || 'N/A'} | ${new Date(order.created_at).toLocaleDateString('zh-CN')} | ${salesName}`);
    });
  }
  
  // 显示900元订单详情
  if (orders900 && orders900.length > 0) {
    console.log('\n900元订单详情:');
    console.log('-'.repeat(80));
    console.log('订单ID | TR用户名 | 微信名 | 时长 | 创建日期 | 销售');
    console.log('-'.repeat(80));
    orders900.forEach(order => {
      let salesName = '无';
      if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
        salesName = secondarySalesMap[order.secondary_sales_id];
      } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
        salesName = primarySalesMap[order.primary_sales_id];
      }
      
      console.log(`${order.id} | ${order.tradingview_username || 'N/A'} | ${order.customer_wechat || 'N/A'} | ${order.duration || 'N/A'} | ${new Date(order.created_at).toLocaleDateString('zh-CN')} | ${salesName}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('分析完成');
  console.log('\n注意: 这些非标准金额的订单可能需要进一步确认:');
  console.log('- 300元订单可能是1个月试用或特殊优惠');
  console.log('- 500元订单可能是3个月试用或特殊套餐');
  console.log('- 900元订单可能是6个月试用或特殊套餐');
}

checkOtherAbnormalOrders();