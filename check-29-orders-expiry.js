require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function check29OrdersExpiry() {
  console.log('检查29个订单的到期时间设置');
  console.log('=' .repeat(80));
  
  // 我修改的用户列表
  const myModifiedUsers = [
    'huodong423', 'yyt8341', 'yyT8341', 'n1374y5mg0', 'huguogu99', 
    'coshou008', 'qq2721', 'jiangmc42', 'tax15574681086', 'zy7711006-jue',
    'qiyue-jue', 'wujie520133638', 'rr9652264', 'piaopiao4858', 
    'importantAnaly81922', 'ruiqi666go', 'liuyixss', 'JY131419',
    'jiujing110', 'beiken666', 'qiyuec'
  ];
  
  // 查询这些用户的订单
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, created_at, effective_time, expiry_time, duration, amount')
    .in('tradingview_username', myModifiedUsers)
    .eq('duration', '7天')
    .eq('amount', 0)
    .order('id');
  
  console.log(`\n找到 ${orders?.length || 0} 个订单\n`);
  
  console.log('订单ID | 用户名 | 创建时间 | 生效时间 | 到期时间 | 正确到期时间 | 状态');
  console.log('-'.repeat(100));
  
  let correctCount = 0;
  let wrongCount = 0;
  let nullCount = 0;
  
  orders?.forEach(order => {
    const createdDate = new Date(order.created_at);
    const effectiveDate = order.effective_time ? new Date(order.effective_time) : createdDate;
    
    // 计算正确的到期时间（生效时间或创建时间 + 7天）
    const correctExpiryDate = new Date(effectiveDate);
    correctExpiryDate.setDate(correctExpiryDate.getDate() + 7);
    
    const actualExpiryDate = order.expiry_time ? new Date(order.expiry_time) : null;
    
    let status = '';
    if (!actualExpiryDate) {
      status = '❌ 到期时间为NULL';
      nullCount++;
    } else {
      const actualExpiryStr = actualExpiryDate.toLocaleDateString('zh-CN');
      const correctExpiryStr = correctExpiryDate.toLocaleDateString('zh-CN');
      
      if (actualExpiryStr === correctExpiryStr) {
        status = '✅ 正确';
        correctCount++;
      } else {
        status = `❌ 错误(应为${correctExpiryStr})`;
        wrongCount++;
      }
    }
    
    console.log([
      order.id.toString().padEnd(6),
      order.tradingview_username.padEnd(20),
      createdDate.toLocaleDateString('zh-CN'),
      order.effective_time ? new Date(order.effective_time).toLocaleDateString('zh-CN') : '立即',
      actualExpiryDate ? actualExpiryDate.toLocaleDateString('zh-CN') : 'NULL',
      correctExpiryDate.toLocaleDateString('zh-CN'),
      status
    ].join(' | '));
  });
  
  console.log('\n' + '=' .repeat(80));
  console.log('统计结果:');
  console.log(`- 正确设置: ${correctCount}个`);
  console.log(`- 错误设置: ${wrongCount}个`);
  console.log(`- 未设置(NULL): ${nullCount}个`);
  console.log(`- 总计: ${orders?.length || 0}个`);
  
  if (wrongCount > 0 || nullCount > 0) {
    console.log('\n⚠️ 需要修复到期时间！');
    console.log('应该根据每个订单的创建时间或生效时间+7天来设置');
  }
}

check29OrdersExpiry();