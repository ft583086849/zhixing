// 直接查询sales_optimized表中的字段值
console.log('🔍 直接查询sales_optimized表的字段值\n');

async function checkSalesOptimizedFields() {
  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error('❌ 未找到supabase客户端');
    return;
  }
  
  const testSalesCode = 'PRI17547241780648255';
  
  // 直接查询销售数据
  const { data, error } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .single();
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  console.log('✅ 查询到的完整数据:');
  console.log(data);
  
  console.log('\n📊 关键字段值:');
  console.log('total_commission:', data.total_commission);
  console.log('direct_commission:', data.direct_commission);
  console.log('secondary_avg_rate:', data.secondary_avg_rate);
  console.log('secondary_share_commission:', data.secondary_share_commission);
  console.log('secondary_orders_amount:', data.secondary_orders_amount);
  console.log('direct_orders_amount:', data.direct_orders_amount);
  
  // 检查字段是否存在
  console.log('\n🔍 字段存在性检查:');
  const fields = [
    'total_commission',
    'direct_commission', 
    'secondary_avg_rate',
    'secondary_share_commission',
    'secondary_orders_amount',
    'direct_orders_amount'
  ];
  
  fields.forEach(field => {
    const hasField = field in data;
    const value = data[field];
    console.log(`${field}: ${hasField ? '✅ 存在' : '❌ 不存在'}, 值: ${value}`);
  });
  
  // 检查API返回的数据
  console.log('\n📡 调用API查看返回数据:');
  try {
    const response = await fetch('/api/sales/primary-sales-settlement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sales_code: testSalesCode
      })
    });
    
    const apiData = await response.json();
    console.log('API返回:', apiData);
    
    if (apiData.data && apiData.data.sales) {
      console.log('\nAPI返回的sales对象:');
      console.log(apiData.data.sales);
      
      console.log('\n检查API返回的字段:');
      fields.forEach(field => {
        const value = apiData.data.sales[field];
        console.log(`${field}: ${value}`);
      });
    }
  } catch (error) {
    console.error('API调用失败:', error);
  }
}

// 执行检查
checkSalesOptimizedFields();