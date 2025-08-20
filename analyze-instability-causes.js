// 分析数据不稳定的可能原因
console.log('🔍 分析数据不稳定的原因...\n');

async function analyzeInstabilityCauses() {
  const testParams = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };
  
  console.log('🧐 检查可能的不稳定原因:');
  console.log('=' .repeat(50));
  
  // 1. 检查数据库连接稳定性
  console.log('1. 📊 检查数据库连接稳定性...');
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient
        .from('sales_optimized')
        .select('*')
        .eq('sales_code', testParams.sales_code)
        .single();
      
      if (error) {
        console.log('❌ 数据库查询有错误:', error.message);
      } else {
        console.log('✅ 数据库连接正常');
        console.log('💾 数据库字段状态:');
        const fields = ['total_commission', 'direct_commission', 'secondary_avg_rate', 'secondary_share_commission', 'secondary_orders_amount'];
        fields.forEach(field => {
          console.log(`  ${field}: ${data[field]} (${typeof data[field]})`);
        });
      }
    } catch (error) {
      console.log('❌ 数据库连接异常:', error.message);
    }
  } else {
    console.log('❌ supabaseClient未初始化');
  }
  
  // 2. 检查API服务层
  console.log('\n2. 🔧 检查API服务层...');
  if (window.SupabaseService && typeof window.SupabaseService.getPrimarySalesSettlement === 'function') {
    console.log('✅ SupabaseService存在且方法可用');
    
    // 检查方法内部逻辑
    console.log('🔍 测试API方法调用...');
    try {
      const response = await window.SupabaseService.getPrimarySalesSettlement(testParams);
      
      if (response && response.data) {
        console.log('✅ API调用成功');
        console.log('📦 返回数据结构:');
        console.log('  有sales对象:', !!response.data.sales);
        console.log('  有stats对象:', !!response.data.stats);
        
        if (response.data.sales) {
          console.log('💰 sales对象内容:');
          const sales = response.data.sales;
          console.log('  total_commission:', sales.total_commission);
          console.log('  direct_commission:', sales.direct_commission);
          console.log('  secondary_avg_rate:', sales.secondary_avg_rate);
          console.log('  secondary_share_commission:', sales.secondary_share_commission);
          console.log('  secondary_orders_amount:', sales.secondary_orders_amount);
        } else {
          console.log('❌ sales对象不存在');
        }
      } else {
        console.log('❌ API返回数据为空或格式不正确');
      }
    } catch (error) {
      console.log('❌ API调用失败:', error.message);
    }
  } else {
    console.log('❌ SupabaseService不可用');
  }
  
  // 3. 检查Redux状态管理
  console.log('\n3. ⚛️ 检查Redux状态管理...');
  if (window.store) {
    console.log('✅ Redux store存在');
    
    const state = window.store.getState();
    if (state.sales) {
      console.log('✅ sales slice存在');
      console.log('📊 当前状态:');
      console.log('  loading:', state.sales.loading);
      console.log('  error:', state.sales.error);
      console.log('  primarySalesSettlement:', !!state.sales.primarySalesSettlement);
      
      if (state.sales.primarySalesSettlement) {
        const settlement = state.sales.primarySalesSettlement;
        console.log('💾 Redux中的数据:');
        
        if (settlement.sales) {
          console.log('  sales对象存在，字段:');
          const fields = ['total_commission', 'direct_commission', 'secondary_avg_rate', 'secondary_share_commission', 'secondary_orders_amount'];
          fields.forEach(field => {
            console.log(`    ${field}: ${settlement.sales[field]}`);
          });
        } else {
          console.log('  ❌ sales对象不存在');
        }
        
        if (settlement.stats) {
          console.log('  stats对象存在');
        } else {
          console.log('  ❌ stats对象不存在');
        }
      }
    } else {
      console.log('❌ sales slice不存在');
    }
  } else {
    console.log('❌ Redux store不存在');
  }
  
  // 4. 检查页面组件状态
  console.log('\n4. 🖥️ 检查页面组件状态...');
  
  // 检查当前URL
  console.log('当前页面URL:', window.location.href);
  
  // 检查是否在正确页面
  if (window.location.pathname.includes('sales/commission')) {
    console.log('✅ 在一级销售对账页面');
  } else {
    console.log('❌ 不在一级销售对账页面，可能影响数据加载');
  }
  
  // 5. 检查网络请求
  console.log('\n5. 🌐 检查网络请求情况...');
  
  // 监听网络请求（需要在页面刷新后重新运行）
  const originalFetch = window.fetch;
  let networkRequests = [];
  
  window.fetch = function(...args) {
    const url = args[0];
    console.log('🔍 捕获到网络请求:', url);
    networkRequests.push({
      url: url,
      time: new Date().toLocaleTimeString()
    });
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ 已设置网络请求监听');
  
  // 6. 检查时序问题
  console.log('\n6. ⏰ 检查可能的时序问题...');
  
  console.log('建议的调试步骤:');
  console.log('1. 打开开发者工具网络面板');
  console.log('2. 刷新页面或重新查询');
  console.log('3. 观察API调用时机和响应');
  console.log('4. 检查是否有并发请求导致数据覆盖');
  
  // 7. 检查缓存问题
  console.log('\n7. 💾 检查可能的缓存问题...');
  
  console.log('Redux数据是否被缓存:', !!window.store?.getState()?.sales?.primarySalesSettlement);
  console.log('建议清除缓存重新测试');
  
  // 提供修复建议
  console.log('\n💡 修复建议:');
  console.log('=' .repeat(50));
  console.log('1. 如果数据库数据稳定 → 问题在API或Redux层');
  console.log('2. 如果API响应不稳定 → 检查Supabase查询逻辑');
  console.log('3. 如果Redux状态不稳定 → 检查action处理逻辑');
  console.log('4. 如果页面显示不稳定 → 检查组件数据映射逻辑');
  console.log('5. 添加更多错误处理和重试机制');
}

// 执行分析
analyzeInstabilityCauses().catch(console.error);

console.log('\n💡 提示: 请在一级销售对账页面运行此脚本');
console.log('💡 同时观察开发者工具的网络和控制台面板');