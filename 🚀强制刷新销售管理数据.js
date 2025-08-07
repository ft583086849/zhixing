/**
 * 强制刷新销售管理页面数据
 * 在浏览器控制台运行此脚本，立即看到重新计算后的数据
 */

async function forceRefreshSalesData() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🚀 开始强制刷新销售管理数据');
  console.log('='.repeat(60));
  
  try {
    // 1. 如果有Redux store，直接触发刷新
    if (window.store) {
      console.log('\n📦 找到Redux Store，触发数据刷新...');
      const { dispatch } = window.store;
      
      // 动态导入adminSlice
      const adminSliceModule = await import('/src/store/slices/adminSlice.js');
      const { getSales } = adminSliceModule;
      
      // 触发获取销售数据
      await dispatch(getSales());
      
      console.log('✅ Redux Store数据已刷新');
      
      // 获取最新的state
      const state = window.store.getState();
      const sales = state.admin?.sales || [];
      
      console.log(`\n📊 获取到 ${sales.length} 条销售数据`);
      
      // 显示数据统计
      if (sales.length > 0) {
        console.log('\n📋 销售数据详情：');
        sales.forEach(sale => {
          console.log(`\n🏷️ ${sale.sales?.wechat_name || sale.sales?.name || '未知销售'} (${sale.sales?.sales_code})`);
          console.log(`   类型: ${sale.sales?.sales_type === 'primary' ? '一级销售' : '二级销售'}`);
          console.log(`   总订单数: ${sale.total_orders || 0}`);
          console.log(`   有效订单数: ${sale.valid_orders || 0}`);
          console.log(`   总金额: $${(sale.total_amount || 0).toFixed(2)}`);
          console.log(`   已配置确认订单金额: $${(sale.confirmed_amount || 0).toFixed(2)}`);
          console.log(`   佣金率: ${sale.commission_rate || sale.sales?.commission_rate || 0}%`);
          console.log(`   应返佣金额: $${(sale.commission_amount || 0).toFixed(2)}`);
        });
        
        // 汇总统计
        const totalOrders = sales.reduce((sum, s) => sum + (s.total_orders || 0), 0);
        const totalValidOrders = sales.reduce((sum, s) => sum + (s.valid_orders || 0), 0);
        const totalAmount = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
        const totalConfirmedAmount = sales.reduce((sum, s) => sum + (s.confirmed_amount || 0), 0);
        const totalCommission = sales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 汇总统计');
        console.log('='.repeat(60));
        console.log(`总订单数: ${totalOrders}`);
        console.log(`总有效订单数: ${totalValidOrders}`);
        console.log(`总金额: $${totalAmount.toFixed(2)}`);
        console.log(`总已配置确认金额: $${totalConfirmedAmount.toFixed(2)}`);
        console.log(`总应返佣金额: $${totalCommission.toFixed(2)}`);
      }
    } else {
      console.log('⚠️ 未找到Redux Store，尝试直接调用API...');
      
      // 直接调用API
      const AdminAPI = await import('/src/services/api.js').then(m => m.AdminAPI);
      const salesData = await AdminAPI.getSales();
      
      console.log(`\n📊 API返回 ${salesData.length} 条销售数据`);
      
      if (salesData.length > 0) {
        console.log('\n📋 销售数据详情：');
        salesData.forEach(sale => {
          console.log(`\n🏷️ ${sale.sales?.wechat_name || sale.sales?.name || '未知销售'} (${sale.sales?.sales_code})`);
          console.log(`   类型: ${sale.sales?.sales_type === 'primary' ? '一级销售' : '二级销售'}`);
          console.log(`   总订单数: ${sale.total_orders || 0}`);
          console.log(`   有效订单数: ${sale.valid_orders || 0}`);
          console.log(`   总金额: $${(sale.total_amount || 0).toFixed(2)}`);
          console.log(`   已配置确认订单金额: $${(sale.confirmed_amount || 0).toFixed(2)}`);
          console.log(`   佣金率: ${sale.commission_rate || sale.sales?.commission_rate || 0}%`);
          console.log(`   应返佣金额: $${(sale.commission_amount || 0).toFixed(2)}`);
        });
      }
      
      console.log('\n💡 提示：请刷新页面查看最新数据');
    }
    
    // 2. 检查页面是否在销售管理页面
    if (window.location.pathname.includes('/admin/sales')) {
      console.log('\n✅ 当前在销售管理页面，数据应该已更新');
    } else {
      console.log('\n💡 提示：请导航到销售管理页面查看更新后的数据');
    }
    
  } catch (error) {
    console.error('❌ 刷新失败:', error);
    console.log('💡 建议：请手动刷新页面（Ctrl+F5 或 Cmd+Shift+R）');
  }
}

// 执行强制刷新
console.log('🚀 开始执行强制刷新...');
forceRefreshSalesData().then(() => {
  console.log('\n✅ 强制刷新完成！');
  console.log('💡 如果页面数据未更新，请按 F5 刷新页面');
});

