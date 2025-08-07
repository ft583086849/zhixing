// 🔍验证054282b部署效果.js
// 验证销售微信号修复和数据概览API重新设计的效果

console.log('=== 🔍 验证054282b部署效果 ===\n');

async function verify054282bDeployment() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // === 1. 验证数据概览修复效果 ===
    console.log('📊 === 数据概览修复验证 ===');
    
    const statsData = state.admin?.stats;
    console.log('当前数据概览数据:', statsData);
    
    if (statsData) {
      const hasRealData = Object.values(statsData).some(val => val > 0);
      
      console.log('📈 关键指标检查:');
      console.log(`✓ 总订单数: ${statsData.total_orders || 0}`);
      console.log(`✓ 今日订单: ${statsData.today_orders || 0}`);
      console.log(`✓ 待付款确认: ${statsData.pending_payment_orders || 0}`);
      console.log(`✓ 已付款确认: ${statsData.confirmed_payment_orders || 0}`);
      console.log(`✓ 待配置确认: ${statsData.pending_config_orders || 0}`);
      console.log(`✓ 已配置确认: ${statsData.confirmed_config_orders || 0}`);
      console.log(`✓ 总金额: $${statsData.total_amount || 0}`);
      console.log(`✓ 总佣金: $${statsData.total_commission || 0}`);
      console.log(`✓ 一级销售: ${statsData.primary_sales_count || 0}`);
      console.log(`✓ 二级销售: ${statsData.secondary_sales_count || 0}`);
      
      // 检查调试信息
      if (statsData.debug_info) {
        console.log('\n🔍 调试信息:');
        console.log(`订单总数: ${statsData.debug_info.orders_count}`);
        console.log('状态分布:', statsData.debug_info.status_distribution);
      }
      
      if (hasRealData) {
        console.log('\n✅ 数据概览修复成功! 不再全零');
      } else {
        console.log('\n❌ 数据概览仍然全零');
        console.log('💡 需要检查新API是否正常工作');
      }
    } else {
      console.log('❌ 数据概览数据完全为空');
    }

    // === 2. 验证销售微信号修复效果 ===
    console.log('\n👥 === 销售微信号修复验证 ===');
    
    const salesData = state.admin?.sales;
    if (salesData && salesData.length > 0) {
      console.log(`销售数据总数: ${salesData.length}`);
      
      // 检查微信号修复效果
      let fixedWechatCount = 0;
      let stillEmptyCount = 0;
      
      salesData.forEach((sale, index) => {
        const wechatName = sale.wechat_name;
        console.log(`销售${index + 1}: ${sale.sales_code} - 微信号: ${wechatName || '空'}`);
        
        if (wechatName && wechatName !== '' && wechatName !== '-') {
          fixedWechatCount++;
        } else {
          stillEmptyCount++;
        }
      });
      
      console.log(`\n📊 微信号修复统计:`);
      console.log(`✅ 有微信号: ${fixedWechatCount}/${salesData.length}`);
      console.log(`❌ 仍为空: ${stillEmptyCount}/${salesData.length}`);
      
      if (stillEmptyCount === 0) {
        console.log('🎉 销售微信号修复完全成功!');
      } else {
        console.log('⚠️  部分销售微信号仍为空，需要进一步调试');
      }
    } else {
      console.log('❌ 销售数据为空');
    }

    // === 3. 验证订单状态英文列 ===
    console.log('\n🔍 === 订单状态英文列验证 ===');
    
    const ordersData = state.admin?.orders;
    if (ordersData && ordersData.length > 0) {
      console.log(`订单数据总数: ${ordersData.length}`);
      
      // 统计状态分布
      const statusCounts = {};
      ordersData.forEach(order => {
        const status = order.status || 'null';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('\n📋 实际订单状态分布:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} 个订单`);
      });
      
      console.log('\n💡 请查看订单管理页面的"状态(英文)"列');
      console.log('   告诉我正确的状态映射关系，然后我们删除这个临时列');
      
    } else {
      console.log('❌ 订单数据为空');
    }

    // === 4. 测试新的数据概览API ===
    console.log('\n🧪 === 测试新数据概览API ===');
    
    if (window.adminAPI && typeof window.adminAPI.getStats === 'function') {
      console.log('🔄 手动调用新的getStats API...');
      
      try {
        const newStats = await window.adminAPI.getStats();
        console.log('📈 新API返回结果:', newStats);
        
        if (newStats && newStats.total_orders > 0) {
          console.log('✅ 新API工作正常，返回真实数据');
        } else {
          console.log('❌ 新API仍返回空数据');
          console.log('💡 可能需要检查Supabase连接或订单表数据');
        }
      } catch (error) {
        console.log('❌ 新API调用失败:', error.message);
      }
    } else {
      console.log('❌ adminAPI.getStats方法不存在');
    }

    // === 5. 整体验证结论 ===
    console.log('\n📋 === 054282b部署验证结论 ===');
    
    const results = [];
    
    if (statsData && Object.values(statsData).some(val => val > 0)) {
      results.push('✅ 数据概览修复成功');
    } else {
      results.push('❌ 数据概览仍有问题');
    }
    
    if (salesData && salesData.length > 0) {
      const hasWechat = salesData.some(sale => sale.wechat_name && sale.wechat_name !== '-');
      if (hasWechat) {
        results.push('✅ 销售微信号部分修复');
      } else {
        results.push('❌ 销售微信号仍未修复');
      }
    } else {
      results.push('❌ 销售数据为空');
    }
    
    if (ordersData && ordersData.length > 0) {
      results.push('✅ 订单数据正常，英文状态列可用');
    } else {
      results.push('❌ 订单数据为空');
    }
    
    console.log('\n📊 验证结果汇总:');
    results.forEach(result => console.log(result));
    
    // === 6. 下一步建议 ===
    console.log('\n🎯 === 下一步建议 ===');
    
    if (statsData && Object.values(statsData).some(val => val > 0)) {
      console.log('🎉 数据概览API修复成功，可以继续修复其他问题');
    } else {
      console.log('🔧 需要进一步调试数据概览API');
      console.log('   1. 检查Supabase orders表是否有数据');
      console.log('   2. 检查API调用链路');
      console.log('   3. 检查Redux数据更新');
    }
    
    console.log('\n💡 请检查以下页面:');
    console.log('1. 数据概览页面 - 是否显示真实数据');
    console.log('2. 销售管理页面 - 微信号是否正常显示');
    console.log('3. 订单管理页面 - 英文状态列的值');
    console.log('4. 告知正确的状态映射关系');

  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
  }
}

// 执行验证
verify054282bDeployment();

console.log('\n💻 使用说明:');
console.log('1. 等待Vercel部署完成');
console.log('2. 在管理后台按F12打开控制台');
console.log('3. 粘贴此脚本并回车执行');
console.log('4. 查看详细的修复效果验证结果');
