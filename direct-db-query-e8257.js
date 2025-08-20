/**
 * 直接查询数据库中e8257的订单数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryE8257() {
  try {
    console.log('🔍 直接从数据库查询e8257的订单...\n');

    // 查询orders_optimized表
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select(`
        id,
        order_number,
        tradingview_username,
        customer_name,
        customer_wechat,
        duration,
        amount,
        payable_amount,
        paid_amount,
        original_price,
        discount_rate,
        status,
        payment_status,
        created_at,
        sales_code
      `)
      .or('tradingview_username.ilike.%e8257%,customer_name.ilike.%e8257%,customer_wechat.ilike.%e8257%');
    
    if (error) {
      console.error('查询错误:', error);
      
      // 如果网络有问题，尝试使用curl直接调用API
      console.log('\n尝试使用curl直接调用API...');
      const { exec } = require('child_process');
      
      const curlCommand = `curl -X GET "https://ksacrjrgmcbdwwjrkcws.supabase.co/rest/v1/orders_optimized?or=(tradingview_username.ilike.*e8257*,customer_name.ilike.*e8257*,customer_wechat.ilike.*e8257*)&select=id,order_number,tradingview_username,customer_name,customer_wechat,duration,amount,payable_amount,paid_amount,original_price,discount_rate,status,payment_status,created_at,sales_code" \\
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8" \\
        -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8"`;
      
      exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('curl执行失败:', error);
          return;
        }
        
        try {
          const data = JSON.parse(stdout);
          displayResults(data);
        } catch (e) {
          console.error('解析结果失败:', e);
          console.log('原始输出:', stdout);
        }
      });
      
      return;
    }
    
    displayResults(orders);
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

function displayResults(orders) {
  if (!orders || orders.length === 0) {
    console.log('未找到e8257的订单');
    return;
  }
  
  console.log(`找到 ${orders.length} 个e8257的订单:\n`);
  
  orders.forEach((order, index) => {
    console.log(`订单 ${index + 1}:`);
    console.log('========================================');
    console.log(`订单ID: ${order.id}`);
    console.log(`订单号: ${order.order_number}`);
    console.log(`TradingView用户名: ${order.tradingview_username}`);
    console.log(`客户名称: ${order.customer_name}`);
    console.log(`客户微信: ${order.customer_wechat}`);
    console.log(`\n💰 金额信息:`);
    console.log(`  购买时长(duration): ${order.duration}`);
    console.log(`  订单金额(amount): $${order.amount}`);
    console.log(`  应付金额(payable_amount): $${order.payable_amount}`);
    console.log(`  实付金额(paid_amount): $${order.paid_amount}`);
    console.log(`  原价(original_price): $${order.original_price}`);
    console.log(`  折扣率(discount_rate): ${order.discount_rate}`);
    console.log(`\n📊 其他信息:`);
    console.log(`  订单状态: ${order.status}`);
    console.log(`  支付状态: ${order.payment_status}`);
    console.log(`  创建时间: ${order.created_at}`);
    console.log(`  销售代码: ${order.sales_code}`);
    console.log('========================================\n');
  });
  
  // 分析数据问题
  orders.forEach(order => {
    const issues = [];
    
    // 检查duration和amount是否匹配
    const durationAmountMap = {
      '1month': 188,
      '3months': 488,
      '6months': 888,
      '1year': 1588,
      'lifetime': 1588,
      '7days': 0
    };
    
    const expectedAmount = durationAmountMap[order.duration];
    if (expectedAmount !== undefined && expectedAmount != order.amount) {
      issues.push(`⚠️ duration(${order.duration})与amount($${order.amount})不匹配，预期应为$${expectedAmount}`);
    }
    
    // 检查payable_amount和paid_amount
    if (order.payable_amount != order.paid_amount && order.payment_status === 'paid') {
      issues.push(`⚠️ 应付金额($${order.payable_amount})与实付金额($${order.paid_amount})不一致`);
    }
    
    if (issues.length > 0) {
      console.log(`订单#${order.id}存在以下问题:`);
      issues.forEach(issue => console.log(`  ${issue}`));
      console.log('');
    }
  });
}

// 执行查询
queryE8257();