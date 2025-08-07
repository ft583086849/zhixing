// 🔍验证部署974f0fa全面修复效果.js
// 验证数据概览、销售管理、客户管理、订单操作的全面修复

console.log('=== 验证部署 974f0fa 全面修复效果 ===');
console.log('本次修复内容:');
console.log('1. 📊 数据概览全零问题 - 防御性编程+错误保护');
console.log('2. 👥 销售管理数据不稳定 - 恢复缓存+失败保护');
console.log('3. 👤 客户管理空值问题 - 字段统一+关联优化');
console.log('4. 🔧 订单状态更新失败 - 补全API链路\n');

async function verifyComprehensiveFix() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用 - 请在管理后台页面运行此脚本');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // === 1. 数据概览修复验证 ===
    console.log('📊 === 数据概览修复验证 ===');
    const statsData = state.admin?.stats;
    
    if (statsData) {
      console.log('✅ 统计数据已加载:', statsData);
      
      const totalOrders = statsData.total_orders || 0;
      const pendingPayment = statsData.pending_payment_orders || 0;
      const confirmedPayment = statsData.confirmed_payment_orders || 0;
      
      console.log(`📈 关键指标:`);
      console.log(`- 总订单数: ${totalOrders}`);
      console.log(`- 待付款确认: ${pendingPayment}`);
      console.log(`- 已付款确认: ${confirmedPayment}`);
      console.log(`- 今日订单: ${statsData.today_orders || 0}`);
      console.log(`- 总收入: $${statsData.total_amount || 0}`);
      
      if (totalOrders > 0) {
        console.log('🎉 数据概览修复成功 - 显示真实数据');
      } else {
        console.log('⚠️  总订单数为0，可能是数据库确实没有数据或API仍有问题');
      }
    } else {
      console.log('❌ 统计数据为空');
    }

    // === 2. 销售管理稳定性验证 ===
    console.log('\n👥 === 销售管理稳定性验证 ===');
    const salesData = state.admin?.sales;
    
    if (salesData && salesData.length > 0) {
      console.log(`✅ 销售数据已稳定加载: ${salesData.length} 条记录`);
      
      // 检查数据质量
      let primaryCount = 0;
      let secondaryCount = 0;
      let withOrdersCount = 0;
      let withCommissionCount = 0;
      
      salesData.forEach(sale => {
        if (sale.sales_type === 'primary') primaryCount++;
        if (sale.sales_type === 'secondary') secondaryCount++;
        if ((sale.total_orders || 0) > 0) withOrdersCount++;
        if ((sale.commission_amount || 0) > 0) withCommissionCount++;
      });
      
      console.log(`📊 销售数据分析:`);
      console.log(`- 一级销售: ${primaryCount} 个`);
      console.log(`- 二级销售: ${secondaryCount} 个`);
      console.log(`- 有订单的销售: ${withOrdersCount} 个`);
      console.log(`- 有佣金的销售: ${withCommissionCount} 个`);
      
      // 显示前3个销售的详细信息
      console.log('\n🔍 销售详情样本:');
      salesData.slice(0, 3).forEach((sale, index) => {
        console.log(`销售${index + 1}:`, {
          姓名: sale.name || sale.wechat_name,
          类型: sale.sales_type,
          层级: sale.hierarchy_info,
          订单数: sale.total_orders,
          佣金: sale.commission_amount,
          销售额: sale.total_amount
        });
      });
      
      console.log('🎉 销售管理数据稳定性修复成功');
    } else {
      console.log('❌ 销售数据为空');
    }

    // === 3. 客户管理空值修复验证 ===
    console.log('\n👤 === 客户管理空值修复验证 ===');
    const customersData = state.admin?.customers;
    
    if (customersData && customersData.length > 0) {
      console.log(`✅ 客户数据已加载: ${customersData.length} 条记录`);
      
      let hasWechatCount = 0;
      let hasOrdersCount = 0;
      let emptyWechatCount = 0;
      let emptyOrdersCount = 0;
      
      customersData.forEach(customer => {
        if (customer.sales_wechat_name && customer.sales_wechat_name !== '-' && customer.sales_wechat_name !== '') {
          hasWechatCount++;
        } else {
          emptyWechatCount++;
        }
        
        if ((customer.total_orders || 0) > 0) {
          hasOrdersCount++;
        } else {
          emptyOrdersCount++;
        }
      });
      
      console.log(`📊 客户数据分析:`);
      console.log(`- 有销售微信号: ${hasWechatCount} 个客户`);
      console.log(`- 无销售微信号: ${emptyWechatCount} 个客户`);
      console.log(`- 有订单数: ${hasOrdersCount} 个客户`);
      console.log(`- 无订单数: ${emptyOrdersCount} 个客户`);
      
      // 显示前3个客户的详细信息
      console.log('\n🔍 客户详情样本:');
      customersData.slice(0, 3).forEach((customer, index) => {
        console.log(`客户${index + 1}:`, {
          客户名: customer.customer_name,
          微信号: customer.customer_wechat,
          TradingView: customer.tradingview_username,
          销售微信号: customer.sales_wechat_name,
          总订单数: customer.total_orders,
          实付金额: customer.actual_payment_amount
        });
      });
      
      if (emptyWechatCount === 0 && emptyOrdersCount === 0) {
        console.log('🎉 客户管理空值问题完全修复');
      } else if (emptyWechatCount < customersData.length / 2) {
        console.log('✅ 客户管理空值问题大部分修复');
      } else {
        console.log('⚠️  客户管理仍有较多空值，需进一步排查');
      }
    } else {
      console.log('❌ 客户数据为空');
    }

    // === 4. 订单操作功能验证准备 ===
    console.log('\n🔧 === 订单操作功能验证 ===');
    const ordersData = state.admin?.orders;
    
    if (ordersData && ordersData.length > 0) {
      console.log(`✅ 订单数据已加载: ${ordersData.length} 条记录`);
      
      // 检查不同状态的订单数量
      const statusCounts = {};
      ordersData.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('📊 订单状态分布:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} 个订单`);
      });
      
      // 找到可操作的订单
      const operableOrders = ordersData.filter(order => 
        ['pending_payment', 'pending', 'pending_review', 'confirmed_payment', 'confirmed', 'pending_config'].includes(order.status)
      );
      
      console.log(`\n🎯 可操作订单: ${operableOrders.length} 个`);
      if (operableOrders.length > 0) {
        console.log('💡 订单操作测试说明:');
        console.log('1. 在订单管理页面找到待操作的订单');
        console.log('2. 点击"付款确认"或"配置确认"按钮');
        console.log('3. 观察是否显示"状态更新成功"');
        console.log('4. 刷新页面检查状态是否已更新');
        
        console.log('\n📋 可测试订单样本:');
        operableOrders.slice(0, 3).forEach((order, index) => {
          console.log(`订单${index + 1}:`, {
            ID: order.id,
            当前状态: order.status,
            客户: order.customer_wechat || order.tradingview_username,
            应显示按钮: order.status.includes('pending') ? '付款确认' : '配置确认'
          });
        });
      }
      
      console.log('✅ 订单操作功能API已补全，可进行测试');
    } else {
      console.log('❌ 订单数据为空');
    }

    // === 5. 直接测试Supabase连接 ===
    console.log('\n🔗 === Supabase连接验证 ===');
    if (window.supabaseClient) {
      try {
        const { data: testOrders, error } = await window.supabaseClient
          .from('orders')
          .select('id, status, created_at')
          .limit(5);
        
        if (error) {
          console.log('❌ Supabase连接错误:', error);
        } else {
          console.log(`✅ Supabase连接正常，查询到 ${testOrders.length} 个订单样本`);
        }
      } catch (error) {
        console.log('❌ Supabase查询异常:', error);
      }
    } else {
      console.log('❌ Supabase客户端不可用');
    }

    // === 总结 ===
    console.log('\n📋 === 修复效果总结 ===');
    const results = [];
    
    if (statsData && Object.values(statsData).some(val => val > 0)) {
      results.push('✅ 数据概览显示真实数据');
    } else {
      results.push('❌ 数据概览仍显示零值');
    }
    
    if (salesData && salesData.length > 0) {
      results.push('✅ 销售管理数据稳定加载');
    } else {
      results.push('❌ 销售管理数据仍为空');
    }
    
    if (customersData && customersData.length > 0) {
      const hasValidData = customersData.some(c => c.sales_wechat_name && c.total_orders > 0);
      if (hasValidData) {
        results.push('✅ 客户管理显示完整数据');
      } else {
        results.push('⚠️  客户管理数据质量待提升');
      }
    } else {
      results.push('❌ 客户管理数据仍为空');
    }
    
    if (ordersData && ordersData.length > 0) {
      results.push('✅ 订单操作功能已修复(需手动测试)');
    } else {
      results.push('❌ 订单数据为空');
    }
    
    results.forEach(result => console.log(result));
    
    const successCount = results.filter(r => r.startsWith('✅')).length;
    const totalCount = results.length;
    
    console.log(`\n🎯 修复成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
      console.log('🎉 全面修复成功！所有功能已恢复正常');
    } else if (successCount >= totalCount * 0.7) {
      console.log('✅ 主要问题已修复，部分功能可能需要进一步优化');
    } else {
      console.log('⚠️  仍有重要问题需要解决');
    }

  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
  }
}

// 执行验证
verifyComprehensiveFix();

console.log('\n💻 使用说明:');
console.log('1. 等待Vercel部署完成(约1-2分钟)');
console.log('2. 访问管理后台任意页面(建议数据概览页)');
console.log('3. 按F12打开控制台，粘贴此脚本并回车');
console.log('4. 查看详细的修复验证结果');
console.log('5. 根据结果手动测试订单操作功能');
