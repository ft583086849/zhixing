// 🚨紧急深度调试数据问题
// 在管理员页面控制台运行此脚本，找出真正的问题根源

console.log('=== 🚨 紧急深度调试数据问题 ===\n');

async function emergencyDebug() {
  try {
    console.log('🔍 开始深度调试...\n');

    // === 1. 检查最基础的环境 ===
    console.log('🔧 检查基础环境:');
    console.log(`- window.store: ${window.store ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`- window.adminAPI: ${window.adminAPI ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`- window.supabaseClient: ${window.supabaseClient ? '✅ 存在' : '❌ 不存在'}`);

    if (!window.store) {
      console.log('❌ 致命错误：Redux store不存在！');
      return;
    }

    // === 2. 检查当前Redux状态 ===
    console.log('\n📊 检查当前Redux状态:');
    const state = window.store.getState();
    console.log('完整state结构:', Object.keys(state));
    
    if (state.admin) {
      console.log('admin state详情:');
      console.log(`  loading: ${state.admin.loading}`);
      console.log(`  stats: ${JSON.stringify(state.admin.stats, null, 2)}`);
      console.log(`  sales类型: ${Array.isArray(state.admin.sales) ? 'Array' : typeof state.admin.sales}, 长度: ${state.admin.sales?.length || 0}`);
      console.log(`  customers类型: ${Array.isArray(state.admin.customers) ? 'Array' : typeof state.admin.customers}, 长度: ${state.admin.customers?.length || 0}`);
      console.log(`  orders类型: ${Array.isArray(state.admin.orders) ? 'Array' : typeof state.admin.orders}, 长度: ${state.admin.orders?.length || 0}`);
    } else {
      console.log('❌ admin state不存在！');
    }

    // === 3. 手动测试Redux actions ===
    console.log('\n🎯 手动测试Redux actions:');
    
    if (window.store.dispatch) {
      console.log('尝试手动dispatch getStats...');
      try {
        // 尝试导入action
        console.log('查找可用的actions...');
        console.log('window对象中的属性:', Object.keys(window).filter(key => key.includes('admin') || key.includes('redux') || key.includes('store')));
        
        // 尝试直接调用store的dispatch
        console.log('尝试手动创建action调用...');
        
        // 检查是否能访问到reducer
        const testAction = { type: 'admin/getStats/pending' };
        window.store.dispatch(testAction);
        console.log('✅ dispatch测试成功');
        
      } catch (actionError) {
        console.log('❌ Redux action测试失败:', actionError.message);
      }
    }

    // === 4. 直接测试API调用 ===
    console.log('\n🔌 直接测试API调用:');
    
    if (window.adminAPI) {
      // 测试getStats
      try {
        console.log('测试 adminAPI.getStats()...');
        const statsResult = await window.adminAPI.getStats();
        console.log('getStats结果类型:', typeof statsResult);
        console.log('getStats结果内容:', statsResult);
        
        if (typeof statsResult === 'object' && statsResult !== null) {
          console.log('✅ getStats API正常工作');
        } else {
          console.log('❌ getStats API返回异常数据');
        }
      } catch (statsError) {
        console.log('❌ getStats API失败:', statsError.message);
        console.log('完整错误:', statsError);
      }

      // 测试getSales
      try {
        console.log('\n测试 adminAPI.getSales()...');
        const salesResult = await window.adminAPI.getSales();
        console.log('getSales结果类型:', typeof salesResult);
        console.log('getSales是否为数组:', Array.isArray(salesResult));
        console.log('getSales长度:', salesResult?.length);
        console.log('getSales样本:', salesResult?.[0]);
        
        if (Array.isArray(salesResult)) {
          console.log('✅ getSales API正常工作');
        } else {
          console.log('❌ getSales API返回非数组数据');
        }
      } catch (salesError) {
        console.log('❌ getSales API失败:', salesError.message);
        console.log('完整错误:', salesError);
      }

      // 测试getCustomers
      try {
        console.log('\n测试 adminAPI.getCustomers()...');
        const customersResult = await window.adminAPI.getCustomers();
        console.log('getCustomers结果类型:', typeof customersResult);
        console.log('getCustomers是否为数组:', Array.isArray(customersResult));
        console.log('getCustomers长度:', customersResult?.length);
        console.log('getCustomers样本:', customersResult?.[0]);
        
        if (Array.isArray(customersResult)) {
          console.log('✅ getCustomers API正常工作');
        } else {
          console.log('❌ getCustomers API返回非数组数据');
        }
      } catch (customersError) {
        console.log('❌ getCustomers API失败:', customersError.message);
        console.log('完整错误:', customersError);
      }
    } else {
      console.log('❌ adminAPI不存在，检查API导入...');
    }

    // === 5. 检查Supabase连接 ===
    console.log('\n🗄️  检查Supabase连接:');
    
    if (window.supabaseClient) {
      try {
        console.log('测试直接查询orders表...');
        const { data: orders, error } = await window.supabaseClient
          .from('orders')
          .select('id, amount, status, sales_code')
          .limit(3);
        
        if (error) {
          console.log('❌ Supabase查询错误:', error);
        } else {
          console.log(`✅ Supabase连接正常，orders表有 ${orders?.length || 0} 条数据`);
          console.log('orders样本:', orders);
        }
      } catch (supabaseError) {
        console.log('❌ Supabase测试失败:', supabaseError.message);
      }
    } else {
      console.log('❌ supabaseClient不存在');
    }

    // === 6. 检查网络请求 ===
    console.log('\n🌐 检查网络请求:');
    console.log('打开开发者工具的Network标签页，查看是否有API请求失败');
    console.log('特别注意以下URL的请求:');
    console.log('- /api/admin/stats');
    console.log('- /api/admin/sales');
    console.log('- /api/admin/customers');

    // === 7. 检查错误日志 ===
    console.log('\n📝 检查错误日志:');
    console.log('打开开发者工具的Console标签页，查看是否有红色错误信息');
    
    // === 8. 强制重新获取数据 ===
    console.log('\n🔄 尝试强制重新获取数据:');
    
    if (window.location.reload) {
      console.log('建议强制刷新页面: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)');
    }

    // === 9. 问题定位总结 ===
    console.log('\n🎯 问题定位总结:');
    console.log('1. 如果API调用正常但Redux state为空 → Redux数据流问题');
    console.log('2. 如果API调用失败 → 后端API或网络问题');
    console.log('3. 如果Supabase查询失败 → 数据库连接问题');
    console.log('4. 如果基础环境缺失 → 组件初始化问题');
    
    console.log('\n💡 下一步调试方向:');
    console.log('请将上述所有输出结果截图或复制给开发者，');
    console.log('特别是API测试结果和Supabase查询结果！');

  } catch (error) {
    console.error('❌ 调试过程出错:', error);
    console.error('完整错误堆栈:', error.stack);
  }
}

// 执行调试
emergencyDebug();

console.log('\n🚨 紧急调试完成！请将所有输出发给开发者！');
