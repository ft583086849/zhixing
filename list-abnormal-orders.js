require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function listAbnormalOrders() {
  console.log('=' .repeat(100));
  console.log('异常订单详细列表（金额为100/300/500/900的订单）');
  console.log('=' .repeat(100));
  
  // 1. 查询orders_optimized表
  const { data: ordersOptimized } = await supabase
    .from('orders_optimized')
    .select(`
      id,
      order_number,
      tradingview_username,
      sales_code,
      sales_type,
      primary_sales_id,
      secondary_sales_id,
      duration,
      effective_time,
      amount,
      actual_payment_amount,
      created_at,
      status
    `)
    .in('amount', [100, 300, 500, 900])
    .not('status', 'eq', 'rejected')
    .order('amount', { ascending: false })
    .order('created_at', { ascending: true });
  
  // 获取销售信息
  const primarySalesIds = [...new Set(ordersOptimized?.map(o => o.primary_sales_id).filter(Boolean) || [])];
  const secondarySalesIds = [...new Set(ordersOptimized?.map(o => o.secondary_sales_id).filter(Boolean) || [])];
  
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
  
  console.log('\n📊 orders_optimized表数据:');
  console.log('-'.repeat(100));
  console.log('用户TR名 | 销售信息 | 购买时长 | 生效时间 | 应付金额 | 订单ID');
  console.log('-'.repeat(100));
  
  if (ordersOptimized && ordersOptimized.length > 0) {
    ordersOptimized.forEach(order => {
      // 获取销售信息
      let salesInfo = '无销售';
      if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
        salesInfo = secondarySalesMap[order.secondary_sales_id].wechat_name + '(二级)';
      } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
        salesInfo = primarySalesMap[order.primary_sales_id].wechat_name + '(一级)';
      } else if (order.sales_code) {
        salesInfo = order.sales_code + '(代码)';
      }
      
      console.log([
        order.tradingview_username || 'N/A',
        salesInfo,
        order.duration || 'N/A',
        order.effective_time ? new Date(order.effective_time).toLocaleDateString('zh-CN') : '立即生效',
        `$${order.amount}`,
        order.id
      ].join(' | '));
    });
    
    console.log(`\n共 ${ordersOptimized.length} 个异常订单`);
  }
  
  // 2. 查询orders表进行对比
  console.log('\n\n📊 对比orders表数据:');
  console.log('-'.repeat(100));
  
  // 获取相同的订单ID列表
  const orderIds = ordersOptimized?.map(o => o.id) || [];
  
  if (orderIds.length > 0) {
    const { data: ordersOriginal } = await supabase
      .from('orders')
      .select('id, tradingview_username, duration, amount, status')
      .in('id', orderIds);
    
    if (ordersOriginal) {
      // 创建对比映射
      const originalMap = {};
      ordersOriginal.forEach(o => {
        originalMap[o.id] = o;
      });
      
      let sameCount = 0;
      let diffCount = 0;
      
      console.log('订单ID | orders_optimized表 | orders表 | 是否一致');
      console.log('-'.repeat(80));
      
      ordersOptimized.forEach(opt => {
        const orig = originalMap[opt.id];
        if (orig) {
          const isSame = (
            opt.amount === orig.amount && 
            opt.duration === orig.duration &&
            opt.tradingview_username === orig.tradingview_username
          );
          
          if (isSame) {
            sameCount++;
          } else {
            diffCount++;
            console.log([
              opt.id,
              `金额:$${opt.amount}, 时长:${opt.duration}`,
              `金额:$${orig.amount}, 时长:${orig.duration}`,
              '❌ 不一致'
            ].join(' | '));
          }
        } else {
          console.log(`${opt.id} | 存在 | 不存在 | ❓ orders表中无此记录`);
        }
      });
      
      console.log(`\n统计: ${sameCount}个订单两表一致, ${diffCount}个订单不一致`);
    }
  }
  
  // 3. 分析这些订单的特征
  console.log('\n\n📊 异常订单特征分析:');
  console.log('-'.repeat(100));
  
  // 按金额分组
  const byAmount = {};
  ordersOptimized?.forEach(order => {
    if (!byAmount[order.amount]) {
      byAmount[order.amount] = [];
    }
    byAmount[order.amount].push(order);
  });
  
  Object.entries(byAmount).forEach(([amount, orders]) => {
    console.log(`\n$${amount} 订单（${orders.length}个）:`);
    
    // 统计duration
    const durations = {};
    orders.forEach(o => {
      const d = o.duration || '未知';
      durations[d] = (durations[d] || 0) + 1;
    });
    console.log('  时长分布:', Object.entries(durations).map(([d, c]) => `${d}(${c}个)`).join(', '));
    
    // 统计销售
    const sales = {};
    orders.forEach(o => {
      const s = o.sales_code || '无销售';
      sales[s] = (sales[s] || 0) + 1;
    });
    const topSales = Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 3);
    console.log('  TOP销售:', topSales.map(([s, c]) => `${s}(${c}个)`).join(', '));
    
    // 统计日期
    const dates = {};
    orders.forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString('zh-CN');
      dates[d] = (dates[d] || 0) + 1;
    });
    console.log('  日期分布:', Object.keys(dates).sort().join(', '));
  });
  
  console.log('\n' + '=' .repeat(100));
  console.log('分析完成');
}

listAbnormalOrders();