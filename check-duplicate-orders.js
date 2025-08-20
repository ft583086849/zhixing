require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkDuplicateOrders() {
  console.log('检查多修改的订单');
  console.log('=' .repeat(60));
  
  // 原本的21个用户
  const trUsernames = [
    'huodong423', 'yyt8341', 'yyT8341', 'n1374y5mg0', 'huguogu99', 
    'coshou008', 'qq2721', 'jiangmc42', 'tax15574681086', 'zy7711006-jue',
    'qiyue-jue', 'wujie520133638', 'rr9652264', 'piaopiao4858', 
    'importantAnaly81922', 'ruiqi666go', 'liuyixss', 'JY131419',
    'jiujing110', 'beiken666', 'qiyuec'
  ];
  
  // 查询这些用户所有被修改为7天的订单
  const { data } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, duration, created_at, updated_at')
    .in('tradingview_username', trUsernames)
    .eq('duration', '7天')
    .order('tradingview_username');
  
  // 找出有多个订单的用户
  const userCounts = {};
  data.forEach(order => {
    if (!userCounts[order.tradingview_username]) {
      userCounts[order.tradingview_username] = [];
    }
    userCounts[order.tradingview_username].push(order);
  });
  
  console.log('\n有多个订单被修改的用户:');
  console.log('-'.repeat(60));
  
  let extraOrders = [];
  
  Object.entries(userCounts).forEach(([username, orders]) => {
    if (orders.length > 1) {
      console.log(`\n⚠️ ${username} 有 ${orders.length} 个订单被修改:`);
      orders.forEach((o, index) => {
        console.log(`  订单${index + 1}: ID=${o.id}, 创建时间=${new Date(o.created_at).toLocaleDateString('zh-CN')}`);
        if (index > 0) {
          extraOrders.push({
            id: o.id,
            username: username,
            created: new Date(o.created_at).toLocaleDateString('zh-CN')
          });
        }
      });
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('总结:');
  console.log(`- 应该修改: 21个订单（21个用户，每人1个）`);
  console.log(`- 实际修改: ${data.length}个订单`);
  console.log(`- 多修改了: ${data.length - 21}个订单`);
  
  if (extraOrders.length > 0) {
    console.log('\n多修改的订单详情:');
    extraOrders.forEach(o => {
      console.log(`  - 订单ID: ${o.id}, 用户: ${o.username}, 创建时间: ${o.created}`);
    });
  }
  
  // 查询这些多余订单原本的数据（从历史记录或日志中可能无法获取，但可以查看其他类似订单）
  console.log('\n建议: 这些多余的订单可能原本不是$100的订单，需要进一步确认是否要恢复');
}

checkDuplicateOrders();