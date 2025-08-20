const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkReminderTables() {
  console.log('🔍 查找销售相关的表和催单字段...\n');
  
  // 查找可能的表
  const possibleTables = [
    'sales_optimized',
    'sales_management', 
    'sales_reminder',
    'sales_statistics',
    'primary_sales',
    'secondary_sales',
    'customers_optimized'
  ];
  
  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error && data) {
        console.log(`✅ 表存在: ${table}`);
        
        if (data[0]) {
          const fields = Object.keys(data[0]);
          
          // 查找催单相关字段
          const reminderFields = fields.filter(key => 
            key.includes('reminder') || 
            key.includes('催') || 
            key.includes('pending') ||
            key.includes('urge') ||
            key.includes('follow')
          );
          
          if (reminderFields.length > 0) {
            console.log(`   催单相关字段: ${reminderFields.join(', ')}`);
            reminderFields.forEach(field => {
              console.log(`     ${field}: ${data[0][field]}`);
            });
          }
          
          // 显示所有字段（如果是销售相关表）
          if (table.includes('sales')) {
            console.log(`   所有字段: ${fields.slice(0, 10).join(', ')}...`);
          }
        }
        console.log();
      }
    } catch (e) {
      // 表不存在，忽略
    }
  }
  
  // 特别检查customers_optimized表
  console.log('📊 检查customers_optimized表的催单字段...');
  const { data: customers } = await supabase
    .from('customers_optimized')
    .select('*')
    .limit(3);
    
  if (customers && customers[0]) {
    const fields = Object.keys(customers[0]);
    console.log('customers_optimized表字段:', fields.join(', '));
    
    // 查找催单相关的客户
    const { data: reminderCustomers } = await supabase
      .from('customers_optimized')
      .select('*')
      .not('reminder_count', 'is', null)
      .limit(3);
      
    if (reminderCustomers && reminderCustomers.length > 0) {
      console.log('\n有催单记录的客户:');
      reminderCustomers.forEach(c => {
        console.log(`  客户${c.id}: 催单次数=${c.reminder_count}, 销售员=${c.sales_code}`);
      });
    }
  }
  
  // 检查sales_optimized表的统计字段
  console.log('\n📊 检查sales_optimized表的统计字段...');
  const { data: salesStats } = await supabase
    .from('sales_optimized')
    .select('*')
    .limit(1);
    
  if (salesStats && salesStats[0]) {
    const statsFields = Object.keys(salesStats[0]).filter(key => 
      key.includes('count') || 
      key.includes('total') || 
      key.includes('reminder') ||
      key.includes('pending')
    );
    
    console.log('统计相关字段:', statsFields.join(', '));
    if (statsFields.length > 0) {
      statsFields.forEach(field => {
        console.log(`  ${field}: ${salesStats[0][field]}`);
      });
    }
  }
}

checkReminderTables();