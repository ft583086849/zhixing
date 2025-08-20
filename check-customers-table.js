const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkCustomersTable() {
  console.log('📊 检查customers_optimized表...\n');
  
  // 1. 尝试查询一条记录
  const { data, error } = await supabase
    .from('customers_optimized')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('❌ customers_optimized表查询失败:', error.message);
    console.log('\n看起来customers_optimized表不存在或没有权限访问');
    
    // 2. 检查是否有customers表
    console.log('\n📊 尝试查询customers表...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
      
    if (customersError) {
      console.log('❌ customers表也查询失败:', customersError.message);
    } else {
      console.log('✅ customers表存在');
      if (customersData && customersData[0]) {
        console.log('字段列表:', Object.keys(customersData[0]));
      }
    }
  } else {
    console.log('✅ customers_optimized表存在');
    if (data && data[0]) {
      console.log('字段列表:', Object.keys(data[0]));
      
      // 检查关键字段
      const keyFields = ['sales_code', 'sales_wechat_name', 'reminder_suggestion', 'expiry_time'];
      console.log('\n关键字段检查:');
      keyFields.forEach(field => {
        if (data[0].hasOwnProperty(field)) {
          console.log(`  ✅ ${field}: 存在`);
        } else {
          console.log(`  ❌ ${field}: 不存在`);
        }
      });
    } else {
      console.log('表是空的');
    }
  }
}

checkCustomersTable();
