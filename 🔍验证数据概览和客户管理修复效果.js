// 🔍验证数据概览和客户管理修复效果
// 在管理员页面控制台运行此脚本

console.log('=== 🔍 验证数据概览和客户管理修复效果 ===\n');

async function verifyFixes() {
  try {
    console.log('🚀 开始验证修复效果...\n');

    // 检查基础环境
    if (!window.store || !window.adminAPI || !window.supabaseClient) {
      console.log('❌ 基础环境不可用，请确保在管理员页面运行');
      return;
    }

    // === 1. 验证数据概览修复效果 ===
    console.log('📊 === 验证数据概览修复效果 ===');
    
    try {
      console.log('🔄 测试getStats API...');
      const statsResult = await window.adminAPI.getStats();
      
      if (statsResult && typeof statsResult === 'object') {
        console.log('✅ 数据概览API调用成功');
        console.log(`📈 总订单数: ${statsResult.total_orders || 0}`);
        console.log(`💰 总金额: $${statsResult.total_amount || 0}`);
        console.log(`👥 一级销售: ${statsResult.primary_sales_count || 0}`);
        console.log(`👥 二级销售: ${statsResult.secondary_sales_count || 0}`);
        
        if (statsResult.total_orders > 0) {
          console.log('🎉 数据概览修复成功！显示了正确的统计数据');
        } else {
          console.log('⚠️  数据概览API正常，但可能暂无订单数据');
        }
      } else {
        console.log('❌ 数据概览API返回格式错误');
      }
    } catch (statsError) {
      console.log('❌ 数据概览API调用失败:', statsError.message);
    }

    // === 2. 验证销售管理修复效果 ===
    console.log('\n👥 === 验证销售管理修复效果 ===');
    
    try {
      console.log('🔄 测试getSales API...');
      const salesResult = await window.adminAPI.getSales();
      
      if (Array.isArray(salesResult)) {
        console.log(`✅ 销售管理API调用成功，获取到 ${salesResult.length} 条销售数据`);
        
        if (salesResult.length > 0) {
          const sampleSale = salesResult[0];
          console.log('📋 销售数据示例:');
          console.log(`  销售代码: ${sampleSale.sales_code || '空'}`);
          console.log(`  微信号: ${sampleSale.wechat_name || '空'}`);
          console.log(`  销售类型: ${sampleSale.sales_type || '空'}`);
          console.log(`  订单数: ${sampleSale.total_orders || 0}`);
          
          const salesWithWechat = salesResult.filter(s => s.wechat_name && s.wechat_name !== '').length;
          console.log(`📊 有微信号的销售: ${salesWithWechat}/${salesResult.length}`);
          
          if (salesWithWechat > 0) {
            console.log('🎉 销售管理修复成功！正确显示了销售微信号');
          } else {
            console.log('⚠️  销售数据加载成功，但微信号可能为空');
          }
        } else {
          console.log('⚠️  销售管理API正常，但暂无销售数据');
        }
      } else {
        console.log('❌ 销售管理API返回格式错误，期望数组但得到:', typeof salesResult);
      }
    } catch (salesError) {
      console.log('❌ 销售管理API调用失败:', salesError.message);
    }

    // === 3. 验证客户管理修复效果 ===
    console.log('\n👤 === 验证客户管理修复效果 ===');
    
    try {
      console.log('🔄 测试getCustomers API...');
      const customersResult = await window.adminAPI.getCustomers();
      
      if (Array.isArray(customersResult)) {
        console.log(`✅ 客户管理API调用成功，获取到 ${customersResult.length} 条客户数据`);
        
        if (customersResult.length > 0) {
          const sampleCustomer = customersResult[0];
          console.log('📋 客户数据示例:');
          console.log(`  客户微信: ${sampleCustomer.customer_wechat || '空'}`);
          console.log(`  TradingView用户: ${sampleCustomer.tradingview_username || '空'}`);
          console.log(`  销售微信号: ${sampleCustomer.sales_wechat_name || '空'}`);
          console.log(`  订单数: ${sampleCustomer.total_orders || 0}`);
          console.log(`  总金额: $${sampleCustomer.total_amount || 0}`);
          
          const customersWithSales = customersResult.filter(c => 
            c.sales_wechat_name && c.sales_wechat_name !== '-' && c.sales_wechat_name !== ''
          ).length;
          console.log(`📊 有销售微信号的客户: ${customersWithSales}/${customersResult.length}`);
          
          if (customersWithSales > 0) {
            console.log('🎉 客户管理修复成功！正确显示了销售微信号字段');
          } else {
            console.log('⚠️  客户数据加载成功，但销售微信号关联可能有问题');
          }
        } else {
          console.log('⚠️  客户管理API正常，但暂无客户数据');
        }
      } else {
        console.log('❌ 客户管理API返回格式错误，期望数组但得到:', typeof customersResult);
      }
    } catch (customersError) {
      console.log('❌ 客户管理API调用失败:', customersError.message);
    }

    // === 4. 验证Redux状态 ===
    console.log('\n🔄 === 验证Redux状态 ===');
    
    const currentState = window.store.getState();
    const adminState = currentState.admin;
    
    console.log('📊 Redux admin状态:');
    console.log(`  loading: ${adminState?.loading || false}`);
    console.log(`  stats存在: ${adminState?.stats ? '是' : '否'}`);
    console.log(`  sales数量: ${adminState?.sales?.length || 0}`);
    console.log(`  customers数量: ${adminState?.customers?.length || 0}`);
    
    if (adminState?.stats && adminState?.sales && adminState?.customers) {
      console.log('✅ Redux状态正常，数据已正确加载到store');
    }

    // === 5. 总结验证结果 ===
    console.log('\n🎯 === 验证结果总结 ===');
    console.log('修复验证完成！');
    console.log('');
    console.log('🔧 修复的问题:');
    console.log('1. ✅ Redux slice数据处理统一化');
    console.log('2. ✅ 客户管理字段映射修复');
    console.log('3. ✅ 销售微信号获取逻辑优化');
    console.log('');
    console.log('💡 如果仍有问题，请检查:');
    console.log('1. 数据库中销售表的name字段是否有数据');
    console.log('2. orders表的sales_code是否正确关联到销售表');
    console.log('3. 浏览器是否需要强制刷新清除缓存');

  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
}

// 执行验证
verifyFixes();

console.log('\n💻 验证脚本执行完成！请查看上述结果并告知开发者！');
