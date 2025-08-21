const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function testTriggerRealtime() {
  try {
    console.log('========== 测试触发器实时更新 ==========\n');
    
    // 1. 选择一个测试销售员
    const testSalesCode = 'PRI17556178888309999'; // 使用一个测试销售代码
    
    // 查看当前统计
    const { data: beforeStats, error: beforeError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', testSalesCode)
      .single();
    
    if (beforeError || !beforeStats) {
      console.log('使用第一个可用的销售员进行测试...');
      const { data: firstSales } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_type', 'primary')
        .limit(1)
        .single();
      
      if (firstSales) {
        testSalesCode = firstSales.sales_code;
        console.log(`使用销售员: ${firstSales.wechat_name} (${testSalesCode})\n`);
        
        console.log('当前统计：');
        console.log('- 今日订单数:', firstSales.today_orders || 0);
        console.log('- 今日金额:', firstSales.today_amount || 0);
        console.log('- 今日佣金:', firstSales.today_commission || 0);
        console.log('- 总订单数:', firstSales.total_orders || 0);
        console.log('- 总佣金:', firstSales.total_commission || 0);
      }
    } else {
      console.log(`测试销售员: ${beforeStats.wechat_name} (${testSalesCode})\n`);
      console.log('触发器执行前的统计：');
      console.log('- 今日订单数:', beforeStats.today_orders || 0);
      console.log('- 今日金额:', beforeStats.today_amount || 0);
      console.log('- 今日佣金:', beforeStats.today_commission || 0);
      console.log('- 总订单数:', beforeStats.total_orders || 0);
      console.log('- 总佣金:', beforeStats.total_commission || 0);
    }
    
    // 2. 创建一个测试订单
    console.log('\n创建测试订单...');
    const testOrder = {
      customer_wechat: 'test_customer_' + Date.now(),
      product_type: '年度会员',
      duration: '365天',
      amount: 999,
      total_amount: 999,
      actual_payment_amount: 999,
      payment_method: 'alipay',
      sales_code: testSalesCode,
      sales_type: 'primary',
      status: 'confirmed_config',
      commission_rate: 0.4,
      commission_amount: 399.6,
      link_code: 'TEST' + Date.now(),
      created_at: new Date().toISOString()
    };
    
    const { data: newOrder, error: orderError } = await supabase
      .from('orders_optimized')
      .insert([testOrder])
      .select()
      .single();
    
    if (orderError) {
      console.error('创建订单失败:', orderError);
      return;
    }
    
    console.log(`✅ 订单创建成功! ID: ${newOrder.id}`);
    console.log(`   金额: $${newOrder.total_amount}`);
    console.log(`   佣金: $${newOrder.commission_amount}`);
    
    // 3. 立即查看统计是否更新
    console.log('\n等待1秒后检查统计更新...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: afterStats, error: afterError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', testSalesCode)
      .single();
    
    if (afterError) {
      console.error('查询失败:', afterError);
      return;
    }
    
    console.log('\n触发器执行后的统计：');
    console.log('- 今日订单数:', afterStats.today_orders || 0, 
      (afterStats.today_orders > (beforeStats?.today_orders || 0) ? '✅ 已增加' : '❌ 未更新'));
    console.log('- 今日金额:', afterStats.today_amount || 0,
      (afterStats.today_amount > (beforeStats?.today_amount || 0) ? '✅ 已增加' : '❌ 未更新'));
    console.log('- 今日佣金:', afterStats.today_commission || 0,
      (afterStats.today_commission > (beforeStats?.today_commission || 0) ? '✅ 已增加' : '❌ 未更新'));
    console.log('- 总订单数:', afterStats.total_orders || 0,
      (afterStats.total_orders > (beforeStats?.total_orders || 0) ? '✅ 已增加' : '❌ 未更新'));
    console.log('- 总佣金:', afterStats.total_commission || 0,
      (afterStats.total_commission > (beforeStats?.total_commission || 0) ? '✅ 已增加' : '❌ 未更新'));
    
    // 4. 判断触发器是否生效
    console.log('\n========== 测试结果 ==========');
    if (afterStats.today_orders > (beforeStats?.today_orders || 0) && 
        afterStats.today_commission > (beforeStats?.today_commission || 0)) {
      console.log('✅ 触发器正常工作！今日佣金实时更新成功！');
      console.log('📊 新订单已自动更新到销售统计中');
    } else {
      console.log('❌ 触发器未生效，统计没有自动更新');
      console.log('📌 请确认 create-sales-stats-trigger.sql 已正确执行');
      console.log('📌 或者手动运行 update-sales-stats-correct.js 更新统计');
    }
    
    // 5. 清理测试订单（可选）
    console.log('\n清理测试订单...');
    const { error: deleteError } = await supabase
      .from('orders_optimized')
      .delete()
      .eq('id', newOrder.id);
    
    if (!deleteError) {
      console.log('✅ 测试订单已删除');
      
      // 再次检查统计是否回滚
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: finalStats } = await supabase
        .from('sales_optimized')
        .select('today_orders, today_commission')
        .eq('sales_code', testSalesCode)
        .single();
      
      if (finalStats) {
        console.log('\n删除订单后的统计：');
        console.log('- 今日订单数:', finalStats.today_orders || 0);
        console.log('- 今日佣金:', finalStats.today_commission || 0);
        
        if (finalStats.today_orders === (beforeStats?.today_orders || 0)) {
          console.log('✅ 删除触发器也正常工作，统计已回滚');
        }
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  process.exit(0);
}

testTriggerRealtime();