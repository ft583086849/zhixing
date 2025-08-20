const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkTableStructure() {
  console.log('🔍 检查orders_optimized表结构');
  console.log('='.repeat(60));
  
  try {
    // 获取一条记录来查看表结构
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('查询失败:', error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('\n表字段列表:');
      columns.forEach(col => {
        if (col.includes('remind')) {
          console.log('   ✅', col);
        } else {
          console.log('   -', col);
        }
      });
      
      const hasIsReminded = columns.includes('is_reminded');
      const hasRemindedAt = columns.includes('reminded_at');
      
      console.log('\n字段检查结果:');
      console.log('   is_reminded字段:', hasIsReminded ? '✅ 存在' : '❌ 不存在');
      console.log('   reminded_at字段:', hasRemindedAt ? '✅ 存在' : '❌ 不存在');
      
      if (!hasIsReminded || !hasRemindedAt) {
        console.log('\n⚠️ 需要添加缺失的字段！');
        console.log('\n建议执行以下SQL添加字段:');
        if (!hasIsReminded) {
          console.log("ALTER TABLE orders_optimized ADD COLUMN is_reminded BOOLEAN DEFAULT false;");
        }
        if (!hasRemindedAt) {
          console.log("ALTER TABLE orders_optimized ADD COLUMN reminded_at TIMESTAMP WITH TIME ZONE;");
        }
      }
    } else {
      console.log('表中没有数据');
    }
    
    // 尝试更新一条测试记录
    console.log('\n测试更新操作...');
    const { data: testData, error: testError } = await supabase
      .from('orders_optimized')
      .select('id')
      .limit(1)
      .single();
      
    if (testData) {
      const { error: updateError } = await supabase
        .from('orders_optimized')
        .update({ 
          is_reminded: false,
          reminded_at: null
        })
        .eq('id', testData.id);
        
      if (updateError) {
        console.log('❌ 更新失败:', updateError.message);
        console.log('   错误代码:', updateError.code);
        console.log('   错误详情:', JSON.stringify(updateError, null, 2));
      } else {
        console.log('✅ 更新测试成功，字段存在且可用');
      }
    }
    
  } catch (err) {
    console.error('检查过程出错:', err);
  }
}

checkTableStructure().catch(console.error);