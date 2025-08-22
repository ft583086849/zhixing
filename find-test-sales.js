const { supabase } = require('./client/src/services/supabase');

async function findSalesWithOrders() {
  try {
    console.log('正在查询有订单的销售...');
    
    // 查询有订单的销售（使用optimized表）
    const { data: sales, error } = await supabase
      .from('sales_optimized')
      .select('id, wechat_name, sales_code, total_commission, total_orders')
      .gt('total_orders', 0)
      .order('total_orders', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('查询错误:', error);
      return;
    }
    
    console.log('找到有订单的销售:');
    sales.forEach(sale => {
      console.log(`- 微信号: ${sale.wechat_name}, 订单数: ${sale.total_orders}, 佣金: ${sale.total_commission}`);
    });
    
    // 返回第一个用于测试
    if (sales.length > 0) {
      console.log(`\n测试用销售微信号: ${sales[0].wechat_name}`);
      
      // 查询该销售的订单数量
      const { data: orders, error: orderError } = await supabase
        .from('orders_optimized')
        .select('id, customer_wechat, amount')
        .eq('sales_code', sales[0].sales_code)
        .eq('config_confirmed', true);
        
      if (!orderError && orders) {
        console.log(`该销售共有 ${orders.length} 个已确认订单`);
      }
    }
  } catch (error) {
    console.error('执行错误:', error);
  } finally {
    process.exit(0);
  }
}

findSalesWithOrders();