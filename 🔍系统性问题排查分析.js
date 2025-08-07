// 🔍系统性问题排查分析.js
// 深度分析每个问题的根本原因和解法有效性

console.log('=== 系统性问题排查分析 ===\n');

async function systematicAnalysis() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // ========== 1. 数据概览全零问题深度分析 ==========
    console.log('📊 === 数据概览全零问题深度分析 ===');
    
    console.log('🔍 步骤1: 检查Redux中的统计数据');
    const statsData = state.admin?.stats;
    console.log('Redux stats:', statsData);
    
    if (window.supabaseClient) {
      console.log('\n🔍 步骤2: 直接查询数据库获取原始数据');
      const { data: rawOrders, error: ordersError } = await window.supabaseClient
        .from('orders')
        .select('*');
      
      if (ordersError) {
        console.log('❌ 数据库查询失败:', ordersError);
        console.log('💡 可能原因: Supabase权限、网络、API密钥问题');
      } else {
        console.log(`✅ 数据库原始数据: ${rawOrders.length} 个订单`);
        
        // 手动计算应该显示的统计
        const today = new Date().toDateString();
        const manualStats = {
          total: rawOrders.length,
          today: rawOrders.filter(o => new Date(o.created_at).toDateString() === today).length,
          pending_payment: rawOrders.filter(o => ['pending_payment', 'pending', 'pending_review'].includes(o.status)).length,
          confirmed_payment: rawOrders.filter(o => ['confirmed_payment', 'confirmed'].includes(o.status)).length,
          pending_config: rawOrders.filter(o => o.status === 'pending_config').length,
          confirmed_config: rawOrders.filter(o => o.status === 'confirmed_configuration').length
        };
        
        console.log('🧮 手动计算的统计:', manualStats);
        console.log('🔍 Redux vs 手动计算对比:');
        console.log(`- 总订单: Redux=${statsData?.total_orders || 0}, 应该=${manualStats.total}`);
        console.log(`- 今日订单: Redux=${statsData?.today_orders || 0}, 应该=${manualStats.today}`);
        console.log(`- 待付款: Redux=${statsData?.pending_payment_orders || 0}, 应该=${manualStats.pending_payment}`);
        
        if (manualStats.total > 0 && (statsData?.total_orders || 0) === 0) {
          console.log('❌ 确认问题: 数据库有数据但Redux为0');
          console.log('💡 可能原因:');
          console.log('  1. AdminAPI.getStats()调用失败');
          console.log('  2. SupabaseService.getOrderStats()返回格式错误');
          console.log('  3. Redux action处理错误');
          console.log('  4. 缓存返回了错误数据');
        }
        
        // 测试API调用
        console.log('\n🔍 步骤3: 测试API调用链路');
        try {
          if (window.adminAPI) {
            const apiStats = await window.adminAPI.getStats();
            console.log('AdminAPI.getStats()返回:', apiStats);
          } else {
            console.log('❌ window.adminAPI不可用');
          }
        } catch (apiError) {
          console.log('❌ AdminAPI.getStats()调用失败:', apiError);
        }
      }
    }

    // ========== 2. 订单状态与操作逻辑分析 ==========
    console.log('\n🔧 === 订单状态与操作逻辑分析 ===');
    
    const ordersData = state.admin?.orders;
    if (ordersData && ordersData.length > 0) {
      console.log(`📋 订单数据: ${ordersData.length} 个订单`);
      
      // 分析实际的订单状态分布
      const statusCounts = {};
      const statusMappingAnalysis = [];
      
      ordersData.forEach(order => {
        const status = order.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        // 分析状态与操作的匹配逻辑
        let expectedOperation = '';
        if (['pending_payment', 'pending', 'pending_review'].includes(status)) {
          expectedOperation = '付款确认';
        } else if (status === 'confirmed_payment' || status === 'confirmed') {
          expectedOperation = '配置确认';
        } else if (status === 'pending_config') {
          expectedOperation = '配置确认';
        } else {
          expectedOperation = '无操作';
        }
        
        statusMappingAnalysis.push({
          订单ID: order.id,
          原始状态: status,
          应显示操作: expectedOperation
        });
      });
      
      console.log('📊 实际订单状态分布:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} 个`);
      });
      
      console.log('\n🔍 状态映射分析(前5个订单):');
      statusMappingAnalysis.slice(0, 5).forEach(analysis => {
        console.log(analysis);
      });
      
      // 特别检查"已确认"状态
      const confirmedOrders = ordersData.filter(o => o.status === 'confirmed');
      if (confirmedOrders.length > 0) {
        console.log(`\n⚠️  发现${confirmedOrders.length}个'confirmed'状态订单`);
        console.log('💡 用户反馈: confirmed状态映射可能错误');
        console.log('🔍 confirmed状态订单样本:');
        confirmedOrders.slice(0, 3).forEach(order => {
          console.log(`  订单${order.id}: created=${order.created_at}, status=confirmed`);
        });
      }
    } else {
      console.log('❌ 没有订单数据');
    }

    // ========== 3. 销售管理微信号缺失分析 ==========
    console.log('\n👥 === 销售管理微信号缺失分析 ===');
    
    const salesData = state.admin?.sales;
    if (salesData && salesData.length > 0) {
      console.log(`📋 销售数据: ${salesData.length} 个销售`);
      
      let noWechatCount = 0;
      let noCommissionCount = 0;
      let noSalesIdCount = 0;
      
      console.log('\n🔍 销售数据质量分析:');
      salesData.slice(0, 5).forEach((sale, index) => {
        console.log(`销售${index + 1}:`, {
          ID: sale.id,
          销售代码: sale.sales_code,
          姓名: sale.name,
          微信号: sale.wechat_name,
          佣金率: sale.commission_rate,
          佣金金额: sale.commission_amount,
          总订单: sale.total_orders,
          层级信息: sale.hierarchy_info
        });
        
        if (!sale.wechat_name) noWechatCount++;
        if (!sale.commission_rate || sale.commission_rate === 0) noCommissionCount++;
        if (!sale.id) noSalesIdCount++;
      });
      
      console.log(`\n📊 问题统计:`);
      console.log(`- 无微信号: ${noWechatCount}/${salesData.length}`);
      console.log(`- 无佣金率: ${noCommissionCount}/${salesData.length}`);
      console.log(`- 无销售ID: ${noSalesIdCount}/${salesData.length}`);
      
      if (noWechatCount > 0) {
        console.log('❌ 问题确认: 销售微信号缺失');
        console.log('💡 可能原因:');
        console.log('  1. 数据库中wechat_name字段为空');
        console.log('  2. getSales()方法中字段映射错误');
        console.log('  3. 数据关联逻辑问题');
      }
    } else {
      console.log('❌ 没有销售数据');
    }

    // ========== 4. 客户管理微信号缺失分析 ==========
    console.log('\n👤 === 客户管理微信号缺失分析 ===');
    
    const customersData = state.admin?.customers;
    if (customersData && customersData.length > 0) {
      console.log(`📋 客户数据: ${customersData.length} 个客户`);
      
      let noSalesWechatCount = 0;
      
      console.log('\n🔍 客户销售微信号分析:');
      customersData.slice(0, 5).forEach((customer, index) => {
        const salesWechat = customer.sales_wechat_name;
        console.log(`客户${index + 1}:`, {
          客户名: customer.customer_name,
          客户微信: customer.customer_wechat,
          销售微信号: salesWechat,
          总订单数: customer.total_orders,
          是否缺失销售微信: !salesWechat || salesWechat === '-' || salesWechat === ''
        });
        
        if (!salesWechat || salesWechat === '-' || salesWechat === '') {
          noSalesWechatCount++;
        }
      });
      
      console.log(`\n📊 问题统计: ${noSalesWechatCount}/${customersData.length} 客户缺失销售微信号`);
      
      if (noSalesWechatCount > 0) {
        console.log('❌ 问题确认: 客户管理销售微信号缺失');
        console.log('💡 可能原因:');
        console.log('  1. getOrders()中销售关联失败');
        console.log('  2. getCustomers()中字段获取策略错误');
        console.log('  3. 订单数据中sales_wechat_name字段为空');
      }
    } else {
      console.log('❌ 没有客户数据');
    }

    // ========== 5. 检查原始数据关联情况 ==========
    if (window.supabaseClient) {
      console.log('\n🔗 === 原始数据关联情况检查 ===');
      
      // 检查订单与销售的关联情况
      const { data: orderSalesData } = await window.supabaseClient
        .from('orders')
        .select('id, sales_code, primary_sales_id, secondary_sales_id, customer_wechat, status')
        .limit(5);
      
      console.log('🔍 订单关联样本:');
      orderSalesData?.forEach((order, index) => {
        console.log(`订单${index + 1}:`, {
          ID: order.id,
          销售代码: order.sales_code,
          一级销售ID: order.primary_sales_id,
          二级销售ID: order.secondary_sales_id,
          客户微信: order.customer_wechat,
          状态: order.status
        });
      });
      
      // 检查销售表的实际数据
      const { data: primarySalesData } = await window.supabaseClient
        .from('primary_sales')
        .select('id, sales_code, name, wechat_name')
        .limit(3);
      
      const { data: secondarySalesData } = await window.supabaseClient
        .from('secondary_sales')
        .select('id, sales_code, name, wechat_name')
        .limit(3);
      
      console.log('\n🔍 一级销售原始数据样本:');
      primarySalesData?.forEach((sale, index) => {
        console.log(`一级销售${index + 1}:`, {
          ID: sale.id,
          销售代码: sale.sales_code,
          姓名: sale.name,
          微信号: sale.wechat_name
        });
      });
      
      console.log('\n🔍 二级销售原始数据样本:');
      secondarySalesData?.forEach((sale, index) => {
        console.log(`二级销售${index + 1}:`, {
          ID: sale.id,
          销售代码: sale.sales_code,
          姓名: sale.name,
          微信号: sale.wechat_name
        });
      });
    }

    // ========== 6. 解法有效性分析 ==========
    console.log('\n🔬 === 解法有效性分析 ===');
    
    console.log('📋 之前的解法回顾:');
    console.log('1. ef0e84a: 修复订单状态统计兼容性 - 部分有效');
    console.log('2. 3b38cb8: 重构销售管理数据逻辑 - 禁用缓存导致不稳定');
    console.log('3. 974f0fa: 全面错误处理优化 - 防护性但未解决根本问题');
    
    console.log('\n💡 问题根源分析:');
    console.log('1. 数据概览全零:');
    console.log('   - 可能是getStats API调用本身就失败了');
    console.log('   - 或者SupabaseService.getOrderStats()返回了错误格式');
    console.log('   - 需要检查API调用链路的每一环节');
    
    console.log('2. 销售微信号缺失:');
    console.log('   - 可能是数据库中wechat_name字段确实为空');
    console.log('   - 或者销售数据获取时字段映射错误');
    console.log('   - 需要检查原始数据库数据');
    
    console.log('3. 客户管理微信号缺失:');
    console.log('   - 可能是getOrders()中的销售关联逻辑失败');
    console.log('   - 或者getCustomers()中的字段获取策略错误');
    
    console.log('4. 订单状态操作不匹配:');
    console.log('   - confirmed状态可能被错误映射');
    console.log('   - 需要明确confirmed在业务逻辑中的具体含义');
    
    console.log('\n🎯 下步排查建议:');
    console.log('1. 直接测试AdminAPI.getStats()方法');
    console.log('2. 检查SupabaseService.getOrderStats()的具体返回值');
    console.log('3. 验证数据库中销售表的wechat_name字段');
    console.log('4. 明确confirmed状态的业务含义');
    console.log('5. 检查getOrders()中的销售关联逻辑');

  } catch (error) {
    console.error('❌ 系统性分析过程发生错误:', error);
  }
}

// 执行分析
systematicAnalysis();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台任意页面按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看详细的问题根源分析');
console.log('4. 根据分析结果确定下一步修复方向');
