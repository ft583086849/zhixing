const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkSalesCommission() {
  // 1. 查找销售员信息
  const salesCode = 'PRI17548273477088006';
  const { data: sales } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', salesCode)
    .single();
  
  if (!sales) {
    console.log('找不到销售代码:', salesCode);
    return;
  }
  
  console.log('销售员信息:');
  console.log('=====================================');
  console.log('销售姓名:', sales.sales_name);
  console.log('销售代码:', sales.sales_code);
  console.log('销售类型:', sales.sales_type === 'primary' ? '一级销售' : '二级销售');
  console.log('佣金率:', (sales.commission_rate * 100).toFixed(1) + '%');
  console.log('微信:', sales.wechat || '未设置');
  console.log('支付宝:', sales.alipay || '未设置');
  console.log('USDT地址:', sales.usdt_address || '未设置');
  console.log('创建时间:', new Date(sales.created_at).toLocaleString('zh-CN'));
  
  // 2. 查询该销售员的所有订单
  console.log('\n该销售员的所有订单:');
  console.log('=====================================');
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, status, commission_amount, primary_commission_amount, created_at')
    .eq('sales_code', salesCode)
    .order('id');
  
  let totalConfirmed = 0;
  let totalCommission = 0;
  let rejectedCommission = 0;
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const commission = order.commission_amount || 0;
      const primaryCommission = order.primary_commission_amount || 0;
      console.log(`订单 ${order.id}: ${order.tradingview_username} - ¥${order.amount} - 状态: ${order.status}`);
      console.log(`  commission_amount: ${commission}, primary_commission_amount: ${primaryCommission}`);
      
      if (order.status === 'confirmed_config') {
        totalConfirmed += order.amount;
        totalCommission += commission;
      } else if (order.status === 'rejected') {
        rejectedCommission += primaryCommission;
      }
    });
  } else {
    console.log('该销售员暂无订单');
  }
  
  console.log('\n佣金统计:');
  console.log('=====================================');
  console.log('确认订单总额: ¥' + totalConfirmed);
  console.log('应得佣金总额: ¥' + totalCommission);
  console.log('拒绝订单的佣金(未计入): ¥' + rejectedCommission);
  
  // 3. 查看销售管理页面的统计逻辑
  console.log('\n销售管理页面佣金计算逻辑:');
  console.log('=====================================');
  console.log('根据 AdminSales.js 的逻辑:');
  console.log('1. 只统计 status = "confirmed_config" 的订单');
  console.log('2. 一级销售的佣金 = commission_amount');
  console.log('3. 如果有二级销售，一级还能获得 secondary_commission_amount');
  console.log('4. rejected(拒绝) 状态的订单不计入佣金');
  console.log('');
  console.log('订单141的情况:');
  console.log('- 状态: rejected (已拒绝)');
  console.log('- commission_amount: 0');
  console.log('- primary_commission_amount: 75.2 (这是错误的遗留数据)');
  console.log('- 结论: 这笔佣金【没有】计入销售员的统计中');
}

checkSalesCommission();