/**
 * 检查e8257订单数据的工具函数
 */

import { SupabaseService } from '../services/supabase';
const { supabase } = SupabaseService;

export async function checkE8257Order() {
  console.log('🔍 直接从数据库查询e8257的订单...\n');
  
  try {
    // 查询orders_optimized表 - 只查询实际存在的字段
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
      return;
    }
    
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
      console.log(`  实付金额(paid_amount): $${order.paid_amount}`);
      console.log(`  原价(original_price): $${order.original_price}`);
      console.log(`  折扣率(discount_rate): ${order.discount_rate}`);
      console.log(`\n📊 其他信息:`);
      console.log(`  订单状态: ${order.status}`);
      console.log(`  支付状态: ${order.payment_status}`);
      console.log(`  创建时间: ${order.created_at}`);
      console.log(`  销售代码: ${order.sales_code}`);
      console.log('========================================\n');
      
      // 检查数据问题
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
      
      // 检查amount和paid_amount
      if (order.amount != order.paid_amount && order.payment_status === 'paid') {
        issues.push(`⚠️ 订单金额($${order.amount})与实付金额($${order.paid_amount})不一致`);
      }
      
      if (issues.length > 0) {
        console.log(`❗ 订单#${order.id}存在以下问题:`);
        issues.forEach(issue => console.log(`  ${issue}`));
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

// 将函数暴露到window对象，方便在控制台调用
if (typeof window !== 'undefined') {
  window.checkE8257Order = checkE8257Order;
}