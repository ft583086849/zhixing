require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// 模拟前端的计算逻辑
function simulateFrontendCalculation(order) {
  if (order.created_at && order.duration) {
    const createdDate = new Date(order.created_at);
    
    // 生效时间：统一使用创建时间
    const effectiveTime = order.created_at;
    
    // 到期时间计算 - 基于创建时间计算
    // 支持中文和英文的duration值
    const expiryDate = new Date(createdDate);
    if (order.duration === '7days' || order.duration === '7天') {
      expiryDate.setDate(expiryDate.getDate() + 7);
    } else if (order.duration === '1month' || order.duration === '1个月') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (order.duration === '3months' || order.duration === '3个月') {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    } else if (order.duration === '6months' || order.duration === '6个月') {
      expiryDate.setMonth(expiryDate.getMonth() + 6);
    } else if (order.duration === '1year' || order.duration === '1年') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    return {
      effectiveTime,
      calculatedExpiryTime: expiryDate.toISOString()
    };
  }
  
  return null;
}

async function testFrontendDisplay() {
  console.log('测试前端显示逻辑');
  console.log('='.repeat(80));
  
  // 测试几个关键用户的订单
  const testUsers = ['huodong423', 'yyt8341', 'jiangmc42'];
  
  for (const username of testUsers) {
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, created_at, expiry_time, duration, amount')
      .eq('tradingview_username', username)
      .eq('duration', '7天');
    
    if (orders && orders.length > 0) {
      console.log(`\n用户: ${username}`);
      console.log('-'.repeat(40));
      
      orders.forEach(order => {
        const frontendCalc = simulateFrontendCalculation(order);
        const dbExpiry = new Date(order.expiry_time);
        const calcExpiry = new Date(frontendCalc.calculatedExpiryTime);
        
        console.log(`订单ID: ${order.id}`);
        console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
        console.log(`  duration: "${order.duration}"`);
        console.log(`  数据库到期时间: ${dbExpiry.toLocaleString('zh-CN')}`);
        console.log(`  前端计算到期时间: ${calcExpiry.toLocaleString('zh-CN')}`);
        
        const isMatch = dbExpiry.getTime() === calcExpiry.getTime();
        console.log(`  匹配状态: ${isMatch ? '✅ 一致' : '❌ 不一致'}`);
        
        if (!isMatch) {
          console.log(`  ⚠️ 警告: 前端显示的到期时间与数据库不一致！`);
        }
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('测试完成');
  console.log('\n说明:');
  console.log('- 如果所有订单都显示"✅ 一致"，说明前端会正确显示到期时间');
  console.log('- 如果有"❌ 不一致"，需要进一步调查前端代码');
}

testFrontendDisplay();