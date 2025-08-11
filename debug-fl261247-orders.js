// 专门调试fl261247订单问题
// 在浏览器控制台运行

(async function debugFL261247() {
  console.log('🔍 调试fl261247订单问题...');
  
  const supabase = window.supabaseClient || window.supabase;
  if (!supabase) {
    console.error('❌ 未找到 Supabase 客户端');
    return;
  }

  try {
    // 1. 获取fl261247的完整信息
    console.log('\n1️⃣ 查询fl261247销售信息：');
    const { data: fl261247, error: e1 } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('wechat_name', 'fl261247')
      .single();
    
    if (fl261247) {
      console.log('fl261247信息:', fl261247);
      console.log('- sales_code:', fl261247.sales_code);
      console.log('- primary_sales_id:', fl261247.primary_sales_id);
      console.log('- commission_rate:', fl261247.commission_rate);
      
      // 2. 查询fl261247的所有订单
      console.log('\n2️⃣ 查询fl261247的订单：');
      const { data: orders, error: e2 } = await supabase
        .from('orders')
        .select('*')
        .eq('sales_code', fl261247.sales_code)
        .order('created_at', { ascending: false });
      
      console.log(`找到 ${orders?.length || 0} 个订单`);
      
      if (orders && orders.length > 0) {
        // 3. 分析订单状态
        console.log('\n3️⃣ 订单状态分析：');
        const statusMap = {};
        orders.forEach(o => {
          statusMap[o.status] = (statusMap[o.status] || 0) + 1;
        });
        console.table(statusMap);
        
        // 4. 检查确认订单
        console.log('\n4️⃣ 确认订单详情：');
        const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
        const confirmedOrders = orders.filter(o => confirmedStatuses.includes(o.status));
        
        console.log(`已确认订单数: ${confirmedOrders.length}`);
        console.log('确认订单状态列表:', confirmedOrders.map(o => o.status));
        
        // 计算总金额
        const totalAmount = confirmedOrders.reduce((sum, o) => {
          return sum + (o.actual_payment_amount || o.amount || 0);
        }, 0);
        console.log('确认订单总金额:', totalAmount);
        
        // 显示前5个确认订单
        console.log('\n前5个确认订单:');
        confirmedOrders.slice(0, 5).forEach(o => {
          console.log(`- ${o.order_number}: status=${o.status}, amount=${o.amount}, customer=${o.customer_wechat}`);
        });
        
        // 5. 检查订单的sales_code是否一致
        console.log('\n5️⃣ sales_code一致性检查：');
        const uniqueSalesCodes = [...new Set(orders.map(o => o.sales_code))];
        console.log('唯一的sales_code值:', uniqueSalesCodes);
        if (uniqueSalesCodes.length > 1) {
          console.warn('⚠️ 发现多个不同的sales_code！');
        }
      }
      
      // 6. 查询WML792355703的信息
      console.log('\n6️⃣ 查询上级WML792355703：');
      if (fl261247.primary_sales_id) {
        const { data: primary } = await supabase
          .from('primary_sales')
          .select('*')
          .eq('id', fl261247.primary_sales_id)
          .single();
        
        console.log('一级销售信息:', primary);
        
        // 查询该一级下的所有二级
        const { data: allSecondaries } = await supabase
          .from('secondary_sales')
          .select('id, wechat_name, sales_code')
          .eq('primary_sales_id', fl261247.primary_sales_id);
        
        console.log('该一级下的所有二级销售:', allSecondaries);
      }
      
      // 7. 测试getPrimarySalesSettlement的查询逻辑
      console.log('\n7️⃣ 模拟getPrimarySalesSettlement查询：');
      
      // 模拟后端查询
      const { data: primarySale } = await supabase
        .from('primary_sales')
        .select('*')
        .eq('wechat_name', 'WML792355703')
        .single();
      
      if (primarySale) {
        // 获取所有二级销售
        const { data: secondarySales } = await supabase
          .from('secondary_sales')
          .select('*')
          .eq('primary_sales_id', primarySale.id);
        
        console.log('二级销售列表:', secondarySales?.map(s => s.wechat_name));
        
        // 对每个二级销售查询订单
        for (const ss of (secondarySales || [])) {
          const { data: ssOrders } = await supabase
            .from('orders')
            .select('amount, actual_payment_amount, status')
            .eq('sales_code', ss.sales_code);
          
          const confirmed = (ssOrders || []).filter(o => 
            ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
          );
          
          const totalAmt = confirmed.reduce((sum, o) => 
            sum + (o.actual_payment_amount || o.amount || 0), 0
          );
          
          console.log(`${ss.wechat_name}: ${confirmed.length}个确认订单, 总额${totalAmt}`);
        }
      }
      
    } else {
      console.error('未找到fl261247');
    }
    
  } catch (error) {
    console.error('调试出错:', error);
  }
})();
