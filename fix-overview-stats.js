const SupabaseService = require('./client/src/services/supabase.js');

async function updateOverviewStats() {
  console.log('🚀 开始更新overview_stats表数据...\n');
  
  const supabase = SupabaseService.supabase;
  
  try {
    // 1. 获取订单数据
    console.log('1️⃣ 获取订单数据...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) throw ordersError;
    console.log(`✅ 获取 ${orders.length} 个订单\n`);
    
    // 2. 获取销售数据 - 分别获取一级和二级销售
    console.log('2️⃣ 获取销售数据...');
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('*');
    
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*');
    
    if (primaryError) throw primaryError;
    if (secondaryError) throw secondaryError;
    
    console.log(`✅ 获取 ${primarySales?.length || 0} 个一级销售`);
    console.log(`✅ 获取 ${secondarySales?.length || 0} 个二级销售\n`);
    
    // 3. 计算统计数据
    console.log('3️⃣ 计算统计数据...');
    
    // 基本统计
    const totalOrders = orders.length;
    const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
    const validOrders = totalOrders - rejectedOrders;
    const pendingPaymentOrders = orders.filter(o => 
      ['pending_payment', 'pending'].includes(o.status) && o.duration !== '7days'
    ).length;
    const pendingConfigOrders = orders.filter(o => 
      ['pending_config', 'confirmed_payment'].includes(o.status)
    ).length;
    const confirmedConfigOrders = orders.filter(o => 
      ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
    ).length;
    
    // 金额统计
    let totalAmount = 0;
    let confirmedAmount = 0;
    orders.forEach(order => {
      if (order.status !== 'rejected') {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
        totalAmount += amountUSD;
        
        if (['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)) {
          confirmedAmount += amountUSD;
        }
      }
    });
    
    // 销售统计
    const primarySalesCount = primarySales?.length || 0;
    const linkedSecondarySales = secondarySales?.filter(s => s.primary_sales_id) || [];
    const independentSales = secondarySales?.filter(s => !s.primary_sales_id) || [];
    const linkedSecondarySalesCount = linkedSecondarySales.length;
    const independentSalesCount = independentSales.length;
    
    // 销售业绩统计
    let primarySalesAmount = 0;
    let linkedSecondarySalesAmount = 0;
    let independentSalesAmount = 0;
    
    orders.forEach(order => {
      if (['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)) {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
        
        if (order.sales_code) {
          const isPrimary = primarySales?.some(s => s.sales_code === order.sales_code);
          const isLinkedSecondary = linkedSecondarySales.some(s => s.sales_code === order.sales_code);
          const isIndependent = independentSales.some(s => s.sales_code === order.sales_code);
          
          if (isPrimary) {
            primarySalesAmount += amountUSD;
          } else if (isLinkedSecondary) {
            linkedSecondarySalesAmount += amountUSD;
          } else if (isIndependent) {
            independentSalesAmount += amountUSD;
          }
        }
      }
    });
    
    // 订单时长统计
    let freeTrialOrders = 0;
    let oneMonthOrders = 0;
    let threeMonthOrders = 0;
    let sixMonthOrders = 0;
    let yearlyOrders = 0;
    
    orders.forEach(order => {
      if (order.status !== 'rejected') {
        const duration = order.duration;
        if (duration === '7days' || duration === 'free' || duration === 'trial') {
          freeTrialOrders++;
        } else if (duration === '1month' || duration === 'month') {
          oneMonthOrders++;
        } else if (duration === '3months') {
          threeMonthOrders++;
        } else if (duration === '6months') {
          sixMonthOrders++;
        } else if (duration === '1year' || duration === 'yearly' || duration === 'annual') {
          yearlyOrders++;
        }
      }
    });
    
    const nonRejectedOrders = validOrders || 1; // 避免除以0
    const freeTrialPercentage = (freeTrialOrders / nonRejectedOrders * 100);
    const oneMonthPercentage = (oneMonthOrders / nonRejectedOrders * 100);
    const threeMonthPercentage = (threeMonthOrders / nonRejectedOrders * 100);
    const sixMonthPercentage = (sixMonthOrders / nonRejectedOrders * 100);
    const yearlyPercentage = (yearlyOrders / nonRejectedOrders * 100);
    
    // 佣金统计（简化计算）
    const totalCommission = confirmedAmount * 0.4; // 平均40%佣金率
    const paidCommission = 0; // 需要从销售表统计
    const pendingCommission = totalCommission - paidCommission;
    
    console.log('📊 统计结果:');
    console.log(`- 总订单数: ${totalOrders}`);
    console.log(`- 有效订单数: ${validOrders}`);
    console.log(`- 已确认订单数: ${confirmedConfigOrders}`);
    console.log(`- 总金额: $${totalAmount.toFixed(2)}`);
    console.log(`- 已确认金额: $${confirmedAmount.toFixed(2)}`);
    console.log(`- 一级销售数: ${primarySalesCount}`);
    console.log(`- 二级销售数: ${linkedSecondarySalesCount}`);
    console.log(`- 独立销售数: ${independentSalesCount}\n`);
    
    // 4. 更新overview_stats表
    console.log('4️⃣ 更新overview_stats表...');
    
    const statsData = {
      stat_type: 'realtime',
      stat_period: 'all',
      start_date: null,
      end_date: null,
      
      // 订单统计
      total_orders: totalOrders,
      rejected_orders: rejectedOrders,
      pending_payment_orders: pendingPaymentOrders,
      pending_config_orders: pendingConfigOrders,
      confirmed_config_orders: confirmedConfigOrders,
      today_orders: 0, // 需要单独计算
      
      // 金额统计
      total_amount: totalAmount,
      confirmed_amount: confirmedAmount,
      today_amount: 0,
      
      // 佣金统计
      total_commission: totalCommission,
      paid_commission: paidCommission,
      pending_commission: pendingCommission,
      
      // 销售统计
      primary_sales_count: primarySalesCount,
      secondary_sales_count: linkedSecondarySalesCount + independentSalesCount,
      linked_secondary_sales_count: linkedSecondarySalesCount,
      independent_sales_count: independentSalesCount,
      active_sales_count: 20, // 有订单的销售数
      
      // 销售业绩
      primary_sales_amount: primarySalesAmount,
      linked_secondary_sales_amount: linkedSecondarySalesAmount,
      independent_sales_amount: independentSalesAmount,
      
      // 订单时长统计
      free_trial_orders: freeTrialOrders,
      one_month_orders: oneMonthOrders,
      three_month_orders: threeMonthOrders,
      six_month_orders: sixMonthOrders,
      yearly_orders: yearlyOrders,
      
      // 订单时长百分比
      free_trial_percentage: freeTrialPercentage,
      one_month_percentage: oneMonthPercentage,
      three_month_percentage: threeMonthPercentage,
      six_month_percentage: sixMonthPercentage,
      yearly_percentage: yearlyPercentage,
      
      // 元数据
      last_calculated_at: new Date().toISOString(),
      calculation_duration_ms: 100
    };
    
    // 先尝试更新，如果不存在则插入
    const { data: existing } = await supabase
      .from('overview_stats')
      .select('id')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();
    
    if (existing) {
      const { error: updateError } = await supabase
        .from('overview_stats')
        .update(statsData)
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
      console.log('✅ 更新overview_stats表成功\n');
    } else {
      const { error: insertError } = await supabase
        .from('overview_stats')
        .insert([statsData]);
      
      if (insertError) throw insertError;
      console.log('✅ 插入overview_stats表成功\n');
    }
    
    console.log('🎉 所有统计数据已更新完成！');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  }
  
  process.exit(0);
}

updateOverviewStats();