#!/usr/bin/env node

/**
 * 🚨 紧急RLS策略诊断 - 检查当前策略状态
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseRLS() {
  console.log('🚨 紧急RLS策略诊断...\n');
  
  try {
    // 测试各表的插入权限
    const tables = [
      { name: 'admins', data: { username: 'test_admin', password_hash: 'test123' } },
      { name: 'orders', data: { order_number: 'TEST001', customer_name: 'Test', amount: 100, status: 'pending' } },
      { name: 'primary_sales', data: { sales_code: 'TEST_PRIMARY', name: 'Test Primary', phone: '13800138000' } },
      { name: 'secondary_sales', data: { sales_code: 'TEST_SECONDARY', name: 'Test Secondary', phone: '13900139000' } }
    ];
    
    for (const table of tables) {
      console.log(`🔍 测试表: ${table.name}`);
      
      const { data, error } = await supabase
        .from(table.name)
        .insert(table.data)
        .select()
        .single();
      
      if (error) {
        console.log(`   ❌ 插入失败: ${error.message}`);
        console.log(`   📋 错误代码: ${error.code || 'N/A'}`);
      } else {
        console.log(`   ✅ 插入成功: ${JSON.stringify(data).substring(0, 50)}...`);
        
        // 清理测试数据
        await supabase.from(table.name).delete().eq('id', data.id);
        console.log(`   🧹 测试数据已清理`);
      }
      console.log('');
    }
    
    console.log('📋 诊断完成！');
    console.log('\n🔧 如果admins和orders表仍然失败，请执行以下强力修复:');
    
  } catch (error) {
    console.error('❌ 诊断出错:', error.message);
  }
}

diagnoseRLS();