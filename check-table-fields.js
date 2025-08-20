const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkTables() {
  try {
    console.log('========== 检查 sales_optimized 表结构 ==========');
    
    // 获取表结构信息
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'sales_optimized' });
    
    if (error) {
      // 如果RPC不存在，尝试查询一条记录看字段
      const { data: sample, error: sampleError } = await supabase
        .from('sales_optimized')
        .select('*')
        .limit(1)
        .single();
      
      if (!sampleError && sample) {
        console.log('sales_optimized 表的字段（从样本数据获取）：');
        Object.keys(sample).forEach(key => {
          console.log(`  - ${key}: ${typeof sample[key]} (值: ${sample[key]})`);
        });
      }
    } else if (columns) {
      console.log('sales_optimized 表的字段：');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    console.log('\n========== 检查 orders_optimized 表中订单381 ==========');
    const { data: order, error: orderError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 381)
      .single();
    
    if (!orderError && order) {
      console.log('订单381的所有字段：');
      Object.keys(order).forEach(key => {
        const value = order[key];
        if (value !== null && value !== undefined) {
          console.log(`  - ${key}: ${value}`);
        }
      });
      
      console.log('\n缺失或为空的字段：');
      Object.keys(order).forEach(key => {
        const value = order[key];
        if (value === null || value === undefined) {
          console.log(`  - ${key}: ${value}`);
        }
      });
    }
    
  } catch (error) {
    console.error('查询错误:', error.message);
  }
  
  process.exit(0);
}

checkTables();