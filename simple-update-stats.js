const SupabaseService = require('./client/src/services/supabase.js');

async function simpleUpdateStats() {
  console.log('🚀 简化版overview_stats更新...\n');
  
  const supabase = SupabaseService.supabase;
  
  try {
    // 1. 获取订单数据
    console.log('1️⃣ 获取订单数据...');
    const { data: orders } = await supabase.from('orders').select('*');
    console.log(`✅ 获取 ${orders?.length || 0} 个订单\n`);
    
    // 2. 获取销售数据
    console.log('2️⃣ 获取销售数据...');
    const { data: primarySales } = await supabase.from('primary_sales').select('*');
    const { data: secondarySales } = await supabase.from('secondary_sales').select('*');
    console.log(`✅ 获取 ${primarySales?.length || 0} 个一级销售`);
    console.log(`✅ 获取 ${secondarySales?.length || 0} 个二级销售\n`);
    
    // 3. 计算基本统计
    console.log('3️⃣ 计算统计数据...');
    
    const totalOrders = orders?.length || 0;
    const rejectedOrders = orders?.filter(o => o.status === 'rejected').length || 0;
    const validOrders = totalOrders - rejectedOrders;
    
    const pendingPaymentOrders = orders?.filter(o => 
      ['pending_payment', 'pending'].includes(o.status) && o.duration !== '7days'
    ).length || 0;
    
    const pendingConfigOrders = orders?.filter(o => 
      ['pending_config', 'confirmed_payment'].includes(o.status)
    ).length || 0;
    
    const confirmedConfigOrders = orders?.filter(o => 
      ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
    ).length || 0;
    
    // 金额统计
    let totalAmount = 0;
    let confirmedAmount = 0;
    
    orders?.forEach(order => {
      if (order.status !== 'rejected') {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
        totalAmount += amountUSD;
        
        if (['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)) {
          confirmedAmount += amountUSD;
        }
      }
    });
    
    // 订单时长统计
    let freeTrialOrders = 0;
    let oneMonthOrders = 0;
    let threeMonthOrders = 0;
    let sixMonthOrders = 0;
    let yearlyOrders = 0;
    
    orders?.forEach(order => {
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
    
    const nonRejectedOrders = validOrders || 1;
    const freeTrialPercentage = (freeTrialOrders / nonRejectedOrders * 100);
    const oneMonthPercentage = (oneMonthOrders / nonRejectedOrders * 100);
    const threeMonthPercentage = (threeMonthOrders / nonRejectedOrders * 100);
    const sixMonthPercentage = (sixMonthOrders / nonRejectedOrders * 100);
    const yearlyPercentage = (yearlyOrders / nonRejectedOrders * 100);
    
    // 佣金统计（简化）
    const totalCommission = confirmedAmount * 0.4;
    const paidCommission = 0;
    const pendingCommission = totalCommission - paidCommission;
    
    console.log('📊 统计结果:');
    console.log(`- 总订单数: ${totalOrders}`);
    console.log(`- 有效订单数: ${validOrders}`);
    console.log(`- 已确认订单数: ${confirmedConfigOrders}`);
    console.log(`- 总金额: $${totalAmount.toFixed(2)}`);
    console.log(`- 一级销售数: ${primarySales?.length || 0}`);
    console.log(`- 二级销售数: ${secondarySales?.length || 0}\n`);
    
    // 4. 更新overview_stats表（只更新已存在的字段）
    console.log('4️⃣ 更新overview_stats表...');
    
    const statsData = {
      stat_type: 'realtime',
      stat_period: 'all',
      
      // 订单统计
      total_orders: totalOrders,
      rejected_orders: rejectedOrders,
      pending_payment_orders: pendingPaymentOrders,
      pending_config_orders: pendingConfigOrders,
      confirmed_config_orders: confirmedConfigOrders,
      today_orders: 0,
      
      // 金额统计
      total_amount: totalAmount,
      confirmed_amount: confirmedAmount,
      today_amount: 0,
      
      // 佣金统计
      total_commission: totalCommission,
      paid_commission: paidCommission,
      pending_commission: pendingCommission,
      
      // 销售统计
      primary_sales_count: primarySales?.length || 0,
      // secondary_sales_count字段可能不存在，暂时注释
      // secondary_sales_count: secondarySales?.length || 0,
      
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
    
    // 先检查是否存在记录
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
      
      if (updateError) {
        console.error('❌ 更新失败:', updateError.message);
      } else {
        console.log('✅ 更新overview_stats表成功');
      }
    } else {
      const { error: insertError } = await supabase
        .from('overview_stats')
        .insert([statsData]);
      
      if (insertError) {
        console.error('❌ 插入失败:', insertError.message);
      } else {
        console.log('✅ 插入overview_stats表成功');
      }
    }
    
    console.log('\n🎉 统计数据更新完成！');
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  }
  
  process.exit(0);
}

simpleUpdateStats();