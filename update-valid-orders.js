/**
 * 更新生效订单量字段
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function updateValidOrders() {
  console.log('🔧 更新生效订单量字段...\n');
  
  try {
    // 1. 获取所有订单数据
    console.log('1️⃣ 获取订单数据...');
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*');
    
    // 2. 计算各种订单数量
    const totalOrders = allOrders.length;
    const rejectedOrders = allOrders.filter(o => o.status === 'rejected').length;
    const validOrders = totalOrders - rejectedOrders; // 生效订单 = 总订单 - 拒绝订单
    
    // 活跃订单（已确认配置的订单）
    const validStatuses = ['confirmed_config', 'config_confirmed', 'confirmed', 'active'];
    const activeOrders = allOrders.filter(o => validStatuses.includes(o.status)).length;
    
    // 待处理订单
    const pendingStatuses = ['pending', 'pending_payment', 'pending_config'];
    const pendingOrders = allOrders.filter(o => pendingStatuses.includes(o.status)).length;
    
    console.log('\n📊 订单统计:');
    console.log(`   总订单数: ${totalOrders}`);
    console.log(`   拒绝订单: ${rejectedOrders}`);
    console.log(`   生效订单: ${validOrders} ✨`);
    console.log(`   活跃订单: ${activeOrders}`);
    console.log(`   待处理订单: ${pendingOrders}`);
    
    // 3. 计算金额和佣金（只计算生效订单）
    const validOrdersData = allOrders.filter(o => o.status !== 'rejected');
    
    const totalAmount = validOrdersData.reduce((sum, o) => {
      return sum + parseFloat(o.price || o.amount || o.actual_payment_amount || 0);
    }, 0);
    
    const totalCommission = validOrdersData
      .filter(o => validStatuses.includes(o.status))
      .reduce((sum, o) => {
        const price = parseFloat(o.price || o.amount || o.actual_payment_amount || 0);
        const rate = parseFloat(o.commission_rate) || 0.25;
        return sum + (price * rate);
      }, 0);
    
    console.log(`   总金额: $${totalAmount.toFixed(2)}`);
    console.log(`   总佣金: $${totalCommission.toFixed(2)}`);
    
    // 4. 更新数据库
    console.log('\n2️⃣ 更新数据库...');
    
    const updateData = {
      total_orders: totalOrders,
      rejected_orders: rejectedOrders,
      valid_orders: validOrders, // 新增字段
      active_orders: activeOrders,
      pending_payment_orders: pendingOrders,
      total_amount: totalAmount.toFixed(2),
      total_commission: totalCommission.toFixed(2),
      pending_commission: totalCommission.toFixed(2),
      last_calculated_at: new Date().toISOString()
    };
    
    // 更新所有时间段
    const periods = ['all', 'today', 'week', 'month', 'year'];
    
    for (const period of periods) {
      const { error } = await supabase
        .from('overview_stats')
        .update(updateData)
        .eq('stat_type', 'realtime')
        .eq('stat_period', period);
      
      if (error) {
        console.error(`❌ 更新 ${period} 失败:`, error.message);
      } else {
        console.log(`✅ ${period} 更新成功`);
      }
    }
    
    // 5. 验证更新
    console.log('\n3️⃣ 验证更新...');
    const { data: stats } = await supabase
      .from('overview_stats')
      .select('stat_period, total_orders, rejected_orders, valid_orders, active_orders')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();
    
    if (stats) {
      console.log('\n📋 更新后的数据:');
      console.log(`   总订单: ${stats.total_orders}`);
      console.log(`   拒绝订单: ${stats.rejected_orders}`);
      console.log(`   生效订单: ${stats.valid_orders} ✨`);
      console.log(`   活跃订单: ${stats.active_orders}`);
    }
    
    console.log('\n✨ 更新完成！');
    console.log('\n📝 前端显示建议:');
    console.log('1. 显示"生效订单"而不是"总订单"');
    console.log('2. 或同时显示：总订单(290) / 生效订单(209)');
    console.log('3. 在统计卡片中使用 valid_orders 字段');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

updateValidOrders();