const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function compareCommissionData() {
  // 1. 获取有订单的销售及其佣金率
  const { data: salesWithOrders, error: salesError } = await supabase
    .from('sales_optimized')
    .select('sales_code, sales_type, commission_rate, wechat_name')
    .order('sales_code');
  
  if (salesError) {
    console.log('查询销售失败:', salesError);
    return;
  }
  
  console.log('=== 销售佣金率对比 ===');
  console.log('销售数量:', salesWithOrders.length);
  
  // 2. 对每个销售，检查其订单的佣金数据
  let mismatchCount = 0;
  let totalOrders = 0;
  let issueList = [];
  
  for (const sale of salesWithOrders) {
    // 获取该销售的订单
    const { data: orders, error: orderError } = await supabase
      .from('orders_optimized')
      .select('id, amount, commission_rate, commission_amount, status')
      .eq('sales_code', sale.sales_code)
      .neq('status', 'rejected')
      .limit(100);
    
    if (orderError) {
      console.log('查询订单失败:', orderError);
      continue;
    }
    
    if (orders && orders.length > 0) {
      totalOrders += orders.length;
      
      // 检查佣金率是否一致
      let hasIssue = false;
      for (const order of orders) {
        const expectedRate = sale.commission_rate || (sale.sales_type === 'primary' ? 0.4 : 0.25);
        const expectedCommission = order.amount * expectedRate;
        
        // 如果订单的佣金率为0或null，或者佣金计算不正确
        const rateOk = order.commission_rate && Math.abs(order.commission_rate - expectedRate) < 0.001;
        const amountOk = order.commission_amount && Math.abs(order.commission_amount - expectedCommission) < 0.01;
        
        if (!rateOk || !amountOk) {
          hasIssue = true;
          mismatchCount++;
          break;
        }
      }
      
      if (hasIssue) {
        issueList.push({
          销售: sale.wechat_name || sale.sales_code,
          类型: sale.sales_type,
          销售佣金率: (sale.commission_rate * 100).toFixed(1) + '%',
          订单数: orders.length,
          首个订单佣金率: orders[0].commission_rate ? (orders[0].commission_rate * 100).toFixed(1) + '%' : '未设置',
          首个订单金额: orders[0].amount,
          首个订单佣金: orders[0].commission_amount || 0
        });
      }
    }
  }
  
  // 打印有问题的销售
  if (issueList.length > 0) {
    console.log('\n=== 有问题的销售 ===');
    issueList.forEach(issue => {
      console.log('\n销售:', issue.销售);
      console.log('  类型:', issue.类型);
      console.log('  销售佣金率:', issue.销售佣金率);
      console.log('  订单数:', issue.订单数);
      console.log('  首个订单佣金率:', issue.首个订单佣金率);
      console.log('  首个订单金额:', issue.首个订单金额);
      console.log('  首个订单佣金:', issue.首个订单佣金);
    });
  }
  
  console.log('\n=== 统计结果 ===');
  console.log('总订单数:', totalOrders);
  console.log('有问题的销售数:', mismatchCount);
  
  // 3. 检查订单表中佣金字段的填充情况
  const { data: orderStats, error: statsError } = await supabase
    .from('orders_optimized')
    .select('commission_rate, commission_amount, status')
    .neq('status', 'rejected');
  
  if (!statsError && orderStats) {
    const ordersWithRate = orderStats.filter(o => o.commission_rate && o.commission_rate > 0);
    const ordersWithAmount = orderStats.filter(o => o.commission_amount && o.commission_amount > 0);
    
    console.log('\n=== 订单佣金字段统计 ===');
    console.log('非拒绝订单总数:', orderStats.length);
    console.log('有佣金率的订单:', ordersWithRate.length);
    console.log('有佣金金额的订单:', ordersWithAmount.length);
    console.log('佣金率填充率:', ((ordersWithRate.length / orderStats.length) * 100).toFixed(1) + '%');
    console.log('佣金金额填充率:', ((ordersWithAmount.length / orderStats.length) * 100).toFixed(1) + '%');
  }
  
  // 4. 检查最近的订单样本
  const { data: recentOrders, error: recentError } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, amount, commission_rate, commission_amount, created_at')
    .neq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!recentError && recentOrders) {
    console.log('\n=== 最近10个订单样本 ===');
    recentOrders.forEach(order => {
      const expectedCommission = order.amount * (order.commission_rate || 0);
      const isCorrect = Math.abs((order.commission_amount || 0) - expectedCommission) < 0.01;
      console.log(`订单${order.id}: 金额=$${order.amount}, 佣金率=${order.commission_rate || '未设置'}, 佣金=$${order.commission_amount || 0}, ${isCorrect ? '✓' : '✗'}`);
    });
  }
}

compareCommissionData();