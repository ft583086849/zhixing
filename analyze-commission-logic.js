const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function analyzeCommissionLogic() {
  console.log('========== 分析订单391的佣金计算逻辑 ==========\n');
  
  try {
    // 1. 查看订单391的完整信息
    const { data: order } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 391)
      .single();
    
    console.log('订单391详细信息:');
    console.log('==================');
    console.log('基本信息:');
    console.log('  - ID:', order.id);
    console.log('  - 订单号:', order.order_number);
    console.log('  - 客户:', order.customer_name);
    console.log('  - 状态:', order.status);
    
    console.log('\n销售信息:');
    console.log('  - sales_code:', order.sales_code);
    console.log('  - sales_type:', order.sales_type || 'null (表示直销)');
    console.log('  - primary_sales_id:', order.primary_sales_id);
    console.log('  - secondary_sales_id:', order.secondary_sales_id);
    
    console.log('\n金额信息:');
    console.log('  - amount:', order.amount);
    console.log('  - total_amount:', order.total_amount);
    console.log('  - commission_amount:', order.commission_amount);
    console.log('  - commission_rate:', order.commission_rate);
    
    // 2. 分析触发器的佣金计算
    console.log('\n\n触发器函数 update_sales_statistics 的逻辑:');
    console.log('=============================================');
    console.log('INSERT时触发器会:');
    console.log('1. 获取 v_amount = COALESCE(NEW.total_amount, NEW.amount, 0)');
    console.log('   对于订单391: v_amount = COALESCE(' + order.total_amount + ', ' + order.amount + ', 0) = ' + (order.total_amount || order.amount || 0));
    console.log('\n2. 获取 v_commission = COALESCE(NEW.commission_amount, 0)');
    console.log('   对于订单391: v_commission = COALESCE(' + order.commission_amount + ', 0) = ' + (order.commission_amount || 0));
    console.log('\n3. 调用 update_single_sales_stats 函数更新统计');
    
    console.log('\n\nupdate_single_sales_stats 函数的逻辑:');
    console.log('=====================================');
    console.log('该函数会更新 sales_optimized 表:');
    console.log('  - direct_commission += p_commission (直接佣金)');
    console.log('  - total_commission += p_commission (总佣金)');
    console.log('  - today_commission += p_commission (今日佣金，如果是今天的订单)');
    
    console.log('\n\n问题分析:');
    console.log('=========');
    if (order.total_amount === 0) {
      console.log('❌ 问题1: total_amount = 0');
      console.log('   虽然 amount = ' + order.amount + '，但触发器优先使用 total_amount');
      console.log('   导致统计的订单金额是 0 而不是 ' + order.amount);
    }
    
    console.log('\n✅ 佣金字段正常: commission_amount = ' + order.commission_amount);
    console.log('   这个值应该会正确加到佣金统计中');
    
    // 3. 查看对应销售的当前统计
    console.log('\n\n查看销售 ' + order.sales_code + ' 的当前统计:');
    console.log('==========================================');
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', order.sales_code)
      .single();
    
    if (sales) {
      console.log('订单统计:');
      console.log('  - total_orders:', sales.total_orders);
      console.log('  - total_direct_orders:', sales.total_direct_orders);
      console.log('  - today_orders:', sales.today_orders);
      
      console.log('\n金额统计:');
      console.log('  - total_amount:', sales.total_amount);
      console.log('  - total_direct_amount:', sales.total_direct_amount);
      console.log('  - today_amount:', sales.today_amount);
      
      console.log('\n佣金统计:');
      console.log('  - total_commission:', sales.total_commission);
      console.log('  - direct_commission:', sales.direct_commission);
      console.log('  - today_commission:', sales.today_commission);
    }
    
    // 4. 手动触发一次更新看看效果
    console.log('\n\n测试：更新订单391的一个字段触发UPDATE触发器...');
    const { error: updateError } = await supabase
      .from('orders_optimized')
      .update({ 
        total_amount: order.amount  // 修正 total_amount
      })
      .eq('id', 391);
    
    if (!updateError) {
      console.log('✅ 已将 total_amount 从 0 更新为 ' + order.amount);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: updatedSales } = await supabase
        .from('sales_optimized')
        .select('today_amount, total_amount, today_commission, total_commission')
        .eq('sales_code', order.sales_code)
        .single();
      
      console.log('\n更新后的统计:');
      console.log('  - today_amount:', updatedSales?.today_amount, '(变化:', (updatedSales?.today_amount || 0) - (sales?.today_amount || 0), ')');
      console.log('  - total_amount:', updatedSales?.total_amount, '(变化:', (updatedSales?.total_amount || 0) - (sales?.total_amount || 0), ')');
      console.log('  - today_commission:', updatedSales?.today_commission, '(变化:', (updatedSales?.today_commission || 0) - (sales?.today_commission || 0), ')');
      console.log('  - total_commission:', updatedSales?.total_commission, '(变化:', (updatedSales?.total_commission || 0) - (sales?.total_commission || 0), ')');
    }
    
  } catch (error) {
    console.error('分析出错:', error);
  }
  
  console.log('\n========== 分析完成 ==========');
  process.exit(0);
}

analyzeCommissionLogic();