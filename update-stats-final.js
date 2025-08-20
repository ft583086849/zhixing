/**
 * 更新overview_stats表的实际数据 - 最终版本
 * 使用update而不是upsert
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOverviewStats() {
  console.log('🚀 开始更新overview_stats表数据...\n');
  
  const startTime = Date.now();
  
  try {
    // 1. 获取所有订单数据
    console.log('1️⃣ 获取订单数据...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError.message);
      return;
    }
    console.log(`✅ 获取 ${orders.length} 个订单`);
    
    // 分析订单状态
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    console.log('📊 订单状态分布:', statusCount);
    
    // 2. 获取销售数据
    console.log('\n2️⃣ 获取销售数据...');
    const { data: primarySales } = await supabase.from('primary_sales').select('*');
    const { data: secondarySales } = await supabase.from('secondary_sales').select('*');
    
    console.log(`✅ 一级销售: ${primarySales?.length || 0} 个`);
    console.log(`✅ 二级销售: ${secondarySales?.length || 0} 个`);
    
    // 3. 计算统计数据
    console.log('\n3️⃣ 计算统计数据...');
    
    // 修正状态判断 - 根据实际数据库的状态值
    const validStatuses = ['confirmed_config', 'config_confirmed', 'confirmed', 'active'];
    const pendingStatuses = ['pending', 'pending_payment', 'pending_config'];
    
    // 总体统计
    const totalOrders = orders.length;
    const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
    const activeOrders = orders.filter(o => validStatuses.includes(o.status)).length;
    const pendingOrders = orders.filter(o => pendingStatuses.includes(o.status)).length;
    
    // 计算金额（假设价格字段存储的是USD）
    const totalAmount = orders
      .filter(o => o.status !== 'rejected')
      .reduce((sum, o) => {
        // 尝试多个可能的价格字段
        const price = parseFloat(o.price || o.amount || o.actual_payment_amount || 0);
        return sum + price;
      }, 0);
    
    const confirmedAmount = orders
      .filter(o => validStatuses.includes(o.status))
      .reduce((sum, o) => {
        const price = parseFloat(o.price || o.amount || o.actual_payment_amount || 0);
        return sum + price;
      }, 0);
    
    // 计算佣金
    const totalCommission = orders
      .filter(o => validStatuses.includes(o.status))
      .reduce((sum, o) => {
        const price = parseFloat(o.price || o.amount || o.actual_payment_amount || 0);
        const commissionRate = parseFloat(o.commission_rate) || 0.25;
        return sum + (price * commissionRate);
      }, 0);
    
    // 销售统计
    const primarySalesCount = primarySales?.length || 0;
    const secondarySalesCount = secondarySales?.length || 0;
    const independentSalesCount = secondarySales?.filter(s => !s.primary_sales_id).length || 0;
    
    // 时长分布
    const durationMap = {
      'free_trial': ['free_trial', '7days', 'free'],
      '1month': ['1month', '30days', 'monthly'],
      '3months': ['3months', '90days', 'quarterly'],
      '6months': ['6months', '180days', 'semi-annual'],
      'yearly': ['yearly', '1year', '365days', 'annual']
    };
    
    const freeTrialOrders = orders.filter(o => 
      durationMap['free_trial'].includes(o.duration)
    ).length;
    const oneMonthOrders = orders.filter(o => 
      durationMap['1month'].includes(o.duration)
    ).length;
    const threeMonthOrders = orders.filter(o => 
      durationMap['3months'].includes(o.duration)
    ).length;
    const sixMonthOrders = orders.filter(o => 
      durationMap['6months'].includes(o.duration)
    ).length;
    const yearlyOrders = orders.filter(o => 
      durationMap['yearly'].includes(o.duration)
    ).length;
    
    // 计算百分比
    const validOrders = totalOrders - rejectedOrders || 1;
    const freeTrialPercentage = (freeTrialOrders / validOrders * 100);
    const oneMonthPercentage = (oneMonthOrders / validOrders * 100);
    const threeMonthPercentage = (threeMonthOrders / validOrders * 100);
    const sixMonthPercentage = (sixMonthOrders / validOrders * 100);
    const yearlyPercentage = (yearlyOrders / validOrders * 100);
    
    // 今日数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const todayOrdersCount = todayOrders.length;
    const todayAmount = todayOrders
      .filter(o => o.status !== 'rejected')
      .reduce((sum, o) => {
        const price = parseFloat(o.price || o.amount || o.actual_payment_amount || 0);
        return sum + price;
      }, 0);
    
    const statsData = {
      total_orders: totalOrders,
      today_orders: todayOrdersCount,
      pending_payment_orders: pendingOrders,
      confirmed_payment_orders: 0,
      pending_config_orders: 0,
      confirmed_config_orders: activeOrders,
      rejected_orders: rejectedOrders,
      active_orders: activeOrders,
      total_amount: totalAmount.toFixed(2),
      today_amount: todayAmount.toFixed(2),
      confirmed_amount: confirmedAmount.toFixed(2),
      total_commission: totalCommission.toFixed(2),
      paid_commission: 0,
      pending_commission: totalCommission.toFixed(2),
      primary_sales_count: primarySalesCount,
      secondary_sales_count: secondarySalesCount,
      independent_sales_count: independentSalesCount,
      active_sales_count: primarySalesCount + secondarySalesCount,
      free_trial_orders: freeTrialOrders,
      one_month_orders: oneMonthOrders,
      three_month_orders: threeMonthOrders,
      six_month_orders: sixMonthOrders,
      yearly_orders: yearlyOrders,
      free_trial_percentage: freeTrialPercentage.toFixed(1),
      one_month_percentage: oneMonthPercentage.toFixed(1),
      three_month_percentage: threeMonthPercentage.toFixed(1),
      six_month_percentage: sixMonthPercentage.toFixed(1),
      yearly_percentage: yearlyPercentage.toFixed(1),
      last_calculated_at: new Date().toISOString(),
      calculation_duration_ms: Date.now() - startTime,
      data_version: 1
    };
    
    console.log('\n📊 计算结果:');
    console.log(`   总订单: ${totalOrders}`);
    console.log(`   活跃订单: ${activeOrders}`);
    console.log(`   待处理订单: ${pendingOrders}`);
    console.log(`   拒绝订单: ${rejectedOrders}`);
    console.log(`   总金额: $${totalAmount.toFixed(2)}`);
    console.log(`   总佣金: $${totalCommission.toFixed(2)}`);
    console.log(`   销售团队: ${primarySalesCount + secondarySalesCount} 人`);
    
    // 4. 更新数据库 - 使用update而不是upsert
    console.log('\n4️⃣ 更新数据库...');
    const { error: updateError } = await supabase
      .from('overview_stats')
      .update(statsData)
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all');
    
    if (updateError) {
      console.error('❌ 更新失败:', updateError.message);
      return;
    }
    
    const endTime = Date.now();
    console.log(`\n✅ 数据更新成功！`);
    console.log(`⏱️ 总耗时: ${endTime - startTime}ms`);
    
    // 5. 验证更新
    console.log('\n5️⃣ 验证更新...');
    const { data: newStats, error: verifyError } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();
    
    if (!verifyError && newStats) {
      console.log('✅ 数据已成功写入数据库');
      console.log(`   总订单: ${newStats.total_orders}`);
      console.log(`   活跃订单: ${newStats.active_orders}`);
      console.log(`   总金额: $${newStats.total_amount}`);
      console.log(`   最后更新: ${newStats.last_calculated_at}`);
    }
    
    console.log('\n✨ 更新完成！');
    console.log('\n📝 测试步骤:');
    console.log('1. 访问 http://localhost:3000/admin');
    console.log('2. 登录: admin / 123456');
    console.log('3. 查看数据概览页面');
    console.log('4. 打开控制台查看 "📊 使用新的统计方式" 日志');
    console.log('5. 验证数据显示正确');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

// 执行更新
updateOverviewStats();