require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkDistributionIncome() {
  console.log('检查WML792355703的分销收益计算');
  console.log('='.repeat(50));
  
  // 获取fl261247的佣金率
  const { data: fl } = await supabase
    .from('secondary_sales')
    .select('*')
    .eq('wechat_name', 'fl261247')
    .single();
    
  console.log('fl261247的信息:');
  console.log('  commission_rate:', fl.commission_rate);
  console.log('  订单金额: $1588');
  
  // 计算
  const rate = fl.commission_rate > 1 ? fl.commission_rate / 100 : fl.commission_rate;
  const flCommission = 1588 * rate;
  const wmlEarning = 1588 * 0.4 - flCommission;
  
  console.log('\n计算过程:');
  console.log(`  fl261247的佣金率: ${fl.commission_rate}% → ${rate}`);
  console.log(`  fl261247获得: $1588 × ${rate} = $${flCommission}`);
  console.log(`  WML获得差价: $1588 × 0.4 - $${flCommission} = $${wmlEarning}`);
  
  console.log('\n问题分析:');
  if (Math.abs(flCommission - 397) < 1) {
    console.log('  页面显示的$397是fl261247的佣金，不是WML的差价收益！');
    console.log('  正确的分销收益应该是: $' + wmlEarning.toFixed(2));
  }
  
  // 检查前端代码的计算逻辑
  console.log('\n前端代码salesCache.js第190-193行的逻辑:');
  console.log('  const secRate = secondary.commission_rate > 1 ?');
  console.log('    secondary.commission_rate / 100 :');
  console.log('    (secondary.commission_rate || 0.25);');
  console.log('  secondaryTotalCommission += amountUSD * secRate;');
  
  console.log('\n再看199-201行:');
  console.log('  const secondaryShareCommission = secondaryOrdersAmount * primaryRate - secondaryTotalCommission;');
  console.log('  这个算的是一级销售从团队订单赚的差价');
  
  console.log('\n页面显示的值:');
  console.log('  secondary_share_commission字段应该是: $' + wmlEarning.toFixed(2));
  console.log('  但页面显示: $397');
  console.log('  这可能是显示了secondaryTotalCommission而不是secondaryShareCommission');
}

checkDistributionIncome();