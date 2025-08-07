// 🔍紧急诊断数据概览和客户管理问题
// 在管理员页面控制台直接运行此脚本

console.log('=== 🔍 紧急诊断数据概览和客户管理问题 ===\n');

async function quickDiagnose() {
  try {
    console.log('🚀 开始紧急诊断...\n');

    // === 1. 检查基础环境 ===
    console.log('🔧 检查基础环境:');
    console.log(`- Redux store: ${window.store ? '✅ 可用' : '❌ 不可用'}`);
    console.log(`- AdminAPI: ${window.adminAPI ? '✅ 可用' : '❌ 不可用'}`);
    console.log(`- Supabase客户端: ${window.supabaseClient ? '✅ 可用' : '❌ 不可用'}`);

    if (!window.store || !window.adminAPI || !window.supabaseClient) {
      console.log('❌ 基础环境缺失，请确保在管理员页面运行');
      return;
    }

    // === 2. 直接诊断数据概览为0问题 ===
    console.log('\n📊 === 诊断数据概览为0问题 ===');
    
    try {
      console.log('🔄 直接调用getStats API...');
      const statsResult = await window.adminAPI.getStats();
      console.log('getStats返回结果:', statsResult);
      
      if (statsResult && typeof statsResult === 'object') {
        console.log('✅ API返回了数据对象');
        console.log(`  total_orders: ${statsResult.total_orders || 0}`);
        console.log(`  total_amount: ${statsResult.total_amount || 0}`);
        console.log(`  primary_sales_count: ${statsResult.primary_sales_count || 0}`);
        console.log(`  secondary_sales_count: ${statsResult.secondary_sales_count || 0}`);
        
        if (statsResult.total_orders > 0) {
          console.log('✅ API返回正确数据，检查Redux更新');
        } else {
          console.log('❌ API返回空数据，问题在API逻辑');
        }
      } else {
        console.log('❌ API返回格式错误:', typeof statsResult);
      }
    } catch (statsError) {
      console.log('❌ getStats API调用失败:', statsError.message);
    }
    
    // 手动检查订单表
    console.log('\n🔍 手动检查订单表:');
    try {
      const { data: orders, error } = await window.supabaseClient
        .from('orders')
        .select('id, amount, actual_payment_amount, status, payment_method, created_at');
      
      if (error) {
        console.log('❌ 查询订单失败:', error.message);
      } else {
        console.log(`📋 订单表数据: ${orders?.length || 0} 条`);
        
        if (orders && orders.length > 0) {
          console.log('前3个订单样本:');
          orders.slice(0, 3).forEach((order, i) => {
            console.log(`  订单${i+1}: amount=${order.amount}, actual_payment_amount=${order.actual_payment_amount}, status=${order.status}`);
          });
          
          // 计算总金额
          let totalAmount = 0;
          orders.forEach(order => {
            let amount = parseFloat(order.amount || 0);
            if (order.actual_payment_amount && parseFloat(order.actual_payment_amount) > 0) {
              amount = parseFloat(order.actual_payment_amount);
            }
            if (order.payment_method === 'alipay') {
              amount = amount / 7.15;
            }
            totalAmount += amount;
          });
          
          console.log(`💰 手动计算总金额: $${totalAmount.toFixed(2)}`);
        } else {
          console.log('⚠️  订单表确实无数据');
        }
      }
    } catch (orderError) {
      console.log('❌ 查询订单表失败:', orderError.message);
    }

    // === 3. 诊断销售管理数据为空问题 ===
    console.log('\n👥 === 诊断销售管理数据为空问题 ===');
    
    try {
      console.log('🔄 直接调用getSales API...');
      const salesResult = await window.adminAPI.getSales();
      console.log(`getSales返回结果: ${Array.isArray(salesResult) ? salesResult.length + ' 条销售数据' : typeof salesResult}`);
      
      if (Array.isArray(salesResult) && salesResult.length > 0) {
        console.log('✅ API返回销售数据');
        const sampleSale = salesResult[0];
        console.log('销售样本:', {
          sales_code: sampleSale.sales_code,
          wechat_name: sampleSale.wechat_name,
          sales_type: sampleSale.sales_type,
          total_orders: sampleSale.total_orders
        });
      } else {
        console.log('❌ API返回空销售数据');
      }
    } catch (salesError) {
      console.log('❌ getSales API调用失败:', salesError.message);
    }
    
    // 手动检查销售表
    console.log('\n🔍 手动检查销售表:');
    try {
      const [primaryResult, secondaryResult] = await Promise.all([
        window.supabaseClient.from('primary_sales').select('*'),
        window.supabaseClient.from('secondary_sales').select('*')
      ]);
      
      console.log(`📋 一级销售: ${primaryResult.data?.length || 0} 条`);
      console.log(`📋 二级销售: ${secondaryResult.data?.length || 0} 条`);
      
      if (primaryResult.data && primaryResult.data.length > 0) {
        const sample = primaryResult.data[0];
        console.log('一级销售样本:', {
          sales_code: sample.sales_code,
          name: sample.name,
          wechat_name: sample.wechat_name,
          phone: sample.phone
        });
      }
    } catch (salesTableError) {
      console.log('❌ 查询销售表失败:', salesTableError.message);
    }

    // === 4. 诊断客户管理数据为空问题 ===
    console.log('\n👤 === 诊断客户管理数据为空问题 ===');
    
    try {
      console.log('🔄 直接调用getCustomers API...');
      const customersResult = await window.adminAPI.getCustomers();
      console.log(`getCustomers返回结果: ${Array.isArray(customersResult) ? customersResult.length + ' 条客户数据' : typeof customersResult}`);
      
      if (Array.isArray(customersResult) && customersResult.length > 0) {
        console.log('✅ API返回客户数据');
        const sampleCustomer = customersResult[0];
        console.log('客户样本:', {
          customer_wechat: sampleCustomer.customer_wechat,
          sales_wechat_name: sampleCustomer.sales_wechat_name,
          total_orders: sampleCustomer.total_orders
        });
      } else {
        console.log('❌ API返回空客户数据');
      }
    } catch (customersError) {
      console.log('❌ getCustomers API调用失败:', customersError.message);
    }

    // === 5. 检查Redux状态 ===
    console.log('\n🔄 === 检查Redux状态 ===');
    const state = window.store.getState();
    const adminState = state.admin;
    
    console.log('Redux admin状态:');
    console.log(`  loading: ${adminState?.loading}`);
    console.log(`  stats: ${adminState?.stats ? JSON.stringify(adminState.stats, null, 2) : '空'}`);
    console.log(`  sales数量: ${adminState?.sales?.length || 0}`);
    console.log(`  customers数量: ${adminState?.customers?.length || 0}`);

    // === 6. 强制刷新数据 ===
    console.log('\n🔄 === 尝试强制刷新数据 ===');
    if (window.store && window.store.dispatch) {
      console.log('尝试重新获取统计数据...');
      try {
        // 这里需要导入正确的action
        console.log('请手动刷新页面或重新登录来重新获取数据');
      } catch (refreshError) {
        console.log('刷新失败:', refreshError.message);
      }
    }

    console.log('\n📋 === 诊断总结 ===');
    console.log('1. 检查API调用是否成功');
    console.log('2. 检查Supabase数据库连接');
    console.log('3. 检查数据表是否有数据');
    console.log('4. 检查Redux状态更新');
    console.log('5. 如需修复，等待开发者处理');

  } catch (error) {
    console.error('❌ 诊断过程出错:', error);
  }
}

// 执行诊断
quickDiagnose();

console.log('\n💡 请将上述诊断结果截图发给开发者进行修复！');
