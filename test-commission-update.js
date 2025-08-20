require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testCommissionUpdate() {
  console.log('测试佣金率修改功能');
  console.log('='.repeat(50));
  
  // 测试修改fl261247的佣金率从25%改为30%
  const testSalesCode = 'SEC17547252976848697'; // fl261247
  
  // 1. 获取当前数据
  const { data: before } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .single();
    
  console.log('修改前:');
  console.log('  sales_optimized.commission_rate:', before?.commission_rate);
  console.log('  sales_optimized.original_table:', before?.original_table);
  console.log('  sales_optimized.original_id:', before?.original_id);
  
  // 2. 检查原始表
  if (before?.original_table && before?.original_id) {
    const { data: originalBefore } = await supabase
      .from(before.original_table)
      .select('commission_rate')
      .eq('id', before.original_id)
      .single();
      
    console.log(`  ${before.original_table}.commission_rate:`, originalBefore?.commission_rate);
  }
  
  // 3. 模拟修改
  const newRate = 0.30; // 30%
  console.log('\n模拟修改佣金率为30%...');
  
  // 更新sales_optimized
  const { error: updateError } = await supabase
    .from('sales_optimized')
    .update({ 
      commission_rate: newRate,
      updated_at: new Date().toISOString()
    })
    .eq('sales_code', testSalesCode);
    
  if (updateError) {
    console.error('更新失败:', updateError);
    return;
  }
  
  // 更新原始表
  if (before?.original_table && before?.original_id) {
    const { error: syncError } = await supabase
      .from(before.original_table)
      .update({ 
        commission_rate: newRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', before.original_id);
      
    if (syncError) {
      console.error('同步更新失败:', syncError);
    }
  }
  
  // 4. 验证修改结果
  const { data: after } = await supabase
    .from('sales_optimized')
    .select('commission_rate')
    .eq('sales_code', testSalesCode)
    .single();
    
  console.log('\n修改后:');
  console.log('  sales_optimized.commission_rate:', after?.commission_rate);
  
  if (before?.original_table && before?.original_id) {
    const { data: originalAfter } = await supabase
      .from(before.original_table)
      .select('commission_rate')
      .eq('id', before.original_id)
      .single();
      
    console.log(`  ${before.original_table}.commission_rate:`, originalAfter?.commission_rate);
  }
  
  // 5. 恢复原值
  console.log('\n恢复原值25%...');
  await supabase
    .from('sales_optimized')
    .update({ commission_rate: 0.25 })
    .eq('sales_code', testSalesCode);
    
  if (before?.original_table && before?.original_id) {
    await supabase
      .from(before.original_table)
      .update({ commission_rate: 25 }) // 注意：secondary_sales表可能存储的是25而不是0.25
      .eq('id', before.original_id);
  }
  
  console.log('✅ 测试完成！');
}

testCommissionUpdate();