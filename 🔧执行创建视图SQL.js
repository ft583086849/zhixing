// 🔧 执行创建数据库视图的SQL脚本
// 执行方式：node 🔧执行创建视图SQL.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 直接使用项目中的 Supabase 配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQL() {
  console.log('🔧 开始执行创建视图的SQL脚本...\n');
  console.log('=====================================\n');

  try {
    // 注意：Supabase JS客户端不支持执行原始SQL，特别是DDL语句
    // 我们需要通过 Supabase Dashboard 或使用管理员API来执行这些SQL
    
    console.log('⚠️  注意：创建视图的SQL需要在Supabase Dashboard中执行');
    console.log('');
    console.log('请按以下步骤操作：');
    console.log('');
    console.log('1. 打开 Supabase Dashboard: https://app.supabase.com');
    console.log('2. 选择项目: itvmeamoqthfqtkpubdv');
    console.log('3. 进入 SQL Editor');
    console.log('4. 依次执行以下SQL文件的内容：');
    console.log('');
    console.log('   📄 ✅Step2-创建二级销售统计视图.sql');
    console.log('   📄 ✅Step3-创建一级销售统计视图.sql');
    console.log('');
    console.log('=====================================\n');
    
    // 读取并显示SQL文件内容
    const sqlFiles = [
      '✅Step2-创建二级销售统计视图.sql',
      '✅Step3-创建一级销售统计视图.sql'
    ];
    
    for (const file of sqlFiles) {
      console.log(`📄 ${file} 的内容：`);
      console.log('-------------------------------------');
      try {
        const content = fs.readFileSync(file, 'utf8');
        console.log(content);
        console.log('-------------------------------------\n');
      } catch (err) {
        console.error(`❌ 无法读取文件 ${file}:`, err.message);
      }
    }
    
    console.log('✅ 请将以上SQL内容复制到Supabase SQL Editor中执行');
    console.log('');
    console.log('执行完成后，管理员仪表板的数据概览应该能正常显示数据了。');
    
  } catch (error) {
    console.error('❌ 执行过程出错:', error);
  }
}

// 执行
executeSQL();
