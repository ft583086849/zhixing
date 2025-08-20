const { createClient } = require('@supabase/supabase-js');

const config = {
  url: 'https://itvmeamoqthfqtkpubdv.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
};

const supabase = createClient(config.url, config.key);

async function checkDatabaseStructure() {
  console.log('🔍 一级销售对账页面数据为0问题 - 数据库层检查\n');
  
  // 1. 检查sales_optimized表结构和数据
  console.log('1. 检查sales_optimized表中的一级/二级销售数据');
  const { data: salesData, error: salesError } = await supabase
    .from('sales_optimized')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (salesError) {
    console.log('❌ sales_optimized查询错误:', salesError);
    return;
  }
  
  console.log('✅ sales_optimized表数据样本:', salesData.length, '条');
  if (salesData.length > 0) {
    console.log('字段列表:', Object.keys(salesData[0]));
    
    // 检查一级和二级销售
    const primarySales = salesData.filter(s => !s.parent_sales_code);
    const secondarySales = salesData.filter(s => s.parent_sales_code);
    console.log('一级销售数量:', primarySales.length);
    console.log('二级销售数量:', secondarySales.length);
    
    if (primarySales.length > 0) {
      console.log('一级销售样本:', {
        sales_code: primarySales[0].sales_code,
        name: primarySales[0].name,
        direct_commission: primarySales[0].direct_commission,
        secondary_avg_rate: primarySales[0].secondary_avg_rate,
        total_commission: primarySales[0].total_commission,
        secondary_commission_today: primarySales[0].secondary_commission_today
      });
    }
    
    if (secondarySales.length > 0) {
      console.log('二级销售样本:', {
        sales_code: secondarySales[0].sales_code,
        name: secondarySales[0].name,  
        parent_sales_code: secondarySales[0].parent_sales_code,
        commission_rate: secondarySales[0].commission_rate
      });
    }
  }
  
  // 2. 检查orders_optimized表中的订单数据
  console.log('\n2. 检查orders_optimized表中的订单数据');
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('status', '已确认')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (ordersError) {
    console.log('❌ orders_optimized查询错误:', ordersError);
  } else {
    console.log('✅ 已确认订单数量:', ordersData.length);
    if (ordersData.length > 0) {
      console.log('订单字段列表:', Object.keys(ordersData[0]));
      console.log('订单样本:', {
        order_id: ordersData[0].order_id,
        sales_code: ordersData[0].sales_code,
        amount: ordersData[0].amount,
        commission: ordersData[0].commission,
        status: ordersData[0].status,
        created_at: ordersData[0].created_at
      });
    }
  }
  
  // 3. 检查是否有错误的表名引用
  console.log('\n3. 测试是否存在secondary_sales表');
  try {
    const { data: secondaryTest, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*')
      .limit(1);
    
    if (secondaryError) {
      console.log('❌ secondary_sales表不存在 (这是正确的):', secondaryError.message);
    } else {
      console.log('⚠️ 意外发现secondary_sales表存在:', secondaryTest?.length, '条数据');
    }
  } catch (err) {
    console.log('❌ secondary_sales表访问异常:', err.message);
  }

  // 4. 检查特定销售的二级数据
  console.log('\n4. 检查特定一级销售的二级销售情况');
  if (primarySales.length > 0) {
    const primaryCode = primarySales[0].sales_code;
    console.log('检查一级销售:', primaryCode);
    
    const { data: subSales, error: subError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('parent_sales_code', primaryCode);
    
    if (subError) {
      console.log('❌ 查询二级销售错误:', subError);
    } else {
      console.log('该一级销售的二级销售数量:', subSales.length);
      if (subSales.length > 0) {
        console.log('二级销售详情:', subSales.map(s => ({
          sales_code: s.sales_code,
          name: s.name,
          commission_rate: s.commission_rate
        })));
      }
    }
  }
}

async function checkAPILogic() {
  console.log('\n📡 API层检查 - getPrimarySalesSettlement函数模拟');
  
  // 模拟API调用逻辑
  const today = new Date().toISOString().split('T')[0];
  console.log('查询日期:', today);
  
  try {
    // 获取一级销售列表
    const { data: primarySalesData, error: primaryError } = await supabase
      .from('sales_optimized')
      .select('*')
      .is('parent_sales_code', null);
    
    if (primaryError) {
      console.log('❌ 获取一级销售失败:', primaryError);
      return;
    }
    
    console.log('✅ 获取到一级销售数量:', primarySalesData.length);
    
    if (primarySalesData.length > 0) {
      const firstPrimary = primarySalesData[0];
      console.log('测试第一个一级销售:', firstPrimary.sales_code);
      
      // 获取该一级销售的二级销售
      const { data: secondaryData, error: secondaryError } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('parent_sales_code', firstPrimary.sales_code);
      
      if (secondaryError) {
        console.log('❌ 获取二级销售失败:', secondaryError);
      } else {
        console.log('✅ 二级销售数量:', secondaryData.length);
        
        // 计算统计数据
        let totalSecondaryOrders = 0;
        let totalSecondaryAmount = 0;
        let totalSecondaryCommission = 0;
        
        for (const secondary of secondaryData) {
          const { data: orders, error: orderError } = await supabase
            .from('orders_optimized')
            .select('*')
            .eq('sales_code', secondary.sales_code)
            .eq('status', '已确认')
            .gte('created_at', today + 'T00:00:00')
            .lt('created_at', today + 'T23:59:59');
          
          if (!orderError && orders) {
            totalSecondaryOrders += orders.length;
            totalSecondaryAmount += orders.reduce((sum, order) => sum + (order.amount || 0), 0);
            totalSecondaryCommission += orders.reduce((sum, order) => sum + (order.commission || 0), 0);
          }
        }
        
        console.log('统计结果:');
        console.log('- 二级销售订单数:', totalSecondaryOrders);
        console.log('- 二级销售总额:', totalSecondaryAmount);
        console.log('- 二级佣金总额:', totalSecondaryCommission);
        console.log('- 平均二级佣金率:', secondaryData.length > 0 ? 
          (secondaryData.reduce((sum, s) => sum + (s.commission_rate || 0), 0) / secondaryData.length).toFixed(2) + '%' : '0%');
      }
    }
  } catch (err) {
    console.log('❌ API逻辑检查异常:', err);
  }
}

// 执行检查
async function main() {
  await checkDatabaseStructure();
  await checkAPILogic();
  console.log('\n🔍 排查完成');
}

main().catch(console.error);