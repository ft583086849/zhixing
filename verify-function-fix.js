const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function verifyFunctionFix() {
  console.log('========== 验证函数修复情况 ==========\n');
  
  try {
    // 1. 测试创建一个新订单，看是否会触发错误
    console.log('步骤1: 创建测试订单，验证触发器是否正常工作...\n');
    
    // 先获取一个有效的销售代码
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_id')
      .limit(1)
      .single();
    
    if (salesError || !sales) {
      console.log('❌ 无法获取销售信息进行测试');
      return;
    }
    
    console.log(`使用销售代码: ${sales.sales_code} (${sales.wechat_id})`);
    
    // 记录当前的统计数据
    const { data: statsBefore } = await supabase
      .from('sales_optimized')
      .select('today_orders, today_amount, today_commission, total_orders, total_amount, total_commission')
      .eq('sales_code', sales.sales_code)
      .single();
    
    console.log('\n修改前的统计数据:');
    console.log('今日订单数:', statsBefore?.today_orders || 0);
    console.log('今日金额:', statsBefore?.today_amount || 0);
    console.log('今日佣金:', statsBefore?.today_commission || 0);
    console.log('总订单数:', statsBefore?.total_orders || 0);
    console.log('总金额:', statsBefore?.total_amount || 0);
    console.log('总佣金:', statsBefore?.total_commission || 0);
    
    // 创建测试订单
    const testOrder = {
      customer_name: '测试客户-验证触发器',
      customer_wechat: 'test_trigger_verify',
      sales_code: sales.sales_code,
      amount: 100.00,
      total_amount: 100.00,
      commission_amount: 30.00,
      product_type: '月卡',
      duration: '30天',
      payment_method: 'alipay',
      status: 'pending',
      sales_type: 'direct',
      created_at: new Date().toISOString()
    };
    
    console.log('\n创建测试订单...');
    const { data: newOrder, error: orderError } = await supabase
      .from('orders_optimized')
      .insert(testOrder)
      .select()
      .single();
    
    if (orderError) {
      console.log('❌ 创建订单时出错:', orderError.message);
      if (orderError.message.includes('update_single_sales_stats')) {
        console.log('\n⚠️  函数错误仍然存在！');
        console.log('错误类型:', orderError.code);
        console.log('请确认已在 Supabase SQL Editor 中执行了 fix-function-types.sql');
      }
      return;
    }
    
    console.log('✅ 订单创建成功, ID:', newOrder.id);
    
    // 等待一下让触发器执行
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 检查统计是否更新
    const { data: statsAfter } = await supabase
      .from('sales_optimized')
      .select('today_orders, today_amount, today_commission, total_orders, total_amount, total_commission')
      .eq('sales_code', sales.sales_code)
      .single();
    
    console.log('\n修改后的统计数据:');
    console.log('今日订单数:', statsAfter?.today_orders || 0, '(变化:', (statsAfter?.today_orders || 0) - (statsBefore?.today_orders || 0), ')');
    console.log('今日金额:', statsAfter?.today_amount || 0, '(变化:', (statsAfter?.today_amount || 0) - (statsBefore?.today_amount || 0), ')');
    console.log('今日佣金:', statsAfter?.today_commission || 0, '(变化:', (statsAfter?.today_commission || 0) - (statsBefore?.today_commission || 0), ')');
    console.log('总订单数:', statsAfter?.total_orders || 0, '(变化:', (statsAfter?.total_orders || 0) - (statsBefore?.total_orders || 0), ')');
    console.log('总金额:', statsAfter?.total_amount || 0, '(变化:', (statsAfter?.total_amount || 0) - (statsBefore?.total_amount || 0), ')');
    console.log('总佣金:', statsAfter?.total_commission || 0, '(变化:', (statsAfter?.total_commission || 0) - (statsBefore?.total_commission || 0), ')');
    
    // 判断是否成功
    const todayOrdersChanged = (statsAfter?.today_orders || 0) > (statsBefore?.today_orders || 0);
    const todayAmountChanged = (statsAfter?.today_amount || 0) > (statsBefore?.today_amount || 0);
    const totalOrdersChanged = (statsAfter?.total_orders || 0) > (statsBefore?.total_orders || 0);
    
    console.log('\n========== 验证结果 ==========\n');
    
    if (todayOrdersChanged && todayAmountChanged && totalOrdersChanged) {
      console.log('✅ 触发器工作正常！');
      console.log('   - 今日统计已自动更新');
      console.log('   - 总计统计已自动更新');
      console.log('   - 函数参数类型问题已解决');
    } else {
      console.log('⚠️  触发器可能未正常工作');
      if (!todayOrdersChanged) console.log('   - 今日订单数未更新');
      if (!todayAmountChanged) console.log('   - 今日金额未更新');
      if (!totalOrdersChanged) console.log('   - 总订单数未更新');
    }
    
    // 清理测试数据
    console.log('\n清理测试订单...');
    const { error: deleteError } = await supabase
      .from('orders_optimized')
      .delete()
      .eq('id', newOrder.id);
    
    if (!deleteError) {
      console.log('✅ 测试订单已删除');
      
      // 再次检查删除后的统计
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: statsAfterDelete } = await supabase
        .from('sales_optimized')
        .select('today_orders, today_amount, total_orders, total_amount')
        .eq('sales_code', sales.sales_code)
        .single();
      
      console.log('\n删除测试订单后的统计:');
      console.log('今日订单数:', statsAfterDelete?.today_orders || 0, '(应该恢复到:', statsBefore?.today_orders || 0, ')');
      console.log('总订单数:', statsAfterDelete?.total_orders || 0, '(应该恢复到:', statsBefore?.total_orders || 0, ')');
      
      if ((statsAfterDelete?.today_orders || 0) === (statsBefore?.today_orders || 0) &&
          (statsAfterDelete?.total_orders || 0) === (statsBefore?.total_orders || 0)) {
        console.log('✅ 删除触发器也正常工作！');
      }
    }
    
  } catch (error) {
    console.error('验证过程出错:', error.message);
    console.log('\n请检查:');
    console.log('1. 是否已在 Supabase SQL Editor 中执行了 fix-function-types.sql');
    console.log('2. 是否有权限创建和删除订单');
  }
  
  console.log('\n========== 验证完成 ==========');
  process.exit(0);
}

verifyFunctionFix();