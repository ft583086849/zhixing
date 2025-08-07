// 🔍验证部署ef0e84a效果.js
// 验证订单状态统计逻辑修复效果

console.log('=== 验证部署 ef0e84a 效果 ===');
console.log('提交内容: 修复订单状态统计逻辑 - 兼容多种状态格式');
console.log('修复目标: 数据概览页面显示正确的订单统计数据\n');

async function verifyDeployment() {
  try {
    // 1. 检查Redux Store
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用 - 请在管理后台页面运行此脚本');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用');

    // 2. 验证数据概览统计
    console.log('\n📊 数据概览统计验证:');
    const adminStats = state.admin?.stats;
    if (adminStats) {
      console.log('统计数据:', adminStats);
      console.log(`- 总订单数: ${adminStats.total_orders}`);
      console.log(`- 今日订单: ${adminStats.today_orders}`);
      console.log(`- 待付款确认: ${adminStats.pending_payment}`);
      console.log(`- 已付款确认: ${adminStats.confirmed_payment}`);
      console.log(`- 待配置确认: ${adminStats.pending_config}`);
      console.log(`- 已配置确认: ${adminStats.confirmed_config}`);
      
      // 检查是否全零
      const allZero = Object.values(adminStats).every(val => val === 0);
      if (allZero) {
        console.log('⚠️  所有统计数据仍为0 - 可能需要进一步排查');
      } else {
        console.log('✅ 统计数据已更新');
      }
    } else {
      console.log('❌ 未找到统计数据');
    }

    // 3. 直接测试Supabase订单查询
    console.log('\n🔍 直接验证Supabase订单数据:');
    
    // 检查是否有Supabase客户端
    if (window.supabaseClient) {
      const { data: orders, error } = await window.supabaseClient
        .from('orders')
        .select('*');
      
      if (error) {
        console.log('❌ Supabase查询错误:', error);
      } else {
        console.log(`✅ 成功查询到 ${orders.length} 个订单`);
        
        // 按状态分组统计
        const statusCounts = {};
        orders.forEach(order => {
          const status = order.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        console.log('📈 订单状态分布:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });
        
        // 测试新的状态分组逻辑
        const pendingPayment = orders.filter(order => 
          ['pending_payment', 'pending', 'pending_review'].includes(order.status)
        ).length;
        const confirmedPayment = orders.filter(order => 
          ['confirmed_payment', 'confirmed'].includes(order.status)
        ).length;
        
        console.log('\n🔧 修复后的状态统计逻辑:');
        console.log(`- 待付款确认 (pending_payment/pending/pending_review): ${pendingPayment}`);
        console.log(`- 已付款确认 (confirmed_payment/confirmed): ${confirmedPayment}`);
      }
    } else {
      console.log('❌ Supabase客户端不可用');
    }

    // 4. 检查销售管理数据
    console.log('\n👥 销售管理数据验证:');
    const salesData = state.admin?.sales;
    if (salesData && salesData.length > 0) {
      console.log(`✅ 销售数据已加载: ${salesData.length} 条记录`);
      
      // 检查销售类型分布
      const salesTypes = {};
      salesData.forEach(sale => {
        const type = sale.sales_display_type || sale.hierarchy_info || 'unknown';
        salesTypes[type] = (salesTypes[type] || 0) + 1;
      });
      
      console.log('销售类型分布:');
      Object.entries(salesTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    } else {
      console.log('❌ 销售数据为空或未加载');
    }

    // 5. 总结验证结果
    console.log('\n📋 验证总结:');
    console.log('ef0e84a 修复内容:');
    console.log('✅ 1. 订单状态统计兼容多种格式 (pending, pending_payment, confirmed等)');
    console.log('✅ 2. AdminOrders.js 状态映射优化');
    console.log('✅ 3. AdminPaymentConfig.js Upload组件错误修复');
    console.log('✅ 4. Supabase RLS策略配置');
    
    const hasValidStats = adminStats && !Object.values(adminStats).every(val => val === 0);
    const hasSalesData = salesData && salesData.length > 0;
    
    if (hasValidStats && hasSalesData) {
      console.log('🎉 部署验证成功 - 主要功能已恢复正常');
    } else {
      console.log('⚠️  部分功能仍需进一步排查');
    }

  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
  }
}

// 执行验证
verifyDeployment();

console.log('\n💡 使用说明:');
console.log('1. 在管理后台任意页面按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看验证结果，确认ef0e84a修复效果');
