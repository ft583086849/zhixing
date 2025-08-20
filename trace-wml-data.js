const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function traceWMLData() {
  console.log('🔍 追踪 WML792355703 的数据流');
  console.log('=====================================\n');
  
  const salesCode = 'WML792355703';
  
  // 1. 查找销售员基本信息
  console.log('1️⃣ 查找销售员基本信息...');
  const { data: salesOptimized } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', salesCode);
    
  const { data: primarySales } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('sales_code', salesCode);
    
  if (salesOptimized && salesOptimized[0]) {
    console.log('在 sales_optimized 表找到:');
    const s = salesOptimized[0];
    console.log(`  销售代码: ${s.sales_code}`);
    console.log(`  微信名: ${s.wechat_name}`);
    console.log(`  销售类型: ${s.sales_type}`);
    console.log(`  佣金率: ${s.commission_rate}`);
    console.log(`  总订单数: ${s.total_orders}`);
    console.log(`  总金额: ${s.total_amount}`);
    console.log(`  总佣金: ${s.total_commission}`);
  } else {
    console.log('❌ 在 sales_optimized 表中未找到');
  }
  
  if (primarySales && primarySales[0]) {
    console.log('\n在 primary_sales 表找到:');
    const p = primarySales[0];
    console.log(`  销售代码: ${p.sales_code}`);
    console.log(`  微信名: ${p.wechat_name}`);
    console.log(`  佣金率: ${p.commission_rate}`);
  } else {
    console.log('❌ 在 primary_sales 表中未找到');
  }
  
  // 2. 查找该销售的所有订单
  console.log('\n2️⃣ 查找该销售的订单...');
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', salesCode);
    
  if (orders && orders.length > 0) {
    console.log(`找到 ${orders.length} 个订单:`);
    
    let totalAmount = 0;
    let totalCommission = 0;
    
    orders.forEach(order => {
      console.log(`\n  订单ID: ${order.id}`);
      console.log(`    客户: ${order.customer_wechat}`);
      console.log(`    状态: ${order.status}`);
      console.log(`    金额: $${order.amount}`);
      console.log(`    commission_amount: $${order.commission_amount || 0}`);
      console.log(`    primary_commission_amount: $${order.primary_commission_amount || 0}`);
      console.log(`    创建时间: ${order.created_at}`);
      
      if (order.status === 'confirmed_config') {
        totalAmount += order.amount || 0;
        totalCommission += order.commission_amount || 0;
      }
    });
    
    console.log(`\n  统计:`);
    console.log(`    确认订单总金额: $${totalAmount}`);
    console.log(`    应得总佣金: $${totalCommission}`);
    console.log(`    按40%计算应得: $${totalAmount * 0.4}`);
  } else {
    console.log('❌ 没有找到订单');
  }
  
  // 3. 查找该销售的下级销售
  console.log('\n3️⃣ 查找下级销售...');
  const { data: secondarySales } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('parent_sales_code', salesCode);
    
  if (secondarySales && secondarySales.length > 0) {
    console.log(`找到 ${secondarySales.length} 个下级销售:`);
    
    for (const sec of secondarySales) {
      console.log(`  ${sec.sales_code} (佣金率: ${sec.commission_rate})`);
      
      // 查找下级的订单
      const { data: secOrders } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', sec.sales_code);
        
      if (secOrders && secOrders.length > 0) {
        const confirmedOrders = secOrders.filter(o => o.status === 'confirmed_config');
        const secTotal = confirmedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        console.log(`    订单数: ${secOrders.length}`);
        console.log(`    确认订单金额: $${secTotal}`);
        console.log(`    应得分成(15%): $${secTotal * 0.15}`);
      }
    }
  } else {
    console.log('❌ 没有下级销售');
  }
  
  // 4. 检查订单ID fl261247
  console.log('\n4️⃣ 检查特定订单 fl261247...');
  const { data: specificOrder } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('id', 'fl261247');
    
  if (specificOrder && specificOrder[0]) {
    const o = specificOrder[0];
    console.log('找到订单 fl261247:');
    console.log(`  销售代码: ${o.sales_code}`);
    console.log(`  客户: ${o.customer_wechat}`);
    console.log(`  金额: $${o.amount}`);
    console.log(`  佣金字段:`);
    console.log(`    commission_amount: $${o.commission_amount || 0}`);
    console.log(`    primary_commission_amount: $${o.primary_commission_amount || 0}`);
    console.log(`  如果佣金率25%，应得: $${o.amount * 0.25}`);
    console.log(`  如果佣金率40%，应得: $${o.amount * 0.4}`);
    
    // 检查为什么显示 $39700
    console.log(`\n  ⚠️ 页面显示 $39700.00 的问题:`);
    console.log(`  可能是显示时乘了100倍: ${o.amount * 0.25} * 100 = ${o.amount * 0.25 * 100}`);
    console.log(`  或者是错误地显示了: ${o.amount * 25} = ${o.amount * 25}`);
  } else {
    console.log('❌ 未找到订单 fl261247');
  }
  
  // 5. 检查催单数据
  console.log('\n5️⃣ 检查催单数据...');
  const { data: activeOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', salesCode)
    .in('status', ['confirmed_config', 'active'])
    .eq('is_reminded', false);
    
  console.log(`未催单的活跃订单数: ${activeOrders?.length || 0}`);
  
  if (activeOrders && activeOrders.length > 0) {
    const now = new Date();
    let needReminderCount = 0;
    
    activeOrders.forEach(order => {
      if (order.created_at && order.duration) {
        const createdDate = new Date(order.created_at);
        const expiryDate = new Date(createdDate);
        
        // 计算到期时间
        if (order.duration === '1month' || order.duration === '1个月') {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (order.duration === '3months' || order.duration === '3个月') {
          expiryDate.setMonth(expiryDate.getMonth() + 3);
        } else if (order.duration === '1year' || order.duration === '1年') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
        const reminderDays = (order.amount > 0) ? 7 : 3;
        
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) {
          needReminderCount++;
          console.log(`  订单${order.id} 需要催单 (${daysUntilExpiry}天后到期)`);
        }
      }
    });
    
    console.log(`需要催单的订单数: ${needReminderCount}`);
  }
}

traceWMLData();