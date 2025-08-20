// 在浏览器控制台运行，测试Redux的API调用
console.log('🔍 测试Redux API调用...\n');

async function testReduxAPICall() {
  // 1. 检查Redux store
  if (!window.store) {
    console.error('❌ 未找到Redux store');
    return;
  }
  
  const store = window.store;
  
  // 2. 导入必要的action
  // 注意：这需要在已经加载的页面上运行
  console.log('📡 调用getPrimarySalesSettlement...');
  
  // 构造参数
  const params = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };
  
  console.log('请求参数:', params);
  
  // 3. 直接调用salesAPI（如果可用）
  if (window.salesAPI) {
    try {
      console.log('\n使用salesAPI直接调用...');
      const response = await window.salesAPI.getPrimarySalesSettlement(params);
      console.log('✅ salesAPI响应:', response);
      
      if (response.data) {
        console.log('\n📊 返回的数据结构:');
        console.log('sales对象:', response.data.sales);
        console.log('stats对象:', response.data.stats);
        
        if (response.data.sales) {
          console.log('\n🔍 检查sales对象的关键字段:');
          const fields = [
            'total_commission',
            'direct_commission',
            'secondary_avg_rate', 
            'secondary_share_commission',
            'secondary_orders_amount'
          ];
          
          fields.forEach(field => {
            const value = response.data.sales[field];
            console.log(`  ${field}: ${value !== undefined ? value : '❌ undefined'}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ salesAPI调用失败:', error);
    }
  }
  
  // 4. 通过dispatch调用
  console.log('\n📡 通过dispatch调用...');
  
  // 需要找到action creator
  // 这通常需要import，但在控制台中我们尝试其他方法
  
  // 5. 直接查看当前页面state
  console.log('\n📊 当前页面Redux状态:');
  const state = store.getState();
  
  if (state.sales) {
    console.log('sales slice状态:');
    console.log('  loading:', state.sales.loading);
    console.log('  primarySalesSettlement:', state.sales.primarySalesSettlement);
    
    if (state.sales.primarySalesSettlement) {
      const settlement = state.sales.primarySalesSettlement;
      console.log('\n结算数据:');
      console.log('  sales:', settlement.sales);
      console.log('  stats:', settlement.stats);
      console.log('  secondarySales数量:', settlement.secondarySales?.length);
    }
  }
  
  // 6. 模拟页面的数据映射逻辑
  console.log('\n📋 模拟页面数据映射:');
  if (state.sales?.primarySalesSettlement) {
    const response = state.sales.primarySalesSettlement;
    const { sales, stats } = response;
    
    const mappedData = {
      direct_commission: sales?.direct_commission || stats?.direct_commission || 0,
      secondary_avg_rate: sales?.secondary_avg_rate || stats?.secondary_avg_rate || 0,
      secondary_share_commission: sales?.secondary_share_commission || stats?.secondary_share_commission || 0,
      secondary_orders_amount: sales?.secondary_orders_amount || stats?.secondary_orders_amount || 0
    };
    
    console.log('映射后的数据:');
    Object.entries(mappedData).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
}

// 执行测试
testReduxAPICall().catch(console.error);

console.log('\n💡 提示: 如果salesAPI不可用，请在页面上先进行一次查询，然后查看Redux状态');