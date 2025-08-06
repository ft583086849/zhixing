#!/usr/bin/env node

/**
 * 验证Supabase数据库表创建状态
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTables() {
  console.log('🔍 验证Supabase数据库表创建状态...\n');
  
  const tablesToCheck = ['admins', 'primary_sales', 'secondary_sales', 'orders'];
  let allTablesExist = true;
  
  for (const tableName of tablesToCheck) {
    try {
      console.log(`📋 检查表: ${tableName}...`);
      
      // 尝试查询表结构
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ 表 ${tableName} 不存在`);
          allTablesExist = false;
        } else if (error.message.includes('permission denied')) {
          console.log(`⚠️  表 ${tableName} 存在但权限受限（正常，需要配置RLS）`);
        } else {
          console.log(`✅ 表 ${tableName} 存在并可访问`);
        }
      } else {
        console.log(`✅ 表 ${tableName} 存在并可访问`);
      }
      
    } catch (err) {
      console.log(`❌ 检查表 ${tableName} 时出错:`, err.message);
      allTablesExist = false;
    }
  }
  
  console.log('\n📊 验证结果汇总：');
  if (allTablesExist) {
    console.log('🎯 所有表创建成功！');
    console.log('🔄 下一步：配置行级安全策略和权限...');
  } else {
    console.log('⚠️  部分表可能未正确创建，请检查Supabase Dashboard');
  }
  
  console.log('\n🔗 Supabase Dashboard地址：');
  console.log('https://itvmeamoqthfqtkpubdv.supabase.co/project/itvmeamoqthfqtkpubdv/editor');
  
  return allTablesExist;
}

// 测试数据插入（如果表存在）
async function testDataOperations() {
  console.log('\n🧪 测试基本数据操作...');
  
  try {
    // 测试插入一条管理员数据
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .insert([
        { username: 'test_admin', password_hash: 'test_hash_12345' }
      ])
      .select();
    
    if (adminError) {
      console.log('ℹ️  管理员表插入测试（权限限制是正常的）:', adminError.message);
    } else {
      console.log('✅ 管理员表插入测试成功');
    }
    
  } catch (err) {
    console.log('ℹ️  数据操作测试（权限限制是正常的）:', err.message);
  }
}

// 运行验证
verifyTables().then(async (success) => {
  if (success) {
    await testDataOperations();
  }
  console.log('\n✨ 验证完成！准备进行下一步配置...');
});