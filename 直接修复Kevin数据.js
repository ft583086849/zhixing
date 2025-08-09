/**
 * 直接修复Kevin_十三的收款地址数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixKevin() {
  console.log('🔧 直接修复Kevin_十三的数据...\n');

  // 1. 先获取Kevin的数据
  const { data: kevin, error: getError } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', 'Kevin_十三')
    .single();

  if (getError) {
    console.error('获取数据失败:', getError);
    return;
  }

  console.log('当前数据：');
  console.log(`  payment_address: ${kevin.payment_address}`);
  console.log(`  payment_account: ${kevin.payment_account}`);

  // 2. 执行更新
  if (kevin.payment_address && kevin.payment_address !== '未设置') {
    console.log('\n执行更新...');
    const { data: updateData, error: updateError } = await supabase
      .from('primary_sales')
      .update({ 
        payment_account: kevin.payment_address  // 将payment_address的值复制到payment_account
      })
      .eq('wechat_name', 'Kevin_十三')
      .select()
      .single();

    if (updateError) {
      console.error('❌ 更新失败:', updateError);
    } else {
      console.log('✅ 更新成功！');
      console.log('\n更新后的数据：');
      console.log(`  chain_name: ${updateData.chain_name}`);
      console.log(`  payment_account: ${updateData.payment_account}`);
      console.log(`  payment_address: ${updateData.payment_address}`);
    }
  }

  // 3. 再次验证
  const { data: verify, error: verifyError } = await supabase
    .from('primary_sales')
    .select('wechat_name, chain_name, payment_account, payment_address')
    .eq('wechat_name', 'Kevin_十三')
    .single();

  if (!verifyError && verify) {
    console.log('\n✅ 最终验证：');
    console.log(`  链名: ${verify.chain_name}`);
    console.log(`  收款地址(payment_account): ${verify.payment_account}`);
    
    if (verify.payment_account && verify.payment_account !== '未设置') {
      console.log('\n🎉 修复成功！现在可以在管理员系统看到了');
    }
  }
}

fixKevin().catch(console.error);
