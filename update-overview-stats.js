/**
 * 更新overview_stats表的实际数据
 * 从orders和sales表计算真实统计
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
    
    // 2. 获取销售数据
    console.log('\n2️⃣ 获取销售数据...');
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*');
    
    if (salesError) {
      console.error('❌ 获取销售失败:', salesError.message);
      return;
    }
    console.log(`✅ 获取 ${sales.length} 个销售`);
    
    // 3. 计算统计数据
    console.log('\n3️⃣ 计算统计数据...');
    
    // 总体统计
    const totalOrders = orders.length;
    const pendingPaymentOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedPaymentOrders = orders.filter(o => o.status === 'confirmed').length;
    const pendingConfigOrders = orders.filter(o => o.status === 'pending_config').length;
    const confirmedConfigOrders = orders.filter(o => o.status === 'config_confirmed').length;
    const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
    const activeOrders = orders.filter(o => ['confirmed', 'config_confirmed'].includes(o.status)).length;
    
    // 计算金额（USD）
    const totalAmount = orders
      .filter(o => o.status !== 'rejected')
      .reduce((sum, o) => {
        // 将价格转换为USD
        const price = parseFloat(o.price) || 0;
        if (o.currency === 'RMB') {
          return sum + (price / 7.15); // RMB转USD
        }
        return sum + price;
      }, 0);
    
    const confirmedAmount = orders
      .filter(o => ['confirmed', 'config_confirmed'].includes(o.status))
      .reduce((sum, o) => {
        const price = parseFloat(o.price) || 0;
        if (o.currency === 'RMB') {
          return sum + (price / 7.15);
        }
        return sum + price;
      }, 0);
    
    // 计算佣金
    const totalCommission = orders
      .filter(o => ['confirmed', 'config_confirmed'].includes(o.status))
      .reduce((sum, o) => {
        const price = parseFloat(o.price) || 0;
        const commissionRate = parseFloat(o.commission_rate) || 0.25;
        const usdPrice = o.currency === 'RMB' ? price / 7.15 : price;
        return sum + (usdPrice * commissionRate);
      }, 0);
    
    // 销售统计
    const primarySalesCount = sales.filter(s => s.sales_type === 'primary').length;
    const secondarySalesCount = sales.filter(s => s.sales_type === 'secondary').length;
    const independentSalesCount = sales.filter(s => s.sales_type === 'independent').length;
    
    // 时长分布
    const freeTrialOrders = orders.filter(o => o.duration === 'free_trial').length;
    const oneMonthOrders = orders.filter(o => o.duration === '1month').length;
    const threeMonthOrders = orders.filter(o => o.duration === '3months').length;
    const sixMonthOrders = orders.filter(o => o.duration === '6months').length;
    const yearlyOrders = orders.filter(o => o.duration === 'yearly').length;
    
    // 计算百分比
    const validOrders = orders.filter(o => o.status !== 'rejected').length || 1;
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
        const price = parseFloat(o.price) || 0;
        if (o.currency === 'RMB') {
          return sum + (price / 7.15);
        }
        return sum + price;
      }, 0);
    
    const statsData = {
      stat_type: 'realtime',
      stat_period: 'all',
      total_orders: totalOrders,
      today_orders: todayOrdersCount,
      pending_payment_orders: pendingPaymentOrders,
      confirmed_payment_orders: confirmedPaymentOrders,
      pending_config_orders: pendingConfigOrders,
      confirmed_config_orders: confirmedConfigOrders,
      rejected_orders: rejectedOrders,
      active_orders: activeOrders,
      total_amount: totalAmount.toFixed(2),
      today_amount: todayAmount.toFixed(2),
      confirmed_amount: confirmedAmount.toFixed(2),
      total_commission: totalCommission.toFixed(2),
      paid_commission: 0, // 需要从其他表计算
      pending_commission: totalCommission.toFixed(2),
      primary_sales_count: primarySalesCount,
      secondary_sales_count: secondarySalesCount,
      independent_sales_count: independentSalesCount,
      active_sales_count: primarySalesCount + secondarySalesCount + independentSalesCount,
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
    console.log(`   总订单数: ${totalOrders}`);
    console.log(`   今日订单: ${todayOrdersCount}`);
    console.log(`   总金额: $${totalAmount.toFixed(2)}`);
    console.log(`   总佣金: $${totalCommission.toFixed(2)}`);
    console.log(`   一级销售: ${primarySalesCount}`);
    console.log(`   二级销售: ${secondarySalesCount}`);
    console.log(`   独立销售: ${independentSalesCount}`);
    
    // 4. 更新数据库
    console.log('\n4️⃣ 更新数据库...');
    const { error: updateError } = await supabase
      .from('overview_stats')
      .upsert(statsData, {
        onConflict: 'stat_type,stat_period',
        ignoreDuplicates: false
      });
    
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
      console.log(`   最后更新时间: ${newStats.last_calculated_at}`);
      console.log(`   计算耗时: ${newStats.calculation_duration_ms}ms`);
    }
    
    console.log('\n✨ 更新完成！');
    console.log('\n📝 现在可以:');
    console.log('1. 访问 http://localhost:3000/admin');
    console.log('2. 使用 admin / 123456 登录');
    console.log('3. 查看数据概览页面的实时数据');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

// 执行更新
updateOverviewStats();