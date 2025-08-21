const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function verifyTrigger() {
  console.log('========== 验证触发器修复状态 ==========\n');
  
  try {
    // 创建一个简单的测试订单
    const testOrder = {
      customer_name: '触发器验证',
      customer_wechat: 'verify_' + Date.now(),
      sales_code: 'ADMIN',  // 使用一个固定的销售代码
      amount: 100.00,
      total_amount: 100.00,
      commission_amount: 30.00,
      product_type: '月卡',
      duration: '30天',
      payment_method: 'alipay',
      status: 'pending',
      sales_type: 'direct'
    };
    
    console.log('创建测试订单...');
    const { data: newOrder, error: insertError } = await supabase
      .from('orders_optimized')
      .insert(testOrder)
      .select('id')
      .single();
    
    if (insertError) {
      console.log('\n❌ 触发器错误仍然存在！');
      console.log('错误:', insertError.message);
      
      if (insertError.message.includes('update_single_sales_stats')) {
        console.log('\n问题: 函数签名不匹配');
        console.log('\n解决方案:');
        console.log('1. 打开 Supabase SQL Editor');
        console.log('2. 复制 fix-function-types.sql 的全部内容');
        console.log('3. 在 SQL Editor 中执行');
        console.log('4. 确保执行成功后再运行此验证脚本');
      }
      return;
    }
    
    console.log('✅ 触发器已修复！订单创建成功');
    console.log('订单ID:', newOrder.id);
    
    // 清理测试数据
    console.log('\n清理测试数据...');
    await supabase
      .from('orders_optimized')
      .delete()
      .eq('id', newOrder.id);
    
    console.log('✅ 测试完成，触发器工作正常');
    
    // 检查统计更新
    console.log('\n检查销售统计是否自动更新...');
    const { data: stats } = await supabase
      .from('sales_optimized')
      .select('sales_code, today_orders, today_amount, today_commission')
      .eq('sales_code', 'ADMIN')
      .single();
    
    if (stats) {
      console.log('销售统计已更新:');
      console.log('- 今日订单:', stats.today_orders || 0);
      console.log('- 今日金额:', stats.today_amount || 0);
      console.log('- 今日佣金:', stats.today_commission || 0);
    }
    
  } catch (error) {
    console.error('验证过程出错:', error);
  }
  
  console.log('\n========== 验证完成 ==========');
  process.exit(0);
}

verifyTrigger();