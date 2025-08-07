// 🔍深度诊断数据问题根源.js
// 专门诊断数据概览0、销售数据不稳定、客户管理空值问题

console.log('=== 深度诊断数据问题根源 ===\n');

async function deepDiagnosis() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // 1. 数据概览问题诊断
    console.log('📊 === 数据概览问题诊断 ===');
    const statsData = state.admin?.stats;
    console.log('Redux中的stats:', statsData);
    
    if (window.supabaseClient) {
      // 手动查询订单统计
      const { data: allOrders, error: ordersError } = await window.supabaseClient
        .from('orders')
        .select('*');
      
      if (ordersError) {
        console.log('❌ 查询订单失败:', ordersError);
      } else {
        console.log(`✅ 实际订单数据: ${allOrders.length} 个订单`);
        
        // 手动计算统计
        const today = new Date().toDateString();
        const todayOrders = allOrders.filter(order => 
          new Date(order.created_at).toDateString() === today
        ).length;
        
        const statusCounts = {
          total: allOrders.length,
          today: todayOrders,
          pending_payment: allOrders.filter(o => ['pending_payment', 'pending', 'pending_review'].includes(o.status)).length,
          confirmed_payment: allOrders.filter(o => ['confirmed_payment', 'confirmed'].includes(o.status)).length,
          pending_config: allOrders.filter(o => o.status === 'pending_config').length,
          confirmed_config: allOrders.filter(o => o.status === 'confirmed_configuration').length
        };
        
        console.log('💡 手动计算的统计:', statusCounts);
        console.log('🔍 Redux统计 vs 手动统计对比:');
        console.log(`- 总订单: Redux=${statsData?.total_orders || 0}, 实际=${statusCounts.total}`);
        console.log(`- 今日订单: Redux=${statsData?.today_orders || 0}, 实际=${statusCounts.today}`);
        console.log(`- 待付款: Redux=${statsData?.pending_payment || 0}, 实际=${statusCounts.pending_payment}`);
        
        if (statsData?.total_orders === 0 && statusCounts.total > 0) {
          console.log('❌ 问题确认: Redux统计为0但实际有数据，getStats API有问题');
        }
      }
    }

    // 2. 销售管理数据稳定性诊断
    console.log('\n👥 === 销售管理数据稳定性诊断 ===');
    const salesData = state.admin?.sales;
    console.log('Redux中的sales:', salesData?.length || 0, '条记录');
    
    if (window.supabaseClient) {
      // 手动查询销售数据
      const { data: primarySales } = await window.supabaseClient.from('primary_sales').select('*');
      const { data: secondarySales } = await window.supabaseClient.from('secondary_sales').select('*');
      
      console.log(`✅ 实际销售数据: 一级${primarySales?.length || 0}个, 二级${secondarySales?.length || 0}个`);
      console.log(`🔍 Redux销售 vs 实际销售: Redux=${salesData?.length || 0}, 实际=${(primarySales?.length || 0) + (secondarySales?.length || 0)}`);
      
      if (!salesData || salesData.length === 0) {
        console.log('❌ 问题确认: Redux销售数据为空但实际有数据，getSales API有问题');
        
        // 测试缓存问题
        console.log('🔍 检查缓存状态...');
        if (window.CacheManager) {
          const cached = window.CacheManager.get('admin-sales');
          console.log('销售数据缓存:', cached ? '有缓存' : '无缓存');
        }
      } else {
        // 检查销售数据质量
        console.log('🔍 检查销售数据质量:');
        salesData.slice(0, 3).forEach((sale, index) => {
          console.log(`销售${index + 1}:`, {
            name: sale.name || sale.wechat_name,
            sales_type: sale.sales_type,
            total_orders: sale.total_orders,
            commission_amount: sale.commission_amount,
            hierarchy_info: sale.hierarchy_info
          });
        });
      }
    }

    // 3. 客户管理空值问题诊断
    console.log('\n👤 === 客户管理空值问题诊断 ===');
    const customersData = state.admin?.customers;
    console.log('Redux中的customers:', customersData?.length || 0, '条记录');
    
    if (customersData && customersData.length > 0) {
      console.log('🔍 检查客户数据质量:');
      customersData.slice(0, 5).forEach((customer, index) => {
        console.log(`客户${index + 1}:`, {
          customer_name: customer.customer_name,
          sales_wechat_name: customer.sales_wechat_name,
          total_orders: customer.total_orders,
          actual_payment_amount: customer.actual_payment_amount,
          原始数据字段: Object.keys(customer)
        });
        
        if (!customer.sales_wechat_name || customer.sales_wechat_name === '-') {
          console.log(`❌ 客户${index + 1}的sales_wechat_name为空`);
        }
        if (!customer.total_orders || customer.total_orders === 0) {
          console.log(`❌ 客户${index + 1}的total_orders为空或0`);
        }
      });
    } else {
      console.log('❌ 客户数据完全为空');
    }

    // 4. API调用流程诊断
    console.log('\n🌐 === API调用流程诊断 ===');
    console.log('admin loading状态:', state.admin?.loading);
    console.log('admin error状态:', state.admin?.error);
    
    // 5. 检查数据关联逻辑
    console.log('\n🔗 === 数据关联逻辑诊断 ===');
    if (window.supabaseClient) {
      const { data: ordersWithSales } = await window.supabaseClient
        .from('orders')
        .select('id, sales_code, primary_sales_id, secondary_sales_id, customer_name')
        .limit(5);
      
      console.log('订单关联情况样本:');
      ordersWithSales?.forEach((order, index) => {
        console.log(`订单${index + 1}:`, {
          id: order.id,
          sales_code: order.sales_code,
          primary_sales_id: order.primary_sales_id,
          secondary_sales_id: order.secondary_sales_id,
          customer_name: order.customer_name,
          关联完整性: !!(order.sales_code || order.primary_sales_id || order.secondary_sales_id)
        });
      });
    }

    // 6. 总结问题类型
    console.log('\n📋 === 问题总结 ===');
    const issues = [];
    
    if (!statsData || Object.values(statsData).every(val => val === 0)) {
      issues.push('❌ 数据概览全零 - getStats API问题');
    }
    
    if (!salesData || salesData.length === 0) {
      issues.push('❌ 销售管理数据空 - getSales API问题或缓存问题');
    }
    
    if (!customersData || customersData.length === 0) {
      issues.push('❌ 客户管理数据空 - getCustomers API问题');
    } else {
      const hasEmptyWechat = customersData.some(c => !c.sales_wechat_name || c.sales_wechat_name === '-');
      const hasEmptyOrders = customersData.some(c => !c.total_orders || c.total_orders === 0);
      if (hasEmptyWechat) issues.push('❌ 客户管理销售微信号空值 - 数据关联问题');
      if (hasEmptyOrders) issues.push('❌ 客户管理总订单数空值 - 数据聚合问题');
    }
    
    console.log('发现的问题:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\n💡 建议修复策略:');
    console.log('1. 检查AdminAPI的getStats/getSales/getCustomers方法');
    console.log('2. 验证SupabaseService的数据查询和聚合逻辑');
    console.log('3. 确认Redux action调用和数据处理流程');
    console.log('4. 排查缓存机制影响');
    console.log('5. 修复数据关联和聚合计算');

  } catch (error) {
    console.error('❌ 诊断过程发生错误:', error);
  }
}

// 执行诊断
deepDiagnosis();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台数据概览页面按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看详细的问题根源分析');
