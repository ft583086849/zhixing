// 分析问题的调试脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeIssue() {
  console.log('🔍 系统性分析数据流问题\n');
  console.log('=' .repeat(60));
  
  // 1. 检查环境变量
  console.log('\n1️⃣ 环境变量检查:');
  console.log('REACT_APP_ENABLE_NEW_STATS =', process.env.REACT_APP_ENABLE_NEW_STATS);
  
  // 2. 直接查询数据库
  console.log('\n2️⃣ 数据库直接查询:');
  const { data: orders, error } = await supabase
    .from('orders_optimized')
    .select('duration, status');
  
  if (error) {
    console.log('❌ 数据库查询失败:', error);
  } else {
    console.log('✅ 查询成功，订单数:', orders.length);
    
    // 统计duration值
    const durationCount = {};
    orders.forEach(o => {
      const key = o.duration || 'null';
      durationCount[key] = (durationCount[key] || 0) + 1;
    });
    console.log('Duration分布:', durationCount);
  }
  
  // 3. 模拟API的getStats逻辑
  console.log('\n3️⃣ 模拟API getStats逻辑:');
  
  if (orders) {
    const validOrders = orders.filter(o => o.status !== 'rejected');
    console.log('有效订单数 (非rejected):', validOrders.length);
    
    let free_trial_orders = 0;
    let one_month_orders = 0;
    
    validOrders.forEach(order => {
      const duration = order.duration;
      
      // 先测试精确匹配
      if (duration === '7天') {
        free_trial_orders++;
      }
      if (duration === '1个月') {
        one_month_orders++;
      }
    });
    
    console.log('精确匹配"7天":', free_trial_orders);
    console.log('精确匹配"1个月":', one_month_orders);
    
    // 再测试修复后的条件
    free_trial_orders = 0;
    one_month_orders = 0;
    
    validOrders.forEach(order => {
      const duration = order.duration;
      if (duration === 'free' || duration === '7days' || duration === 'trial' || 
          duration === '7天' || duration === '7日' || duration === '七天') {
        free_trial_orders++;
      }
      if (duration === '1month' || duration === 'month' || 
          duration === '1个月' || duration === '一个月') {
        one_month_orders++;
      }
    });
    
    console.log('多条件匹配7天:', free_trial_orders);
    console.log('多条件匹配1个月:', one_month_orders);
    
    const total = validOrders.length || 1;
    console.log('百分比计算:');
    console.log('  7天免费百分比:', (free_trial_orders / total * 100).toFixed(2) + '%');
    console.log('  1个月百分比:', (one_month_orders / total * 100).toFixed(2) + '%');
  }
  
  // 4. 检查可能的问题
  console.log('\n4️⃣ 可能的问题分析:');
  console.log('─'.repeat(50));
  
  console.log('\n可能原因1: Redux状态没有更新');
  console.log('  → 需要在浏览器检查Redux store');
  
  console.log('\n可能原因2: API返回的数据结构不对');
  console.log('  → 需要在浏览器控制台查看API返回值');
  
  console.log('\n可能原因3: 组件没有正确读取stats数据');
  console.log('  → 需要检查AdminOverview组件的props');
  
  console.log('\n可能原因4: 缓存问题');
  console.log('  → API可能返回了缓存的旧数据');
  
  console.log('\n可能原因5: 时间范围过滤');
  console.log('  → timeRange参数可能过滤掉了所有数据');
}

analyzeIssue();