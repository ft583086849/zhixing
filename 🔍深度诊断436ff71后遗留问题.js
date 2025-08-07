// 🔍深度诊断436ff71后遗留问题.js
// 全面诊断所有API、数据源、关联逻辑问题

console.log('=== 🔍 深度诊断436ff71后遗留问题 ===\n');

async function deepDiagnosis() {
  try {
    if (typeof window === 'undefined' || !window.store) {
      console.log('❌ Redux store 不可用');
      return;
    }

    const state = window.store.getState();
    console.log('✅ Redux store 可用\n');

    // === 1. 检查Supabase连接和权限 ===
    console.log('🔗 === Supabase连接和权限检查 ===');
    
    if (window.supabaseClient) {
      console.log('✅ Supabase客户端存在');
      
      // 测试各表的权限
      const tables = ['orders', 'primary_sales', 'secondary_sales', 'payment_config'];
      
      for (const table of tables) {
        try {
          const { data, error } = await window.supabaseClient
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ ${table}表权限: 失败 - ${error.message}`);
          } else {
            console.log(`✅ ${table}表权限: 正常 (${data?.length || 0} 条记录)`);
          }
        } catch (err) {
          console.log(`❌ ${table}表权限: 异常 - ${err.message}`);
        }
      }
      
      // 特别测试订单表UPDATE权限
      console.log('\n🔧 测试订单状态更新权限:');
      try {
        const { data: testOrder } = await window.supabaseClient
          .from('orders')
          .select('id, status')
          .limit(1);
        
        if (testOrder && testOrder.length > 0) {
          const orderId = testOrder[0].id;
          const currentStatus = testOrder[0].status;
          
          console.log(`测试订单: ID=${orderId}, 当前状态=${currentStatus}`);
          
          // 尝试更新状态 (模拟更新，不实际改变)
          const testUpdate = await window.supabaseClient
            .from('orders')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .select();
          
          if (testUpdate.error) {
            console.log(`❌ 订单UPDATE权限: 失败 - ${testUpdate.error.message}`);
          } else {
            console.log(`✅ 订单UPDATE权限: 正常`);
          }
        } else {
          console.log('⚠️  没有订单数据可供测试');
        }
      } catch (err) {
        console.log(`❌ 订单UPDATE权限测试异常: ${err.message}`);
      }
      
    } else {
      console.log('❌ Supabase客户端不存在');
    }

    // === 2. 检查订单表微信号字段 ===
    console.log('\n👥 === 订单表微信号字段分析 ===');
    
    if (window.supabaseClient) {
      try {
        const { data: sampleOrders } = await window.supabaseClient
          .from('orders')
          .select('*')
          .limit(5);
        
        if (sampleOrders && sampleOrders.length > 0) {
          console.log(`📊 订单表字段分析 (样本: ${sampleOrders.length} 条):`);
          
          const firstOrder = sampleOrders[0];
          const wechatFields = [];
          
          Object.keys(firstOrder).forEach(field => {
            if (field.toLowerCase().includes('wechat') || 
                field.toLowerCase().includes('微信') ||
                field.toLowerCase().includes('name')) {
              wechatFields.push(field);
            }
          });
          
          console.log('🔍 潜在微信号字段:', wechatFields);
          
          // 分析每个字段的数据完整性
          wechatFields.forEach(field => {
            const hasData = sampleOrders.filter(order => 
              order[field] && order[field] !== '' && order[field] !== '-'
            ).length;
            
            console.log(`  ${field}: ${hasData}/${sampleOrders.length} 有数据`);
            
            if (hasData > 0) {
              const sampleValues = sampleOrders
                .filter(order => order[field] && order[field] !== '')
                .map(order => order[field])
                .slice(0, 2);
              console.log(`    样本值: ${sampleValues.join(', ')}`);
            }
          });
          
          // 检查销售关联字段
          console.log('\n🔗 销售关联字段:');
          ['sales_code', 'primary_sales_id', 'secondary_sales_id', 'sales_type'].forEach(field => {
            if (firstOrder.hasOwnProperty(field)) {
              const hasData = sampleOrders.filter(order => order[field]).length;
              console.log(`  ${field}: ${hasData}/${sampleOrders.length} 有数据`);
            } else {
              console.log(`  ${field}: 字段不存在`);
            }
          });
          
        } else {
          console.log('❌ 订单表无数据');
        }
      } catch (err) {
        console.log(`❌ 订单表分析失败: ${err.message}`);
      }
    }

    // === 3. 检查API调用链路 ===
    console.log('\n🔄 === API调用链路检查 ===');
    
    // 检查adminAPI是否存在
    if (window.adminAPI) {
      console.log('✅ adminAPI对象存在');
      
      const apiMethods = ['updateOrderStatus', 'getSales', 'getCustomers', 'getStats'];
      apiMethods.forEach(method => {
        if (typeof window.adminAPI[method] === 'function') {
          console.log(`✅ adminAPI.${method}: 存在`);
        } else {
          console.log(`❌ adminAPI.${method}: 不存在`);
        }
      });
      
      // 测试订单状态更新API链路
      console.log('\n🧪 测试订单状态更新API链路:');
      try {
        // 获取一个测试订单
        const ordersData = state.admin?.orders;
        if (ordersData && ordersData.length > 0) {
          const testOrder = ordersData[0];
          console.log(`测试订单: ID=${testOrder.id}, 状态=${testOrder.status}`);
          
          // 模拟API调用 (不实际更新)
          console.log('🔄 模拟API调用流程...');
          console.log('  1. adminSlice.updateAdminOrderStatus');
          console.log('  2. adminAPI.updateOrderStatus');
          console.log('  3. SupabaseService.updateOrderStatus');
          console.log('  4. supabase.from("orders").update()');
          
          console.log('💡 需要实际点击按钮测试完整流程');
        } else {
          console.log('⚠️  没有订单数据可供测试API');
        }
      } catch (err) {
        console.log(`❌ API链路测试异常: ${err.message}`);
      }
      
    } else {
      console.log('❌ adminAPI对象不存在');
    }

    // === 4. 分析数据获取不稳定原因 ===
    console.log('\n📊 === 数据获取不稳定原因分析 ===');
    
    const adminState = state.admin;
    
    console.log('Redux admin状态:');
    console.log(`  loading: ${adminState?.loading}`);
    console.log(`  orders: ${adminState?.orders?.length || 0} 条`);
    console.log(`  sales: ${adminState?.sales?.length || 0} 条`);
    console.log(`  customers: ${adminState?.customers?.length || 0} 条`);
    console.log(`  stats: ${adminState?.stats ? '有数据' : '无数据'}`);
    
    // 检查缓存状态
    if (window.CacheManager) {
      console.log('\n🗄️  缓存状态:');
      ['admin-orders', 'admin-sales', 'admin-customers', 'admin-stats'].forEach(key => {
        const cached = window.CacheManager.get(key);
        console.log(`  ${key}: ${cached ? '有缓存' : '无缓存'}`);
      });
    }

    // === 5. 客户管理初始加载问题 ===
    console.log('\n👤 === 客户管理初始加载问题分析 ===');
    
    // 检查是否有搜索触发的差异
    if (adminState?.customers && adminState.customers.length > 0) {
      console.log('✅ 当前有客户数据，分析数据来源:');
      
      const sampleCustomer = adminState.customers[0];
      console.log('样本客户数据结构:');
      Object.keys(sampleCustomer).forEach(key => {
        console.log(`  ${key}: ${sampleCustomer[key]}`);
      });
      
      // 检查销售微信号字段
      const wechatField = sampleCustomer.sales_wechat_name;
      console.log(`\n销售微信号状态: ${wechatField || '空值/未定义'}`);
      
      if (!wechatField || wechatField === '-') {
        console.log('❌ 销售微信号确实未关联成功');
      }
      
    } else {
      console.log('❌ 当前无客户数据');
      console.log('💡 需要点击搜索按钮触发数据加载');
    }

    // === 6. 生成修复建议 ===
    console.log('\n🎯 === 修复建议 ===');
    
    console.log('🔴 紧急修复 (订单状态更新):');
    console.log('  1. 检查Supabase orders表UPDATE权限');
    console.log('  2. 简化API调用链路，直接使用supabase客户端');
    console.log('  3. 添加详细错误日志定位具体失败点');
    
    console.log('\n🟡 重要修复 (销售微信号关联):');
    console.log('  1. 分析订单表微信号字段完整性');
    console.log('  2. 修改关联逻辑，从订单表反向获取销售信息');
    console.log('  3. 建立稳定的销售-订单关联映射');
    
    console.log('\n🔵 优化项 (数据稳定性):');
    console.log('  1. 简化复杂的数据计算逻辑');
    console.log('  2. 移除可能导致冲突的缓存策略');
    console.log('  3. 为客户管理添加自动初始加载机制');

    // === 7. 建议添加的临时调试字段 ===
    console.log('\n🔧 === 建议的调试措施 ===');
    
    console.log('1. 在订单管理添加临时英文状态列:');
    console.log('   目的: 验证状态映射逻辑');
    console.log('   实现: 在表格添加 { title: "状态(英文)", dataIndex: "status", key: "status_en" }');
    
    console.log('\n2. 添加销售微信号调试列:');
    console.log('   目的: 对比不同来源的微信号数据');
    console.log('   实现: 显示订单表微信号 vs 销售表微信号');
    
    console.log('\n3. 添加API调用日志:');
    console.log('   目的: 追踪每次API调用的成功/失败');
    console.log('   实现: 在控制台输出详细的调用链路信息');

  } catch (error) {
    console.error('❌ 深度诊断过程发生错误:', error);
  }
}

// 执行深度诊断
deepDiagnosis();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台任意页面按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看详细的问题根因分析');
console.log('4. 按照修复建议进行下一步开发');
