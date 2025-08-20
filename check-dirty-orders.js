require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkDirtyOrders() {
  console.log('=' .repeat(80));
  console.log('查找数据库中的脏数据');
  console.log('=' .repeat(80));
  
  // 1. 先查看提到的特定脏数据
  console.log('\n1. 检查已知的脏数据:');
  console.log('-'.repeat(40));
  
  const dirtyUsers = [
    { tr_name: 'vindudu', id: 154 },
    { tr_name: 'lublvexh41', id: 120 },
    { tr_name: 'JY131419', id: 110 },
    { tr_name: 'ruiqi666go', id: 107 },
    { tr_name: 'beiken666', id: 97 },
    { tr_name: 'piaopiao4858', id: 96 },
    { tr_name: 'rr9652264', id: 93 }
  ];
  
  for (const user of dirtyUsers) {
    const { data } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, customer_wechat, amount, status')
      .or(`tradingview_username.eq.${user.tr_name},id.eq.${user.id}`)
      .limit(1);
    
    if (data && data.length > 0) {
      console.log(`✓ 找到: TR用户=${data[0].tradingview_username} - ID=${data[0].id} - 金额=$${data[0].amount} - 状态=${data[0].status}`);
    }
  }
  
  // 2. 查找非标准金额的订单
  console.log('\n2. 查找非标准金额的订单 (非188/488/688/1588):');
  console.log('-'.repeat(80));
  
  const { data: nonStandardOrders, error } = await supabase
    .from('orders_optimized')
    .select(`
      id,
      tradingview_username,
      customer_wechat,
      sales_code,
      primary_sales_id,
      secondary_sales_id,
      amount,
      actual_payment_amount,
      created_at,
      effective_time,
      status,
      order_number
    `)
    .not('amount', 'in', '(188,488,688,1588)')
    .not('status', 'eq', 'rejected')
    .order('amount', { ascending: false });
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  if (nonStandardOrders && nonStandardOrders.length > 0) {
    console.log(`\n找到 ${nonStandardOrders.length} 个非标准金额的订单:\n`);
    
    // 获取销售信息
    const primarySalesIds = [...new Set(nonStandardOrders.map(o => o.primary_sales_id).filter(Boolean))];
    const secondarySalesIds = [...new Set(nonStandardOrders.map(o => o.secondary_sales_id).filter(Boolean))];
    
    // 查询一级销售信息
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
    
    // 查询二级销售信息
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
    
    // 格式化输出
    console.log('用户TR名 | 用户微信 | 销售微信 | 一级销售 | 二级销售 | 订单编号 | 金额 | 生效时间 | 状态');
    console.log('-'.repeat(120));
    
    nonStandardOrders.forEach(order => {
      const primarySales = primarySalesMap[order.primary_sales_id];
      const secondarySales = secondarySalesMap[order.secondary_sales_id];
      
      // 获取销售微信（可能是二级销售的，也可能是一级销售的）
      let salesWechat = 'N/A';
      if (order.sales_code) {
        // 优先使用二级销售
        if (secondarySales) {
          salesWechat = secondarySales.wechat_name;
        } else if (primarySales) {
          salesWechat = primarySales.wechat_name;
        }
      }
      
      console.log([
        order.tradingview_username || 'N/A',
        order.customer_wechat || 'N/A',
        salesWechat,
        primarySales?.wechat_name || 'N/A',
        secondarySales?.wechat_name || 'N/A',
        order.order_number || order.id,
        `$${order.amount}`,
        order.effective_time ? new Date(order.effective_time).toLocaleDateString('zh-CN') : 'N/A',
        order.status
      ].join(' | '));
    });
    
    // 统计各种金额的分布
    console.log('\n3. 金额分布统计:');
    console.log('-'.repeat(40));
    
    const amountStats = {};
    nonStandardOrders.forEach(order => {
      const amount = order.amount;
      amountStats[amount] = (amountStats[amount] || 0) + 1;
    });
    
    Object.entries(amountStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([amount, count]) => {
        console.log(`  $${amount}: ${count} 个订单`);
      });
      
    // 标准金额订单统计
    console.log('\n4. 标准金额订单统计:');
    console.log('-'.repeat(40));
    
    const standardAmounts = [188, 488, 688, 1588];
    for (const amount of standardAmounts) {
      const { count } = await supabase
        .from('orders_optimized')
        .select('*', { count: 'exact', head: true })
        .eq('amount', amount)
        .not('status', 'eq', 'rejected');
      
      console.log(`  $${amount}: ${count || 0} 个订单`);
    }
    
  } else {
    console.log('没有找到非标准金额的订单');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('查询完成');
}

checkDirtyOrders();