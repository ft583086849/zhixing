const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkFields() {
  try {
    // 获取一条订单记录看看有哪些字段
    const { data: order, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 381)
      .single();
    
    if (error) throw error;
    
    console.log('订单381的所有字段：');
    console.log('=====================================');
    Object.keys(order).forEach(key => {
      console.log(`${key}: ${order[key]}`);
    });
    
    console.log('\n\n关键字段分析：');
    console.log('=====================================');
    console.log('销售相关字段：');
    console.log('- sales_code:', order.sales_code);
    console.log('- sales_type:', order.sales_type);
    console.log('- primary_sales_id:', order.primary_sales_id);
    console.log('- link_code:', order.link_code);
    
    // 查询该销售的其他订单
    console.log('\n\n查询该销售的所有订单：');
    console.log('=====================================');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('id, sales_code, sales_type, primary_sales_id, total_amount, commission_amount, created_at')
      .eq('sales_code', order.sales_code);
    
    if (!ordersError && orders) {
      console.log(`找到 ${orders.length} 个订单`);
      orders.forEach(o => {
        console.log(`订单${o.id}: 金额$${o.total_amount}, 佣金$${o.commission_amount}, 类型${o.sales_type}`);
      });
      
      const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const totalCommission = orders.reduce((sum, o) => sum + parseFloat(o.commission_amount || 0), 0);
      console.log(`\n总金额: $${totalAmount}`);
      console.log(`总佣金: $${totalCommission}`);
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  }
  
  process.exit(0);
}

checkFields();