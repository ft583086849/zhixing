require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function list100Orders() {
  // 查询$100订单
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select(`
      id,
      order_number,
      tradingview_username,
      sales_code,
      primary_sales_id,
      secondary_sales_id,
      created_at
    `)
    .eq('amount', 100)
    .not('status', 'eq', 'rejected')
    .order('created_at', { ascending: true });
  
  // 获取销售信息
  const primarySalesIds = [...new Set(orders?.map(o => o.primary_sales_id).filter(Boolean) || [])];
  const secondarySalesIds = [...new Set(orders?.map(o => o.secondary_sales_id).filter(Boolean) || [])];
  
  const primarySalesMap = {};
  if (primarySalesIds.length > 0) {
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('id, sales_code, wechat_name')
      .in('id', primarySalesIds);
    
    if (primarySales) {
      primarySales.forEach(ps => {
        primarySalesMap[ps.id] = ps;
      });
    }
  }
  
  const secondarySalesMap = {};
  if (secondarySalesIds.length > 0) {
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('id, sales_code, wechat_name')
      .in('id', secondarySalesIds);
    
    if (secondarySales) {
      secondarySales.forEach(ss => {
        secondarySalesMap[ss.id] = ss;
      });
    }
  }
  
  console.log('$100订单列表（21个）');
  console.log('=' .repeat(80));
  console.log('');
  console.log('| 序号 | TR用户名 | 订单ID | 对应销售 | 创建日期 |');
  console.log('|------|----------|--------|----------|----------|');
  
  if (orders) {
    orders.forEach((order, index) => {
      // 获取销售名称
      let salesName = '无';
      if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
        salesName = secondarySalesMap[order.secondary_sales_id].wechat_name;
      } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
        salesName = primarySalesMap[order.primary_sales_id].wechat_name;
      }
      
      const row = [
        `| ${(index + 1).toString().padEnd(4)} `,
        `| ${(order.tradingview_username || 'N/A').padEnd(20)} `,
        `| ${order.id.toString().padEnd(6)} `,
        `| ${salesName.padEnd(20)} `,
        `| ${new Date(order.created_at).toLocaleDateString('zh-CN')} |`
      ].join('');
      
      console.log(row);
    });
  }
  
  console.log('');
  console.log('=' .repeat(80));
}

list100Orders();