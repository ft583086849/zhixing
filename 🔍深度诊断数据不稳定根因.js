// 🔍深度诊断数据不稳定根因.js
// 全面诊断页面慢、数据空、不稳定的根本原因

console.log('=== 深度诊断数据不稳定根因 ===\n');

async function diagnosisDataIssues() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // === 1. 性能和加载问题诊断 ===
    console.log('⏱️ === 性能和加载问题诊断 ===');
    
    console.log('🔍 Redux状态检查:');
    console.log(`- admin.loading: ${state.admin?.loading}`);
    console.log(`- admin.error: ${state.admin?.error}`);
    console.log(`- 订单数据量: ${state.admin?.orders?.length || 0}`);
    console.log(`- 销售数据量: ${state.admin?.sales?.length || 0}`);
    console.log(`- 客户数据量: ${state.admin?.customers?.length || 0}`);
    
    // 检查是否有无限加载
    if (state.admin?.loading) {
      console.log('⚠️  当前仍在加载中，可能存在无限加载问题');
    }

    // === 2. 数据概览问题深度诊断 ===
    console.log('\n📊 === 数据概览问题深度诊断 ===');
    
    const statsData = state.admin?.stats;
    console.log('Redux stats:', statsData);
    
    // 手动测试getStats API
    console.log('\n🧪 手动测试AdminAPI.getStats():');
    
    try {
      // 检查是否有adminAPI
      if (window.adminAPI) {
        console.log('✅ window.adminAPI 可用');
        const startTime = Date.now();
        const apiStats = await window.adminAPI.getStats();
        const endTime = Date.now();
        
        console.log(`⏱️  getStats调用耗时: ${endTime - startTime}ms`);
        console.log('🔍 getStats返回结果:', apiStats);
        console.log('🔍 返回数据类型:', typeof apiStats);
        
        if (apiStats && typeof apiStats === 'object') {
          console.log('📈 API统计数据:');
          Object.entries(apiStats).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        }
      } else {
        console.log('❌ window.adminAPI 不可用');
        
        // 检查导入的API
        if (typeof adminAPI !== 'undefined') {
          console.log('✅ adminAPI 在全局可用');
        } else {
          console.log('❌ adminAPI 在全局不可用');
        }
      }
    } catch (apiError) {
      console.log('❌ getStats API调用失败:', apiError);
      console.log('错误详情:', {
        name: apiError.name,
        message: apiError.message,
        stack: apiError.stack?.split('\n').slice(0, 3)
      });
    }

    // === 3. 订单状态更新问题诊断 ===
    console.log('\n🔧 === 订单状态更新问题诊断 ===');
    
    const ordersData = state.admin?.orders;
    if (ordersData && ordersData.length > 0) {
      console.log('🔍 查找可测试的订单:');
      
      // 查找不同状态的订单
      const testableOrders = ordersData.filter(order => 
        ['pending_payment', 'pending', 'confirmed', 'pending_config'].includes(order.status)
      ).slice(0, 5);
      
      testableOrders.forEach((order, index) => {
        console.log(`可测试订单${index + 1}:`, {
          ID: order.id,
          状态: order.status,
          时长: order.duration,
          客户: order.customer_wechat || order.tradingview_username
        });
      });
      
      // 检查7天免费订单
      const freeOrders = ordersData.filter(order => order.duration === '7days');
      console.log(`\n🎯 7天免费订单分析 (${freeOrders.length}个):`);
      
      const freeOrderStatuses = {};
      freeOrders.forEach(order => {
        const status = order.status;
        freeOrderStatuses[status] = (freeOrderStatuses[status] || 0) + 1;
      });
      
      Object.entries(freeOrderStatuses).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} 个`);
      });
      
      // 检查pending_payment状态的7天免费订单
      const freePendingPayment = freeOrders.filter(o => 
        ['pending_payment', 'pending', 'pending_review'].includes(o.status)
      );
      
      if (freePendingPayment.length > 0) {
        console.log(`⚠️  发现${freePendingPayment.length}个7天免费订单仍在待付款状态`);
        console.log('💡 这些订单应该直接跳过付款确认');
      } else {
        console.log('✅ 7天免费订单状态符合预期（无待付款状态）');
      }
      
      // 手动测试状态更新API
      if (testableOrders.length > 0 && window.adminAPI) {
        console.log('\n🧪 手动测试状态更新API:');
        const testOrder = testableOrders[0];
        console.log(`选择测试订单: ${testOrder.id} (${testOrder.status})`);
        
        try {
          // 注意：这里只是测试API是否存在，不实际更新
          console.log('🔍 检查updateOrderStatus方法是否存在...');
          if (typeof window.adminAPI.updateOrderStatus === 'function') {
            console.log('✅ updateOrderStatus方法存在');
          } else {
            console.log('❌ updateOrderStatus方法不存在');
          }
        } catch (methodError) {
          console.log('❌ updateOrderStatus方法检查失败:', methodError);
        }
      }
      
    } else {
      console.log('❌ 没有订单数据可供测试');
    }

    // === 4. 销售数据不稳定问题诊断 ===
    console.log('\n👥 === 销售数据不稳定问题诊断 ===');
    
    const salesData = state.admin?.sales;
    
    console.log('🔍 销售数据状态检查:');
    console.log(`- 销售数据: ${salesData?.length || 0} 条`);
    console.log(`- 数据类型: ${Array.isArray(salesData) ? 'Array' : typeof salesData}`);
    
    if (salesData && salesData.length > 0) {
      console.log('\n🔍 销售数据质量检查:');
      
      const dataQuality = {
        无微信号: 0,
        无姓名: 0,
        无销售ID: 0,
        无订单数: 0,
        无佣金: 0
      };
      
      salesData.forEach(sale => {
        if (!sale.wechat_name) dataQuality.无微信号++;
        if (!sale.name) dataQuality.无姓名++;
        if (!sale.id) dataQuality.无销售ID++;
        if (!sale.total_orders || sale.total_orders === 0) dataQuality.无订单数++;
        if (!sale.commission_amount || sale.commission_amount === 0) dataQuality.无佣金++;
      });
      
      console.log('📊 数据质量统计:');
      Object.entries(dataQuality).forEach(([issue, count]) => {
        console.log(`  ${issue}: ${count}/${salesData.length} (${Math.round(count/salesData.length*100)}%)`);
      });
      
      // 显示前3个销售的详细信息
      console.log('\n🔍 销售数据样本:');
      salesData.slice(0, 3).forEach((sale, index) => {
        console.log(`销售${index + 1}:`, {
          ID: sale.id,
          姓名: sale.name,
          微信号: sale.wechat_name,
          销售代码: sale.sales_code,
          订单数: sale.total_orders,
          佣金: sale.commission_amount,
          层级: sale.hierarchy_info
        });
      });
      
    } else {
      console.log('❌ 销售数据为空');
      
      // 手动测试getSales API
      console.log('\n🧪 手动测试AdminAPI.getSales():');
      try {
        if (window.adminAPI && typeof window.adminAPI.getSales === 'function') {
          const startTime = Date.now();
          const apiSales = await window.adminAPI.getSales();
          const endTime = Date.now();
          
          console.log(`⏱️  getSales调用耗时: ${endTime - startTime}ms`);
          console.log(`🔍 getSales返回数量: ${apiSales?.length || 0}`);
          
          if (apiSales && apiSales.length > 0) {
            console.log('✅ API返回了销售数据，但Redux中为空');
            console.log('💡 可能是Redux更新问题');
          } else {
            console.log('❌ API也返回空数据');
          }
        }
      } catch (salesApiError) {
        console.log('❌ getSales API调用失败:', salesApiError);
      }
    }

    // === 5. 客户数据搜索问题诊断 ===
    console.log('\n👤 === 客户数据搜索问题诊断 ===');
    
    const customersData = state.admin?.customers;
    console.log(`🔍 客户数据: ${customersData?.length || 0} 条`);
    
    if (!customersData || customersData.length === 0) {
      console.log('❌ 客户数据为空');
      console.log('💡 用户反馈: 点搜索后才出现数据');
      console.log('💡 可能原因: 初始加载时getCustomers没有被调用');
    }

    // === 6. Supabase连接状态检查 ===
    console.log('\n🔗 === Supabase连接状态检查 ===');
    
    if (window.supabaseClient) {
      console.log('✅ Supabase客户端可用');
      
      try {
        const startTime = Date.now();
        const { data: testQuery, error } = await window.supabaseClient
          .from('orders')
          .select('id')
          .limit(1);
        const endTime = Date.now();
        
        console.log(`⏱️  Supabase查询耗时: ${endTime - startTime}ms`);
        
        if (error) {
          console.log('❌ Supabase查询错误:', error);
        } else {
          console.log('✅ Supabase连接正常');
        }
      } catch (supabaseError) {
        console.log('❌ Supabase连接异常:', supabaseError);
      }
    } else {
      console.log('❌ Supabase客户端不可用');
    }

    // === 7. 缓存状态检查 ===
    console.log('\n💾 === 缓存状态检查 ===');
    
    if (window.CacheManager) {
      console.log('✅ CacheManager可用');
      
      // 检查关键缓存
      const cacheKeys = ['admin-stats', 'admin-sales', 'admin-customers', 'admin-orders'];
      cacheKeys.forEach(key => {
        const cached = window.CacheManager.get(key);
        console.log(`- ${key}: ${cached ? '有缓存' : '无缓存'}`);
      });
    } else {
      console.log('❌ CacheManager不可用');
    }

    // === 8. 总结问题严重性 ===
    console.log('\n📋 === 问题严重性总结 ===');
    
    const issues = [];
    
    if (state.admin?.loading) {
      issues.push('🔴 严重: 页面持续加载中');
    }
    
    if (!statsData || Object.values(statsData).every(v => v === 0)) {
      issues.push('🔴 严重: 数据概览全零');
    }
    
    if (!salesData || salesData.length === 0) {
      issues.push('🟡 中等: 销售数据为空');
    }
    
    if (!customersData || customersData.length === 0) {
      issues.push('🟡 中等: 客户数据为空');
    }
    
    if (salesData && salesData.some(s => !s.wechat_name)) {
      issues.push('🟡 中等: 销售微信号缺失');
    }
    
    console.log('发现问题:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\n🎯 修复优先级建议:');
    console.log('1. 🔴 立即修复: 页面加载和数据概览问题');
    console.log('2. 🟡 其次修复: 数据稳定性和关联问题');
    console.log('3. 🔵 最后优化: 性能和用户体验');

  } catch (error) {
    console.error('❌ 诊断过程发生错误:', error);
  }
}

// 执行诊断
diagnosisDataIssues();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台数据概览页面按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看详细的根因分析结果');
console.log('4. 根据优先级建议进行修复');
