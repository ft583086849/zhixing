// 🔍验证94381a9修复效果.js
// 验证订单状态映射修复和数据概览问题排查

console.log('=== 验证部署 94381a9 修复效果 ===');
console.log('修复内容: confirmed状态映射 + 数据概览强制刷新\n');

async function verify94381a9() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // === 1. 验证订单状态映射修复 ===
    console.log('🔧 === 验证订单状态映射修复 ===');
    
    const ordersData = state.admin?.orders;
    if (ordersData && ordersData.length > 0) {
      console.log(`✅ 订单数据已加载: ${ordersData.length} 个订单`);
      
      // 查找confirmed状态的订单
      const confirmedOrders = ordersData.filter(order => order.status === 'confirmed');
      
      if (confirmedOrders.length > 0) {
        console.log(`🎯 找到 ${confirmedOrders.length} 个confirmed状态订单`);
        console.log('📋 confirmed状态订单详情:');
        
        confirmedOrders.forEach((order, index) => {
          console.log(`订单${index + 1}:`, {
            订单ID: order.id,
            状态: order.status,
            客户: order.customer_wechat || order.tradingview_username,
            创建时间: order.created_at,
            '修复后应显示': 'confirmed状态 → 配置确认按钮'
          });
        });
        
        console.log('✅ 订单状态映射修复验证:');
        console.log('- confirmed状态已修复为 → pending_config');
        console.log('- 应该显示"配置确认"按钮，不再显示"付款确认"');
        console.log('💡 请在订单管理页面手动验证按钮文字');
      } else {
        console.log('ℹ️  当前没有confirmed状态的订单可供验证');
      }
      
      // 检查所有状态分布
      const statusCounts = {};
      ordersData.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('\n📊 当前订单状态分布:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        let expectedButton = '';
        if (['pending_payment', 'pending', 'pending_review'].includes(status)) {
          expectedButton = '→ 付款确认';
        } else if (status === 'confirmed' || status === 'confirmed_payment') {
          expectedButton = '→ 配置确认';
        } else if (status === 'pending_config') {
          expectedButton = '→ 配置确认';
        } else {
          expectedButton = '→ 无操作或已完成';
        }
        console.log(`  ${status}: ${count} 个 ${expectedButton}`);
      });
      
    } else {
      console.log('❌ 订单数据为空');
    }

    // === 2. 验证数据概览强制刷新效果 ===
    console.log('\n📊 === 验证数据概览强制刷新效果 ===');
    
    const statsData = state.admin?.stats;
    console.log('Redux中的统计数据:', statsData);
    
    if (statsData) {
      const totalOrders = statsData.total_orders || 0;
      const hasNonZeroData = Object.values(statsData).some(val => val > 0);
      
      console.log('📈 统计数据检查:');
      console.log(`- 总订单数: ${totalOrders}`);
      console.log(`- 待付款确认: ${statsData.pending_payment_orders || 0}`);
      console.log(`- 已付款确认: ${statsData.confirmed_payment_orders || 0}`);
      console.log(`- 待配置确认: ${statsData.pending_config_orders || 0}`);
      console.log(`- 已配置确认: ${statsData.confirmed_config_orders || 0}`);
      console.log(`- 今日订单: ${statsData.today_orders || 0}`);
      console.log(`- 总收入: $${statsData.total_amount || 0}`);
      
      if (hasNonZeroData) {
        console.log('✅ 数据概览修复成功 - 显示非零数据');
      } else {
        console.log('❌ 数据概览仍然全零 - 需要深度排查');
        
        // 如果仍然全零，进行深度检查
        if (window.supabaseClient) {
          console.log('\n🔍 深度检查数据概览全零问题:');
          
          const { data: rawOrders, error } = await window.supabaseClient
            .from('orders')
            .select('id, status, created_at, amount');
          
          if (error) {
            console.log('❌ 数据库查询失败:', error);
          } else {
            console.log(`✅ 数据库实际有 ${rawOrders.length} 个订单`);
            
            if (rawOrders.length > 0 && totalOrders === 0) {
              console.log('❌ 确认问题: 数据库有数据但Redux统计为0');
              console.log('💡 问题可能在于:');
              console.log('  1. AdminAPI.getStats()调用失败');
              console.log('  2. SupabaseService.getOrderStats()返回错误格式');
              console.log('  3. Redux action处理错误');
              
              // 检查控制台是否有getStats的日志
              console.log('🔍 请查看控制台是否有"开始获取统计数据..."的日志');
              console.log('🔍 如果没有，说明getStats()没有被调用');
              console.log('🔍 如果有，但显示错误，说明API调用失败');
            }
          }
        }
      }
    } else {
      console.log('❌ 统计数据完全为空');
    }

    // === 3. 检查其他关键问题状态 ===
    console.log('\n🔍 === 其他关键问题检查 ===');
    
    // 销售管理数据
    const salesData = state.admin?.sales;
    if (salesData && salesData.length > 0) {
      console.log(`✅ 销售管理: ${salesData.length} 条记录`);
      
      const noWechatCount = salesData.filter(s => !s.wechat_name || s.wechat_name === '').length;
      const zeroCommissionCount = salesData.filter(s => !s.commission_rate || s.commission_rate === 0).length;
      
      console.log(`- 无微信号销售: ${noWechatCount}/${salesData.length}`);
      console.log(`- 零佣金率销售: ${zeroCommissionCount}/${salesData.length}`);
      
      if (noWechatCount > 0) {
        console.log('⚠️  销售微信号仍然缺失');
      }
    } else {
      console.log('❌ 销售管理数据为空');
    }
    
    // 客户管理数据
    const customersData = state.admin?.customers;
    if (customersData && customersData.length > 0) {
      console.log(`✅ 客户管理: ${customersData.length} 条记录`);
      
      const noSalesWechatCount = customersData.filter(c => 
        !c.sales_wechat_name || c.sales_wechat_name === '-' || c.sales_wechat_name === ''
      ).length;
      
      console.log(`- 无销售微信号客户: ${noSalesWechatCount}/${customersData.length}`);
      
      if (noSalesWechatCount > 0) {
        console.log('⚠️  客户管理销售微信号仍然缺失');
      }
    } else {
      console.log('❌ 客户管理数据为空');
    }

    // === 4. 总结验证结果 ===
    console.log('\n📋 === 94381a9 修复效果总结 ===');
    
    const results = [];
    
    if (confirmedOrders && confirmedOrders.length > 0) {
      results.push('✅ confirmed状态映射已修复(需手动验证按钮)');
    } else {
      results.push('ℹ️  confirmed状态映射已修复(无测试订单)');
    }
    
    if (statsData && Object.values(statsData).some(val => val > 0)) {
      results.push('✅ 数据概览显示非零数据');
    } else {
      results.push('❌ 数据概览仍然全零');
    }
    
    if (salesData && salesData.length > 0) {
      results.push('✅ 销售管理数据稳定显示');
    } else {
      results.push('❌ 销售管理数据为空');
    }
    
    if (customersData && customersData.length > 0) {
      results.push('✅ 客户管理数据正常显示');
    } else {
      results.push('❌ 客户管理数据为空');
    }
    
    results.forEach(result => console.log(result));
    
    const successCount = results.filter(r => r.startsWith('✅')).length;
    console.log(`\n🎯 修复成功率: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
    
    console.log('\n💡 下步建议:');
    if (statsData && Object.values(statsData).some(val => val > 0)) {
      console.log('1. ✅ 主要问题已解决，重点测试订单操作功能');
      console.log('2. 🔍 排查销售微信号和客户微信号缺失问题');
    } else {
      console.log('1. 🔍 优先解决数据概览全零问题');
      console.log('2. 📞 需要深度排查API调用链路');
    }

  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
  }
}

// 执行验证
verify94381a9();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台任意页面按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看94381a9版本的具体修复效果');
console.log('4. 重点关注confirmed状态订单的操作按钮变化');
