// 在浏览器控制台运行此脚本来调试销售问题
// 请先登录 https://zhixing-seven.vercel.app/admin

(async function debugSalesIssues() {
  console.log('🔍 开始调试销售问题...');
  
  // 获取 supabase 客户端
  const supabase = window.supabaseClient || window.supabase;
  if (!supabase) {
    console.error('❌ 未找到 Supabase 客户端，请确保已登录管理后台');
    return;
  }

  try {
    // 1. 检查订单状态值分布
    console.log('\n📊 1. 订单状态分布：');
    const { data: statusData, error: statusError } = await supabase
      .from('orders')
      .select('status')
      .not('status', 'is', null);
    
    if (statusData) {
      const statusCount = {};
      statusData.forEach(o => {
        statusCount[o.status] = (statusCount[o.status] || 0) + 1;
      });
      console.table(statusCount);
    }

    // 2. 检查WML792355703的二级销售订单
    console.log('\n👥 2. WML792355703的二级销售情况：');
    
    // 先获取WML792355703的信息
    const { data: primarySale } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', 'WML792355703')
      .single();
    
    if (primarySale) {
      console.log('一级销售:', primarySale);
      
      // 获取他的二级销售
      const { data: secondarySales } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primarySale.id);
      
      console.log('二级销售列表:', secondarySales);
      
      // 检查每个二级销售的订单
      if (secondarySales && secondarySales.length > 0) {
        for (const ss of secondarySales) {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, order_number, sales_code, status, amount, customer_wechat')
            .eq('sales_code', ss.sales_code)
            .limit(5);
          
          console.log(`\n${ss.wechat_name} (${ss.sales_code}) 的订单:`, orders);
        }
      }
    }

    // 3. 检查fl261247的sales_code和订单
    console.log('\n📦 3. fl261247的订单情况：');
    const { data: fl261247 } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('wechat_name', 'fl261247')
      .single();
    
    if (fl261247) {
      console.log('fl261247销售信息:', fl261247);
      
      const { data: fl261247Orders } = await supabase
        .from('orders')
        .select('*')
        .eq('sales_code', fl261247.sales_code)
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('fl261247的订单:', fl261247Orders);
      
      // 检查订单状态
      if (fl261247Orders) {
        const confirmedOrders = fl261247Orders.filter(o => 
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
        );
        console.log('已确认订单数量:', confirmedOrders.length);
        console.log('订单状态分布:', fl261247Orders.map(o => o.status));
      }
    }

    // 4. 检查customer_wechat为guazigongshe和niu001002003的订单
    console.log('\n🔍 4. 检查问题订单（客户微信显示为销售）：');
    const { data: problemOrders } = await supabase
      .from('orders')
      .select('*')
      .in('customer_wechat', ['guazigongshe', 'niu001002003']);
    
    if (problemOrders && problemOrders.length > 0) {
      console.log('找到问题订单:', problemOrders);
      
      // 检查这些订单的sales_code
      for (const order of problemOrders) {
        console.log(`\n订单 ${order.order_number}:`);
        console.log('- customer_wechat:', order.customer_wechat);
        console.log('- sales_code:', order.sales_code);
        console.log('- primary_sales_id:', order.primary_sales_id);
        console.log('- secondary_sales_id:', order.secondary_sales_id);
        
        // 尝试查找对应的销售
        if (order.sales_code) {
          const { data: primaryMatch } = await supabase
            .from('primary_sales')
            .select('id, wechat_name')
            .eq('sales_code', order.sales_code)
            .single();
          
          const { data: secondaryMatch } = await supabase
            .from('secondary_sales')
            .select('id, wechat_name')
            .eq('sales_code', order.sales_code)
            .single();
          
          console.log('- 匹配的一级销售:', primaryMatch);
          console.log('- 匹配的二级销售:', secondaryMatch);
        }
      }
    } else {
      console.log('未找到customer_wechat为guazigongshe或niu001002003的订单');
    }

    // 5. 检查是否有销售的wechat_name是这两个值
    console.log('\n🔍 5. 检查是否有销售使用客户微信作为名称：');
    const { data: wrongPrimary } = await supabase
      .from('primary_sales')
      .select('*')
      .in('wechat_name', ['guazigongshe', 'niu001002003']);
    
    const { data: wrongSecondary } = await supabase
      .from('secondary_sales')
      .select('*')
      .in('wechat_name', ['guazigongshe', 'niu001002003']);
    
    console.log('一级销售中的匹配:', wrongPrimary);
    console.log('二级销售中的匹配:', wrongSecondary);

    // 6. 检查qq4073969订单
    console.log('\n📦 6. 检查qq4073969订单的销售关联：');
    const { data: qq4073969Orders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_wechat', 'qq4073969');
    
    if (qq4073969Orders && qq4073969Orders.length > 0) {
      console.log('qq4073969的订单:', qq4073969Orders);
      
      for (const order of qq4073969Orders) {
        console.log(`\n订单 ${order.order_number}:`);
        console.log('- sales_code:', order.sales_code || '❌ 空');
        console.log('- primary_sales_id:', order.primary_sales_id || '❌ 空');
        console.log('- secondary_sales_id:', order.secondary_sales_id || '❌ 空');
        console.log('- status:', order.status);
        console.log('- amount:', order.amount);
      }
    } else {
      console.log('未找到qq4073969的订单');
    }

    // 7. 检查异常的sales_code
    console.log('\n⚠️ 7. 检查异常的sales_code值：');
    const { data: allOrders } = await supabase
      .from('orders')
      .select('sales_code, customer_wechat')
      .not('sales_code', 'is', null)
      .not('sales_code', 'eq', '');
    
    if (allOrders) {
      const salesCodeMap = {};
      allOrders.forEach(o => {
        if (!salesCodeMap[o.sales_code]) {
          salesCodeMap[o.sales_code] = new Set();
        }
        salesCodeMap[o.sales_code].add(o.customer_wechat);
      });
      
      // 找出可疑的sales_code（看起来像客户微信的）
      const suspiciousCodes = Object.keys(salesCodeMap).filter(code => 
        !code.startsWith('PRI') && !code.startsWith('SEC') && !code.includes('17')
      );
      
      if (suspiciousCodes.length > 0) {
        console.log('发现可疑的sales_code（不符合标准格式）:');
        suspiciousCodes.forEach(code => {
          console.log(`- ${code}: 关联客户 [${Array.from(salesCodeMap[code]).join(', ')}]`);
        });
      }
    }

    console.log('\n✅ 调试完成！请查看上述输出找出问题原因。');
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  }
})();
