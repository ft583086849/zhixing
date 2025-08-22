const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkCommissionIssue() {
  console.log('========== 检查佣金计算问题 ==========\n');
  
  try {
    // 1. 查看订单391的详细信息
    console.log('1. 查询订单391的信息...');
    const { data: order, error: orderError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 391)
      .single();
    
    if (orderError || !order) {
      console.log('无法找到订单391');
      return;
    }
    
    console.log('订单信息:');
    console.log('  - ID:', order.id);
    console.log('  - 订单号:', order.order_number);
    console.log('  - 销售代码:', order.sales_code);
    console.log('  - 金额:', order.amount);
    console.log('  - 总金额:', order.total_amount);
    console.log('  - 佣金金额:', order.commission_amount);
    console.log('  - 状态:', order.status);
    console.log('  - 配置确认:', order.config_confirmed);
    console.log('  - 创建时间:', order.created_at);
    
    // 2. 查看对应销售的统计
    console.log('\n2. 查询销售统计...');
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', order.sales_code)
      .single();
    
    if (salesError || !sales) {
      console.log('无法找到销售:', order.sales_code);
    } else {
      console.log('销售统计:');
      console.log('  - 销售代码:', sales.sales_code);
      console.log('  - 今日订单:', sales.today_orders);
      console.log('  - 今日金额:', sales.today_amount);
      console.log('  - 今日佣金:', sales.today_commission);
      console.log('  - 总订单数:', sales.total_orders);
      console.log('  - 总金额:', sales.total_amount);
      console.log('  - 总佣金:', sales.total_commission);
      console.log('  - 直接佣金:', sales.direct_commission);
    }
    
    // 3. 分析触发器函数调用
    console.log('\n3. 分析触发器调用参数...');
    console.log('触发器调用 update_single_sales_stats 时传递的参数:');
    console.log('  - p_sales_code:', order.sales_code);
    console.log('  - p_amount:', order.total_amount || order.amount || 0);
    console.log('  - p_commission:', order.commission_amount || 0, '<-- 这个值是', order.commission_amount);
    console.log('  - p_order_time:', order.created_at);
    console.log('  - p_operation: ADD');
    
    // 4. 检查触发器函数源码
    console.log('\n4. 分析问题...');
    if (order.commission_amount === 0 || order.commission_amount === null) {
      console.log('❌ 问题找到：订单的 commission_amount 字段是 0 或 null！');
      console.log('   虽然创建时设置了60，但实际存储的是:', order.commission_amount);
    }
    
    // 5. 手动更新订单佣金并观察
    console.log('\n5. 尝试手动更新订单佣金...');
    const { error: updateError } = await supabase
      .from('orders_optimized')
      .update({ commission_amount: 88.88 })
      .eq('id', 391);
    
    if (!updateError) {
      console.log('✅ 已将订单391的佣金更新为 88.88');
      
      // 等待触发器执行
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 再次查看销售统计
      const { data: updatedSales } = await supabase
        .from('sales_optimized')
        .select('today_commission, total_commission, direct_commission')
        .eq('sales_code', order.sales_code)
        .single();
      
      console.log('\n更新后的销售统计:');
      console.log('  - 今日佣金:', updatedSales?.today_commission);
      console.log('  - 总佣金:', updatedSales?.total_commission);
      console.log('  - 直接佣金:', updatedSales?.direct_commission);
      
      if (updatedSales?.today_commission > (sales?.today_commission || 0)) {
        console.log('\n✅ 佣金统计已更新！说明触发器工作正常。');
        console.log('问题是：订单创建时 commission_amount 没有正确保存。');
      } else {
        console.log('\n❌ 佣金统计仍未更新，可能触发器有其他条件限制。');
      }
    }
    
  } catch (error) {
    console.error('检查过程出错:', error);
  }
  
  console.log('\n========== 检查完成 ==========');
  process.exit(0);
}

checkCommissionIssue();