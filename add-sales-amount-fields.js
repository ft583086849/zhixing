const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function updateOverviewStatsWithAmounts() {
  console.log('更新overview_stats表，添加销售业绩金额...');
  
  try {
    // 获取所有订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_status', 'paid');

    if (ordersError) throw ordersError;
    
    console.log(`找到 ${orders.length} 个已支付订单`);

    // 计算销售业绩
    const primarySalesAmounts = new Map();
    const linkedSecondarySalesAmounts = new Map();
    const independentSalesAmounts = new Map();

    orders.forEach(order => {
      const amount = order.amount || order.actual_payment_amount || 0;
      
      if (order.sales_type === 'primary' && order.primary_sales_id) {
        if (!primarySalesAmounts.has(order.primary_sales_id)) {
          primarySalesAmounts.set(order.primary_sales_id, 0);
        }
        primarySalesAmounts.set(order.primary_sales_id, 
          primarySalesAmounts.get(order.primary_sales_id) + amount);
      } else if (order.sales_type === 'secondary' && order.secondary_sales_id) {
        if (order.primary_sales_id) {
          // 有上级的二级销售
          if (!linkedSecondarySalesAmounts.has(order.secondary_sales_id)) {
            linkedSecondarySalesAmounts.set(order.secondary_sales_id, 0);
          }
          linkedSecondarySalesAmounts.set(order.secondary_sales_id,
            linkedSecondarySalesAmounts.get(order.secondary_sales_id) + amount);
        } else {
          // 独立销售
          if (!independentSalesAmounts.has(order.secondary_sales_id)) {
            independentSalesAmounts.set(order.secondary_sales_id, 0);
          }
          independentSalesAmounts.set(order.secondary_sales_id,
            independentSalesAmounts.get(order.secondary_sales_id) + amount);
        }
      }
    });

    const primaryTotal = Array.from(primarySalesAmounts.values()).reduce((sum, amt) => sum + amt, 0);
    const linkedTotal = Array.from(linkedSecondarySalesAmounts.values()).reduce((sum, amt) => sum + amt, 0);
    const independentTotal = Array.from(independentSalesAmounts.values()).reduce((sum, amt) => sum + amt, 0);

    console.log('销售业绩统计:');
    console.log('- 一级销售总业绩:', primaryTotal);
    console.log('- 二级销售总业绩:', linkedTotal);
    console.log('- 独立销售总业绩:', independentTotal);

    // 更新overview_stats表
    const { data: currentStats, error: fetchError } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();

    if (fetchError) {
      console.error('获取当前统计失败:', fetchError);
      return;
    }

    // 构建更新数据
    const updateData = {
      ...currentStats,
      primary_sales_amount: primaryTotal,
      linked_secondary_sales_amount: linkedTotal,
      independent_sales_amount: independentTotal,
      last_calculated_at: new Date().toISOString()
    };

    // 删除只读字段
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    // 更新记录
    const { error: updateError } = await supabase
      .from('overview_stats')
      .update(updateData)
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all');

    if (updateError) {
      console.error('更新失败:', updateError);
      // 如果字段不存在，尝试不更新这些字段
      console.log('尝试不更新销售金额字段...');
      
      delete updateData.primary_sales_amount;
      delete updateData.linked_secondary_sales_amount;
      delete updateData.independent_sales_amount;
      
      const { error: retryError } = await supabase
        .from('overview_stats')
        .update(updateData)
        .eq('stat_type', 'realtime')
        .eq('stat_period', 'all');
      
      if (retryError) {
        console.error('重试更新失败:', retryError);
      } else {
        console.log('✅ 更新成功（不包含销售金额字段）');
        console.log('注意：数据库表可能不支持销售金额字段，但API会返回0');
      }
    } else {
      console.log('✅ 成功更新overview_stats表');
    }

    // 验证更新
    const { data: verifyData, error: verifyError } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();

    if (!verifyError) {
      console.log('验证后的数据:', {
        primary_sales_count: verifyData.primary_sales_count,
        secondary_sales_count: verifyData.secondary_sales_count,
        independent_sales_count: verifyData.independent_sales_count,
        primary_sales_amount: verifyData.primary_sales_amount || '(字段不存在)',
        linked_secondary_sales_amount: verifyData.linked_secondary_sales_amount || '(字段不存在)',
        independent_sales_amount: verifyData.independent_sales_amount || '(字段不存在)'
      });
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

updateOverviewStatsWithAmounts();