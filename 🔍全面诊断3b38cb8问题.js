// 🔍全面诊断3b38cb8问题.js
// 诊断订单状态、操作逻辑、数据空值等问题

console.log('=== 全面诊断 3b38cb8 部署问题 ===\n');

async function comprehensiveDiagnosis() {
  try {
    // 1. 检查Redux Store
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用 - 请在管理后台页面运行此脚本');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // 2. 检查原始订单数据
    console.log('📋 检查原始订单数据:');
    if (window.supabaseClient) {
      const { data: rawOrders, error } = await window.supabaseClient
        .from('orders')
        .select('*')
        .limit(10);
      
      if (error) {
        console.log('❌ 查询订单失败:', error);
      } else {
        console.log(`✅ 查询到 ${rawOrders.length} 个订单样本:`);
        rawOrders.forEach((order, index) => {
          console.log(`订单${index + 1}:`, {
            id: order.id,
            status: order.status,
            sales_code: order.sales_code,
            primary_sales_id: order.primary_sales_id,
            secondary_sales_id: order.secondary_sales_id,
            sales_type: order.sales_type
          });
        });
        
        // 统计所有可能的状态值
        const allStatuses = [...new Set(rawOrders.map(o => o.status))];
        console.log('\n🏷️  数据库中实际的订单状态:', allStatuses);
      }
    }

    // 3. 检查订单管理页面数据
    console.log('\n📊 检查订单管理页面数据:');
    const adminOrders = state.admin?.orders;
    if (adminOrders && adminOrders.length > 0) {
      console.log(`✅ 订单管理加载了 ${adminOrders.length} 个订单`);
      
      // 检查前几个订单的详细信息
      adminOrders.slice(0, 3).forEach((order, index) => {
        console.log(`处理后订单${index + 1}:`, {
          id: order.id,
          原始状态: order.status,
          销售微信号: order.sales_wechat_name,
          生效时间: order.effective_time,
          到期时间: order.expiry_time,
          关联信息: {
            sales_code: order.sales_code,
            primary_sales_id: order.primary_sales_id,
            secondary_sales_id: order.secondary_sales_id
          }
        });
      });
    } else {
      console.log('❌ 订单管理数据为空');
    }

    // 4. 检查销售管理数据
    console.log('\n👥 检查销售管理数据:');
    const salesData = state.admin?.sales;
    if (salesData && salesData.length > 0) {
      console.log(`✅ 销售管理加载了 ${salesData.length} 条记录`);
      salesData.slice(0, 3).forEach((sale, index) => {
        console.log(`销售${index + 1}:`, {
          name: sale.name || sale.wechat_name,
          sales_type: sale.sales_type,
          hierarchy_info: sale.hierarchy_info,
          total_orders: sale.total_orders,
          commission_amount: sale.commission_amount
        });
      });
    } else {
      console.log('❌ 销售管理数据为空');
      
      // 检查Redux中sales slice的状态
      console.log('Redux sales state:', state.admin);
    }

    // 5. 检查客户管理数据
    console.log('\n👤 检查客户管理数据:');
    const customersData = state.admin?.customers;
    if (customersData && customersData.length > 0) {
      console.log(`✅ 客户管理加载了 ${customersData.length} 条记录`);
      customersData.slice(0, 3).forEach((customer, index) => {
        console.log(`客户${index + 1}:`, {
          name: customer.customer_name,
          销售微信号: customer.sales_wechat_name,
          总订单数: customer.total_orders,
          实付金额: customer.actual_payment_amount
        });
      });
    } else {
      console.log('❌ 客户管理数据为空');
    }

    // 6. 检查数据概览统计
    console.log('\n📈 检查数据概览统计:');
    const statsData = state.admin?.stats;
    if (statsData) {
      console.log('统计数据:', statsData);
      
      // 检查是否全为零
      const allZero = Object.values(statsData).every(val => val === 0);
      if (allZero) {
        console.log('❌ 所有统计数据为零');
        
        // 手动计算统计
        if (window.supabaseClient) {
          const { data: allOrders } = await window.supabaseClient
            .from('orders')
            .select('*');
          
          if (allOrders) {
            console.log('🔧 手动统计验证:');
            console.log(`- 数据库总订单数: ${allOrders.length}`);
            
            const today = new Date().toDateString();
            const todayOrders = allOrders.filter(order => 
              new Date(order.created_at).toDateString() === today
            ).length;
            console.log(`- 今日订单数: ${todayOrders}`);
            
            const statusCounts = {};
            allOrders.forEach(order => {
              statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
            });
            console.log('- 状态分布:', statusCounts);
          }
        }
      } else {
        console.log('✅ 统计数据已更新');
      }
    } else {
      console.log('❌ 统计数据为空');
    }

    // 7. 检查订单状态操作逻辑
    console.log('\n🔧 检查订单状态操作逻辑:');
    console.log('需求文档4.3.1规定:');
    console.log('- 待付款确认状态 → 显示"付款确认"按钮');
    console.log('- 待配置确认状态 → 显示"配置确认"按钮');
    
    if (adminOrders && adminOrders.length > 0) {
      console.log('\n当前订单状态与按钮映射检查:');
      adminOrders.slice(0, 5).forEach((order, index) => {
        let expectedButton = '未知';
        const status = order.status;
        
        if (['pending_payment', 'pending', 'pending_review'].includes(status)) {
          expectedButton = '付款确认';
        } else if (status === 'confirmed_payment' || status === 'confirmed') {
          expectedButton = '配置确认';
        } else if (status === 'pending_config') {
          expectedButton = '配置确认';
        }
        
        console.log(`订单${order.id}: 状态=${status} → 应显示"${expectedButton}"按钮`);
      });
    }

    // 8. 检查API调用状态
    console.log('\n🌐 检查API调用状态:');
    console.log('admin loading状态:', state.admin?.loading);
    console.log('admin error状态:', state.admin?.error);

    // 9. 问题总结
    console.log('\n📋 问题总结:');
    const issues = [];
    
    if (!salesData || salesData.length === 0) {
      issues.push('❌ 销售管理数据为空');
    }
    
    if (!customersData || customersData.length === 0) {
      issues.push('❌ 客户管理数据为空');
    }
    
    if (statsData && Object.values(statsData).every(val => val === 0)) {
      issues.push('❌ 数据概览全为零');
    }
    
    if (issues.length > 0) {
      console.log('发现问题:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ 主要数据加载正常');
    }

    console.log('\n💡 建议排查方向:');
    console.log('1. 检查AdminAPI的数据获取逻辑');
    console.log('2. 验证Supabase查询权限');
    console.log('3. 确认Redux action调用时机');
    console.log('4. 检查数据关联逻辑的正确性');

  } catch (error) {
    console.error('❌ 诊断过程发生错误:', error);
  }
}

// 执行诊断
comprehensiveDiagnosis();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台任意页面按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看详细诊断结果');
