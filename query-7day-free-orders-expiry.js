const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function query7DayFreeOrdersExpiry() {
  console.log('=== 查询7天免费订单到期时间分布 ===\n');
  
  try {
    // 查询所有7天免费的有效订单
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .neq('status', 'rejected')  // 排除被拒绝的订单
      .or('duration.eq.7天,duration.eq.7days,amount.eq.0,actual_payment_amount.eq.0')  // 7天免费订单条件
      .order('expiry_time', { ascending: true });
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('未找到7天免费订单');
      return;
    }
    
    console.log(`找到 ${orders.length} 个7天免费的有效订单\n`);
    
    // 过滤出7天免费订单（amount = 0 且 duration 包含 7）
    const freeOrders = orders.filter(order => {
      const amount = parseFloat(order.amount || 0);
      const actualAmount = parseFloat(order.actual_payment_amount || 0);
      const duration = order.duration || '';
      
      return (amount === 0 || actualAmount === 0) && 
             (duration.includes('7') || duration.includes('七'));
    });
    
    console.log(`实际7天免费订单数: ${freeOrders.length}\n`);
    
    // 按到期日期分组统计
    const expiryStats = {};
    const today = new Date('2025-08-19'); // 当前日期
    const targetDate = new Date('2025-08-20'); // 目标开始日期
    
    freeOrders.forEach(order => {
      if (!order.expiry_time) return;
      
      const expiryDate = new Date(order.expiry_time);
      const dateStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const monthDay = dateStr.substring(5); // MM-DD format
      
      // 只统计8月20日及以后的订单
      if (expiryDate >= targetDate) {
        if (!expiryStats[dateStr]) {
          expiryStats[dateStr] = {
            date: dateStr,
            monthDay: monthDay,
            count: 0,
            orders: []
          };
        }
        expiryStats[dateStr].count++;
        expiryStats[dateStr].orders.push({
          order_number: order.order_number,
          customer: order.customer_wechat,
          created_at: order.created_at,
          expiry_time: order.expiry_time,
          sales_code: order.sales_code,
          duration: order.duration,
          amount: order.amount
        });
      }
    });
    
    // 按日期排序
    const sortedDates = Object.keys(expiryStats).sort();
    
    console.log('📊 7天免费订单到期时间分布（8月20日-30日）：\n');
    console.log('┌────────────┬──────────┬────────────────────┐');
    console.log('│    日期    │ 订单数量 │       详细信息     │');
    console.log('├────────────┼──────────┼────────────────────┤');
    
    // 为8月20-30日生成完整列表
    for (let day = 20; day <= 30; day++) {
      const dateStr = `2025-08-${day.toString().padStart(2, '0')}`;
      const monthDay = `08-${day.toString().padStart(2, '0')}`;
      const stats = expiryStats[dateStr];
      
      if (stats) {
        console.log(`│ 8月${day}日     │    ${stats.count.toString().padStart(2, ' ')}    │ ${stats.count}个订单到期      │`);
      } else {
        console.log(`│ 8月${day}日     │     0    │ 无订单到期        │`);
      }
    }
    
    console.log('└────────────┴──────────┴────────────────────┘');
    
    // 显示详细统计
    let totalCount = 0;
    console.log('\n📋 详细统计：\n');
    
    for (let day = 20; day <= 30; day++) {
      const dateStr = `2025-08-${day.toString().padStart(2, '0')}`;
      const stats = expiryStats[dateStr];
      
      if (stats && stats.count > 0) {
        console.log(`🗓️  8月${day}日 (${stats.count}个订单):`);
        stats.orders.forEach((order, index) => {
          console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
          console.log(`     客户: ${order.customer}`);
          console.log(`     销售代码: ${order.sales_code}`);
          console.log(`     创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
          console.log(`     到期时间: ${new Date(order.expiry_time).toLocaleString('zh-CN')}`);
          console.log('');
        });
        totalCount += stats.count;
      }
    }
    
    console.log(`\n📈 总计：8月20日-30日期间有 ${totalCount} 个7天免费订单到期`);
    
    // 额外统计：按销售代码分组
    const salesStats = {};
    Object.values(expiryStats).forEach(dayStats => {
      dayStats.orders.forEach(order => {
        if (!salesStats[order.sales_code]) {
          salesStats[order.sales_code] = 0;
        }
        salesStats[order.sales_code]++;
      });
    });
    
    console.log('\n👥 按销售代码统计：');
    Object.entries(salesStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([salesCode, count]) => {
        console.log(`  ${salesCode}: ${count}个订单`);
      });
    
  } catch (error) {
    console.error('查询出错:', error);
  }
}

query7DayFreeOrdersExpiry();