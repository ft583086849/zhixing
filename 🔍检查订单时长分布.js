// 🔍 检查订单时长分布
// 运行方式：node 🔍检查订单时长分布.js

const { createClient } = require('@supabase/supabase-js');

// 直接使用项目中的 Supabase 配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrderDurations() {
  console.log('🔍 检查订单时长分布...\n');
  console.log('=====================================\n');

  try {
    // 获取所有订单
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*');
    
    if (error) {
      console.error('❌ 获取订单失败:', error);
      return;
    }
    
    console.log(`📊 总订单数: ${orders.length}\n`);
    
    // 分析duration字段
    const durations = {};
    orders.forEach(order => {
      const duration = order.duration || '未知';
      durations[duration] = (durations[duration] || 0) + 1;
    });
    
    console.log('📈 订单时长分布:');
    console.log('-------------------------------------');
    Object.entries(durations).forEach(([duration, count]) => {
      const percentage = ((count / orders.length) * 100).toFixed(1);
      console.log(`  ${duration}: ${count} 笔 (${percentage}%)`);
    });
    console.log('');
    
    // 计算各时长的订单统计
    const stats = {
      one_month_orders: 0,
      three_month_orders: 0,
      six_month_orders: 0,
      yearly_orders: 0,  // 年度订单
      unknown_orders: 0
    };
    
    orders.forEach(order => {
      const duration = order.duration;
      if (duration === '1month' || duration === '1个月' || duration === 1) {
        stats.one_month_orders++;
      } else if (duration === '3months' || duration === '3个月' || duration === 3) {
        stats.three_month_orders++;
      } else if (duration === '6months' || duration === '6个月' || duration === 6) {
        stats.six_month_orders++;
      } else if (duration === '1year' || duration === 'yearly' || duration === '年度' || duration === 12) {
        stats.yearly_orders++;
      } else {
        stats.unknown_orders++;
        console.log(`  未识别的时长值: "${duration}" (订单ID: ${order.id})`);
      }
    });
    
    // 计算百分比
    const total = orders.length;
    const percentages = {
      one_month_percentage: total > 0 ? (stats.one_month_orders / total * 100).toFixed(1) : 0,
      three_month_percentage: total > 0 ? (stats.three_month_orders / total * 100).toFixed(1) : 0,
      six_month_percentage: total > 0 ? (stats.six_month_orders / total * 100).toFixed(1) : 0,
      yearly_percentage: total > 0 ? (stats.yearly_orders / total * 100).toFixed(1) : 0
    };
    
    console.log('\n📊 规范化后的统计:');
    console.log('=====================================');
    console.log(`  1个月订单: ${stats.one_month_orders} 笔 (${percentages.one_month_percentage}%)`);
    console.log(`  3个月订单: ${stats.three_month_orders} 笔 (${percentages.three_month_percentage}%)`);
    console.log(`  6个月订单: ${stats.six_month_orders} 笔 (${percentages.six_month_percentage}%)`);
    console.log(`  年度订单: ${stats.yearly_orders} 笔 (${percentages.yearly_percentage}%)`);
    if (stats.unknown_orders > 0) {
      console.log(`  ⚠️ 未识别: ${stats.unknown_orders} 笔`);
    }
    console.log('=====================================\n');
    
    // 显示示例订单
    console.log('📝 示例订单数据:');
    orders.slice(0, 3).forEach(order => {
      console.log(`  订单 ${order.order_number}:`);
      console.log(`    时长: ${order.duration}`);
      console.log(`    金额: $${order.amount}`);
      console.log(`    状态: ${order.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  }
}

// 执行检查
checkOrderDurations();

