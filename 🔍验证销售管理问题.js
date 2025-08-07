// 验证销售管理数据为空的问题
// 检查销售数据获取和显示逻辑

console.log('🔍 开始验证销售管理问题...');

// 1. 检查数据库中的销售数据
async function checkSalesData() {
  console.log('\n👥 检查销售数据...');
  
  try {
    // 检查一级销售数据
    console.log('📋 检查一级销售数据...');
    const primaryResponse = await fetch('/api/primary-sales', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (primaryResponse.ok) {
      const primarySales = await primaryResponse.json();
      console.log('✅ 一级销售数据:', {
        数量: primarySales.length,
        前3条: primarySales.slice(0, 3).map(s => ({
          销售代码: s.sales_code,
          姓名: s.name,
          微信号: s.wechat_name,
          手机: s.phone,
          创建时间: s.created_at
        }))
      });
    } else {
      console.log('❌ 获取一级销售失败:', primaryResponse.status);
    }

    // 检查二级销售数据
    console.log('📋 检查二级销售数据...');
    const secondaryResponse = await fetch('/api/secondary-sales', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (secondaryResponse.ok) {
      const secondarySales = await secondaryResponse.json();
      console.log('✅ 二级销售数据:', {
        数量: secondarySales.length,
        前3条: secondarySales.slice(0, 3).map(s => ({
          销售代码: s.sales_code,
          姓名: s.name,
          微信号: s.wechat_name,
          手机: s.phone,
          创建时间: s.created_at
        }))
      });
    } else {
      console.log('❌ 获取二级销售失败:', secondaryResponse.status);
    }

    // 测试合并的销售API
    console.log('📋 测试合并销售API...');
    if (window.AdminAPI && window.AdminAPI.getSales) {
      const allSales = await window.AdminAPI.getSales();
      console.log('✅ 合并销售数据:', {
        总数量: allSales.length,
        一级销售: allSales.filter(s => s.sales_type === 'primary').length,
        二级销售: allSales.filter(s => s.sales_type === 'secondary').length,
        前3条: allSales.slice(0, 3).map(s => ({
          类型: s.sales_type,
          销售代码: s.sales_code,
          姓名: s.name,
          微信号: s.wechat_name
        }))
      });
    } else {
      console.log('❌ AdminAPI.getSales 不可用');
    }

  } catch (error) {
    console.error('❌ 检查销售数据出错:', error);
  }
}

// 2. 检查Redux状态
function checkSalesReduxState() {
  console.log('\n🔄 检查销售管理Redux状态...');
  
  if (window.store) {
    const state = window.store.getState();
    console.log('销售管理状态:', {
      sales: state.admin?.sales,
      销售数量: state.admin?.sales?.length || 0,
      loading: state.admin?.loading,
      error: state.admin?.error
    });
    
    // 检查具体的销售数据内容
    if (state.admin?.sales && state.admin.sales.length > 0) {
      console.log('销售数据示例:', state.admin.sales.slice(0, 3).map(s => ({
        ID: s.id,
        类型: s.sales_type,
        姓名: s.name,
        微信号: s.wechat_name,
        销售代码: s.sales_code,
        有效订单数: s.valid_orders || 0,
        总金额: s.total_amount || 0,
        佣金率: s.commission_rate || 0
      })));
    }
  } else {
    console.log('❌ Redux store 不可用');
  }
}

// 3. 检查销售管理页面组件
function checkSalesPageComponent() {
  console.log('\n🎛️ 检查销售管理页面组件...');
  
  // 查找销售管理表格
  const salesTable = document.querySelector('.ant-table-tbody');
  if (salesTable) {
    const rows = salesTable.querySelectorAll('tr');
    console.log('表格行数:', rows.length);
    
    if (rows.length === 0) {
      console.log('❌ 表格无数据行');
    } else {
      console.log('✅ 表格有数据，前3行内容:');
      Array.from(rows).slice(0, 3).forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        console.log(`行${index + 1}:`, Array.from(cells).map(cell => cell.textContent.trim()));
      });
    }
  } else {
    console.log('❌ 未找到销售管理表格');
  }
  
  // 检查是否有"暂无数据"提示
  const noDataElements = document.querySelectorAll('.ant-empty, [class*="empty"], [class*="no-data"]');
  if (noDataElements.length > 0) {
    console.log('⚠️ 发现"暂无数据"提示:', noDataElements.length, '个');
    noDataElements.forEach((el, index) => {
      console.log(`提示${index + 1}:`, el.textContent);
    });
  }
}

// 4. 检查订单与销售的关联
async function checkOrderSalesRelation() {
  console.log('\n🔗 检查订单与销售的关联关系...');
  
  try {
    // 获取订单数据
    const ordersResponse = await fetch('/api/orders', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (ordersResponse.ok) {
      const orders = await ordersResponse.json();
      
      // 统计每个销售代码的订单数量和金额
      const salesStats = {};
      orders.forEach(order => {
        const salesCode = order.sales_code;
        if (salesCode) {
          if (!salesStats[salesCode]) {
            salesStats[salesCode] = {
              销售代码: salesCode,
              订单数量: 0,
              总金额: 0,
              实付总额: 0,
              销售微信: order.sales_wechat_name || '未关联'
            };
          }
          salesStats[salesCode].订单数量++;
          salesStats[salesCode].总金额 += parseFloat(order.amount || 0);
          salesStats[salesCode].实付总额 += parseFloat(order.actual_payment_amount || 0);
        }
      });
      
      console.log('✅ 按销售代码统计:', salesStats);
      console.log('销售代码数量:', Object.keys(salesStats).length);
      
      // 检查哪些销售代码有订单但在销售表中可能不存在
      const salesCodes = Object.keys(salesStats);
      console.log('有订单的销售代码:', salesCodes);
      
    } else {
      console.log('❌ 获取订单数据失败');
    }
    
  } catch (error) {
    console.error('❌ 检查关联关系出错:', error);
  }
}

// 执行验证
checkSalesData();
checkSalesReduxState();
checkSalesPageComponent();
checkOrderSalesRelation();

console.log('\n🎯 如果销售管理数据为空，可能原因：');
console.log('1. primary_sales 和 secondary_sales 表中无数据');
console.log('2. API调用失败或返回格式错误');
console.log('3. Redux状态未正确更新');
console.log('4. 前端组件未正确渲染数据');
console.log('5. 销售数据与订单数据关联失败');

// 提供手动刷新方法
window.refreshSales = function() {
  if (window.store) {
    console.log('🔄 手动刷新销售数据...');
    window.store.dispatch({type: 'admin/getSales'});
  }
};

console.log('\n💡 可以执行 refreshSales() 手动刷新销售数据');
