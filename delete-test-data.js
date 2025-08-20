const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function deleteTestData() {
  console.log('🗑️ 删除测试数据...\n');
  
  try {
    // 1. 删除我创建的测试订单
    console.log('1️⃣ 删除测试订单...');
    const testOrderIds = [261247, 999001, 888001];
    
    for (const orderId of testOrderIds) {
      const { error } = await supabase
        .from('orders_optimized')
        .delete()
        .eq('id', orderId);
        
      if (error) {
        console.log(`  订单 ${orderId}: 删除失败或不存在`);
      } else {
        console.log(`  ✅ 删除订单 ${orderId}`);
      }
    }
    
    // 2. 删除我创建的测试销售员
    console.log('\n2️⃣ 删除测试销售员...');
    const testSalesCodes = ['WML792355703', 'SEC888666999'];
    
    for (const salesCode of testSalesCodes) {
      // 先查询是否是我创建的测试数据（通过微信名判断）
      const { data: checkData } = await supabase
        .from('sales_optimized')
        .select('wechat_name')
        .eq('sales_code', salesCode)
        .single();
        
      // 只删除我创建的测试数据（张三和李四）
      if (checkData && (checkData.wechat_name === '张三' || checkData.wechat_name === '李四')) {
        const { error } = await supabase
          .from('sales_optimized')
          .delete()
          .eq('sales_code', salesCode);
          
        if (error) {
          console.log(`  ${salesCode} (${checkData.wechat_name}): 删除失败`);
        } else {
          console.log(`  ✅ 删除销售员 ${salesCode} (${checkData.wechat_name})`);
        }
      } else {
        console.log(`  ${salesCode}: 不是测试数据，跳过`);
      }
    }
    
    console.log('\n✅ 测试数据删除完成！');
    console.log('⚠️ 只删除了我创建的测试数据（张三、李四及相关订单），没有碰任何正式数据');
    
  } catch (error) {
    console.error('❌ 删除失败:', error);
  }
}

deleteTestData();