const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function quickVerify() {
  console.log('========== 快速验证触发器修复 ==========\n');
  
  try {
    // 1. 先查看有哪些销售
    console.log('查询现有销售...');
    const { data: salesList, error: listError } = await supabase
      .from('sales_optimized')
      .select('id, sales_code, wechat_id')
      .limit(5);
    
    if (listError) {
      console.log('查询销售列表错误:', listError);
      return;
    }
    
    console.log('找到销售数量:', salesList?.length || 0);
    if (salesList && salesList.length > 0) {
      console.log('销售列表:');
      salesList.forEach(s => {
        console.log(`  - ${s.sales_code} (${s.wechat_id || '无微信'})`);
      });
    }
    
    // 2. 直接测试一个简单的订单插入
    console.log('\n\n测试方案：创建一个最简单的订单...');
    
    const testOrder = {
      customer_name: '触发器测试',
      customer_wechat: 'trigger_test_' + Date.now(),
      sales_code: salesList && salesList[0] ? salesList[0].sales_code : 'TEST001',
      amount: 50.00,
      total_amount: 50.00,
      commission_amount: 15.00,
      product_type: '月卡',
      duration: '30天',
      payment_method: 'alipay',
      status: 'pending',
      sales_type: 'direct'
    };
    
    console.log('订单数据:', testOrder);
    console.log('\n插入订单...');
    
    const { data: newOrder, error: insertError } = await supabase
      .from('orders_optimized')
      .insert(testOrder)
      .select()
      .single();
    
    if (insertError) {
      console.log('\n❌ 插入失败！');
      console.log('错误信息:', insertError.message);
      console.log('错误代码:', insertError.code);
      
      if (insertError.message.includes('update_single_sales_stats')) {
        console.log('\n⚠️  函数问题仍然存在！');
        console.log('说明 fix-function-types.sql 还没有执行');
        console.log('\n请在 Supabase SQL Editor 中执行以下步骤：');
        console.log('1. 打开 https://supabase.com/dashboard/project/itvmeamoqthfqtkpubdv/sql');
        console.log('2. 复制 fix-function-types.sql 的内容');
        console.log('3. 粘贴到 SQL Editor');
        console.log('4. 点击 Run 执行');
      }
    } else {
      console.log('\n✅ 订单创建成功！');
      console.log('订单ID:', newOrder.id);
      console.log('\n这说明触发器已经正常工作了！');
      
      // 删除测试订单
      console.log('\n清理测试数据...');
      await supabase
        .from('orders_optimized')
        .delete()
        .eq('id', newOrder.id);
      console.log('✅ 测试订单已删除');
    }
    
  } catch (error) {
    console.error('验证出错:', error);
  }
  
  console.log('\n========== 验证结束 ==========');
  process.exit(0);
}

quickVerify();