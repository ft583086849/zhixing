/**
 * 检查Kevin_十三的收款地址数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkKevinData() {
  console.log('🔍 检查Kevin_十三的收款地址数据...\n');

  // 查询Kevin_十三的完整数据
  const { data, error } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', 'Kevin_十三')
    .single();

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  if (data) {
    console.log('📊 Kevin_十三的数据：');
    console.log('=====================================');
    
    // 显示关键字段
    console.log('基础信息：');
    console.log(`  wechat_name: ${data.wechat_name}`);
    console.log(`  sales_code: ${data.sales_code}`);
    
    console.log('\n收款信息字段：');
    console.log(`  chain_name: ${data.chain_name || '未设置'}`);
    console.log(`  payment_method: ${data.payment_method || '未设置'}`);
    console.log(`  payment_account: ${data.payment_account || '未设置'}`);
    console.log(`  payment_address: ${data.payment_address || '字段不存在或未设置'}`);
    
    // 检查是否有其他可能的字段
    console.log('\n所有字段：');
    Object.keys(data).forEach(key => {
      if (key.includes('payment') || key.includes('address') || key.includes('chain')) {
        console.log(`  ${key}: ${data[key]}`);
      }
    });
    
    console.log('\n⚠️ 问题分析：');
    if (data.payment_address && !data.payment_account) {
      console.log('  ❌ 数据存在payment_address但没有payment_account');
      console.log('  💡 需要手动更新：将payment_address的值复制到payment_account');
    } else if (!data.payment_address && !data.payment_account) {
      console.log('  ❌ 两个字段都没有数据');
      console.log('  💡 需要Kevin_十三重新填写收款地址');
    } else if (data.payment_account) {
      console.log('  ✅ payment_account字段有值');
      console.log('  💡 前端应该能显示，可能是API返回问题');
    }
  } else {
    console.log('未找到Kevin_十三的数据');
  }
}

checkKevinData().catch(console.error);
