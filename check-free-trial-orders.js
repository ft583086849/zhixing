require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkFreeTrialOrders() {
  console.log('=' .repeat(100));
  console.log('异常金额订单列表分析（排除$0和$888）');
  console.log('=' .repeat(100));
  
  // 查询所有异常金额订单
  const { data: abnormalOrders } = await supabase
    .from('orders_optimized')
    .select(`
      id,
      order_number,
      tradingview_username,
      customer_wechat,
      sales_code,
      sales_type,
      primary_sales_id,
      secondary_sales_id,
      amount,
      actual_payment_amount,
      created_at,
      effective_time,
      expiry_time,
      duration,
      purchase_type,
      status,
      payment_status,
      payment_time
    `)
    .in('amount', [100, 300, 500, 900])
    .not('status', 'eq', 'rejected')
    .order('amount', { ascending: false })
    .order('created_at', { ascending: true });
  
  if (!abnormalOrders || abnormalOrders.length === 0) {
    console.log('没有找到异常订单');
    return;
  }
  
  // 获取销售信息
  const primarySalesIds = [...new Set(abnormalOrders.map(o => o.primary_sales_id).filter(Boolean))];
  const secondarySalesIds = [...new Set(abnormalOrders.map(o => o.secondary_sales_id).filter(Boolean))];
  
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
  
  // 分析订单
  console.log('\n订单列表:');
  console.log('-'.repeat(100));
  console.log('用户TR名 | 订单编号 | 销售名称 | 订单金额 | 下单时间 | 时长 | 支付状态 | 可能是免费试用？');
  console.log('-'.repeat(100));
  
  let freeTrialCount = 0;
  let suspiciousCount = 0;
  
  abnormalOrders.forEach(order => {
    // 获取销售名称
    let salesName = 'N/A';
    if (order.secondary_sales_id && secondarySalesMap[order.secondary_sales_id]) {
      salesName = secondarySalesMap[order.secondary_sales_id].wechat_name;
    } else if (order.primary_sales_id && primarySalesMap[order.primary_sales_id]) {
      salesName = primarySalesMap[order.primary_sales_id].wechat_name;
    }
    
    // 判断是否可能是7天免费试用
    let isFreeTrialLikely = false;
    let reason = '';
    
    // 检查特征
    if (order.duration === '7天' || order.duration === '7日' || order.duration === '试用') {
      isFreeTrialLikely = true;
      reason = '时长标记为7天';
    } else if (order.payment_status === 'pending' || !order.payment_time) {
      isFreeTrialLikely = true;
      reason = '未支付';
    } else if (order.effective_time && order.expiry_time) {
      const effectiveDate = new Date(order.effective_time);
      const expiryDate = new Date(order.expiry_time);
      const daysDiff = (expiryDate - effectiveDate) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        isFreeTrialLikely = true;
        reason = `有效期仅${Math.round(daysDiff)}天`;
      }
    }
    
    if (isFreeTrialLikely) {
      freeTrialCount++;
    }
    
    // 对于$100订单特别标记
    if (order.amount === 100) {
      suspiciousCount++;
    }
    
    const row = [
      order.tradingview_username || 'N/A',
      order.order_number || order.id,
      salesName,
      `$${order.amount}`,
      new Date(order.created_at).toLocaleDateString('zh-CN'),
      order.duration || 'N/A',
      order.payment_status || 'N/A',
      isFreeTrialLikely ? `⚠️ 是 (${reason})` : ''
    ];
    
    console.log(row.join(' | '));
  });
  
  // 统计分析
  console.log('\n' + '=' .repeat(100));
  console.log('统计分析：');
  console.log('-'.repeat(50));
  
  // 按金额分组统计
  const amountGroups = {};
  abnormalOrders.forEach(order => {
    if (!amountGroups[order.amount]) {
      amountGroups[order.amount] = {
        count: 0,
        durations: {},
        paymentStatus: { paid: 0, pending: 0, null: 0 }
      };
    }
    amountGroups[order.amount].count++;
    
    // 统计时长
    const duration = order.duration || '未知';
    amountGroups[order.amount].durations[duration] = (amountGroups[order.amount].durations[duration] || 0) + 1;
    
    // 统计支付状态
    if (order.payment_status === 'paid') {
      amountGroups[order.amount].paymentStatus.paid++;
    } else if (order.payment_status === 'pending') {
      amountGroups[order.amount].paymentStatus.pending++;
    } else {
      amountGroups[order.amount].paymentStatus.null++;
    }
  });
  
  console.log('\n按金额分组统计:');
  Object.entries(amountGroups).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).forEach(([amount, stats]) => {
    console.log(`\n$${amount} (共${stats.count}个订单):`);
    console.log('  时长分布:');
    Object.entries(stats.durations).forEach(([duration, count]) => {
      console.log(`    ${duration}: ${count}个`);
    });
    console.log('  支付状态:');
    console.log(`    已支付: ${stats.paymentStatus.paid}个`);
    console.log(`    待支付: ${stats.paymentStatus.pending}个`);
    console.log(`    未知: ${stats.paymentStatus.null}个`);
  });
  
  console.log('\n总结:');
  console.log(`  总异常订单数: ${abnormalOrders.length}`);
  console.log(`  可能是免费试用: ${freeTrialCount}个`);
  console.log(`  $100订单(最可疑): ${suspiciousCount}个`);
  
  // 检查特定时间段
  const dateGroups = {};
  abnormalOrders.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('zh-CN');
    dateGroups[date] = (dateGroups[date] || 0) + 1;
  });
  
  console.log('\n按日期分布:');
  Object.entries(dateGroups).sort((a, b) => new Date(a[0]) - new Date(b[0])).forEach(([date, count]) => {
    console.log(`  ${date}: ${count}个订单`);
  });
  
  // 查找最可疑的销售
  const salesStats = {};
  abnormalOrders.forEach(order => {
    const salesCode = order.sales_code || 'NO_SALES';
    if (!salesStats[salesCode]) {
      salesStats[salesCode] = { count: 0, amounts: [] };
    }
    salesStats[salesCode].count++;
    salesStats[salesCode].amounts.push(order.amount);
  });
  
  console.log('\n销售相关统计（订单数>2）:');
  Object.entries(salesStats)
    .filter(([_, stats]) => stats.count > 2)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([salesCode, stats]) => {
      const amounts = {};
      stats.amounts.forEach(a => {
        amounts[a] = (amounts[a] || 0) + 1;
      });
      console.log(`  ${salesCode}: ${stats.count}个订单 (金额分布: ${JSON.stringify(amounts)})`);
    });
  
  console.log('\n' + '=' .repeat(100));
  console.log('分析完成');
}

checkFreeTrialOrders();