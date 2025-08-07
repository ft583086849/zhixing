/**
 * 🔧 强制刷新销售数据并更新页面
 * 直接调用Redux action更新数据
 */

async function forceRefreshSales() {
  console.log('='.repeat(60));
  console.log('🔧 强制刷新销售数据');
  console.log('='.repeat(60));
  
  try {
    // 1. 检查必要组件
    if (!window.store) {
      console.error('❌ Redux store不存在，请确保在管理页面');
      return;
    }
    
    if (!window.adminAPI) {
      console.error('❌ AdminAPI不存在，请确保已登录');
      return;
    }
    
    // 2. 直接获取销售数据
    console.log('\n📋 获取销售数据...');
    const salesData = await window.adminAPI.getSales();
    console.log(`✅ 获取到 ${salesData?.length || 0} 条销售数据`);
    
    if (!salesData || salesData.length === 0) {
      console.log('⚠️ 没有销售数据，尝试创建测试数据...');
      
      // 导入Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://itvmeamoqthfqtkpubdv.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
      );
      
      // 创建测试销售
      const testSale = {
        sales_code: `VISIBLE_${Date.now()}`,
        wechat_name: `可见微信号_${Date.now()}`,
        name: `可见销售_${Date.now()}`,
        phone: '13800138000',
        payment_method: 'alipay',
        payment_account: 'test@alipay.com'
      };
      
      await supabase.from('primary_sales').insert([testSale]);
      console.log('✅ 创建测试销售:', testSale.sales_code);
      
      // 重新获取数据
      const newSalesData = await window.adminAPI.getSales();
      console.log(`✅ 重新获取到 ${newSalesData?.length || 0} 条销售数据`);
    }
    
    // 3. 显示前几条数据
    if (salesData && salesData.length > 0) {
      console.log('\n📊 销售数据样本:');
      salesData.slice(0, 5).forEach((sale, idx) => {
        console.log(`${idx + 1}. ${sale.sales_code}`);
        console.log(`   微信: ${sale.wechat_name || '无'}`);
        console.log(`   类型: ${sale.sales_type || sale.sales_display_type || '未知'}`);
        console.log(`   订单: ${sale.total_orders || 0}`);
      });
    }
    
    // 4. 强制更新Redux（尝试多种方式）
    console.log('\n📋 更新Redux store...');
    
    // 方式1：通过fulfilled action
    window.store.dispatch({
      type: 'admin/getSales/fulfilled',
      payload: salesData || []
    });
    
    let state = window.store.getState();
    console.log(`方式1后: Redux销售数据 ${state.admin?.sales?.length || 0} 条`);
    
    // 如果还是0，尝试其他方式
    if (state.admin?.sales?.length === 0) {
      // 方式2：直接设置
      window.store.dispatch({
        type: 'admin/setSales',
        payload: salesData || []
      });
      
      state = window.store.getState();
      console.log(`方式2后: Redux销售数据 ${state.admin?.sales?.length || 0} 条`);
    }
    
    // 5. 如果在销售管理页面，触发重新渲染
    if (window.location.pathname.includes('/admin/sales')) {
      console.log('\n📋 触发页面重新渲染...');
      
      // 方式1：通过路由参数变化
      const newUrl = window.location.pathname + '?t=' + Date.now();
      window.history.replaceState({}, '', newUrl);
      
      // 方式2：触发window事件
      window.dispatchEvent(new Event('statechange'));
      
      // 方式3：如果有React DevTools，强制更新
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const fiberRoot = document.getElementById('root')._reactRootContainer;
        if (fiberRoot) {
          console.log('通过React DevTools触发更新...');
          fiberRoot._internalRoot.current.memoizedState.element.type._context._currentValue = Date.now();
        }
      }
      
      console.log('✅ 已触发页面更新');
    }
    
    // 6. 最终检查
    console.log('\n' + '='.repeat(60));
    console.log('📝 完成');
    console.log('='.repeat(60));
    
    const finalState = window.store.getState();
    const finalSalesCount = finalState.admin?.sales?.length || 0;
    
    if (finalSalesCount > 0) {
      console.log(`✅ 成功！Redux中有 ${finalSalesCount} 条销售数据`);
      console.log('\n请执行以下操作查看效果:');
      console.log('1. 如果页面没有自动更新，请按F5刷新');
      console.log('2. 或者点击其他菜单再点回销售管理');
    } else {
      console.log('⚠️ Redux更新可能失败');
      console.log('\n请尝试:');
      console.log('1. 完全刷新页面（Ctrl+F5）');
      console.log('2. 退出重新登录');
      console.log('3. 清除浏览器缓存');
      
      // 最后的尝试：直接修改state（不推荐但可能有效）
      console.log('\n尝试直接修改state...');
      if (window.store.getState().admin) {
        window.store.getState().admin.sales = salesData || [];
        console.log('已直接修改state，请刷新页面');
      }
    }
    
  } catch (error) {
    console.error('❌ 执行出错:', error);
  }
}

// 执行
console.log('💡 开始强制刷新销售数据...\n');
forceRefreshSales();

