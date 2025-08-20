/**
 * 检查e8257用户的订单详情
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkE8257Order() {
  try {
    console.log('🔍 查找e8257用户的订单详情...\n');

    // 1. 在orders_optimized表中查找e8257
    console.log('1️⃣ 在orders_optimized表中查找e8257:');
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .or('tradingview_username.ilike.%e8257%,customer_wechat.ilike.%e8257%,customer_name.ilike.%e8257%')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('查询失败:', error.message);
      return;
    }

    if (orders && orders.length > 0) {
      console.log(`找到 ${orders.length} 个订单:\n`);
      orders.forEach(order => {
        console.log('订单详情:');
        console.log('-----------------------------------');
        console.log(`订单ID: ${order.id}`);
        console.log(`订单号: ${order.order_number}`);
        console.log(`TradingView用户名: ${order.tradingview_username}`);
        console.log(`客户名称: ${order.customer_name}`);
        console.log(`客户微信: ${order.customer_wechat}`);
        console.log(`购买时长(duration): ${order.duration}`);
        console.log(`订单金额(amount): $${order.amount}`);
        console.log(`应付金额(payable_amount): $${order.payable_amount}`);
        console.log(`实付金额(paid_amount): $${order.paid_amount}`);
        console.log(`原价(original_price): $${order.original_price}`);
        console.log(`折扣率(discount_rate): ${order.discount_rate}`);
        console.log(`订单状态: ${order.status}`);
        console.log(`支付状态: ${order.payment_status}`);
        console.log(`创建时间: ${order.created_at}`);
        console.log(`销售代码: ${order.sales_code}`);
        console.log('-----------------------------------\n');
      });
    } else {
      console.log('未找到e8257的订单');
    }

    // 2. 查看所有$1588订单的duration字段
    console.log('\n2️⃣ 查看所有$1588订单的duration分布:');
    const { data: amountOrders, error: amountError } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, customer_name, duration, amount, payable_amount, paid_amount')
      .eq('amount', 1588)
      .limit(10);
    
    if (!amountError && amountOrders) {
      console.log(`找到 ${amountOrders.length} 个$1588订单:`);
      amountOrders.forEach(order => {
        console.log(`  ID:${order.id} | 用户:${order.tradingview_username || order.customer_name} | duration:${order.duration} | amount:$${order.amount} | payable:$${order.payable_amount} | paid:$${order.paid_amount}`);
      });
    }

    console.log('\n✅ 检查完成');

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkE8257Order();