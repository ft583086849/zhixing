const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function debugSalesStats() {
  try {
    const salesCode = 'PRI17547241780648255'; // WML792355703的销售代码
    
    console.log(`========== 调试销售统计: ${salesCode} ==========\n`);
    
    // 1. 查询所有订单
    const { data: allOrders, error: allError } = await supabase
      .from('orders_optimized')
      .select('*')
      .or(`sales_code.eq.${salesCode},parent_sales_code.eq.${salesCode}`);
    
    if (allError) throw allError;
    
    console.log(`该销售的所有订单数: ${allOrders ? allOrders.length : 0}`);
    
    if (allOrders && allOrders.length > 0) {
      console.log('\n订单详情：');
      allOrders.forEach(order => {
        console.log(`  订单${order.id}:`);
        console.log(`    - 销售代码: ${order.sales_code}`);
        console.log(`    - 上级代码: ${order.parent_sales_code}`);
        console.log(`    - 金额: $${order.total_amount || order.amount || 0}`);
        console.log(`    - 佣金: $${order.commission_amount || 0}`);
        console.log(`    - 状态: ${order.status}`);
        console.log(`    - 创建时间: ${order.created_at}`);
      });
    }
    
    // 2. 查询直销订单（parent_sales_code为null）
    const { data: directOrders, error: directError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', salesCode)
      .is('parent_sales_code', null);
    
    console.log(`\n直销订单数（parent_sales_code为null）: ${directOrders ? directOrders.length : 0}`);
    
    // 3. 查询作为一级销售的订单（parent_sales_code等于该销售代码）
    const { data: primaryOrders, error: primaryError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('parent_sales_code', salesCode);
    
    console.log(`作为一级销售的下级订单数: ${primaryOrders ? primaryOrders.length : 0}`);
    
    // 4. 计算中国时区的今日时间范围
    const now = new Date();
    const chinaToday = new Date();
    chinaToday.setUTCHours(16, 0, 0, 0); // UTC 16:00 = 中国时间 00:00
    const prevDay = new Date(chinaToday);
    prevDay.setDate(prevDay.getDate() - 1);
    
    const todayStart = now.getUTCHours() < 16 ? prevDay : chinaToday;
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    console.log('\n今日时间范围（UTC）：');
    console.log(`  开始: ${todayStart.toISOString()}`);
    console.log(`  结束: ${todayEnd.toISOString()}`);
    
    // 5. 查询今日订单
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders_optimized')
      .select('*')
      .or(`sales_code.eq.${salesCode},parent_sales_code.eq.${salesCode}`)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());
    
    console.log(`\n今日订单数: ${todayOrders ? todayOrders.length : 0}`);
    
    if (todayOrders && todayOrders.length > 0) {
      console.log('今日订单详情：');
      todayOrders.forEach(order => {
        const chinaTime = new Date(order.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        console.log(`  订单${order.id}: 金额$${order.total_amount || order.amount || 0}, 创建时间: ${chinaTime}`);
      });
    }
    
    // 6. 检查销售记录
    const { data: salesRecord, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', salesCode)
      .single();
    
    if (salesRecord) {
      console.log('\n当前销售记录中的统计值：');
      console.log(`  - total_orders: ${salesRecord.total_orders}`);
      console.log(`  - total_amount: ${salesRecord.total_amount}`);
      console.log(`  - total_commission: ${salesRecord.total_commission}`);
      console.log(`  - today_orders: ${salesRecord.today_orders}`);
      console.log(`  - today_amount: ${salesRecord.today_amount}`);
      console.log(`  - today_commission: ${salesRecord.today_commission}`);
      console.log(`  - direct_commission: ${salesRecord.direct_commission}`);
    }
    
  } catch (error) {
    console.error('调试失败:', error.message);
  }
  
  process.exit(0);
}

debugSalesStats();