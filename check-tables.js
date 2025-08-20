const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkTables() {
  console.log('Checking available tables...\n');
  
  // 测试各个表
  const tables = [
    'payment_links',
    'primary_sales', 
    'secondary_sales',
    'sales',
    'orders',
    'admins',
    'overview_stats'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table} - Not found or error`);
      } else {
        console.log(`✅ ${table} - Exists`);
      }
    } catch (e) {
      console.log(`❌ ${table} - Error: ${e.message}`);
    }
  }
}

checkTables();