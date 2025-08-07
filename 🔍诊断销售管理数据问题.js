/**
 * 诊断销售管理页面数据问题
 * 在浏览器控制台运行此脚本
 */

async function diagnoseSalesData() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🔍 开始诊断销售管理数据问题');
  console.log('='.repeat(60));
  
  // 1. 检查销售数据
  console.log('\n📋 步骤1：获取销售数据');
  if (window.adminAPI) {
    try {
      const sales = await window.adminAPI.getSales();
      console.log(`✅ 获取到 ${sales?.length || 0} 个销售`);
      
      if (sales && sales.length > 0) {
        console.log('\n📊 销售详情:');
        sales.forEach((sale, index) => {
          console.log(`\n销售 ${index + 1}:`);
          console.log('- 销售类型:', sale.sales_type);
          console.log('- 销售代码:', sale.sales_code);
          console.log('- 微信号:', sale.wechat_name);
          console.log('- 总订单数:', sale.total_orders);
          console.log('- 总金额:', sale.total_amount);
          console.log('- 佣金率:', sale.commission_rate);
        });
      }
    } catch (error) {
      console.error('❌ 获取销售数据失败:', error);
    }
  }
  
  // 2. 直接查询Supabase数据
  console.log('\n📋 步骤2：直接查询数据库');
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  // 2.1 查询销售表
  console.log('\n📊 查询销售表:');
  const salesTables = ['primary_sales', 'secondary_sales'];
  const salesData = {};
  
  for (const table of salesTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        salesData[table] = data;
        console.log(`✅ ${table}: ${data.length} 条记录`);
        
        if (data.length > 0) {
          console.log(`  示例数据:`, data[0]);
          console.log(`  sales_code列表:`, data.map(s => s.sales_code));
        }
      }
    } catch (error) {
      console.error(`❌ 查询 ${table} 失败:`, error);
    }
  }
  
  // 2.2 查询订单表
  console.log('\n📊 查询订单表:');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      const orders = await response.json();
      console.log(`✅ orders表: ${orders.length} 条记录`);
      
      // 分析订单的sales_code分布
      const salesCodeDistribution = {};
      orders.forEach(order => {
        const code = order.sales_code || '无sales_code';
        salesCodeDistribution[code] = (salesCodeDistribution[code] || 0) + 1;
      });
      
      console.log('\n📊 订单sales_code分布:');
      Object.entries(salesCodeDistribution).forEach(([code, count]) => {
        console.log(`  ${code}: ${count} 个订单`);
      });
      
      // 检查是否有sales_code匹配销售表
      console.log('\n🔗 关联分析:');
      const allSalesCodes = [
        ...(salesData.primary_sales?.map(s => s.sales_code) || []),
        ...(salesData.secondary_sales?.map(s => s.sales_code) || [])
      ];
      
      const matchedOrders = orders.filter(o => allSalesCodes.includes(o.sales_code));
      console.log(`✅ 能关联到销售的订单: ${matchedOrders.length} / ${orders.length}`);
      
      if (matchedOrders.length === 0) {
        console.warn('⚠️ 问题发现：没有任何订单能通过sales_code关联到销售！');
        console.log('这就是为什么销售管理页面数据都是0的原因');
      }
    }
  } catch (error) {
    console.error('❌ 查询订单失败:', error);
  }
  
  // 3. 提供解决方案
  console.log('\n' + '='.repeat(60));
  console.log('💡 诊断总结和解决方案');
  console.log('='.repeat(60));
  
  console.log(`
问题根源：
1. 订单表的 sales_code 字段可能为空或不匹配
2. 销售表的 sales_code 字段可能为空或格式不一致

解决方案：
1. 确保订单创建时正确填充 sales_code 字段
2. 检查现有订单，补充缺失的 sales_code
3. 确保销售表中每个销售都有唯一的 sales_code

临时修复（在Supabase SQL Editor执行）：
-- 示例：为订单补充sales_code（需要根据实际情况调整）
UPDATE orders 
SET sales_code = 'YOUR_SALES_CODE' 
WHERE sales_code IS NULL 
  AND customer_wechat = 'SALES_WECHAT';
  `);
}

// 执行诊断
diagnoseSalesData();
