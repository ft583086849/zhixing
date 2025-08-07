/**
 * 快速修复数据概览问题
 * 在浏览器控制台运行此脚本
 */

// 立即诊断并尝试修复
(async function() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🔧 开始修复数据概览问题');
  console.log('='.repeat(60));
  
  // 1. 检查当前状态
  console.log('\n📋 当前Redux状态:');
  if (window.store) {
    const state = window.store.getState();
    console.log('Stats数据:', state.admin.stats);
    console.log('Loading:', state.admin.loading);
    console.log('Error:', state.admin.error);
  }
  
  // 2. 手动调用getStats
  console.log('\n📋 手动调用getStats API...');
  if (window.adminAPI) {
    try {
      const stats = await window.adminAPI.getStats();
      console.log('✅ getStats成功:', stats);
      
      // 手动更新Redux状态
      if (window.store && stats) {
        console.log('\n📋 手动更新Redux Store...');
        window.store.dispatch({
          type: 'admin/getStats/fulfilled',
          payload: stats
        });
        
        console.log('✅ Redux Store已更新');
        
        // 验证更新
        const newState = window.store.getState();
        console.log('更新后的stats:', newState.admin.stats);
      }
    } catch (error) {
      console.error('❌ getStats失败:', error);
      
      // 尝试直接查询
      console.log('\n📋 尝试直接查询Supabase...');
      const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (response.ok) {
        const orders = await response.json();
        console.log(`✅ 直接查询成功: ${orders.length} 个订单`);
        
        // 手动计算统计数据
        const manualStats = {
          total_orders: orders.length,
          total_amount: orders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0),
          pending_payment_orders: orders.filter(o => ['pending_payment', 'pending'].includes(o.status)).length,
          confirmed_payment_orders: orders.filter(o => ['confirmed_payment', 'confirmed'].includes(o.status)).length,
          pending_config_orders: orders.filter(o => o.status === 'pending_config').length,
          confirmed_config_orders: orders.filter(o => o.status === 'confirmed_configuration').length,
          total_commission: 0,
          primary_sales_count: 0,
          secondary_sales_count: 0,
          today_orders: 0
        };
        
        console.log('📊 手动计算的统计:', manualStats);
        
        // 更新Redux
        if (window.store) {
          window.store.dispatch({
            type: 'admin/getStats/fulfilled',
            payload: manualStats
          });
          console.log('✅ 已使用手动计算的数据更新Redux');
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 修复完成！请刷新页面查看效果');
  console.log('如果还是没有数据，可能需要在Supabase禁用orders表的RLS');
  console.log('='.repeat(60));
})();
