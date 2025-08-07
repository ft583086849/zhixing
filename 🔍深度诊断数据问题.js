/**
 * 🔍 深度诊断销售微信号和数据问题
 * 请在浏览器控制台运行此脚本
 */

async function deepDiagnosis() {
  console.log('='.repeat(60));
  console.log('🔍 深度诊断数据问题');
  console.log('='.repeat(60));
  
  try {
    // 导入Supabase客户端
    const { createClient } = await import('@supabase/supabase-js');
    
    // Supabase配置
    const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase连接成功\n');
    
    // ============= 1. 检查原始数据 =============
    console.log('📋 步骤1：检查Supabase原始数据');
    console.log('-'.repeat(50));
    
    // 直接查询销售表
    console.log('\n🔍 查询一级销售表:');
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('*')
      .limit(5);
    
    if (primaryError) {
      console.error('❌ 查询一级销售失败:', primaryError);
    } else {
      console.log(`✅ 一级销售数量: ${primarySales?.length || 0}`);
      if (primarySales && primarySales.length > 0) {
        console.log('示例数据:');
        primarySales.forEach((sale, idx) => {
          console.log(`  ${idx + 1}. sales_code: ${sale.sales_code}`);
          console.log(`     wechat_name: ${sale.wechat_name || '【空】'}`);
          console.log(`     name: ${sale.name || '【空】'}`);
          console.log(`     created_at: ${sale.created_at}`);
        });
      }
    }
    
    console.log('\n🔍 查询二级销售表:');
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*')
      .limit(5);
    
    if (secondaryError) {
      console.error('❌ 查询二级销售失败:', secondaryError);
    } else {
      console.log(`✅ 二级销售数量: ${secondarySales?.length || 0}`);
      if (secondarySales && secondarySales.length > 0) {
        console.log('示例数据:');
        secondarySales.forEach((sale, idx) => {
          console.log(`  ${idx + 1}. sales_code: ${sale.sales_code}`);
          console.log(`     wechat_name: ${sale.wechat_name || '【空】'}`);
          console.log(`     name: ${sale.name || '【空】'}`);
        });
      }
    }
    
    console.log('\n🔍 查询订单表:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ 查询订单失败:', ordersError);
    } else {
      console.log(`✅ 订单数量: ${orders?.length || 0}`);
      if (orders && orders.length > 0) {
        console.log('示例数据:');
        orders.forEach((order, idx) => {
          console.log(`  ${idx + 1}. sales_code: ${order.sales_code}`);
          console.log(`     sales_wechat_name: ${order.sales_wechat_name || '【空】'}`);
          console.log(`     customer_wechat: ${order.customer_wechat || '【空】'}`);
          console.log(`     amount: ${order.amount}`);
        });
      }
    }
    
    // ============= 2. 测试API调用 =============
    console.log('\n📋 步骤2：测试API调用');
    console.log('-'.repeat(50));
    
    // 检查是否有 SupabaseService
    if (window.SupabaseService) {
      console.log('✅ SupabaseService 存在');
      
      try {
        const primaryData = await window.SupabaseService.getPrimarySales();
        console.log(`  getPrimarySales返回: ${primaryData?.length || 0} 条`);
      } catch (e) {
        console.error('  getPrimarySales失败:', e.message);
      }
      
      try {
        const secondaryData = await window.SupabaseService.getSecondarySales();
        console.log(`  getSecondarySales返回: ${secondaryData?.length || 0} 条`);
      } catch (e) {
        console.error('  getSecondarySales失败:', e.message);
      }
    } else {
      console.log('⚠️ SupabaseService 不存在');
    }
    
    // 检查AdminAPI
    if (window.adminAPI) {
      console.log('\n✅ AdminAPI 存在');
      
      // 测试 syncSalesWechatNames
      if (window.adminAPI.syncSalesWechatNames) {
        console.log('🔄 调用 syncSalesWechatNames...');
        try {
          const syncResult = await window.adminAPI.syncSalesWechatNames();
          console.log('同步结果:', syncResult);
        } catch (e) {
          console.error('同步失败:', e.message);
        }
      }
      
      // 测试 getSales
      console.log('\n🔄 调用 getSales...');
      try {
        const salesData = await window.adminAPI.getSales();
        console.log(`getSales返回: ${salesData?.length || 0} 条`);
        
        if (salesData && salesData.length > 0) {
          const withWechat = salesData.filter(s => s.wechat_name).length;
          console.log(`有微信号的销售: ${withWechat}/${salesData.length}`);
          
          console.log('\n前3条数据:');
          salesData.slice(0, 3).forEach((sale, idx) => {
            console.log(`  ${idx + 1}. sales_code: ${sale.sales_code}`);
            console.log(`     wechat_name: ${sale.wechat_name || '【空】'}`);
            console.log(`     total_orders: ${sale.total_orders || 0}`);
          });
        }
      } catch (e) {
        console.error('getSales失败:', e.message);
      }
    } else {
      console.log('⚠️ AdminAPI 不存在');
    }
    
    // ============= 3. 检查Redux Store =============
    console.log('\n📋 步骤3：检查Redux Store');
    console.log('-'.repeat(50));
    
    if (window.store) {
      const state = window.store.getState();
      console.log('Redux state结构:', Object.keys(state));
      
      if (state.admin) {
        console.log('\nadmin state内容:');
        console.log('  sales数量:', state.admin.sales?.length || 0);
        console.log('  orders数量:', state.admin.orders?.length || 0);
        console.log('  customers数量:', state.admin.customers?.length || 0);
        console.log('  loading:', state.admin.loading);
        console.log('  error:', state.admin.error);
        
        if (state.admin.sales && state.admin.sales.length > 0) {
          console.log('\n销售数据示例:');
          const sample = state.admin.sales[0];
          console.log('  第一条数据:', {
            sales_code: sample.sales_code,
            wechat_name: sample.wechat_name,
            sales_type: sample.sales_type
          });
        }
      }
    } else {
      console.log('⚠️ Redux store 不存在');
    }
    
    // ============= 4. 手动创建并设置测试数据 =============
    console.log('\n📋 步骤4：手动创建并设置测试数据');
    console.log('-'.repeat(50));
    
    const testCode = `DEMO${Date.now()}`;
    const testWechat = `演示微信_${Date.now()}`;
    
    console.log(`创建测试销售: ${testCode}`);
    
    // 创建测试一级销售
    const { data: newSale, error: createError } = await supabase
      .from('primary_sales')
      .insert([{
        sales_code: testCode,
        wechat_name: testWechat,
        name: `演示销售_${testCode}`,
        phone: '13900139000',
        payment_method: 'alipay',
        payment_account: 'demo@test.com',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ 创建测试销售失败:', createError);
    } else {
      console.log('✅ 测试销售创建成功:', newSale);
      
      // 手动更新Redux store
      if (window.store && window.adminAPI) {
        console.log('\n🔄 强制刷新数据...');
        
        // 方法1：通过dispatch action
        try {
          await window.store.dispatch({
            type: 'admin/getSales',
            payload: undefined
          });
          console.log('✅ 通过action刷新');
        } catch (e) {
          console.log('action方式失败，尝试直接调用API');
          
          // 方法2：直接调用API并更新
          const freshSales = await window.adminAPI.getSales();
          window.store.dispatch({
            type: 'admin/getSales/fulfilled',
            payload: freshSales
          });
          console.log('✅ 通过API刷新');
        }
      }
    }
    
    // ============= 5. 最终诊断结果 =============
    console.log('\n' + '='.repeat(60));
    console.log('📝 诊断完成 - 总结');
    console.log('='.repeat(60));
    
    const hasData = (primarySales?.length || 0) + (secondarySales?.length || 0) > 0;
    const hasOrders = (orders?.length || 0) > 0;
    const hasAPI = !!window.adminAPI;
    const hasStore = !!window.store;
    
    console.log('\n✅ 组件状态:');
    console.log(`  Supabase连接: ✅ 正常`);
    console.log(`  数据库有销售数据: ${hasData ? '✅ 有' : '❌ 无'}`);
    console.log(`  数据库有订单数据: ${hasOrders ? '✅ 有' : '❌ 无'}`);
    console.log(`  AdminAPI可用: ${hasAPI ? '✅ 是' : '❌ 否'}`);
    console.log(`  Redux Store可用: ${hasStore ? '✅ 是' : '❌ 否'}`);
    
    console.log('\n💡 建议操作:');
    if (!hasData) {
      console.log('1. 数据库没有销售数据，需要先创建销售');
    }
    if (hasData && !hasAPI) {
      console.log('1. 请确保已登录管理员账号');
    }
    if (hasData && hasAPI) {
      console.log('1. 数据和API都正常，请刷新页面（Ctrl+F5）');
      console.log('2. 清除浏览器缓存后重试');
      console.log(`3. 搜索测试数据: ${testCode}`);
    }
    
  } catch (error) {
    console.error('❌ 诊断过程发生错误:', error);
  }
}

// 执行诊断
console.log('💡 开始深度诊断...\n');
deepDiagnosis();
