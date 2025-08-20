/**
 * 查找fl261247的订单
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUserOrder() {
  try {
    console.log('🔍 查找e8257的订单...\n');

    // 1. 在orders_optimized表中查找e8257
    console.log('1️⃣ 在orders_optimized表中查找e8257:');
    const { data: optimizedOrders, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('*')
      .or('tradingview_username.ilike.%e8257%,customer_wechat.ilike.%e8257%,customer_name.ilike.%e8257%')
      .order('created_at', { ascending: false });
    
    if (optimizedError) {
      console.error('查询orders_optimized失败:', optimizedError.message);
    } else {
      console.log(`找到 ${optimizedOrders.length} 个订单:`);
      optimizedOrders.forEach(order => {
        console.log(`  - 订单#${order.id}: ${order.tradingview_username || order.customer_name}, 金额:$${order.amount}, 时长:${order.duration}, 状态:${order.status}, 创建时间:${order.created_at}`);
      });
    }

    // 2. 在原orders表中查找e8257
    console.log('\n2️⃣ 在原orders表中查找e8257:');
    const { data: originalOrders, error: originalError } = await supabase
      .from('orders')
      .select('*')
      .or('tradingview_username.ilike.%e8257%,customer_wechat.ilike.%e8257%,customer_name.ilike.%e8257%')
      .order('created_at', { ascending: false });
    
    if (originalError) {
      console.error('查询orders失败:', originalError.message);
    } else {
      console.log(`找到 ${originalOrders.length} 个订单:`);
      originalOrders.forEach(order => {
        console.log(`  - 订单#${order.id}: ${order.tradingview_username || order.customer_name}, 金额:$${order.amount}, 时长:${order.duration}, 状态:${order.status}, 创建时间:${order.created_at}`);
      });
    }

    // 3. 查找所有1588金额的订单
    console.log('\n3️⃣ 查找所有$1588的订单:');
    const { data: amountOrders, error: amountError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('amount', 1588)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (amountError) {
      console.error('查询$1588订单失败:', amountError.message);
    } else {
      console.log(`找到 ${amountOrders.length} 个$1588订单:`);
      amountOrders.forEach(order => {
        console.log(`  - 订单#${order.id}: ${order.tradingview_username || order.customer_name}, 状态:${order.status}, 创建时间:${order.created_at}`);
      });
    }

    // 4. 检查duration字段的所有值
    console.log('\n4️⃣ 检查duration字段的所有值:');
    const { data: durationStats, error: durationError } = await supabase
      .from('orders_optimized')
      .select('duration')
      .not('duration', 'is', null);
    
    if (durationError) {
      console.error('查询duration失败:', durationError.message);
    } else {
      const durationCount = {};
      durationStats.forEach(order => {
        const duration = order.duration;
        durationCount[duration] = (durationCount[duration] || 0) + 1;
      });
      
      console.log('duration字段分布:');
      Object.entries(durationCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([duration, count]) => {
          console.log(`  ${duration}: ${count} 订单`);
        });
    }

    console.log('\n✅ 查找完成');

  } catch (error) {
    console.error('❌ 查找失败:', error);
  }
}

// 运行查找
findUserOrder();