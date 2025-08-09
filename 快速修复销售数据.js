// 🔧 快速修复销售数据问题
// 在 https://zhixing-seven.vercel.app/admin/sales 控制台运行

console.log('🔧 开始修复销售数据...\n');

// 1. 手动刷新数据（延迟确保数据库更新）
async function refreshSalesData() {
  console.log('📊 刷新销售数据...');
  const { getSales } = await import('/src/store/slices/adminSlice.js').catch(() => ({}));
  
  if (window.store && getSales) {
    setTimeout(() => {
      window.store.dispatch(getSales());
      console.log('✅ 数据刷新请求已发送');
    }, 1000);
  } else {
    // 直接调用API
    if (window.AdminAPI) {
      const data = await window.AdminAPI.getSales();
      console.log('✅ 获取到销售数据:', data.length, '条');
      
      // 手动更新Redux状态
      if (window.store) {
        window.store.dispatch({
          type: 'admin/getSales/fulfilled',
          payload: data
        });
      }
    }
  }
}

// 2. 过滤重复记录（前端临时处理）
function filterDuplicates() {
  const state = window.store?.getState();
  const sales = state?.admin?.sales || [];
  
  console.log(`\n📋 原始记录数: ${sales.length}`);
  
  // 按ID去重，优先保留primary_sales
  const seen = new Set();
  const filtered = [];
  
  // 先处理一级销售
  sales.forEach(sale => {
    if (sale.sales_type === 'primary' || sale.sales?.sales_type === 'primary') {
      const id = sale.sales?.wechat_name || sale.sales?.name;
      if (id && !seen.has(id)) {
        seen.add(id);
        filtered.push(sale);
      }
    }
  });
  
  // 再处理其他销售
  sales.forEach(sale => {
    if (sale.sales_type !== 'primary' && sale.sales?.sales_type !== 'primary') {
      const id = sale.sales?.wechat_name || sale.sales?.name;
      if (id && !seen.has(id)) {
        seen.add(id);
        filtered.push(sale);
      }
    }
  });
  
  console.log(`✅ 去重后记录数: ${filtered.length}`);
  
  // 更新Redux状态
  if (window.store) {
    window.store.dispatch({
      type: 'admin/getSales/fulfilled',
      payload: filtered
    });
    console.log('✅ Redux状态已更新');
  }
  
  return filtered;
}

// 3. 修复负数佣金率
function fixNegativeRates() {
  const state = window.store?.getState();
  const sales = state?.admin?.sales || [];
  
  let fixedCount = 0;
  const fixed = sales.map(sale => {
    if (sale.commission_rate < 0) {
      fixedCount++;
      return {
        ...sale,
        commission_rate: 0,
        sales: {
          ...sale.sales,
          commission_rate: 0
        }
      };
    }
    return sale;
  });
  
  if (fixedCount > 0) {
    console.log(`\n✅ 修复了 ${fixedCount} 个负数佣金率`);
    
    // 更新Redux状态
    if (window.store) {
      window.store.dispatch({
        type: 'admin/getSales/fulfilled',
        payload: fixed
      });
    }
  }
  
  return fixed;
}

// 4. 执行修复
async function runFix() {
  console.log('🚀 执行修复流程...\n');
  
  // Step 1: 刷新数据
  await refreshSalesData();
  
  // Step 2: 等待数据加载
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: 过滤重复
  filterDuplicates();
  
  // Step 4: 修复负数
  fixNegativeRates();
  
  console.log('\n✅ 修复完成！');
  console.log('💡 建议：');
  console.log('1. 刷新页面查看效果');
  console.log('2. 如果问题依旧，需要在数据库层面清理重复数据');
  console.log('3. 运行"诊断销售数据问题.js"查看详细信息');
}

// 执行
runFix();
