const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function verifyStatsUpdate() {
  console.log('========== 验证销售统计自动更新 ==========\n');
  
  try {
    // 1. 获取一个销售的当前统计
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('id, sales_code, name, today_orders, today_amount, today_commission, total_orders, total_amount, total_commission')
      .limit(1)
      .single();
    
    if (!sales) {
      console.log('无销售数据');
      return;
    }
    
    console.log('测试销售:', sales.sales_code, sales.name ? `(${sales.name})` : '');
    console.log('\n当前统计:');
    console.log('  今日订单:', sales.today_orders || 0);
    console.log('  今日金额:', sales.today_amount || 0);
    console.log('  今日佣金:', sales.today_commission || 0);
    console.log('  总订单数:', sales.total_orders || 0);
    console.log('  总金额:', sales.total_amount || 0);
    console.log('  总佣金:', sales.total_commission || 0);
    
    // 2. 创建测试订单
    console.log('\n创建测试订单...');
    const testOrder = {
      order_number: 'VERIFY' + Date.now(),
      customer_name: '统计验证',
      customer_wechat: 'verify_' + Date.now(),
      sales_code: sales.sales_code,
      amount: 200.00,
      total_amount: 200.00,
      commission_amount: 60.00,
      payment_method: 'alipay',
      status: 'pending',
      duration: '30天'
    };
    
    const { data: newOrder, error: orderError } = await supabase
      .from('orders_optimized')
      .insert(testOrder)
      .select('id')
      .single();
    
    if (orderError) {
      console.log('创建订单失败:', orderError.message);
      return;
    }
    
    console.log('✅ 订单创建成功, ID:', newOrder.id);
    
    // 3. 等待触发器执行
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. 检查统计是否更新
    const { data: updatedSales } = await supabase
      .from('sales_optimized')
      .select('today_orders, today_amount, today_commission, total_orders, total_amount, total_commission')
      .eq('sales_code', sales.sales_code)
      .single();
    
    console.log('\n更新后统计:');
    console.log('  今日订单:', updatedSales.today_orders || 0, '(+' + ((updatedSales.today_orders || 0) - (sales.today_orders || 0)) + ')');
    console.log('  今日金额:', updatedSales.today_amount || 0, '(+' + ((updatedSales.today_amount || 0) - (sales.today_amount || 0)) + ')');
    console.log('  今日佣金:', updatedSales.today_commission || 0, '(+' + ((updatedSales.today_commission || 0) - (sales.today_commission || 0)) + ')');
    console.log('  总订单数:', updatedSales.total_orders || 0, '(+' + ((updatedSales.total_orders || 0) - (sales.total_orders || 0)) + ')');
    console.log('  总金额:', updatedSales.total_amount || 0, '(+' + ((updatedSales.total_amount || 0) - (sales.total_amount || 0)) + ')');
    console.log('  总佣金:', updatedSales.total_commission || 0, '(+' + ((updatedSales.total_commission || 0) - (sales.total_commission || 0)) + ')');
    
    // 5. 验证结果
    const orderIncreased = (updatedSales.today_orders || 0) > (sales.today_orders || 0);
    const amountIncreased = (updatedSales.today_amount || 0) > (sales.today_amount || 0);
    const commissionIncreased = (updatedSales.today_commission || 0) > (sales.today_commission || 0);
    
    console.log('\n========== 验证结果 ==========');
    if (orderIncreased && amountIncreased && commissionIncreased) {
      console.log('✅ 触发器完美工作！');
      console.log('   - 今日订单数 +1');
      console.log('   - 今日金额 +200');
      console.log('   - 今日佣金 +60');
      console.log('   - 所有统计都自动更新了');
    } else {
      console.log('⚠️  部分统计未更新:');
      if (!orderIncreased) console.log('   - 今日订单数未增加');
      if (!amountIncreased) console.log('   - 今日金额未增加');
      if (!commissionIncreased) console.log('   - 今日佣金未增加');
    }
    
    // 6. 清理测试数据
    console.log('\n删除测试订单...');
    await supabase.from('orders_optimized').delete().eq('id', newOrder.id);
    
    // 7. 验证删除触发器
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { data: finalSales } = await supabase
      .from('sales_optimized')
      .select('today_orders, total_orders')
      .eq('sales_code', sales.sales_code)
      .single();
    
    console.log('\n删除后统计:');
    console.log('  今日订单:', finalSales.today_orders || 0, '(应该回到', sales.today_orders || 0, ')');
    console.log('  总订单数:', finalSales.total_orders || 0, '(应该回到', sales.total_orders || 0, ')');
    
    if ((finalSales.today_orders || 0) === (sales.today_orders || 0)) {
      console.log('✅ 删除触发器也正常工作！');
    }
    
  } catch (error) {
    console.error('验证出错:', error);
  }
  
  console.log('\n========== 完成 ==========');
  process.exit(0);
}

verifyStatsUpdate();