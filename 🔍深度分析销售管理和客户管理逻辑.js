// 🔍深度分析销售管理和客户管理逻辑
// 详细分析数据获取、处理、显示的完整链路

console.log('=== 🔍 深度分析销售管理和客户管理逻辑 ===\n');

async function analyzeDataLogic() {
  try {
    if (typeof window === 'undefined' || !window.supabaseClient || !window.store) {
      console.log('❌ 必要组件不可用');
      return;
    }

    console.log('✅ 开始深度分析\n');

    // === 1. 分析数据概览为0的具体原因 ===
    console.log('📊 === 数据概览为0的具体原因分析 ===');
    
    // 直接调用新的getStats API
    if (window.adminAPI && window.adminAPI.getStats) {
      try {
        console.log('🔄 直接调用adminAPI.getStats()...');
        const directStats = await window.adminAPI.getStats();
        console.log('直接API调用结果:', directStats);
        
        if (directStats && directStats.total_orders > 0) {
          console.log('✅ API返回正确数据，问题可能在Redux更新');
        } else {
          console.log('❌ API本身返回空数据，问题在API逻辑');
        }
      } catch (apiError) {
        console.log('❌ API调用失败:', apiError.message);
        console.log('完整错误:', apiError);
      }
    }
    
    // 手动执行统计逻辑
    console.log('\n🧮 手动执行统计逻辑:');
    const { data: directOrders } = await window.supabaseClient
      .from('orders')
      .select('*');
    
    if (directOrders && directOrders.length > 0) {
      console.log(`✅ 直接查询订单: ${directOrders.length} 条`);
      
      let manualAmount = 0;
      directOrders.forEach(order => {
        let amount = parseFloat(order.amount || 0);
        if (order.actual_payment_amount && parseFloat(order.actual_payment_amount) > 0) {
          amount = parseFloat(order.actual_payment_amount);
        }
        
        if (order.payment_method === 'alipay') {
          amount = amount / 7.15;
        }
        
        manualAmount += amount;
      });
      
      console.log(`手动计算总金额: $${manualAmount.toFixed(2)}`);
      
      if (manualAmount > 0) {
        console.log('✅ 手动计算有金额，API逻辑应该正确');
      } else {
        console.log('❌ 手动计算也为0，检查amount字段');
        
        // 显示前几个订单的详细金额信息
        console.log('\n订单金额详情:');
        directOrders.slice(0, 5).forEach((order, index) => {
          console.log(`订单${index + 1}:`);
          console.log(`  amount: ${order.amount} (类型: ${typeof order.amount})`);
          console.log(`  actual_payment_amount: ${order.actual_payment_amount} (类型: ${typeof order.actual_payment_amount})`);
          console.log(`  payment_method: ${order.payment_method}`);
        });
      }
    }

    // === 2. 详细分析销售管理数据获取逻辑 ===
    console.log('\n👥 === 销售管理数据获取逻辑详细分析 ===');
    
    console.log('\n📋 销售管理数据获取流程:');
    console.log('1. 调用 AdminAPI.getSales()');
    console.log('2. 获取 primary_sales、secondary_sales、orders 三个表数据');
    console.log('3. 遍历每个销售，通过 sales_code 关联订单');
    console.log('4. 计算统计数据和微信号');
    console.log('5. 返回处理后的销售数组');
    
    // 手动执行销售数据获取逻辑
    console.log('\n🔄 手动执行销售数据获取逻辑:');
    
    const [primarySales, secondarySales, orders] = await Promise.all([
      window.supabaseClient.from('primary_sales').select('*'),
      window.supabaseClient.from('secondary_sales').select('*'),
      window.supabaseClient.from('orders').select('*')
    ]);
    
    console.log(`✅ 基础数据获取:`);
    console.log(`  primary_sales: ${primarySales.data?.length || 0} 条`);
    console.log(`  secondary_sales: ${secondarySales.data?.length || 0} 条`);
    console.log(`  orders: ${orders.data?.length || 0} 条`);
    
    if (primarySales.data && primarySales.data.length > 0) {
      console.log('\n🔍 一级销售数据处理示例:');
      const samplePrimary = primarySales.data[0];
      
      console.log(`示例一级销售:`);
      console.log(`  ID: ${samplePrimary.id}`);
      console.log(`  sales_code: ${samplePrimary.sales_code}`);
      console.log(`  wechat_name: ${samplePrimary.wechat_name || '空'}`);
      console.log(`  name: ${samplePrimary.name || '空'}`);
      console.log(`  phone: ${samplePrimary.phone || '空'}`);
      
      // 查找该销售的订单
      const saleOrders = orders.data?.filter(order => 
        order.sales_code === samplePrimary.sales_code || 
        order.primary_sales_id === samplePrimary.id
      ) || [];
      
      console.log(`  关联订单数: ${saleOrders.length}`);
      
      // 应用微信号获取逻辑
      const finalWechatName = samplePrimary.wechat_name || samplePrimary.name || samplePrimary.phone || `一级销售-${samplePrimary.sales_code}`;
      console.log(`  最终微信号: ${finalWechatName}`);
      
      if (saleOrders.length > 0) {
        console.log('✅ 该销售有关联订单，应该能正常显示');
      } else {
        console.log('❌ 该销售无关联订单，可能影响显示');
      }
    }
    
    // 测试AdminAPI.getSales()
    if (window.adminAPI && window.adminAPI.getSales) {
      try {
        console.log('\n🔄 直接调用adminAPI.getSales()...');
        const directSales = await window.adminAPI.getSales();
        console.log(`直接调用结果: ${directSales?.length || 0} 条销售数据`);
        
        if (directSales && directSales.length > 0) {
          console.log('\n销售数据示例:');
          const sampleSale = directSales[0];
          console.log(`销售1: sales_code=${sampleSale.sales_code}, wechat_name=${sampleSale.wechat_name || '空'}, total_orders=${sampleSale.total_orders || 0}`);
          
          if (sampleSale.wechat_name && sampleSale.wechat_name !== '') {
            console.log('✅ API返回的销售有微信号');
          } else {
            console.log('❌ API返回的销售微信号为空');
          }
        } else {
          console.log('❌ API返回空数组');
        }
      } catch (salesError) {
        console.log('❌ 销售API调用失败:', salesError.message);
      }
    }

    // === 3. 详细分析客户管理数据获取逻辑 ===
    console.log('\n👤 === 客户管理数据获取逻辑详细分析 ===');
    
    console.log('\n📋 客户管理数据获取流程:');
    console.log('1. 调用 AdminAPI.getCustomers()');
    console.log('2. 获取所有订单数据');
    console.log('3. 按客户微信号分组去重');
    console.log('4. 通过订单关联获取销售微信号');
    console.log('5. 计算客户统计数据');
    
    // 手动执行客户数据获取逻辑
    console.log('\n🔄 手动执行客户数据获取逻辑:');
    
    if (orders.data && orders.data.length > 0) {
      const customerMap = new Map();
      
      orders.data.forEach(order => {
        const customerWechat = order.customer_wechat || '';
        const tradingviewUser = order.tradingview_username || '';
        const key = `${customerWechat}-${tradingviewUser}`;
        
        if (customerWechat || tradingviewUser) {
          console.log(`处理订单 ${order.id}:`);
          console.log(`  customer_wechat: ${customerWechat || '空'}`);
          console.log(`  tradingview_username: ${tradingviewUser || '空'}`);
          console.log(`  sales_code: ${order.sales_code || '空'}`);
          
          // 获取销售微信号的逻辑
          let salesWechat = order.sales_wechat_name || '';
          
          if (!salesWechat) {
            // 通过sales_code查找销售微信号
            const matchingSale = [...(primarySales.data || []), ...(secondarySales.data || [])].find(sale => 
              sale.sales_code === order.sales_code
            );
            
            if (matchingSale) {
              salesWechat = matchingSale.wechat_name || matchingSale.name || '';
              console.log(`  通过sales_code找到销售微信号: ${salesWechat || '空'}`);
            } else {
              console.log(`  未通过sales_code找到匹配销售`);
            }
          } else {
            console.log(`  订单表直接有销售微信号: ${salesWechat}`);
          }
          
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              customer_wechat: customerWechat,
              tradingview_username: tradingviewUser,
              sales_wechat_name: salesWechat,
              first_order: order.created_at,
              total_orders: 1,
              total_amount: parseFloat(order.amount || 0)
            });
          } else {
            const customer = customerMap.get(key);
            customer.total_orders++;
            customer.total_amount += parseFloat(order.amount || 0);
            
            // 如果当前客户没有销售微信号，尝试用这个订单的
            if (!customer.sales_wechat_name && salesWechat) {
              customer.sales_wechat_name = salesWechat;
            }
          }
        }
      });
      
      const customers = Array.from(customerMap.values());
      console.log(`\n手动计算客户数: ${customers.length}`);
      
      if (customers.length > 0) {
        console.log('\n客户数据示例:');
        const sampleCustomer = customers[0];
        console.log(`客户1:`);
        console.log(`  customer_wechat: ${sampleCustomer.customer_wechat || '空'}`);
        console.log(`  sales_wechat_name: ${sampleCustomer.sales_wechat_name || '空'}`);
        console.log(`  total_orders: ${sampleCustomer.total_orders}`);
        
        const withSalesWechat = customers.filter(c => c.sales_wechat_name && c.sales_wechat_name !== '').length;
        console.log(`\n有销售微信号的客户: ${withSalesWechat}/${customers.length}`);
        
        if (withSalesWechat === 0) {
          console.log('❌ 所有客户都没有销售微信号');
          console.log('💡 问题可能在:');
          console.log('   1. 订单表的sales_wechat_name字段为空');
          console.log('   2. 通过sales_code关联销售失败');
          console.log('   3. 销售表的wechat_name/name字段为空');
        }
      }
    }
    
    // 测试AdminAPI.getCustomers()
    if (window.adminAPI && window.adminAPI.getCustomers) {
      try {
        console.log('\n🔄 直接调用adminAPI.getCustomers()...');
        const directCustomers = await window.adminAPI.getCustomers();
        console.log(`直接调用结果: ${directCustomers?.length || 0} 条客户数据`);
        
        if (directCustomers && directCustomers.length > 0) {
          const sampleCustomer = directCustomers[0];
          console.log(`客户示例: sales_wechat_name=${sampleCustomer.sales_wechat_name || '空'}`);
        }
      } catch (customerError) {
        console.log('❌ 客户API调用失败:', customerError.message);
      }
    }

    // === 4. 检查Redux数据更新问题 ===
    console.log('\n🔄 === Redux数据更新问题检查 ===');
    
    const currentState = window.store.getState();
    const adminState = currentState.admin;
    
    console.log('\nRedux admin状态:');
    console.log(`  loading: ${adminState?.loading}`);
    console.log(`  stats: ${adminState?.stats ? JSON.stringify(adminState.stats) : '空'}`);
    console.log(`  sales: ${adminState?.sales?.length || 0} 条`);
    console.log(`  customers: ${adminState?.customers?.length || 0} 条`);
    console.log(`  orders: ${adminState?.orders?.length || 0} 条`);
    
    // === 5. 提供具体的修复建议 ===
    console.log('\n🎯 === 具体问题和修复建议 ===');
    
    console.log('\n📋 问题总结:');
    console.log('1. 数据概览为0 → API逻辑或Redux更新问题');
    console.log('2. 销售管理无数据 → API调用失败或缓存问题');
    console.log('3. 客户管理需要点搜索 → 初始加载逻辑问题');
    console.log('4. 销售微信号为空 → 字段关联或数据源问题');
    
    console.log('\n🔧 下一步修复方案:');
    console.log('1. 检查SupabaseService.supabase是否正确调用');
    console.log('2. 修复Redux数据更新逻辑');
    console.log('3. 解决客户管理初始加载问题');
    console.log('4. 修复销售微信号字段关联逻辑');

  } catch (error) {
    console.error('❌ 分析过程发生错误:', error);
  }
}

// 执行分析
analyzeDataLogic();

console.log('\n💻 分析完成，请告诉我结果，我将提供精准的修复方案！');
