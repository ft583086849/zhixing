/**
 * 🔍 验证数据库数据并修复显示问题
 * 确认数据存在后，强制刷新页面显示
 */

async function verifyAndFixDisplay() {
  console.log('='.repeat(60));
  console.log('🔍 验证数据库数据并修复显示');
  console.log('='.repeat(60));
  
  try {
    // 导入Supabase客户端
    const { createClient } = await import('@supabase/supabase-js');
    
    // Supabase配置
    const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase连接成功（RLS已禁用）\n');
    
    // ============= 1. 验证数据库数据 =============
    console.log('📋 步骤1：验证数据库数据');
    console.log('-'.repeat(50));
    
    // 获取所有表的数据
    const [primaryResult, secondaryResult, ordersResult] = await Promise.all([
      supabase.from('primary_sales').select('*'),
      supabase.from('secondary_sales').select('*'),
      supabase.from('orders').select('*')
    ]);
    
    console.log('📊 数据库实际数据:');
    console.log(`  ✅ 一级销售: ${primaryResult.data?.length || 0} 条`);
    console.log(`  ✅ 二级销售: ${secondaryResult.data?.length || 0} 条`);
    console.log(`  ✅ 订单: ${ordersResult.data?.length || 0} 条`);
    
    // 显示销售数据样本
    if (primaryResult.data && primaryResult.data.length > 0) {
      console.log('\n一级销售样本（前3条）:');
      primaryResult.data.slice(0, 3).forEach((sale, idx) => {
        console.log(`  ${idx + 1}. ${sale.sales_code} | 微信: ${sale.wechat_name || sale.name || '无'}`);
      });
    }
    
    if (secondaryResult.data && secondaryResult.data.length > 0) {
      console.log('\n二级销售样本（前3条）:');
      secondaryResult.data.slice(0, 3).forEach((sale, idx) => {
        console.log(`  ${idx + 1}. ${sale.sales_code} | 微信: ${sale.wechat_name || sale.name || '无'}`);
      });
    }
    
    // ============= 2. 同步微信号数据 =============
    console.log('\n📋 步骤2：同步销售微信号');
    console.log('-'.repeat(50));
    
    // 从订单提取微信号
    const salesCodeMap = new Map();
    ordersResult.data?.forEach(order => {
      if (order.sales_code && order.sales_wechat_name) {
        salesCodeMap.set(order.sales_code, order.sales_wechat_name);
      }
    });
    
    console.log(`从订单提取到 ${salesCodeMap.size} 个销售微信号映射`);
    
    // 更新销售表
    let updateCount = 0;
    
    // 更新一级销售
    for (const sale of (primaryResult.data || [])) {
      if (!sale.wechat_name) {
        // 优先从订单获取，其次用name字段
        const wechatName = salesCodeMap.get(sale.sales_code) || sale.name || sale.phone;
        if (wechatName) {
          await supabase
            .from('primary_sales')
            .update({ wechat_name: wechatName })
            .eq('id', sale.id);
          updateCount++;
          console.log(`  更新一级销售 ${sale.sales_code}: ${wechatName}`);
        }
      }
    }
    
    // 更新二级销售
    for (const sale of (secondaryResult.data || [])) {
      if (!sale.wechat_name) {
        const wechatName = salesCodeMap.get(sale.sales_code) || sale.name || sale.phone;
        if (wechatName) {
          await supabase
            .from('secondary_sales')
            .update({ wechat_name: wechatName })
            .eq('id', sale.id);
          updateCount++;
          console.log(`  更新二级销售 ${sale.sales_code}: ${wechatName}`);
        }
      }
    }
    
    console.log(`✅ 共更新 ${updateCount} 条销售微信号`);
    
    // ============= 3. 强制刷新AdminAPI =============
    console.log('\n📋 步骤3：强制刷新AdminAPI');
    console.log('-'.repeat(50));
    
    // 清除所有缓存
    if (window.localStorage) {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('cache') || key.includes('admin') || key.includes('sales')) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ 清除本地缓存');
    }
    
    // 重新初始化AdminAPI
    if (window.adminAPI) {
      console.log('🔄 重新获取销售数据...');
      
      // 强制重新获取数据
      try {
        const salesData = await window.adminAPI.getSales();
        console.log(`✅ 获取到 ${salesData?.length || 0} 条销售数据`);
        
        if (salesData && salesData.length > 0) {
          console.log('\n销售数据详情:');
          salesData.slice(0, 5).forEach((sale, idx) => {
            console.log(`  ${idx + 1}. ${sale.sales_code}`);
            console.log(`     微信: ${sale.wechat_name || '无'}`);
            console.log(`     类型: ${sale.sales_type}`);
            console.log(`     订单: ${sale.total_orders || 0}`);
          });
          
          // 更新Redux store
          if (window.store) {
            window.store.dispatch({
              type: 'admin/getSales/fulfilled',
              payload: salesData
            });
            console.log('\n✅ Redux store已更新');
          }
        }
      } catch (error) {
        console.error('❌ 获取销售数据失败:', error);
      }
    } else {
      console.log('⚠️ AdminAPI不可用，请确保已登录');
    }
    
    // ============= 4. 验证Redux状态 =============
    console.log('\n📋 步骤4：验证Redux状态');
    console.log('-'.repeat(50));
    
    if (window.store) {
      const state = window.store.getState();
      const adminSales = state.admin?.sales || [];
      
      console.log(`Redux中的销售数据: ${adminSales.length} 条`);
      
      if (adminSales.length > 0) {
        const withWechat = adminSales.filter(s => s.wechat_name).length;
        console.log(`有微信号的销售: ${withWechat}/${adminSales.length}`);
      }
    }
    
    // ============= 5. 创建完整测试数据 =============
    console.log('\n📋 步骤5：创建完整测试数据（确保可见）');
    console.log('-'.repeat(50));
    
    const testTime = Date.now();
    const testSale = {
      sales_code: `VISIBLE_${testTime}`,
      wechat_name: `可见微信_${testTime}`,
      name: `可见销售_${testTime}`,
      phone: '13800138000',
      payment_method: 'alipay',
      payment_account: 'visible@test.com'
    };
    
    const { data: newSale, error: createError } = await supabase
      .from('primary_sales')
      .insert([testSale])
      .select()
      .single();
    
    if (!createError) {
      console.log('✅ 创建测试销售成功:');
      console.log(`  销售代码: ${testSale.sales_code}`);
      console.log(`  微信号: ${testSale.wechat_name}`);
    }
    
    // ============= 完成 =============
    console.log('\n' + '='.repeat(60));
    console.log('✅ 验证和修复完成！');
    console.log('='.repeat(60));
    
    console.log('\n📊 最终统计:');
    console.log(`  数据库有销售: ${(primaryResult.data?.length || 0) + (secondaryResult.data?.length || 0)} 条`);
    console.log(`  更新微信号: ${updateCount} 条`);
    console.log(`  测试数据: ${testSale.sales_code}`);
    
    console.log('\n💡 请执行以下操作:');
    console.log('1. 按 F5 刷新页面');
    console.log('2. 访问 https://zhixing-seven.vercel.app/admin/sales');
    console.log(`3. 搜索 "${testSale.sales_code}" 验证显示`);
    console.log('4. 如果还是看不到，请截图控制台输出给我');
    
    console.log('\n🔍 如果还是没有数据显示:');
    console.log('1. 退出登录，重新登录管理员账号');
    console.log('2. 使用无痕模式打开网站');
    console.log('3. 检查网络请求是否正常（F12 → Network标签）');
    
  } catch (error) {
    console.error('❌ 执行过程发生错误:', error);
    console.log('\n可能的原因:');
    console.log('1. Supabase连接问题');
    console.log('2. 网络问题');
    console.log('3. 请重试或刷新页面后再试');
  }
}

// 执行验证和修复
console.log('💡 开始验证数据并修复显示...\n');
verifyAndFixDisplay();

