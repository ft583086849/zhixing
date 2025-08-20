const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkRealFields() {
  try {
    console.log('========== 检查 orders_optimized 表的实际字段 ==========\n');
    
    // 获取一条记录看看有哪些字段
    const { data: sample, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(3);
    
    if (error) throw error;
    
    if (sample && sample.length > 0) {
      console.log('orders_optimized 表的所有字段：');
      console.log('=====================================');
      const fields = Object.keys(sample[0]);
      fields.forEach(field => {
        console.log(`- ${field}`);
      });
      
      console.log('\n销售相关字段的实际值（前3条记录）：');
      console.log('=====================================');
      sample.forEach((order, index) => {
        console.log(`\n订单 ${index + 1} (ID: ${order.id}):`);
        console.log(`  - sales_code: ${order.sales_code}`);
        console.log(`  - sales_type: ${order.sales_type}`);
        console.log(`  - primary_sales_id: ${order.primary_sales_id}`);
        console.log(`  - secondary_sales_id: ${order.secondary_sales_id}`);
        console.log(`  - link_code: ${order.link_code}`);
        
        // 检查是否有 parent_sales_code 字段
        if ('parent_sales_code' in order) {
          console.log(`  - parent_sales_code: ${order.parent_sales_code}`);
        } else {
          console.log(`  - parent_sales_code: [字段不存在]`);
        }
      });
      
      // 分析销售关系
      console.log('\n\n销售关系分析：');
      console.log('=====================================');
      
      // 查询一级销售的订单
      const { data: primaryOrders } = await supabase
        .from('orders_optimized')
        .select('id, sales_code, sales_type, primary_sales_id, secondary_sales_id')
        .eq('sales_type', 'primary')
        .limit(2);
      
      if (primaryOrders && primaryOrders.length > 0) {
        console.log('\n一级销售订单示例：');
        primaryOrders.forEach(order => {
          console.log(`  订单${order.id}: sales_code=${order.sales_code}, primary_sales_id=${order.primary_sales_id}`);
        });
      }
      
      // 查询二级销售的订单
      const { data: secondaryOrders } = await supabase
        .from('orders_optimized')
        .select('id, sales_code, sales_type, primary_sales_id, secondary_sales_id')
        .eq('sales_type', 'secondary')
        .limit(2);
      
      if (secondaryOrders && secondaryOrders.length > 0) {
        console.log('\n二级销售订单示例：');
        secondaryOrders.forEach(order => {
          console.log(`  订单${order.id}: sales_code=${order.sales_code}, primary_sales_id=${order.primary_sales_id}, secondary_sales_id=${order.secondary_sales_id}`);
        });
      }
      
      // 查询有 primary_sales_id 的订单
      const { data: withPrimaryId, count } = await supabase
        .from('orders_optimized')
        .select('id', { count: 'exact' })
        .not('primary_sales_id', 'is', null);
      
      console.log(`\n有 primary_sales_id 的订单数: ${count}`);
      
      // 分析如何判断订单归属
      console.log('\n\n订单归属判断逻辑：');
      console.log('=====================================');
      console.log('根据代码分析：');
      console.log('1. sales_type 字段标识销售类型（primary/secondary）');
      console.log('2. sales_code 是销售代码');
      console.log('3. primary_sales_id 可能指向一级销售的ID');
      console.log('4. secondary_sales_id 可能指向二级销售的ID');
      console.log('5. 没有 parent_sales_code 字段');
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  }
  
  process.exit(0);
}

checkRealFields();