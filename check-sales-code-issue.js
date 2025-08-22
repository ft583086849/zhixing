const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkSalesCodeIssue() {
  console.log('========== 检查销售代码显示问题 ==========\n');
  
  // 获取一个一级销售的数据
  const { data: primarySales, error } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_type', 'primary')
    .limit(1)
    .single();
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  console.log('一级销售信息：');
  console.log('- 微信名:', primarySales.wechat_name);
  console.log('- 销售代码:', primarySales.sales_code);
  console.log('- 销售类型:', primarySales.sales_type);
  
  // 获取该一级销售的订单
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, customer_wechat')
    .eq('sales_code', primarySales.sales_code)
    .limit(3);
  
  console.log('\n该一级销售的订单：');
  orders?.forEach(order => {
    console.log(`- 订单${order.id}: sales_code=${order.sales_code}`);
    console.log(`  应该显示: ${primarySales.wechat_name}`);
    console.log(`  判断条件: sales_code(${order.sales_code}) === primarySalesStats.sales_code(${primarySales.sales_code})`);
    console.log(`  结果: ${order.sales_code === primarySales.sales_code ? '✅ 匹配，显示微信名' : '❌ 不匹配，显示销售代码'}`);
  });
  
  process.exit(0);
}

checkSalesCodeIssue();