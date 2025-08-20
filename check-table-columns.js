const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkColumns() {
  // 尝试插入一个最小的测试记录
  const testOrder = {
    id: 'test_' + Date.now(),
    sales_code: 'TEST',
    amount: 0
  };
  
  const { data, error } = await supabase
    .from('orders_optimized')
    .insert(testOrder)
    .select();
    
  if (error) {
    console.log('插入测试记录失败，错误信息可能包含字段信息:', error);
  } else {
    console.log('插入成功，返回数据:', data);
    // 删除测试记录
    await supabase.from('orders_optimized').delete().eq('id', testOrder.id);
  }
  
  // 获取一条记录看看有哪些字段
  const { data: sample } = await supabase
    .from('orders_optimized')
    .select('*')
    .limit(1);
    
  if (sample && sample[0]) {
    console.log('\n表中的字段:');
    console.log(Object.keys(sample[0]));
  }
}

checkColumns();
