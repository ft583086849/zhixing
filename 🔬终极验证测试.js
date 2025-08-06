#!/usr/bin/env node

/**
 * 🔬 终极验证测试 - 检查RLS状态和策略
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function ultimateTest() {
  console.log('🔬 终极验证测试开始...\n');
  
  console.log('📊 根据你的操作，预期结果:');
  console.log('✅ admins表: rowsecurity = false (RLS已禁用)');
  console.log('✅ orders表: rowsecurity = false (RLS已禁用)');
  console.log('✅ 两个表都应该能正常插入数据');
  console.log('');
  
  try {
    // 测试简单插入，更明确的错误信息
    console.log('🧪 测试1: 尝试最简单的管理员插入...');
    const { data: adminResult, error: adminError } = await supabase
      .from('admins')
      .insert({ username: 'simple_test', password_hash: 'test' })
      .select();
    
    if (adminError) {
      console.log('❌ 管理员插入失败:');
      console.log(`   错误信息: ${adminError.message}`);
      console.log(`   错误代码: ${adminError.code}`);
      console.log(`   详细信息: ${adminError.details}`);
      console.log(`   提示信息: ${adminError.hint}`);
    } else {
      console.log('✅ 管理员插入成功!', adminResult);
    }
    
    console.log('\n🧪 测试2: 尝试最简单的订单插入...');
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert({ 
        order_number: 'SIMPLE_TEST', 
        customer_name: 'Test',
        amount: 100,
        status: 'pending'
      })
      .select();
    
    if (orderError) {
      console.log('❌ 订单插入失败:');
      console.log(`   错误信息: ${orderError.message}`);
      console.log(`   错误代码: ${orderError.code}`);
      console.log(`   详细信息: ${orderError.details}`);
      console.log(`   提示信息: ${orderError.hint}`);
    } else {
      console.log('✅ 订单插入成功!', orderResult);
    }
    
    console.log('\n📋 诊断结论:');
    if (adminError && adminError.message.includes('row-level security policy')) {
      console.log('🚨 管理员表的RLS仍然开启，ALTER TABLE命令可能没有生效');
    }
    if (orderError && orderError.message.includes('row-level security policy')) {
      console.log('🚨 订单表的RLS仍然开启，ALTER TABLE命令可能没有生效');
    }
    
    if (adminError || orderError) {
      console.log('\n🔧 建议解决方案:');
      console.log('1️⃣ 检查SQL执行是否有错误提示');
      console.log('2️⃣ 尝试在Supabase Dashboard新建查询执行:');
      console.log('   ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;');
      console.log('   ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;');
      console.log('3️⃣ 或者直接告诉我SQL执行的结果截图');
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
  }
}

ultimateTest();