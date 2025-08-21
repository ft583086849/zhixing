const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkOrderTable() {
  console.log('========== 检查 orders_optimized 表结构 ==========\n');
  
  // 查询现有订单看有哪些字段
  const { data, error } = await supabase
    .from('orders_optimized')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('查询错误:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('表中现有字段:');
    Object.keys(data[0]).forEach(key => {
      const value = data[0][key];
      const type = value === null ? 'null' : typeof value;
      console.log(`  - ${key}: ${type} (示例值: ${JSON.stringify(value)?.substring(0, 50)})`);
    });
    
    console.log('\n\n创建符合表结构的测试订单...');
    
    // 基于实际字段创建测试订单
    const testOrder = {
      order_number: 'TEST' + Date.now(),  // 添加必需的订单号
      customer_name: '触发器测试',
      customer_wechat: 'test_' + Date.now(),
      sales_code: data[0].sales_code || 'TEST',
      amount: 100.00,
      payment_method: 'alipay',
      status: 'pending'
    };
    
    // 添加其他必要字段
    if ('total_amount' in data[0]) testOrder.total_amount = 100.00;
    if ('commission_amount' in data[0]) testOrder.commission_amount = 30.00;
    if ('sales_type' in data[0]) testOrder.sales_type = null;  // 先用 null 避免约束错误
    if ('duration' in data[0]) testOrder.duration = '30天';
    
    console.log('测试订单数据:', testOrder);
    
    const { data: newOrder, error: insertError } = await supabase
      .from('orders_optimized')
      .insert(testOrder)
      .select('id')
      .single();
    
    if (insertError) {
      console.log('\n❌ 插入失败!');
      console.log('错误:', insertError.message);
      
      if (insertError.message.includes('update_single_sales_stats')) {
        console.log('\n⚠️ 这是触发器函数错误！');
        console.log('请在 Supabase SQL Editor 执行 fix-function-types.sql');
      }
    } else {
      console.log('\n✅ 订单创建成功！ID:', newOrder.id);
      console.log('说明触发器已经修复');
      
      // 删除测试订单
      await supabase.from('orders_optimized').delete().eq('id', newOrder.id);
      console.log('测试订单已删除');
    }
  } else {
    console.log('表中没有数据，无法确定字段结构');
  }
  
  process.exit(0);
}

checkOrderTable();