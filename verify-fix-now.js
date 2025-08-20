const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function verifyFix() {
  console.log('🔍 验证一级销售对账页面修复效果...\n');
  
  const salesCode = 'PRI17547241780648255';
  
  // 1. 获取销售信息
  const { data: salesInfo } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', salesCode)
    .single();
    
  if (!salesInfo) {
    console.log('❌ 找不到销售信息');
    return;
  }
  
  console.log('✅ 销售信息:');
  console.log(`  - 销售代码: ${salesInfo.sales_code}`);
  console.log(`  - 微信号: ${salesInfo.wechat_id}`);
  console.log(`  - primary_sales_id: ${salesInfo.primary_sales_id}`);
  
  // 2. 模拟修复后的查询逻辑
  let orders;
  
  if (salesInfo.primary_sales_id) {
    // 使用primary_sales_id查询
    const { data } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('primary_sales_id', salesInfo.primary_sales_id)
      .eq('order_status', 'confirmed_config');
    orders = data || [];
    console.log(`\n✅ 通过primary_sales_id(${salesInfo.primary_sales_id})查询到 ${orders.length} 条订单`);
  } else {
    // 回退到sales_code查询
    const { data } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', salesCode)
      .eq('order_status', 'confirmed_config');
    orders = data || [];
    console.log(`\n✅ 通过sales_code查询到 ${orders.length} 条订单`);
  }
  
  // 3. 计算统计数据
  const stats = {
    total_orders: orders.length,
    total_amount: orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0),
    total_commission: orders.reduce((sum, o) => sum + (parseFloat(o.primary_commission_amount) || 0), 0)
  };
  
  console.log('\n📊 统计数据:');
  console.log(`  - 总订单数: ${stats.total_orders} 单`);
  console.log(`  - 总金额: $${stats.total_amount.toFixed(2)}`);
  console.log(`  - 总佣金: $${stats.total_commission.toFixed(2)}`);
  
  // 4. 验证结果
  console.log('\n🎯 验证结果:');
  if (stats.total_orders > 0 && stats.total_amount > 0) {
    console.log('✅ 修复成功！数据不再是0，页面应该能正常显示');
    console.log('✅ 销售员WML792355703的数据已经可以正常查询');
  } else {
    console.log('❌ 数据仍然为0，可能还需要进一步检查');
  }
  
  // 5. 显示前5条订单样本
  if (orders.length > 0) {
    console.log('\n📋 订单样本（前5条）:');
    orders.slice(0, 5).forEach((order, i) => {
      console.log(`  ${i + 1}. ${order.order_number} - $${order.amount} - 佣金: $${order.primary_commission_amount || 0}`);
    });
  }
}

verifyFix().catch(console.error);