#!/usr/bin/env node

/**
 * 🔍 检查RLS状态 - 验证是否真的禁用了
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLSStatus() {
  console.log('🔍 检查RLS状态...\n');
  
  try {
    // 再次尝试插入测试数据
    console.log('📋 尝试插入管理员测试数据...');
    const { data: adminTest, error: adminError } = await supabase
      .from('admins')
      .insert({
        username: 'rls_test',
        password_hash: 'test123',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (adminError) {
      console.log('❌ 管理员表仍然阻止插入:', adminError.message);
      console.log('🔧 可能的原因:');
      console.log('   1. SQL执行失败');
      console.log('   2. 需要刷新连接');
      console.log('   3. 策略缓存问题');
    } else {
      console.log('✅ 管理员表插入成功!', adminTest);
      // 清理测试数据
      await supabase.from('admins').delete().eq('id', adminTest.id);
    }
    
    console.log('\n📋 尝试插入订单测试数据...');
    const { data: orderTest, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: 'RLS_TEST_001',
        customer_name: 'Test Customer',
        amount: 100,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (orderError) {
      console.log('❌ 订单表仍然阻止插入:', orderError.message);
    } else {
      console.log('✅ 订单表插入成功!', orderTest);
      // 清理测试数据
      await supabase.from('orders').delete().eq('id', orderTest.id);
    }
    
    console.log('\n🎯 如果仍然失败，请尝试以下备用方案:');
    console.log('1️⃣ 在Supabase Dashboard重新执行SQL');
    console.log('2️⃣ 或者创建一个新的测试查询来验证');
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message);
  }
}

checkRLSStatus();