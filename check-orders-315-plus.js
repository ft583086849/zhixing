require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkOrders315Plus() {
  console.log('查询订单ID >= 315的所有订单');
  console.log('='.repeat(100));
  
  // 1. 查询ID >= 315的所有订单
  const { data: newOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .gte('id', 315)
    .order('id');
  
  console.log(`找到订单数量: ${newOrders?.length || 0}个`);
  console.log('');
  
  if (newOrders && newOrders.length > 0) {
    console.log('【订单详细信息】');
    console.log('-'.repeat(100));
    console.log('订单ID | 用户 | 金额 | 状态 | 一级销售ID | 二级销售ID | 创建时间 | 订单号');
    console.log('-'.repeat(100));
    
    newOrders.forEach(order => {
      console.log(`${order.id} | ${order.tradingview_username || 'N/A'} | $${order.amount} | ${order.status} | ${order.primary_sales_id || '无'} | ${order.secondary_sales_id || '无'} | ${new Date(order.created_at).toLocaleString('zh-CN')} | ${order.order_number}`);
    });
  }
  
  // 2. 获取WML的信息
  const { data: wml } = await supabase
    .from('primary_sales')
    .select('id, wechat_name, sales_code')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  console.log('\n' + '='.repeat(100));
  console.log('【分析与WML的关系】');
  console.log('-'.repeat(100));
  
  const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
  let wmlDirectOrders = [];
  let wmlTeamOrders = [];
  
  newOrders?.forEach(order => {
    if (order.primary_sales_id === wml.id) {
      if (!order.secondary_sales_id) {
        wmlDirectOrders.push(order);
        console.log(`订单${order.id}: ✅ WML直销订单 - $${order.amount} - ${order.status}`);
      } else {
        wmlTeamOrders.push(order);
        console.log(`订单${order.id}: 📊 WML团队订单 - $${order.amount} - 二级销售ID:${order.secondary_sales_id}`);
      }
    } else {
      console.log(`订单${order.id}: ❌ 与WML无关 - 一级销售ID:${order.primary_sales_id}`);
    }
  });
  
  // 3. 统计WML的新增订单
  console.log('\n' + '='.repeat(100));
  console.log('【WML新增订单统计】');
  console.log('-'.repeat(100));
  
  const wmlNewDirectAmount = wmlDirectOrders
    .filter(o => confirmedStatuses.includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);
  
  const wmlNewTeamAmount = wmlTeamOrders
    .filter(o => confirmedStatuses.includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);
  
  console.log(`WML新增直销订单: ${wmlDirectOrders.length}个`);
  console.log(`WML新增直销确认金额: $${wmlNewDirectAmount}`);
  console.log(`WML新增团队订单: ${wmlTeamOrders.length}个`);
  console.log(`WML新增团队确认金额: $${wmlNewTeamAmount}`);
  
  // 4. 计算加上新订单后的总额
  console.log('\n' + '='.repeat(100));
  console.log('【加上新订单后的总额】');
  console.log('-'.repeat(100));
  
  // 之前的确认金额（不含订单303）
  const previousDirectAmount = 676;  // 订单47($488) + 订单122($188)
  const previousTeamAmount = 1588;   // 订单3($1588)
  
  const newTotalDirect = previousDirectAmount + wmlNewDirectAmount;
  const newTotalTeam = previousTeamAmount + wmlNewTeamAmount;
  const newTotal = newTotalDirect + newTotalTeam;
  
  console.log(`之前直销金额: $${previousDirectAmount}`);
  console.log(`新增直销金额: $${wmlNewDirectAmount}`);
  console.log(`现在直销总额: $${newTotalDirect}`);
  console.log('');
  console.log(`之前团队金额: $${previousTeamAmount}`);
  console.log(`新增团队金额: $${wmlNewTeamAmount}`);
  console.log(`现在团队总额: $${newTotalTeam}`);
  console.log('');
  console.log(`总金额应该是: $${newTotal}`);
  
  // 5. 重新计算佣金
  console.log('\n【正确的佣金计算】');
  console.log('-'.repeat(100));
  const directCommission = newTotalDirect * 0.4;
  const teamCommission = newTotalTeam * 0.15;
  const totalCommission = directCommission + teamCommission;
  
  console.log(`直销佣金: $${newTotalDirect} × 40% = $${directCommission}`);
  console.log(`团队差价: $${newTotalTeam} × 15% = $${teamCommission}`);
  console.log(`总佣金: $${totalCommission.toFixed(2)}`);
  
  console.log('\n页面显示的佣金$1001.40与正确值相差: $' + (1001.40 - totalCommission).toFixed(2));
}

checkOrders315Plus();