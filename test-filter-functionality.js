// 测试销售筛选功能是否正常工作

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFiltering() {
  console.log('=== 测试销售筛选功能 ===\n');
  
  try {
    // 1. 获取所有销售数据
    console.log('1. 获取所有销售数据：');
    const { data: allSales, error: allError } = await supabase
      .from('sales_optimized')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) throw allError;
    
    console.log(`   总共 ${allSales.length} 个销售`);
    
    // 按类型统计
    const primaryCount = allSales.filter(s => s.sales_type === 'primary').length;
    const secondaryCount = allSales.filter(s => s.sales_type === 'secondary').length;
    const independentCount = allSales.filter(s => s.sales_type === 'independent').length;
    
    console.log(`   - 一级销售: ${primaryCount} 个`);
    console.log(`   - 二级销售: ${secondaryCount} 个`);
    console.log(`   - 独立销售: ${independentCount} 个`);
    
    // 2. 测试按销售类型筛选 - 一级销售
    console.log('\n2. 测试筛选一级销售：');
    const { data: primarySales, error: primaryError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary');
    
    if (primaryError) throw primaryError;
    
    console.log(`   筛选到 ${primarySales.length} 个一级销售`);
    if (primarySales.length > 0) {
      console.log('   前3个一级销售：');
      primarySales.slice(0, 3).forEach(s => {
        console.log(`   - ${s.wechat_name || s.name} (${s.sales_code})`);
      });
    }
    
    // 3. 获取一级销售的订单
    if (primarySales.length > 0) {
      console.log('\n3. 测试一级销售的订单统计：');
      const firstPrimary = primarySales[0];
      
      // 获取该销售的订单
      const { data: orders, error: ordersError } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', firstPrimary.sales_code)
        .neq('status', 'rejected');
      
      if (ordersError) throw ordersError;
      
      console.log(`   销售 ${firstPrimary.wechat_name} 的订单：`);
      console.log(`   - 总订单数: ${orders.length}`);
      
      const validOrders = orders.filter(o => 
        ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
      );
      console.log(`   - 有效订单数: ${validOrders.length}`);
      
      const totalAmount = validOrders.reduce((sum, o) => {
        const amount = parseFloat(o.actual_payment_amount || o.amount || 0);
        const usd = o.payment_method === 'alipay' ? amount / 7.15 : amount;
        return sum + usd;
      }, 0);
      
      console.log(`   - 总金额: $${totalAmount.toFixed(2)}`);
    }
    
    // 4. 测试按销售名称筛选
    console.log('\n4. 测试按销售名称筛选：');
    if (allSales.length > 0) {
      const testSale = allSales[0];
      const testName = testSale.wechat_name || testSale.name;
      
      const { data: namedSales, error: namedError } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('wechat_name', testName);
      
      if (namedError) throw namedError;
      
      console.log(`   筛选销售 "${testName}"：`);
      console.log(`   - 找到 ${namedSales.length} 条记录`);
      
      if (namedSales.length > 0) {
        const sale = namedSales[0];
        console.log(`   - 销售类型: ${sale.sales_type}`);
        console.log(`   - 销售代码: ${sale.sales_code}`);
        
        // 获取该销售的订单
        const { data: saleOrders } = await supabase
          .from('orders_optimized')
          .select('*')
          .eq('sales_code', sale.sales_code)
          .neq('status', 'rejected');
        
        console.log(`   - 订单数量: ${saleOrders?.length || 0}`);
      }
    }
    
    // 5. 测试组合筛选
    console.log('\n5. 测试组合筛选（一级销售 + 特定名称）：');
    const { data: comboFiltered, error: comboError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary')
      .limit(1);
    
    if (comboError) throw comboError;
    
    if (comboFiltered.length > 0) {
      const targetName = comboFiltered[0].wechat_name;
      
      const { data: finalFiltered } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_type', 'primary')
        .eq('wechat_name', targetName);
      
      console.log(`   筛选条件: 一级销售 + 名称="${targetName}"`);
      console.log(`   结果: ${finalFiltered?.length || 0} 条记录`);
    }
    
    console.log('\n✅ 筛选功能测试完成');
    console.log('\n测试地址: http://localhost:3000/admin/overview');
    console.log('请在页面上测试以下操作：');
    console.log('1. 选择"一级销售" → 点击确认 → 检查数据是否只显示一级销售');
    console.log('2. 选择某个具体销售 → 点击确认 → 检查数据是否只显示该销售');
    console.log('3. 点击重置 → 检查是否恢复显示所有数据');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFiltering();