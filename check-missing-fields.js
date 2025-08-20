const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkMissingFields() {
  try {
    // 添加缺失的字段
    console.log('========== 为 sales_optimized 表添加缺失字段 ==========');
    
    const fieldsToAdd = [
      { name: 'today_commission', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'today_orders', type: 'INTEGER', default: '0' },
      { name: 'today_amount', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'direct_commission', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'secondary_avg_rate', type: 'DECIMAL(5,4)', default: '0' },
      { name: 'secondary_share_commission', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'secondary_orders_amount', type: 'DECIMAL(10,2)', default: '0' }
    ];
    
    for (const field of fieldsToAdd) {
      const sql = `
        ALTER TABLE sales_optimized 
        ADD COLUMN IF NOT EXISTS ${field.name} ${field.type} DEFAULT ${field.default};
      `;
      
      console.log(`添加字段 ${field.name}...`);
      
      // 注意：Supabase不支持直接执行ALTER TABLE，需要在控制台执行
      console.log('SQL语句：', sql);
    }
    
    console.log('\n请在 Supabase 控制台执行以下SQL语句：');
    console.log('```sql');
    for (const field of fieldsToAdd) {
      console.log(`ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS ${field.name} ${field.type} DEFAULT ${field.default};`);
    }
    console.log('```');
    
    // 同时为 orders_optimized 表添加 total_amount 字段
    console.log('\n========== 为 orders_optimized 表添加缺失字段 ==========');
    console.log('```sql');
    console.log('ALTER TABLE orders_optimized ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;');
    console.log('-- 更新 total_amount 字段的值（从 amount 字段复制）');
    console.log('UPDATE orders_optimized SET total_amount = amount WHERE total_amount IS NULL OR total_amount = 0;');
    console.log('```');
    
  } catch (error) {
    console.error('错误:', error.message);
  }
  
  process.exit(0);
}

checkMissingFields();