// 在浏览器控制台执行此脚本来检查销售数据
// 访问 http://localhost:3000/admin/dashboard

console.log('=== 检查销售数据中的名称字段 ===\n');

// 检查Redux store中的销售数据
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  const state = window.store?.getState?.() || {};
  console.log('Redux state:', state);
  
  if (state.admin && state.admin.sales) {
    console.log('销售数据总数:', state.admin.sales.length);
    console.log('\n前5个销售数据的字段:');
    
    state.admin.sales.slice(0, 5).forEach((sale, index) => {
      console.log(`${index + 1}. 销售数据:`, {
        id: sale.id,
        sales_code: sale.sales_code,
        wechat_name: sale.wechat_name,
        name: sale.name,
        sales_type: sale.sales_type,
        total_amount: sale.total_amount,
        '所有字段': Object.keys(sale)
      });
    });
  } else {
    console.log('未找到销售数据');
  }
} else {
  console.log('Redux DevTools 不可用');
}

// 检查AdminAPI是否可用
if (window.AdminAPI && window.AdminAPI.getSales) {
  console.log('\n=== 直接调用API检查销售数据 ===');
  
  window.AdminAPI.getSales({ timeRange: 'all' }).then(result => {
    if (result && result.length > 0) {
      console.log('API返回的销售数据总数:', result.length);
      console.log('\n前3个销售的名称字段:');
      
      result.slice(0, 3).forEach((sale, index) => {
        console.log(`${index + 1}. 销售:`, {
          wechat_name: sale.wechat_name,
          name: sale.name,
          sales_name: sale.sales_name,
          sales_type: sale.sales_type,
          total_amount: sale.total_amount
        });
      });
    } else {
      console.log('API未返回销售数据');
    }
  }).catch(error => {
    console.error('API调用失败:', error);
  });
} else {
  console.log('AdminAPI 不可用');
}