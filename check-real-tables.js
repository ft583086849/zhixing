const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkRealTables() {
  console.log('🔍 检查实际的数据库表结构...\n');
  
  // 1. 检查sales_optimized表
  const { data: salesData, error: salesErr } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', 'PRI17547241780648255')
    .single();
    
  if (salesErr) {
    console.log('❌ sales_optimized表查询失败:', salesErr.message);
  } else {
    console.log('✅ sales_optimized表数据:');
    console.log('  - sales_code:', salesData.sales_code);
    console.log('  - wechat_id:', salesData.wechat_id);
    console.log('  - primary_sales_id:', salesData.primary_sales_id);
    console.log('  - 其他字段:', Object.keys(salesData).join(', '));
  }
  
  // 2. 检查orders_optimized表
  console.log('\n📋 检查orders_optimized表...');
  
  // 查询一级销售直接的订单
  const { data: directOrders } = await supabase
    .from('orders_optimized')
    .select('order_number, sales_code, primary_sales_id, amount, order_status')
    .eq('sales_code', 'PRI17547241780648255')
    .eq('order_status', 'confirmed_config')
    .limit(5);
    
  console.log(`\n直接订单 (sales_code=PRI17547241780648255): ${directOrders?.length || 0} 条`);
  if (directOrders && directOrders.length > 0) {
    directOrders.forEach(o => {
      console.log(`  - ${o.order_number}: $${o.amount}, primary_sales_id=${o.primary_sales_id}`);
    });
  }
  
  // 如果有primary_sales_id，尝试用它查询
  if (salesData && salesData.primary_sales_id) {
    const { data: primaryIdOrders } = await supabase
      .from('orders_optimized')
      .select('order_number, sales_code, primary_sales_id, amount')
      .eq('primary_sales_id', salesData.primary_sales_id)
      .eq('order_status', 'confirmed_config')
      .limit(5);
      
    console.log(`\n通过primary_sales_id (${salesData.primary_sales_id}) 查询: ${primaryIdOrders?.length || 0} 条`);
    if (primaryIdOrders && primaryIdOrders.length > 0) {
      primaryIdOrders.forEach(o => {
        console.log(`  - ${o.order_number}: $${o.amount}, sales_code=${o.sales_code}`);
      });
    }
  }
  
  // 3. 查询所有二级销售
  const { data: secondarySales } = await supabase
    .from('sales_optimized')
    .select('sales_code, wechat_id')
    .eq('parent_sales_code', 'PRI17547241780648255');
    
  console.log(`\n二级销售 (parent_sales_code=PRI17547241780648255): ${secondarySales?.length || 0} 人`);
  if (secondarySales && secondarySales.length > 0) {
    // 查询二级销售的订单
    const secondaryCodes = secondarySales.map(s => s.sales_code);
    const { data: secondaryOrders } = await supabase
      .from('orders_optimized')
      .select('sales_code, amount')
      .in('sales_code', secondaryCodes)
      .eq('order_status', 'confirmed_config');
      
    console.log(`二级销售订单总数: ${secondaryOrders?.length || 0} 条`);
    const totalAmount = secondaryOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    console.log(`二级销售订单总额: $${totalAmount}`);
  }
  
  // 4. 统计总数据
  console.log('\n📊 总体统计:');
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('amount, primary_commission_amount')
    .or(`sales_code.eq.PRI17547241780648255,primary_sales_id.eq.${salesData?.primary_sales_id || 0}`)
    .eq('order_status', 'confirmed_config');
    
  const totalOrders = allOrders?.length || 0;
  const totalAmount = allOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const totalCommission = allOrders?.reduce((sum, o) => sum + (o.primary_commission_amount || 0), 0) || 0;
  
  console.log(`  - 总订单数: ${totalOrders} 单`);
  console.log(`  - 总金额: $${totalAmount}`);
  console.log(`  - 总佣金: $${totalCommission}`);
}

checkRealTables().catch(console.error);