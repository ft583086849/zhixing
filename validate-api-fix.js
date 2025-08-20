
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function validateFix() {
  console.log('🧪 验证API修复效果...');
  
  try {
    // 测试修复后的API调用
    const { data: primarySales } = await supabase
      .from('sales_optimized')
      .select('*')
      .is('parent_sales_code', null)
      .limit(1);
    
    if (primarySales && primarySales.length > 0) {
      const testPrimary = primarySales[0];
      console.log('✅ 找到测试一级销售:', testPrimary.sales_code);
      
      // 使用正确的逻辑查询二级销售
      const { data: secondarySales, error } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('parent_sales_code', testPrimary.sales_code);
      
      if (error) {
        console.log('❌ 查询二级销售失败:', error.message);
      } else {
        console.log('✅ 查询二级销售成功，数量:', secondarySales?.length || 0);
        
        if (secondarySales && secondarySales.length > 0) {
          console.log('二级销售列表:');
          secondarySales.forEach(s => {
            console.log(`- ${s.sales_code} (${s.wechat_name})`);
          });
        } else {
          console.log('ℹ️  当前没有二级销售数据，这是正常现象');
        }
      }
    }
    
    console.log('\n✅ API修复验证完成');
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

validateFix();
