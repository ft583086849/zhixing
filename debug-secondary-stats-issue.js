// 调试一级销售对账页面二级统计为空的问题
// 在浏览器控制台运行

(async function debugSecondaryStats() {
  console.log('🔍 调试二级销售统计问题...');
  
  const supabase = window.supabaseClient || window.supabase;
  if (!supabase) {
    console.error('❌ 未找到 Supabase 客户端');
    return;
  }

  try {
    // 1. 获取WML792355703的信息
    console.log('\n1️⃣ 查询WML792355703信息：');
    const { data: primarySale } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', 'WML792355703')
      .single();
    
    if (!primarySale) {
      console.error('未找到WML792355703');
      return;
    }
    
    console.log('一级销售ID:', primarySale.id);
    console.log('sales_code:', primarySale.sales_code);
    
    // 2. 获取他的二级销售
    console.log('\n2️⃣ 查询二级销售：');
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('primary_sales_id', primarySale.id);
    
    console.log(`找到 ${secondarySales?.length || 0} 个二级销售`);
    
    // 3. 重点：fl261247的数据
    console.log('\n3️⃣ fl261247的详细数据：');
    const fl261247 = secondarySales?.find(s => s.wechat_name === 'fl261247');
    
    if (fl261247) {
      console.log('fl261247信息:', fl261247);
      console.log('- sales_code:', fl261247.sales_code);
      console.log('- commission_rate:', fl261247.commission_rate);
      
      // 4. 查询fl261247的订单（模拟后端逻辑）
      console.log('\n4️⃣ 查询fl261247的订单：');
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('amount, actual_payment_amount, status, payment_time, created_at, sales_code, order_number')
        .eq('sales_code', fl261247.sales_code);
      
      if (error) {
        console.error('查询订单失败:', error);
      } else {
        console.log(`查询到 ${allOrders?.length || 0} 个订单`);
        
        if (allOrders && allOrders.length > 0) {
          // 排除rejected
          const nonRejectedOrders = allOrders.filter(o => o.status !== 'rejected');
          console.log(`非rejected订单: ${nonRejectedOrders.length}`);
          
          // 确认订单
          const confirmedOrders = nonRejectedOrders.filter(o => 
            ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
          );
          console.log(`确认订单: ${confirmedOrders.length}`);
          
          // 计算总金额
          const totalAmount = confirmedOrders.reduce((sum, o) => 
            sum + (o.actual_payment_amount || o.amount || 0), 0
          );
          console.log(`确认订单总金额: ${totalAmount}`);
          
          // 显示订单详情
          console.log('\n订单详情:');
          allOrders.forEach(o => {
            console.log(`- ${o.order_number}: status=${o.status}, amount=${o.amount}, actual=${o.actual_payment_amount}, sales_code=${o.sales_code}`);
          });
        }
      }
      
      // 5. 计算统计数据（模拟后端逻辑）
      console.log('\n5️⃣ 模拟统计计算：');
      
      let secondaryTotalAmount = 0;
      let secondaryTotalCommission = 0;
      
      for (const ss of (secondarySales || [])) {
        const { data: orders } = await supabase
          .from('orders')
          .select('amount, actual_payment_amount, status')
          .eq('sales_code', ss.sales_code);
        
        const confirmedOrders = (orders || []).filter(o => 
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
        );
        
        const amount = confirmedOrders.reduce((sum, o) => 
          sum + (o.actual_payment_amount || o.amount || 0), 0
        );
        
        const commission = amount * (ss.commission_rate || 0);
        
        console.log(`${ss.wechat_name}: ${confirmedOrders.length}个确认订单, 金额=${amount}, 佣金=${commission}`);
        
        secondaryTotalAmount += amount;
        secondaryTotalCommission += commission;
      }
      
      console.log('\n📊 统计结果：');
      console.log('二级销售订单总额:', secondaryTotalAmount);
      console.log('二级销售总佣金:', secondaryTotalCommission);
      console.log('平均佣金率:', secondaryTotalAmount > 0 ? (secondaryTotalCommission / secondaryTotalAmount * 100).toFixed(2) + '%' : '0%');
      console.log('二级佣金收益额（差额）:', secondaryTotalAmount * 0.4 - secondaryTotalCommission);
      
    } else {
      console.log('未找到fl261247');
    }
    
    // 6. 直接调用API看返回什么
    console.log('\n6️⃣ 调用API获取数据：');
    if (window.salesAPI) {
      try {
        const result = await window.salesAPI.getPrimarySalesSettlement({ 
          wechat_name: 'WML792355703' 
        });
        console.log('API返回的数据:', result);
        
        if (result.data) {
          console.log('sales数据:', result.data.sales);
          console.log('secondarySales数据:', result.data.secondarySales);
        }
      } catch (err) {
        console.error('API调用失败:', err);
      }
    }
    
  } catch (error) {
    console.error('调试过程出错:', error);
  }
})();
