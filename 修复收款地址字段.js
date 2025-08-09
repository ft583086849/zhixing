/**
 * 修复收款地址字段：将payment_address迁移到payment_account
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixPaymentAccounts() {
  console.log('🔧 开始修复收款地址字段...\n');

  // 1. 修复一级销售
  console.log('📊 处理一级销售数据...');
  const { data: primarySales, error: primaryError } = await supabase
    .from('primary_sales')
    .select('id, wechat_name, payment_address, payment_account, chain_name');

  if (!primaryError && primarySales) {
    for (const sale of primarySales) {
      // 如果payment_address有值但payment_account没有值
      if (sale.payment_address && 
          sale.payment_address !== '未设置' && 
          (!sale.payment_account || sale.payment_account === '未设置')) {
        
        console.log(`  修复 ${sale.wechat_name}: ${sale.payment_address} -> payment_account`);
        
        const { error: updateError } = await supabase
          .from('primary_sales')
          .update({ payment_account: sale.payment_address })
          .eq('id', sale.id);
        
        if (updateError) {
          console.error(`    ❌ 更新失败:`, updateError);
        } else {
          console.log(`    ✅ 成功`);
        }
      }
    }
  }

  // 2. 修复二级销售
  console.log('\n📊 处理二级销售数据...');
  const { data: secondarySales, error: secondaryError } = await supabase
    .from('secondary_sales')
    .select('id, wechat_name, payment_address, payment_account, chain_name');

  if (!secondaryError && secondarySales) {
    for (const sale of secondarySales) {
      // 如果payment_address有值但payment_account没有值
      if (sale.payment_address && 
          sale.payment_address !== '未设置' && 
          (!sale.payment_account || sale.payment_account === '未设置')) {
        
        console.log(`  修复 ${sale.wechat_name}: ${sale.payment_address} -> payment_account`);
        
        const { error: updateError } = await supabase
          .from('secondary_sales')
          .update({ payment_account: sale.payment_address })
          .eq('id', sale.id);
        
        if (updateError) {
          console.error(`    ❌ 更新失败:`, updateError);
        } else {
          console.log(`    ✅ 成功`);
        }
      }
    }
  }

  // 3. 验证Kevin_十三的数据
  console.log('\n📊 验证Kevin_十三的数据...');
  const { data: kevin, error: kevinError } = await supabase
    .from('primary_sales')
    .select('wechat_name, chain_name, payment_address, payment_account')
    .eq('wechat_name', 'Kevin_十三')
    .single();

  if (!kevinError && kevin) {
    console.log('Kevin_十三修复后的数据：');
    console.log(`  chain_name: ${kevin.chain_name}`);
    console.log(`  payment_address: ${kevin.payment_address}`);
    console.log(`  payment_account: ${kevin.payment_account}`);
    
    if (kevin.payment_account && kevin.payment_account !== '未设置') {
      console.log('  ✅ 修复成功！前台应该能看到了');
    } else {
      console.log('  ❌ 仍需要手动修复');
    }
  }

  console.log('\n✅ 修复完成！');
}

fixPaymentAccounts().catch(console.error);
