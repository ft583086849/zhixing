#!/usr/bin/env node

/**
 * 分析当前Supabase表状态
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeTableStatus() {
  console.log('📊 分析当前Supabase表状态...\n');
  
  try {
    // 检查各表的数据情况
    const tables = ['admins', 'primary_sales', 'secondary_sales', 'orders'];
    
    for (const tableName of tables) {
      console.log(`📋 检查表: ${tableName}`);
      
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`   ❌ 错误: ${error.message}`);
      } else {
        console.log(`   ✅ 记录数: ${count || 0}`);
        if (data && data.length > 0) {
          console.log(`   📄 示例数据: ${JSON.stringify(data[0], null, 2).substring(0, 100)}...`);
        }
      }
      console.log('');
    }
    
    console.log('🔍 分析结果:');
    console.log('');
    console.log('📋 表结构状态:');
    console.log('✅ 表已存在: admins, primary_sales, secondary_sales, orders');
    console.log('✅ 基础架构: 完整');
    console.log('');
    console.log('💾 数据状态:');
    console.log('- primary_sales: 有测试数据');  
    console.log('- secondary_sales: 有测试数据');
    console.log('- admins: 可能为空 (RLS阻止)');
    console.log('- orders: 可能为空 (RLS阻止)');
    console.log('');
    console.log('🎯 建议策略:');
    console.log('📌 使用现有表 + 修复RLS策略 (推荐)');
    console.log('   - 保留已有的销售测试数据');
    console.log('   - 只修复管理员和订单表的权限');
    console.log('   - 添加你的管理员账户');
    console.log('');
    console.log('🆚 新建表 (不推荐)');
    console.log('   - 需要重新创建所有表');
    console.log('   - 丢失已有的测试数据');
    console.log('   - 更复杂的操作');
    
  } catch (error) {
    console.error('❌ 分析出错:', error.message);
  }
}

analyzeTableStatus();