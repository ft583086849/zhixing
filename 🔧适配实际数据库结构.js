/**
 * 🔧 适配实际数据库结构，正确获取和显示销售微信号
 * 不依赖orders表的sales_wechat_name字段
 */

async function fixWithCorrectStructure() {
  console.log('='.repeat(60));
  console.log('🔧 适配实际数据库结构');
  console.log('='.repeat(60));
  
  try {
    // 导入Supabase客户端
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ 连接成功\n');
    
    // ============= 1. 获取销售表数据 =============
    console.log('📋 步骤1：获取销售数据');
    console.log('-'.repeat(50));
    
    const [primaryResult, secondaryResult] = await Promise.all([
      supabase.from('primary_sales').select('*'),
      supabase.from('secondary_sales').select('*')
    ]);
    
    const primarySales = primaryResult.data || [];
    const secondarySales = secondaryResult.data || [];
    
    console.log(`✅ 一级销售: ${primarySales.length} 条`);
    console.log(`✅ 二级销售: ${secondarySales.length} 条`);
    
    // ============= 2. 确保销售表有微信号 =============
    console.log('\n📋 步骤2：确保销售表有微信号');
    console.log('-'.repeat(50));
    
    let updatedCount = 0;
    
    // 更新一级销售的微信号（如果为空，使用name或phone）
    for (const sale of primarySales) {
      if (!sale.wechat_name && (sale.name || sale.phone)) {
        const wechatName = sale.name || sale.phone || `销售_${sale.sales_code}`;
        
        const { error } = await supabase
          .from('primary_sales')
          .update({ wechat_name: wechatName })
          .eq('id', sale.id);
        
        if (!error) {
          updatedCount++;
          console.log(`✅ 更新一级销售 ${sale.sales_code}: ${wechatName}`);
        }
      }
    }
    
    // 更新二级销售的微信号
    for (const sale of secondarySales) {
      if (!sale.wechat_name && (sale.name || sale.phone)) {
        const wechatName = sale.name || sale.phone || `销售_${sale.sales_code}`;
        
        const { error } = await supabase
          .from('secondary_sales')
          .update({ wechat_name: wechatName })
          .eq('id', sale.id);
        
        if (!error) {
          updatedCount++;
          console.log(`✅ 更新二级销售 ${sale.sales_code}: ${wechatName}`);
        }
      }
    }
    
    console.log(`共更新 ${updatedCount} 条微信号`);
    
    // ============= 3. 获取订单数据（不依赖sales_wechat_name字段） =============
    console.log('\n📋 步骤3：获取订单数据');
    console.log('-'.repeat(50));
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(10);
    
    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError);
    } else {
      console.log(`✅ 获取到 ${orders?.length || 0} 条订单`);
      
      // 显示订单的实际字段
      if (orders && orders.length > 0) {
        console.log('\n订单表的实际字段:');
        const sampleOrder = orders[0];
        console.log('字段列表:', Object.keys(sampleOrder).join(', '));
      }
    }
    
    // ============= 4. 直接调用API并更新显示 =============
    console.log('\n📋 步骤4：刷新页面数据');
    console.log('-'.repeat(50));
    
    // 清除缓存
    if (window.localStorage) {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('cache') || key.includes('admin') || key.includes('sales')) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ 清除缓存');
    }
    
    // 如果有AdminAPI，重新获取数据
    if (window.adminAPI && window.adminAPI.getSales) {
      console.log('🔄 调用AdminAPI.getSales()...');
      
      try {
        const salesData = await window.adminAPI.getSales();
        console.log(`✅ API返回 ${salesData?.length || 0} 条销售数据`);
        
        if (salesData && salesData.length > 0) {
          console.log('\n销售数据样本:');
          salesData.slice(0, 3).forEach((sale, idx) => {
            console.log(`${idx + 1}. ${sale.sales_code}`);
            console.log(`   微信: ${sale.wechat_name || '无'}`);
            console.log(`   订单: ${sale.total_orders || 0}`);
          });
          
          // 强制更新Redux
          if (window.store) {
            window.store.dispatch({
              type: 'admin/getSales/fulfilled',
              payload: salesData
            });
            console.log('\n✅ Redux已更新');
            
            // 验证Redux状态
            const state = window.store.getState();
            const adminSales = state.admin?.sales || [];
            console.log(`Redux中的销售: ${adminSales.length} 条`);
          }
        }
      } catch (error) {
        console.error('❌ API调用失败:', error);
      }
    }
    
    // ============= 5. 创建测试数据（确保有微信号） =============
    console.log('\n📋 步骤5：创建测试数据');
    console.log('-'.repeat(50));
    
    const timestamp = Date.now();
    const testData = {
      sales_code: `TEST_${timestamp}`,
      wechat_name: `测试微信_${timestamp}`,
      name: `测试销售_${timestamp}`,
      phone: '13900139000',
      payment_method: 'alipay',
      payment_account: 'test@alipay.com'
    };
    
    const { data: newSale, error: createError } = await supabase
      .from('primary_sales')
      .insert([testData])
      .select()
      .single();
    
    if (!createError) {
      console.log('✅ 创建测试销售成功:');
      console.log(`  销售代码: ${testData.sales_code}`);
      console.log(`  微信号: ${testData.wechat_name}`);
      
      // 创建关联订单
      const testOrder = {
        sales_code: testData.sales_code,
        customer_wechat: `测试客户_${timestamp}`,
        tradingview_username: 'test_user',
        duration: '1month',
        amount: 100,
        payment_method: 'alipay',
        status: 'pending_payment'
      };
      
      const { error: orderError } = await supabase
        .from('orders')
        .insert([testOrder]);
      
      if (!orderError) {
        console.log('✅ 创建测试订单成功');
      }
    }
    
    // ============= 完成 =============
    console.log('\n' + '='.repeat(60));
    console.log('✅ 修复完成！');
    console.log('='.repeat(60));
    
    console.log('\n📊 总结:');
    console.log(`  销售总数: ${primarySales.length + secondarySales.length}`);
    console.log(`  更新微信号: ${updatedCount} 条`);
    console.log(`  测试数据: ${testData.sales_code}`);
    
    console.log('\n💡 下一步:');
    console.log('1. 刷新页面（F5）');
    console.log('2. 访问销售管理页面');
    console.log(`3. 搜索 "${testData.sales_code}" 查看测试数据`);
    console.log('4. 如果还是没有显示，请截图告诉我');
    
  } catch (error) {
    console.error('❌ 执行错误:', error);
  }
}

// 执行修复
console.log('💡 开始修复...\n');
fixWithCorrectStructure();

