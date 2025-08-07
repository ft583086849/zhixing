/**
 * 强制刷新销售管理数据并验证
 * 在浏览器控制台运行此脚本
 */

async function forceRefreshSalesData() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🔥 强制刷新销售数据');
  console.log('='.repeat(60));
  
  // 1. 清除所有缓存
  console.log('\n📋 步骤1：清除缓存');
  if (window.localStorage) {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('cache') || key.includes('sales')) {
        localStorage.removeItem(key);
        console.log(`✅ 清除缓存: ${key}`);
      }
    });
  }
  
  // 2. 手动调用API获取销售数据
  console.log('\n📋 步骤2：重新获取销售数据');
  if (window.adminAPI) {
    try {
      const sales = await window.adminAPI.getSales();
      console.log(`✅ 获取到 ${sales?.length || 0} 个销售`);
      
      // 详细分析每个销售的数据
      if (sales && sales.length > 0) {
        console.log('\n📊 销售数据详情:');
        sales.forEach((sale, index) => {
          console.log(`\n销售 ${index + 1} [${sale.sales_type}]:`, {
            sales_code: sale.sales_code,
            wechat_name: sale.wechat_name,
            total_orders: sale.total_orders,
            valid_orders: sale.valid_orders,
            total_amount: sale.total_amount,
            commission_rate: sale.commission_rate,
            commission_amount: sale.commission_amount,
            sales: sale.sales  // 原始销售数据
          });
        });
      }
      
      // 3. 更新Redux Store
      console.log('\n📋 步骤3：强制更新Redux Store');
      if (window.store) {
        // 手动dispatch更新
        window.store.dispatch({
          type: 'admin/getSales/fulfilled',
          payload: sales
        });
        
        console.log('✅ Redux Store已更新');
        
        // 验证更新
        const state = window.store.getState();
        console.log('当前Redux中的销售数据:', state.admin.sales);
      }
      
      // 4. 验证数据结构
      console.log('\n📋 步骤4：验证数据结构');
      if (sales && sales.length > 0) {
        const firstSale = sales[0];
        console.log('第一个销售的数据结构:');
        console.log('- sales对象是否存在:', !!firstSale.sales);
        console.log('- sales.wechat_name:', firstSale.sales?.wechat_name);
        console.log('- 顶层wechat_name:', firstSale.wechat_name);
        console.log('- sales_type:', firstSale.sales_type);
        console.log('- total_orders:', firstSale.total_orders);
        
        // 检查是否需要调整数据结构
        if (!firstSale.sales) {
          console.warn('⚠️ 数据结构问题：sales对象不存在');
          console.log('尝试修复数据结构...');
          
          const fixedSales = sales.map(sale => ({
            ...sale,
            sales: {
              id: sale.id,
              sales_code: sale.sales_code,
              wechat_name: sale.wechat_name,
              sales_type: sale.sales_type,
              commission_rate: sale.commission_rate
            }
          }));
          
          // 再次更新Redux
          window.store.dispatch({
            type: 'admin/getSales/fulfilled',
            payload: fixedSales
          });
          
          console.log('✅ 数据结构已修复');
        }
      }
      
    } catch (error) {
      console.error('❌ 获取销售数据失败:', error);
    }
  }
  
  // 5. 触发页面重新渲染
  console.log('\n📋 步骤5：触发页面重新渲染');
  
  // 方法1：通过Redux dispatch一个dummy action
  if (window.store) {
    window.store.dispatch({ type: 'FORCE_RERENDER' });
  }
  
  // 方法2：手动触发React组件更新
  const event = new Event('statechange');
  window.dispatchEvent(event);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 强制刷新完成！');
  console.log('');
  console.log('如果数据还是显示0，请尝试：');
  console.log('1. 刷新整个页面 (F5)');
  console.log('2. 清除浏览器缓存并强制刷新 (Ctrl+Shift+R)');
  console.log('3. 检查控制台是否有错误信息');
  console.log('='.repeat(60));
}

// 执行强制刷新
forceRefreshSalesData();

// 额外：提供手动验证函数
window.verifySalesData = async function() {
  console.log('\n🔍 手动验证销售数据...');
  
  // 直接从Supabase获取数据
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  // 获取一个具体的销售代码的订单
  const testSalesCode = 'PS_175450317913';  // 从您的诊断结果中取一个
  
  const response = await fetch(`${supabaseUrl}/rest/v1/orders?sales_code=eq.${testSalesCode}`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  
  if (response.ok) {
    const orders = await response.json();
    console.log(`销售代码 ${testSalesCode} 的订单:`, orders);
    console.log(`订单数量: ${orders.length}`);
    console.log(`总金额: $${orders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0)}`);
  }
};

console.log('\n💡 提示：您可以运行 verifySalesData() 来手动验证特定销售的数据');
