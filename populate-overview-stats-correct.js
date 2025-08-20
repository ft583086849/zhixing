const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function populateOverviewStats() {
  console.log('正在填充overview_stats表数据...');
  
  try {
    // 1. 获取所有订单数据
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) throw ordersError;
    console.log(`找到 ${orders.length} 个订单`);

    // 2. 获取销售数据
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('*');
    
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*');

    if (primaryError) throw primaryError;
    if (secondaryError) throw secondaryError;
    
    console.log(`找到 ${primarySales?.length || 0} 个一级销售`);
    console.log(`找到 ${secondarySales?.length || 0} 个二级销售`);

    // 3. 计算统计数据
    const stats = {
      stat_type: 'realtime',
      stat_period: 'all',
      start_date: null,
      end_date: null,
      total_orders: orders.length,
      today_orders: 0,
      pending_payment_orders: 0,
      confirmed_payment_orders: 0,
      pending_config_orders: 0,
      confirmed_config_orders: 0,
      rejected_orders: 0,
      active_orders: 0,
      total_amount: 0,
      today_amount: 0,
      confirmed_amount: 0,
      total_commission: 0,
      paid_commission: 0,
      pending_commission: 0,
      primary_sales_count: 0,
      secondary_sales_count: 0,
      independent_sales_count: 0,
      active_sales_count: 0,
      free_trial_orders: 0,
      one_month_orders: 0,
      three_month_orders: 0,
      six_month_orders: 0,
      yearly_orders: 0,
      free_trial_percentage: 0,
      one_month_percentage: 0,
      three_month_percentage: 0,
      six_month_percentage: 0,
      yearly_percentage: 0,
      last_calculated_at: new Date().toISOString(),
      calculation_duration_ms: 0,
      data_version: 1
    };

    const startTime = Date.now();

    // 统计订单数据
    const primarySalesAmounts = new Map();
    const linkedSecondarySalesAmounts = new Map();
    const independentSalesAmounts = new Map();

    orders.forEach(order => {
      // 统计订单状态
      if (order.payment_status === 'pending' || order.payment_status === 'pending_payment') {
        stats.pending_payment_orders++;
      } else if (order.payment_status === 'paid') {
        stats.confirmed_payment_orders++;
        stats.active_orders++;
        
        const amount = order.amount || order.actual_payment_amount || 0;
        stats.total_amount += amount;
        stats.confirmed_amount += amount;
        
        const commission = order.commission_amount || 0;
        stats.total_commission += commission;
        stats.pending_commission += commission; // 假设都是待返佣
        
        // 统计销售业绩
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
      } else if (order.payment_status === 'rejected') {
        stats.rejected_orders++;
      }
      
      // 统计配置状态
      if (order.config_confirmed === true) {
        stats.confirmed_config_orders++;
      } else if (order.payment_status === 'paid') {
        stats.pending_config_orders++;
      }
      
      // 统计订单时长类型
      const duration = (order.duration || '').toLowerCase();
      if (duration.includes('7天') || duration.includes('7日') || 
          duration.includes('free') || duration.includes('trial') || 
          duration === '7_days' || duration === 'free_trial') {
        stats.free_trial_orders++;
      } else if (duration.includes('1个月') || duration.includes('1月') || 
                 duration === '1_month' || duration === 'one_month') {
        stats.one_month_orders++;
      } else if (duration.includes('3个月') || duration.includes('3月') || 
                 duration === '3_month' || duration === 'three_month') {
        stats.three_month_orders++;
      } else if (duration.includes('6个月') || duration.includes('6月') || 
                 duration === '6_month' || duration === 'six_month') {
        stats.six_month_orders++;
      } else if (duration.includes('年') || duration.includes('1年') || 
                 duration === 'yearly' || duration === '1_year' || duration === 'annual') {
        stats.yearly_orders++;
      }
    });

    // 计算销售数量（基于实际销售表）
    stats.primary_sales_count = primarySales?.length || 0;
    
    // 计算二级销售（区分有上级和独立）
    let linkedCount = 0;
    let independentCount = 0;
    
    secondarySales?.forEach(sale => {
      if (sale.primary_sales_id) {
        linkedCount++;
      } else {
        independentCount++;
      }
    });
    
    stats.secondary_sales_count = linkedCount;
    stats.independent_sales_count = independentCount;
    stats.active_sales_count = stats.primary_sales_count + linkedCount + independentCount;

    // 计算销售业绩总额
    // 注意：这里使用从订单中统计的金额，而不是销售表的数量
    const primaryTotalAmount = Array.from(primarySalesAmounts.values()).reduce((sum, amt) => sum + amt, 0);
    const linkedTotalAmount = Array.from(linkedSecondarySalesAmounts.values()).reduce((sum, amt) => sum + amt, 0);
    const independentTotalAmount = Array.from(independentSalesAmounts.values()).reduce((sum, amt) => sum + amt, 0);
    
    // 添加销售业绩金额字段（如果表结构支持）
    // 注意：这些字段可能不在表结构中，需要确认
    const extendedStats = {
      ...stats,
      primary_sales_amount: primaryTotalAmount,
      linked_secondary_sales_amount: linkedTotalAmount,
      independent_sales_amount: independentTotalAmount
    };

    // 计算百分比
    const totalOrdersForPercentage = stats.total_orders || 1;
    stats.free_trial_percentage = parseFloat((stats.free_trial_orders / totalOrdersForPercentage * 100).toFixed(2));
    stats.one_month_percentage = parseFloat((stats.one_month_orders / totalOrdersForPercentage * 100).toFixed(2));
    stats.three_month_percentage = parseFloat((stats.three_month_orders / totalOrdersForPercentage * 100).toFixed(2));
    stats.six_month_percentage = parseFloat((stats.six_month_orders / totalOrdersForPercentage * 100).toFixed(2));
    stats.yearly_percentage = parseFloat((stats.yearly_orders / totalOrdersForPercentage * 100).toFixed(2));

    stats.calculation_duration_ms = Date.now() - startTime;

    console.log('计算完成的统计数据:');
    console.log('- 总订单数:', stats.total_orders);
    console.log('- 待付款订单:', stats.pending_payment_orders);
    console.log('- 已付款订单:', stats.confirmed_payment_orders);
    console.log('- 总金额:', stats.total_amount);
    console.log('- 总佣金:', stats.total_commission);
    console.log('- 一级销售数:', stats.primary_sales_count, '业绩:', primaryTotalAmount);
    console.log('- 二级销售数:', stats.secondary_sales_count, '业绩:', linkedTotalAmount);
    console.log('- 独立销售数:', stats.independent_sales_count, '业绩:', independentTotalAmount);
    console.log('- 7天免费订单:', stats.free_trial_orders, `(${stats.free_trial_percentage}%)`);
    console.log('- 1个月订单:', stats.one_month_orders, `(${stats.one_month_percentage}%)`);
    console.log('- 3个月订单:', stats.three_month_orders, `(${stats.three_month_percentage}%)`);
    console.log('- 6个月订单:', stats.six_month_orders, `(${stats.six_month_percentage}%)`);
    console.log('- 年费订单:', stats.yearly_orders, `(${stats.yearly_percentage}%)`);

    // 4. 删除旧的'all'记录
    const { error: deleteError } = await supabase
      .from('overview_stats')
      .delete()
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all');

    if (deleteError) {
      console.warn('删除旧记录时出错:', deleteError);
    }

    // 5. 插入新记录
    const { data: insertData, error: insertError } = await supabase
      .from('overview_stats')
      .insert([stats]);

    if (insertError) {
      console.error('插入数据失败:', insertError);
      throw insertError;
    }

    console.log('✅ 成功更新overview_stats表');

    // 6. 验证插入的数据
    const { data: verifyData, error: verifyError } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();

    if (verifyError) {
      console.error('验证数据失败:', verifyError);
    } else {
      console.log('✅ 验证成功，数据已正确插入');
      console.log('数据库中的记录:', {
        stat_period: verifyData.stat_period,
        total_orders: verifyData.total_orders,
        confirmed_payment_orders: verifyData.confirmed_payment_orders,
        total_amount: verifyData.total_amount,
        primary_sales_count: verifyData.primary_sales_count,
        secondary_sales_count: verifyData.secondary_sales_count,
        independent_sales_count: verifyData.independent_sales_count
      });
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

populateOverviewStats();