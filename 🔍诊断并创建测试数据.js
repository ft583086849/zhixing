/**
 * 🔍 诊断销售微信号问题并创建测试数据
 * 请在浏览器控制台运行此脚本
 */

async function diagnosisAndCreateTestData() {
  console.log('='.repeat(60));
  console.log('🔍 开始诊断销售微信号问题');
  console.log('='.repeat(60));
  
  try {
    // 导入Supabase客户端
    const { createClient } = await import('@supabase/supabase-js');
    
    // Supabase配置
    const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase客户端创建成功\n');
    
    // ============= 步骤1：诊断当前数据状态 =============
    console.log('📋 步骤1：诊断当前数据状态');
    console.log('-'.repeat(50));
    
    // 获取所有数据
    const [primaryResult, secondaryResult, ordersResult] = await Promise.all([
      supabase.from('primary_sales').select('*'),
      supabase.from('secondary_sales').select('*'),
      supabase.from('orders').select('*')
    ]);
    
    const primarySales = primaryResult.data || [];
    const secondarySales = secondaryResult.data || [];
    const orders = ordersResult.data || [];
    
    console.log(`📊 数据统计：`);
    console.log(`  一级销售: ${primarySales.length} 条`);
    console.log(`  二级销售: ${secondarySales.length} 条`);
    console.log(`  订单: ${orders.length} 条`);
    
    // 分析微信号情况
    const primaryWithWechat = primarySales.filter(s => s.wechat_name).length;
    const secondaryWithWechat = secondarySales.filter(s => s.wechat_name).length;
    const ordersWithSalesWechat = orders.filter(o => o.sales_wechat_name).length;
    
    console.log(`\n📱 微信号统计：`);
    console.log(`  一级销售有微信号: ${primaryWithWechat}/${primarySales.length}`);
    console.log(`  二级销售有微信号: ${secondaryWithWechat}/${secondarySales.length}`);
    console.log(`  订单有销售微信号: ${ordersWithSalesWechat}/${orders.length}`);
    
    // 显示前3个销售的详细信息
    if (primarySales.length > 0) {
      console.log('\n🔍 一级销售样本数据:');
      primarySales.slice(0, 3).forEach((sale, idx) => {
        console.log(`  ${idx + 1}. sales_code: ${sale.sales_code}`);
        console.log(`     wechat_name: ${sale.wechat_name || '【空】'}`);
        console.log(`     name: ${sale.name || '【空】'}`);
        console.log(`     phone: ${sale.phone || '【空】'}`);
      });
    }
    
    // ============= 步骤2：创建测试数据 =============
    console.log('\n📋 步骤2：创建测试数据');
    console.log('-'.repeat(50));
    
    const testDate = new Date().toISOString();
    const testCode = `TEST${Date.now()}`;
    
    // 2.1 创建测试一级销售
    console.log('\n🔧 创建测试一级销售...');
    const testPrimarySale = {
      sales_code: testCode,
      wechat_name: `测试微信号_${testCode}`,
      name: `测试销售_${testCode}`,
      phone: '13800138000',
      payment_method: 'alipay',
      payment_account: 'test@alipay.com',
      created_at: testDate,
      updated_at: testDate
    };
    
    const { data: createdPrimary, error: primaryError } = await supabase
      .from('primary_sales')
      .insert([testPrimarySale])
      .select()
      .single();
    
    if (primaryError) {
      console.error('❌ 创建测试一级销售失败:', primaryError);
    } else {
      console.log('✅ 测试一级销售创建成功:', createdPrimary);
    }
    
    // 2.2 创建测试订单（关联刚创建的销售）
    console.log('\n🔧 创建测试订单...');
    const testOrder = {
      sales_code: testCode,
      sales_wechat_name: `测试微信号_${testCode}`,
      customer_wechat: `测试客户_${Date.now()}`,
      tradingview_username: 'test_user',
      duration: '1month',
      amount: 100,
      payment_method: 'alipay',
      status: 'pending_payment',
      created_at: testDate,
      updated_at: testDate
    };
    
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ 创建测试订单失败:', orderError);
    } else {
      console.log('✅ 测试订单创建成功:', createdOrder);
    }
    
    // ============= 步骤3：手动触发API同步 =============
    console.log('\n📋 步骤3：手动触发API同步');
    console.log('-'.repeat(50));
    
    if (window.adminAPI && window.adminAPI.getSales) {
      console.log('🔄 调用 adminAPI.getSales() 触发同步...');
      try {
        const salesData = await window.adminAPI.getSales();
        console.log(`✅ API调用成功，返回 ${salesData?.length || 0} 条销售数据`);
        
        // 查找我们的测试数据
        const ourTestSale = salesData?.find(s => s.sales_code === testCode);
        if (ourTestSale) {
          console.log('\n🎯 找到测试销售数据:');
          console.log(`  sales_code: ${ourTestSale.sales_code}`);
          console.log(`  wechat_name: ${ourTestSale.wechat_name}`);
          console.log(`  total_orders: ${ourTestSale.total_orders}`);
        } else {
          console.log('⚠️ 未在API返回中找到测试数据');
        }
      } catch (error) {
        console.error('❌ API调用失败:', error);
      }
    } else {
      console.log('⚠️ adminAPI不可用，请确保已登录管理员账号');
    }
    
    // ============= 步骤4：验证页面显示 =============
    console.log('\n📋 步骤4：验证页面显示');
    console.log('-'.repeat(50));
    
    // 检查Redux store
    if (window.store) {
      const state = window.store.getState();
      const adminSales = state.admin?.sales || [];
      
      console.log(`Redux store中有 ${adminSales.length} 条销售数据`);
      
      const testSaleInStore = adminSales.find(s => s.sales_code === testCode);
      if (testSaleInStore) {
        console.log('✅ 测试数据已在Redux store中');
        console.log('  微信号:', testSaleInStore.wechat_name);
      } else {
        console.log('⚠️ 测试数据未在Redux store中');
      }
    }
    
    // ============= 步骤5：提供解决建议 =============
    console.log('\n' + '='.repeat(60));
    console.log('📝 诊断总结');
    console.log('='.repeat(60));
    
    console.log('\n✅ 已创建测试数据:');
    console.log(`  销售代码: ${testCode}`);
    console.log(`  微信号: 测试微信号_${testCode}`);
    
    console.log('\n💡 下一步操作:');
    console.log('1. 刷新页面（F5）');
    console.log('2. 访问销售管理页面');
    console.log(`3. 搜索销售代码 "${testCode}" 查看是否显示微信号`);
    console.log('4. 如果仍未显示，查看浏览器控制台的错误信息');
    
    console.log('\n🔍 可能的问题:');
    console.log('1. 页面缓存 - 强制刷新（Ctrl+F5）');
    console.log('2. API同步未触发 - 重新登录管理员账号');
    console.log('3. Supabase RLS策略 - 检查数据库权限设置');
    
  } catch (error) {
    console.error('❌ 执行过程发生错误:', error);
  }
}

// 执行诊断和创建测试数据
console.log('💡 开始执行诊断和创建测试数据...\n');
diagnosisAndCreateTestData();
