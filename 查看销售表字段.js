/**
 * 查看销售表的字段结构
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFields() {
  console.log('🔍 查看销售表的字段结构...\n');

  // 1. 获取一条一级销售记录看字段
  const { data: primarySample, error: pError } = await supabase
    .from('primary_sales')
    .select('*')
    .limit(1);

  if (!pError && primarySample && primarySample.length > 0) {
    console.log('📊 一级销售表 (primary_sales) 字段：');
    console.log('字段列表:', Object.keys(primarySample[0]));
    console.log('\n示例数据:');
    Object.entries(primarySample[0]).forEach(([key, value]) => {
      if (key.includes('payment') || key.includes('chain') || key.includes('wechat')) {
        console.log(`  ${key}: ${value}`);
      }
    });
  }

  // 2. 获取一条二级销售记录看字段
  const { data: secondarySample, error: sError } = await supabase
    .from('secondary_sales')
    .select('*')
    .limit(1);

  if (!sError && secondarySample && secondarySample.length > 0) {
    console.log('\n📊 二级销售表 (secondary_sales) 字段：');
    console.log('字段列表:', Object.keys(secondarySample[0]));
    console.log('\n示例数据:');
    Object.entries(secondarySample[0]).forEach(([key, value]) => {
      if (key.includes('payment') || key.includes('chain') || key.includes('wechat')) {
        console.log(`  ${key}: ${value}`);
      }
    });
  }

  // 3. 特别查看payment相关字段
  console.log('\n📌 重点字段对应关系：');
  console.log('  前端表单字段 → 数据库字段');
  console.log('  wechat_name → wechat_name（微信号）');
  console.log('  chain_name → chain_name（链名）');
  console.log('  payment_address → payment_account（收款地址）');
  console.log('  payment_method → payment_method（收款方式，默认crypto）');
  
  console.log('\n⚠️ 注意：');
  console.log('  - 前端表单使用payment_address');
  console.log('  - 数据库字段是payment_account');
  console.log('  - 需要在保存时进行字段映射');
}

checkFields().catch(console.error);
