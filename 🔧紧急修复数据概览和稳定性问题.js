// 🔧紧急修复数据概览和稳定性问题
// 修复金额字段映射 + 数据加载稳定性

console.log('=== 🔧 紧急修复数据概览和稳定性问题 ===\n');

async function emergencyFix() {
  try {
    if (typeof window === 'undefined' || !window.supabaseClient || !window.store) {
      console.log('❌ 必要组件不可用');
      return;
    }

    console.log('✅ 开始紧急修复\n');

    // === 1. 强制清除所有缓存 ===
    console.log('🧹 === 强制清除所有缓存 ===');
    
    // 清除浏览器缓存
    if (window.localStorage) {
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.includes('admin') || key.includes('cache')) {
          window.localStorage.removeItem(key);
          console.log(`清除localStorage: ${key}`);
        }
      });
    }
    
    // 清除应用缓存
    if (window.CacheManager) {
      ['admin-stats', 'admin-sales', 'admin-customers', 'admin-orders'].forEach(key => {
        window.CacheManager.remove ? window.CacheManager.remove(key) : window.CacheManager.delete(key);
        console.log(`清除应用缓存: ${key}`);
      });
    }

    // === 2. 检查订单金额字段问题 ===
    console.log('\n💰 === 检查订单金额字段问题 ===');
    
    const { data: sampleOrders } = await window.supabaseClient
      .from('orders')
      .select('*')
      .limit(10);
    
    if (sampleOrders && sampleOrders.length > 0) {
      let hasAmount = 0;
      let totalAmount = 0;
      
      console.log('📊 金额字段分析:');
      sampleOrders.forEach((order, index) => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const originalAmount = order.amount;
        const actualAmount = order.actual_payment_amount;
        
        console.log(`订单${index + 1}: amount=${originalAmount}, actual_payment_amount=${actualAmount}, 解析值=${amount}`);
        
        if (amount > 0) {
          hasAmount++;
          totalAmount += amount;
        }
      });
      
      console.log(`\n💡 金额统计: ${hasAmount}/${sampleOrders.length} 个订单有金额, 总计: ${totalAmount}`);
      
      if (hasAmount === 0) {
        console.log('❌ 确认问题: 所有订单的金额字段都为空或0');
        console.log('🔧 需要修复: 数据库金额字段或API数据处理逻辑');
      }
    }

    // === 3. 强制刷新所有管理数据 ===
    console.log('\n🔄 === 强制刷新所有管理数据 ===');
    
    const { dispatch } = window.store;
    
    // 检查Redux actions是否可用
    const actionsAvailable = {
      getAdminOrders: typeof window.store.dispatch && window.adminSlice?.getAdminOrders,
      getSales: typeof window.store.dispatch && window.adminSlice?.getSales, 
      getCustomers: typeof window.store.dispatch && window.adminSlice?.getCustomers,
      getStats: typeof window.store.dispatch && window.adminSlice?.getStats
    };
    
    console.log('Redux actions 可用性:', actionsAvailable);
    
    // 强制刷新数据
    if (window.adminAPI) {
      console.log('🔄 使用adminAPI直接刷新数据...');
      
      try {
        console.log('刷新统计数据...');
        const newStats = await window.adminAPI.getStats();
        console.log('新统计数据:', newStats);
        
        console.log('刷新销售数据...');
        const newSales = await window.adminAPI.getSales();
        console.log('新销售数据长度:', newSales?.length || 0);
        
        console.log('刷新客户数据...');
        const newCustomers = await window.adminAPI.getCustomers();
        console.log('新客户数据长度:', newCustomers?.length || 0);
        
      } catch (apiError) {
        console.log('❌ API刷新失败:', apiError.message);
      }
    }

    // === 4. 修复数据概览显示问题 ===
    console.log('\n📈 === 修复数据概览显示问题 ===');
    
    // 检查Redux状态
    const currentState = window.store.getState();
    const adminState = currentState.admin;
    
    console.log('当前Redux状态:');
    console.log(`  loading: ${adminState?.loading}`);
    console.log(`  stats: ${JSON.stringify(adminState?.stats)}`);
    
    // 手动计算正确的统计数据
    const { data: allOrders } = await window.supabaseClient
      .from('orders')
      .select('*');
    
    if (allOrders && allOrders.length > 0) {
      console.log('\n🧮 手动计算正确统计:');
      
      // 基础统计
      const totalOrders = allOrders.length;
      const todayOrders = allOrders.filter(order => {
        const today = new Date().toDateString();
        const orderDate = new Date(order.created_at).toDateString();
        return orderDate === today;
      }).length;
      
      // 状态统计
      const statusStats = {
        pending: allOrders.filter(o => ['pending_payment', 'pending', 'pending_review'].includes(o.status)).length,
        confirmed: allOrders.filter(o => ['confirmed_payment', 'confirmed'].includes(o.status)).length,
        config: allOrders.filter(o => o.status === 'pending_config').length,
        active: allOrders.filter(o => ['confirmed_configuration', 'active'].includes(o.status)).length
      };
      
      // 尝试从不同字段获取金额
      let calculatedAmount = 0;
      let amountSource = '';
      
      // 尝试多种金额字段
      const amountFields = ['actual_payment_amount', 'amount', 'total_amount', 'order_amount'];
      
      for (const field of amountFields) {
        let fieldTotal = 0;
        let fieldCount = 0;
        
        allOrders.forEach(order => {
          const value = parseFloat(order[field] || 0);
          if (value > 0) {
            fieldTotal += value;
            fieldCount++;
          }
        });
        
        console.log(`字段 ${field}: ${fieldCount} 个订单有值, 总计: ${fieldTotal}`);
        
        if (fieldCount > calculatedAmount) {
          calculatedAmount = fieldTotal;
          amountSource = field;
        }
      }
      
      const correctStats = {
        total_orders: totalOrders,
        today_orders: todayOrders,
        pending_payment_orders: statusStats.pending,
        confirmed_payment_orders: statusStats.confirmed,
        pending_config_orders: statusStats.config,
        confirmed_config_orders: statusStats.active,
        total_amount: calculatedAmount,
        amount_source: amountSource
      };
      
      console.log('✅ 正确的统计数据:', correctStats);
      
      // 如果找到了有效金额，更新显示
      if (calculatedAmount > 0) {
        console.log(`🎉 找到有效金额来源: ${amountSource}, 总额: ${calculatedAmount}`);
        console.log('💡 建议修复API使用此字段');
      } else {
        console.log('❌ 确认: 数据库中所有金额字段都为空');
        console.log('💡 需要检查订单创建逻辑或数据导入');
      }
    }

    // === 5. 提供修复建议 ===
    console.log('\n🎯 === 修复建议 ===');
    
    console.log('立即修复方案:');
    console.log('1. 🔧 修复数据概览API - 使用正确的金额字段');
    console.log('2. 🔄 修复数据加载稳定性 - 禁用缓存,增加重试');
    console.log('3. 🚀 重新部署修复版本');
    
    console.log('\n具体修复内容:');
    console.log('- AdminAPI.getStats(): 检查更多金额字段');
    console.log('- AdminAPI.getSales(): 增加加载稳定性');
    console.log('- AdminAPI.getCustomers(): 修复初始加载问题');
    console.log('- 禁用所有缓存,确保数据实时性');

  } catch (error) {
    console.error('❌ 修复过程发生错误:', error);
  }
}

// 执行紧急修复
emergencyFix();

console.log('\n💻 修复完成后请告诉我结果，我立即部署修复版本！');
