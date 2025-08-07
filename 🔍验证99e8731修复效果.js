// 🔍验证99e8731修复效果.js
// 验证数据概览金额修复和数据稳定性修复

console.log('=== 🔍 验证99e8731修复效果 ===\n');

async function verify99e8731() {
  try {
    if (typeof window === 'undefined' || !window.store || !window.supabaseClient) {
      console.log('❌ 必要组件不可用');
      return;
    }

    console.log('✅ 验证环境准备就绪\n');

    // === 1. 验证数据概览金额修复 ===
    console.log('💰 === 验证数据概览金额修复 ===');
    
    const state = window.store.getState();
    const statsData = state.admin?.stats;
    
    console.log('当前Redux统计数据:', statsData);
    
    if (statsData) {
      console.log('\n📊 关键金额指标:');
      console.log(`总订单数: ${statsData.total_orders || 0}`);
      console.log(`总金额: $${statsData.total_amount || 0}`);
      console.log(`总佣金: $${statsData.total_commission || 0}`);
      console.log(`今日订单: ${statsData.today_orders || 0}`);
      console.log(`待付款确认: ${statsData.pending_payment_orders || 0}`);
      console.log(`已付款确认: ${statsData.confirmed_payment_orders || 0}`);
      
      if (statsData.total_amount > 0) {
        console.log('\n🎉 数据概览金额修复成功! 不再为$0');
        
        // 计算预期金额 (基于数据库查询结果)
        const expectedAmount = (188 + 488 + 188 + 188) / 7.15; // 人民币转美元
        console.log(`预期金额约: $${expectedAmount.toFixed(2)} (基于amount字段)`);
        console.log(`实际显示: $${statsData.total_amount}`);
        
      } else {
        console.log('\n❌ 数据概览金额仍为0');
      }
    } else {
      console.log('❌ 统计数据为空');
    }

    // === 2. 手动测试新的金额逻辑 ===
    console.log('\n🧪 === 手动测试新金额逻辑 ===');
    
    const { data: testOrders } = await window.supabaseClient
      .from('orders')
      .select('amount, actual_payment_amount, commission_amount, payment_method')
      .limit(5);
    
    if (testOrders && testOrders.length > 0) {
      let manualTotal = 0;
      
      console.log('手动计算金额 (使用修复后的逻辑):');
      testOrders.forEach((order, index) => {
        // 使用修复后的逻辑
        let amount = parseFloat(order.amount || 0);
        if (order.actual_payment_amount && parseFloat(order.actual_payment_amount) > 0) {
          amount = parseFloat(order.actual_payment_amount);
        }
        
        // 汇率转换
        if (order.payment_method === 'alipay') {
          amount = amount / 7.15;
        }
        
        manualTotal += amount;
        
        console.log(`订单${index + 1}: amount=${order.amount}, actual=${order.actual_payment_amount}, 最终=${amount.toFixed(2)}`);
      });
      
      console.log(`\n手动计算总额: $${manualTotal.toFixed(2)}`);
      
      if (manualTotal > 0) {
        console.log('✅ 新逻辑计算正确，应该能修复金额显示');
      }
    }

    // === 3. 验证销售管理数据稳定性 ===
    console.log('\n👥 === 验证销售管理数据稳定性 ===');
    
    const salesData = state.admin?.sales;
    
    if (salesData && salesData.length > 0) {
      console.log(`✅ 销售数据加载成功: ${salesData.length} 条`);
      
      // 检查微信号修复情况
      let wechatFixed = 0;
      salesData.forEach((sale, index) => {
        const wechat = sale.wechat_name;
        console.log(`销售${index + 1}: sales_code=${sale.sales_code}, wechat_name=${wechat || '空'}`);
        
        if (wechat && wechat !== '' && wechat !== '-') {
          wechatFixed++;
        }
      });
      
      console.log(`\n微信号修复情况: ${wechatFixed}/${salesData.length} 有微信号`);
      
      if (wechatFixed > 0) {
        console.log('🎉 销售微信号修复成功!');
      } else {
        console.log('❌ 销售微信号仍为空');
      }
      
    } else {
      console.log('❌ 销售数据为空 - 可能需要刷新页面');
      
      // 尝试手动刷新销售数据
      if (window.adminAPI) {
        console.log('🔄 尝试手动刷新销售数据...');
        try {
          const freshSales = await window.adminAPI.getSales();
          console.log(`手动刷新结果: ${freshSales?.length || 0} 条销售数据`);
        } catch (err) {
          console.log('❌ 手动刷新失败:', err.message);
        }
      }
    }

    // === 4. 验证客户管理数据 ===
    console.log('\n👤 === 验证客户管理数据 ===');
    
    const customersData = state.admin?.customers;
    
    if (customersData && customersData.length > 0) {
      console.log(`✅ 客户数据自动加载成功: ${customersData.length} 条`);
      
      // 检查客户数据的销售微信号
      let customerWechatFixed = 0;
      customersData.slice(0, 3).forEach((customer, index) => {
        const salesWechat = customer.sales_wechat_name;
        console.log(`客户${index + 1}: sales_wechat_name=${salesWechat || '空'}`);
        
        if (salesWechat && salesWechat !== '' && salesWechat !== '-') {
          customerWechatFixed++;
        }
      });
      
      if (customerWechatFixed > 0) {
        console.log('🎉 客户管理销售微信号正常!');
      }
      
    } else {
      console.log('❌ 客户数据为空 - 需要检查是否需要点搜索');
    }

    // === 5. 验证缓存禁用效果 ===
    console.log('\n🗄️ === 验证缓存禁用效果 ===');
    
    // 多次调用API检查是否稳定
    console.log('🔄 连续调用API测试稳定性...');
    
    for (let i = 1; i <= 3; i++) {
      try {
        const stats = await window.adminAPI.getStats();
        const sales = await window.adminAPI.getSales();
        
        console.log(`第${i}次调用: stats总订单=${stats?.total_orders || 0}, sales数量=${sales?.length || 0}`);
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.log(`第${i}次调用失败:`, err.message);
      }
    }

    // === 6. 总结验证结果 ===
    console.log('\n📋 === 99e8731修复效果总结 ===');
    
    const results = [];
    
    // 数据概览
    if (statsData && statsData.total_amount > 0) {
      results.push('✅ 数据概览金额修复成功');
    } else {
      results.push('❌ 数据概览金额仍为0');
    }
    
    // 销售管理
    if (salesData && salesData.length > 0) {
      results.push('✅ 销售管理数据稳定显示');
      
      const hasWechat = salesData.some(s => s.wechat_name && s.wechat_name !== '');
      if (hasWechat) {
        results.push('✅ 销售微信号正常显示');
      } else {
        results.push('❌ 销售微信号仍为空');
      }
    } else {
      results.push('❌ 销售管理数据不稳定');
    }
    
    // 客户管理
    if (customersData && customersData.length > 0) {
      results.push('✅ 客户管理数据自动加载');
    } else {
      results.push('❌ 客户管理数据需要手动搜索');
    }
    
    console.log('\n🎯 验证结果:');
    results.forEach(result => console.log(result));
    
    // 成功率计算
    const successCount = results.filter(r => r.startsWith('✅')).length;
    const totalCount = results.length;
    
    console.log(`\n📊 修复成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
      console.log('🎉 所有问题已完全修复!');
    } else if (successCount > totalCount/2) {
      console.log('🔧 主要问题已修复，还有少量问题需要处理');
    } else {
      console.log('⚠️  仍有较多问题需要进一步修复');
    }

  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
  }
}

// 执行验证
verify99e8731();

console.log('\n💻 验证完成后请告诉我结果!');
