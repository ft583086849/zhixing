const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'client/.env.local') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.log('请确保设置了以下环境变量：');
  console.log('- REACT_APP_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY 或 REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL() {
  console.log('🚀 开始创建销售统计排除配置表...\n');
  
  try {
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'create-excluded-sales-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    // 分割SQL语句（按分号分割，但忽略函数内的分号）
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    
    sqlContent.split('\n').forEach(line => {
      // 检测函数开始和结束
      if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE FUNCTION')) {
        inFunction = true;
      }
      if (line.includes('$$ LANGUAGE')) {
        inFunction = false;
        currentStatement += line + '\n';
        statements.push(currentStatement.trim());
        currentStatement = '';
        return;
      }
      
      // 处理普通语句
      if (!inFunction) {
        if (line.includes(';') && !line.trim().startsWith('--')) {
          currentStatement += line;
          const stmt = currentStatement.trim();
          if (stmt && !stmt.startsWith('--')) {
            statements.push(stmt);
          }
          currentStatement = '';
        } else {
          currentStatement += line + '\n';
        }
      } else {
        currentStatement += line + '\n';
      }
    });
    
    console.log(`📋 准备执行 ${statements.length} 条SQL语句\n`);
    
    // 执行每条语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // 跳过注释和空语句
      if (!statement || statement.startsWith('--')) {
        continue;
      }
      
      // 提取语句类型用于日志
      let statementType = 'UNKNOWN';
      if (statement.includes('DROP TABLE')) {
        statementType = 'DROP TABLE';
      } else if (statement.includes('CREATE TABLE')) {
        statementType = 'CREATE TABLE';
      } else if (statement.includes('CREATE INDEX')) {
        statementType = 'CREATE INDEX';
      } else if (statement.includes('CREATE OR REPLACE VIEW')) {
        statementType = 'CREATE VIEW';
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        statementType = 'CREATE FUNCTION';
      } else if (statement.includes('COMMENT ON')) {
        statementType = 'ADD COMMENT';
      } else if (statement.includes('GRANT')) {
        statementType = 'GRANT PERMISSION';
      }
      
      console.log(`${i + 1}. 执行 ${statementType}...`);
      
      try {
        // 使用rpc执行原始SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // 如果rpc方法不存在，尝试其他方式
          if (error.message.includes('function public.exec_sql')) {
            console.log('   ⚠️ exec_sql函数不存在，请手动执行SQL');
          } else {
            console.error(`   ❌ 错误: ${error.message}`);
          }
        } else {
          console.log(`   ✅ 成功`);
        }
      } catch (err) {
        console.error(`   ❌ 执行失败: ${err.message}`);
      }
    }
    
    console.log('\n📊 验证表创建...');
    
    // 验证表是否创建成功
    const { data: tables, error: tableError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
        console.log('❌ 表创建失败，请直接在Supabase控制台执行SQL');
        console.log('\n请复制 create-excluded-sales-table.sql 文件内容到 Supabase SQL编辑器执行');
      } else {
        console.log('⚠️ 表可能已创建，但查询出错:', tableError.message);
      }
    } else {
      console.log('✅ excluded_sales_config 表创建成功！');
      
      // 验证日志表
      const { error: logError } = await supabase
        .from('excluded_sales_log')
        .select('*')
        .limit(1);
      
      if (!logError || logError.message.includes('0 rows')) {
        console.log('✅ excluded_sales_log 表创建成功！');
      }
    }
    
    console.log('\n✨ 数据库准备完成！');
    console.log('\n如果看到错误，请：');
    console.log('1. 登录 Supabase 控制台');
    console.log('2. 进入 SQL Editor');
    console.log('3. 复制 create-excluded-sales-table.sql 的内容');
    console.log('4. 执行SQL语句');
    
  } catch (error) {
    console.error('❌ 执行过程出错:', error);
  }
}

// 执行
executeSQL();