const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'client', '.env') });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkRealData() {
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('status, duration, amount');
  
  console.log('📊 真实数据统计：');
  console.log('所有订单总数:', allOrders.length);
  
  // 按状态统计
  const statusCount = {};
  allOrders.forEach(o => {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;
  });
  console.log('\n按状态分类:', statusCount);
  
  // 计算有效订单（排除rejected）
  const validOrders = allOrders.filter(o => o.status !== 'rejected');
  console.log('\n有效订单（非rejected）:', validOrders.length);
  
  // 统计duration
  const durationCount = {};
  allOrders.forEach(o => {
    if (o.duration) {
      durationCount[o.duration] = (durationCount[o.duration] || 0) + 1;
    }
  });
  console.log('\n时长分布（所有订单）:', durationCount);
  
  // 统计免费vs收费  
  const freeOrders = allOrders.filter(o => o.duration === '7天');
  const paidOrders = allOrders.filter(o => o.duration !== '7天' && o.duration);
  
  console.log('\n订单类型分析：');
  console.log('7天免费订单:', freeOrders.length);
  console.log('收费订单:', paidOrders.length);
  console.log('已配置确认订单:', statusCount['confirmed_config'] || 0);
  
  // 计算正确的转化率
  const totalOrders = allOrders.length;
  const nonRejectedOrders = validOrders.length;
  const confirmedOrders = statusCount['confirmed_config'] || 0;
  
  console.log('\n转化率计算：');
  console.log('总订单 → 非拒绝订单:', `${totalOrders} → ${nonRejectedOrders} (${(nonRejectedOrders/totalOrders*100).toFixed(2)}%)`);
  console.log('总订单 → 已确认订单:', `${totalOrders} → ${confirmedOrders} (${(confirmedOrders/totalOrders*100).toFixed(2)}%)`);
  console.log('总订单 → 收费订单:', `${totalOrders} → ${paidOrders.length} (${(paidOrders.length/totalOrders*100).toFixed(2)}%)`);
}

checkRealData();