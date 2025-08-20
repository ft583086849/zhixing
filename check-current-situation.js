require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkCurrentSituation() {
  console.log('当前数据库情况分析');
  console.log('='.repeat(80));
  
  // 1. 统计7天/$0订单的总数
  const { count: count7Days } = await supabase
    .from('orders_optimized')
    .select('*', { count: 'exact', head: true })
    .eq('duration', '7天')
    .eq('amount', 0);
  
  console.log('\n1. 当前7天/$0订单总数: ' + count7Days);
  
  // 2. 查看最近的更新
  const { data: recentUpdates } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, updated_at')
    .eq('duration', '7天')
    .eq('amount', 0)
    .order('updated_at', { ascending: false })
    .limit(30);
  
  console.log('\n2. 最近30个7天/$0订单的更新时间:');
  const today = new Date().toLocaleDateString('zh-CN');
  let todayCount = 0;
  let oldCount = 0;
  
  recentUpdates?.forEach(order => {
    const updateDate = new Date(order.updated_at).toLocaleDateString('zh-CN');
    const updateTime = new Date(order.updated_at).toLocaleString('zh-CN');
    
    if (updateDate === today) {
      todayCount++;
      if (todayCount <= 5) {
        console.log(`   ${order.tradingview_username}: ${updateTime}`);
      }
    } else {
      oldCount++;
    }
  });
  
  console.log(`   今天更新的: ${todayCount}个`);
  console.log(`   之前更新的: ${oldCount}个`);
  
  // 3. 我刚才修改的订单
  const myModifiedUsers = [
    'huodong423', 'yyt8341', 'yyT8341', 'n1374y5mg0', 'huguogu99', 
    'coshou008', 'qq2721', 'jiangmc42', 'tax15574681086', 'zy7711006-jue',
    'qiyue-jue', 'wujie520133638', 'rr9652264', 'piaopiao4858', 
    'importantAnaly81922', 'ruiqi666go', 'liuyixss', 'JY131419',
    'jiujing110', 'beiken666', 'qiyuec'
  ];
  
  const { data: myModified, count: myCount } = await supabase
    .from('orders_optimized')
    .select('*', { count: 'exact' })
    .in('tradingview_username', myModifiedUsers)
    .eq('duration', '7天')
    .eq('amount', 0);
  
  console.log('\n3. 我刚才修改的用户订单数:');
  console.log(`   修改的用户数: ${myModifiedUsers.length}个`);
  console.log(`   实际修改的订单数: ${myCount}个`);
  
  // 4. 分析所有7天/$0订单的更新日期
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('updated_at')
    .eq('duration', '7天')
    .eq('amount', 0);
  
  const dateGroups = {};
  allOrders?.forEach(order => {
    const date = new Date(order.updated_at).toLocaleDateString('zh-CN');
    dateGroups[date] = (dateGroups[date] || 0) + 1;
  });
  
  console.log('\n4. 所有7天/$0订单的更新日期分布:');
  Object.entries(dateGroups)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .slice(0, 10)
    .forEach(([date, count]) => {
      console.log(`   ${date}: ${count}个订单`);
    });
  
  // 5. 检查是否有批量更新的痕迹
  console.log('\n5. 批量更新分析:');
  
  // 查找8月17日的更新
  const aug17Count = dateGroups['2025/8/17'] || 0;
  const aug18Count = dateGroups['2025/8/18'] || 0;
  const todayCountTotal = dateGroups[today] || 0;
  
  console.log(`   8月17日: ${aug17Count}个`);
  console.log(`   8月18日(今天): ${todayCountTotal}个`);
  
  if (aug17Count > 100) {
    console.log('   ⚠️ 8月17日有大量订单被修改为7天/$0');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('总结:');
  console.log(`- 数据库中共有 ${count7Days} 个7天/$0订单`);
  console.log(`- 今天(8/18)我修改了 ${myCount} 个`);
  console.log(`- 剩余 ${count7Days - myCount} 个是之前就存在的`);
  
  if (count7Days > 100) {
    console.log('\n⚠️ 警告: 存在大量7天/$0订单，可能是之前的批量操作导致');
  }
}

checkCurrentSituation();