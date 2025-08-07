// 🔍 验证41a4e58缓存清理后的修复效果
// 复制到浏览器控制台运行

console.log('=== 🔍 验证41a4e58缓存清理效果 ===\n');

async function verifyFixes() {
  try {
    console.log('🔗 === 1. 检查关键组件是否恢复 ===');
    
    // 检查SupabaseService
    console.log('SupabaseService 可用性:', typeof SupabaseService !== 'undefined');
    console.log('SupabaseService.supabase:', typeof SupabaseService?.supabase);
    
    // 检查window.supabaseClient
    console.log('window.supabaseClient:', typeof window.supabaseClient);
    
    // 检查AdminAPI
    console.log('AdminAPI 可用性:', typeof AdminAPI !== 'undefined');
    
    if (typeof SupabaseService === 'undefined') {
      console.error('❌ SupabaseService 仍然未定义！需要进一步检查');
      return;
    }
    
    console.log('\n🧪 === 2. 测试核心API功能 ===');
    
    // 测试数据概览
    console.log('正在测试数据概览API...');
    try {
      const stats = await AdminAPI.getStats();
      console.log('✅ 数据概览成功:', stats);
      console.log('- 总金额:', stats?.total_amount || 0);
      console.log('- 总订单:', stats?.total_orders || 0);
      console.log('- 今日订单:', stats?.today_orders || 0);
    } catch (error) {
      console.error('❌ 数据概览失败:', error);
    }
    
    // 测试销售管理
    console.log('\n正在测试销售管理API...');
    try {
      const sales = await AdminAPI.getSales();
      console.log('✅ 销售管理成功:', sales);
      console.log('- 销售数量:', sales?.length || 0);
      if (sales?.length > 0) {
        console.log('- 第一个销售样本:', sales[0]);
        console.log('- 销售微信号字段:', sales[0]?.wechat_name);
      }
    } catch (error) {
      console.error('❌ 销售管理失败:', error);
    }
    
    // 测试客户管理
    console.log('\n正在测试客户管理API...');
    try {
      const customers = await AdminAPI.getCustomers();
      console.log('✅ 客户管理成功:', customers);
      console.log('- 客户数量:', customers?.length || 0);
      if (customers?.length > 0) {
        console.log('- 第一个客户样本:', customers[0]);
        console.log('- 销售微信号字段:', customers[0]?.sales_wechat_name);
      }
    } catch (error) {
      console.error('❌ 客户管理失败:', error);
    }
    
    console.log('\n🔍 === 3. 检查Redux状态 ===');
    
    if (window.store) {
      const state = window.store.getState();
      console.log('Redux admin状态:');
      console.log('- stats loaded:', !!state.admin?.stats);
      console.log('- sales loaded:', !!state.admin?.sales?.length);
      console.log('- customers loaded:', !!state.admin?.customers?.length);
    }
    
    console.log('\n🎯 === 验证结果总结 ===');
    console.log('请检查上述结果:');
    console.log('✅ 所有API应该成功调用');
    console.log('✅ 数据概览应该显示真实金额');
    console.log('✅ 销售管理应该有数据');
    console.log('✅ 客户管理应该有数据且销售微信号正常');
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
}

// 立即执行验证
verifyFixes();
