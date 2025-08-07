/**
 * 诊断数据概览页面数据问题
 * 在浏览器控制台运行此脚本
 */

async function diagnoseDashboardData() {
  console.log('='.repeat(60));
  console.log('🔍 开始诊断数据概览问题');
  console.log('='.repeat(60));
  
  // 1. 检查Redux状态
  console.log('\n📋 步骤1：检查Redux Store状态');
  if (window.store) {
    const state = window.store.getState();
    console.log('Admin状态:', state.admin);
    console.log('Stats数据:', state.admin.stats);
    console.log('Loading状态:', state.admin.loading);
    console.log('Error信息:', state.admin.error);
  } else {
    console.error('❌ window.store不存在！');
  }
  
  // 2. 测试getStats API
  console.log('\n📋 步骤2：测试getStats API');
  if (window.adminAPI) {
    try {
      console.log('正在调用adminAPI.getStats()...');
      const stats = await window.adminAPI.getStats();
      console.log('✅ getStats成功:', stats);
      
      // 检查返回的数据结构
      if (stats) {
        console.log('\n📊 统计数据详情:');
        console.log('- total_orders:', stats.total_orders);
        console.log('- pending_payment_orders:', stats.pending_payment_orders);
        console.log('- confirmed_payment_orders:', stats.confirmed_payment_orders);
        console.log('- pending_config_orders:', stats.pending_config_orders);
        console.log('- confirmed_config_orders:', stats.confirmed_config_orders);
        console.log('- total_amount:', stats.total_amount);
        console.log('- total_commission:', stats.total_commission);
      }
    } catch (error) {
      console.error('❌ getStats失败:', error);
    }
  } else {
    console.error('❌ window.adminAPI不存在！');
  }
  
  // 3. 直接测试Supabase查询
  console.log('\n📋 步骤3：直接测试Supabase查询');
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const orders = await response.json();
      console.log(`✅ 直接查询成功: ${orders.length} 个订单`);
      
      // 手动计算统计数据
      const stats = {
        total_orders: orders.length,
        pending_payment_orders: orders.filter(o => ['pending_payment', 'pending'].includes(o.status)).length,
        confirmed_payment_orders: orders.filter(o => ['confirmed_payment', 'confirmed'].includes(o.status)).length,
        pending_config_orders: orders.filter(o => o.status === 'pending_config').length,
        confirmed_config_orders: orders.filter(o => o.status === 'confirmed_configuration').length,
        total_amount: orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0)
      };
      
      console.log('\n📊 手动计算的统计数据:', stats);
    } else {
      const error = await response.json();
      console.error('❌ 查询失败:', error);
    }
  } catch (error) {
    console.error('❌ 网络错误:', error);
  }
  
  // 4. 测试SupabaseService
  console.log('\n📋 步骤4：测试SupabaseService.getOrders()');
  if (window.SupabaseService) {
    try {
      const orders = await window.SupabaseService.getOrders();
      console.log(`✅ SupabaseService.getOrders成功: ${orders.length} 个订单`);
    } catch (error) {
      console.error('❌ SupabaseService.getOrders失败:', error);
    }
  }
  
  // 5. 手动触发Redux action
  console.log('\n📋 步骤5：手动触发Redux action');
  if (window.store) {
    try {
      console.log('正在dispatch getStats...');
      const action = await window.store.dispatch({ 
        type: 'admin/getStats/pending' 
      });
      
      // 等待一下再检查状态
      setTimeout(() => {
        const newState = window.store.getState();
        console.log('更新后的stats:', newState.admin.stats);
      }, 1000);
    } catch (error) {
      console.error('❌ dispatch失败:', error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 诊断完成！');
  console.log('='.repeat(60));
}

// 执行诊断
diagnoseDashboardData();

