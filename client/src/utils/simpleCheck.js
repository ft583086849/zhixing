/**
 * 简单查询e8257订单
 */

export async function simpleCheckE8257() {
  console.log('🔍 查询e8257订单...');
  
  try {
    // 使用window.supabaseClient（如果存在）
    const supabase = window.supabaseClient;
    if (!supabase) {
      console.error('Supabase客户端未找到');
      return;
    }
    
    // 简单查询，只查询基本字段
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, duration, amount, paid_amount')
      .ilike('tradingview_username', '%e8257%');
    
    if (error) {
      console.error('查询错误:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`找到 ${data.length} 个e8257的订单:`);
      data.forEach(order => {
        console.log('-------------------');
        console.log('订单ID:', order.id);
        console.log('用户名:', order.tradingview_username);
        console.log('购买时长:', order.duration);
        console.log('订单金额:', order.amount);
        console.log('实付金额:', order.paid_amount);
        console.log('-------------------');
      });
    } else {
      console.log('未找到e8257的订单');
    }
    
    // 同时查询一些$1588的订单做对比
    const { data: data1588, error: error1588 } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, duration, amount, paid_amount')
      .eq('amount', 1588)
      .limit(5);
    
    if (!error1588 && data1588) {
      console.log('\n其他$1588订单对比:');
      data1588.forEach(order => {
        console.log(`ID:${order.id} | 用户:${order.tradingview_username} | duration:${order.duration} | amount:${order.amount} | paid:${order.paid_amount}`);
      });
    }
    
  } catch (error) {
    console.error('执行错误:', error);
  }
}

// 暴露到window
if (typeof window !== 'undefined') {
  window.simpleCheckE8257 = simpleCheckE8257;
}