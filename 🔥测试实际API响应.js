// 🔥 测试实际API响应
// 运行方式：node 🔥测试实际API响应.js

const { createClient } = require('@supabase/supabase-js');

// 直接使用项目中的 Supabase 配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAPIResponse() {
  console.log('🔥 测试实际API响应...\n');
  console.log('=====================================\n');

  try {
    // 1. 获取订单数据
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*');
    
    if (error) {
      console.error('❌ 获取订单失败:', error);
      return;
    }
    
    console.log(`📊 订单总数: ${orders.length}`);
    
    // 2. 获取销售数据
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('*');
    
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('*');
    
    console.log(`👥 一级销售: ${primarySales?.length || 0}`);
    console.log(`👥 二级销售: ${secondarySales?.length || 0}`);
    console.log('');
    
    // 3. 模拟API的计算逻辑
    let total_amount = 0;
    let total_commission = 0;
    let primary_sales_amount = 0;
    let secondary_sales_amount = 0;
    
    const orderDurationStats = {
      one_month_orders: 0,
      three_month_orders: 0,
      six_month_orders: 0,
      yearly_orders: 0
    };
    
    orders.forEach(order => {
      // 金额计算
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const commission = parseFloat(order.commission_amount || 0);
      
      // 人民币转美元
      if (order.payment_method === 'alipay') {
        total_amount += (amount / 7.15);
        total_commission += (commission / 7.15);
      } else {
        total_amount += amount;
        total_commission += commission;
      }
      
      // 订单时长统计
      const duration = order.duration;
      if (duration === '1month') {
        orderDurationStats.one_month_orders++;
      } else if (duration === '3months') {
        orderDurationStats.three_month_orders++;
      } else if (duration === '6months') {
        orderDurationStats.six_month_orders++;
      } else if (duration === '1year' || duration === 'yearly') {
        orderDurationStats.yearly_orders++;
      }
      
      // 销售业绩统计
      const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
      
      if (order.sales_code) {
        const isPrimarySale = primarySales?.some(ps => ps.sales_code === order.sales_code);
        const isSecondarySale = secondarySales?.some(ss => ss.sales_code === order.sales_code);
        
        if (isPrimarySale) {
          primary_sales_amount += amountUSD;
        } else if (isSecondarySale) {
          secondary_sales_amount += amountUSD;
        }
      }
    });
    
    const stats = {
      total_orders: orders.length,
      total_amount: Math.round(total_amount * 100) / 100,
      total_commission: Math.round(total_commission * 100) / 100,
      commission_amount: Math.round(total_commission * 100) / 100,
      primary_sales_count: primarySales?.length || 0,
      secondary_sales_count: secondarySales?.length || 0,
      primary_sales_amount: Math.round(primary_sales_amount * 100) / 100,
      secondary_sales_amount: Math.round(secondary_sales_amount * 100) / 100,
      ...orderDurationStats
    };
    
    console.log('📈 计算出的统计数据:');
    console.log('=====================================');
    console.log(`总订单数: ${stats.total_orders}`);
    console.log(`总收入: $${stats.total_amount}`);
    console.log(`销售返佣金额: $${stats.commission_amount}`);
    console.log(`一级销售业绩: $${stats.primary_sales_amount}`);
    console.log(`二级销售业绩: $${stats.secondary_sales_amount}`);
    console.log('');
    console.log('订单时长分布:');
    console.log(`  1个月订单: ${stats.one_month_orders}`);
    console.log(`  3个月订单: ${stats.three_month_orders}`);
    console.log(`  6个月订单: ${stats.six_month_orders}`);
    console.log(`  年度订单: ${stats.yearly_orders}`);
    console.log('=====================================\n');
    
    if (stats.total_orders > 0 && stats.total_amount === 0) {
      console.log('⚠️  警告：有订单但金额为0，可能的原因：');
      console.log('  1. 订单的amount字段为空或0');
      console.log('  2. 汇率转换问题');
      console.log('');
      console.log('检查前3个订单的金额字段:');
      orders.slice(0, 3).forEach(order => {
        console.log(`  订单 ${order.order_number}:`);
        console.log(`    amount: ${order.amount}`);
        console.log(`    actual_payment_amount: ${order.actual_payment_amount}`);
        console.log(`    payment_method: ${order.payment_method}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  }
}

// 执行测试
testAPIResponse();
