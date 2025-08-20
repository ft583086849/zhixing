#!/usr/bin/env node

/**
 * 验证生产环境数据库表结构
 * 确保excluded_sales_config表存在且结构正确
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyProductionDatabase() {
  console.log('🔍 验证生产环境数据库表结构...\n');
  console.log(`📍 数据库URL: ${supabaseUrl}\n`);
  
  try {
    // 1. 检查excluded_sales_config表是否存在
    console.log('1️⃣ 检查excluded_sales_config表：');
    
    const { data: testQuery, error: queryError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .limit(1);
    
    if (queryError) {
      if (queryError.message.includes('relation') && queryError.message.includes('does not exist')) {
        console.log('   ❌ 表不存在，需要创建');
        console.log('\n📝 请在Supabase控制台执行以下SQL创建表：\n');
        printCreateTableSQL();
        return false;
      } else {
        console.log('   ⚠️ 查询出错:', queryError.message);
      }
    } else {
      console.log('   ✅ 表存在');
      
      // 2. 检查表结构
      console.log('\n2️⃣ 检查表字段结构：');
      
      // 尝试插入一条测试记录来验证字段
      const testRecord = {
        wechat_name: '__test_verify__',
        sales_code: 'TEST_CODE',
        sales_type: 'test',
        is_active: false,
        excluded_by: 'system_test',
        reason: '验证表结构',
        excluded_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('excluded_sales_config')
        .insert(testRecord)
        .select()
        .single();
      
      if (insertError) {
        console.log('   ❌ 表结构可能不完整:', insertError.message);
        
        // 检查具体缺少哪个字段
        if (insertError.message.includes('is_active')) {
          console.log('   ⚠️ 缺少is_active字段');
          console.log('\n📝 请执行以下SQL添加字段：');
          console.log('ALTER TABLE excluded_sales_config ADD COLUMN is_active BOOLEAN DEFAULT true;');
        }
      } else {
        console.log('   ✅ 表结构正确');
        
        // 删除测试记录
        await supabase
          .from('excluded_sales_config')
          .delete()
          .eq('id', insertData.id);
        console.log('   ✅ 测试记录已清理');
      }
      
      // 3. 检查现有数据
      console.log('\n3️⃣ 检查现有排除数据：');
      
      const { data: existingData, error: existingError } = await supabase
        .from('excluded_sales_config')
        .select('*')
        .eq('is_active', true);
      
      if (!existingError) {
        if (existingData && existingData.length > 0) {
          console.log(`   📊 当前有 ${existingData.length} 条激活的排除记录：`);
          existingData.forEach(record => {
            console.log(`   • ${record.wechat_name} (${record.sales_code})`);
          });
        } else {
          console.log('   📭 当前没有激活的排除记录');
        }
      }
    }
    
    // 4. 检查excluded_sales_log表（可选）
    console.log('\n4️⃣ 检查excluded_sales_log表（可选）：');
    
    const { error: logError } = await supabase
      .from('excluded_sales_log')
      .select('*')
      .limit(1);
    
    if (logError) {
      if (logError.message.includes('does not exist')) {
        console.log('   ⚠️ 日志表不存在（可选，不影响功能）');
      }
    } else {
      console.log('   ✅ 日志表存在');
    }
    
    // 5. 总结
    console.log('\n📊 验证结果总结：');
    console.log('================');
    
    if (!queryError || (queryError && !queryError.message.includes('does not exist'))) {
      console.log('✅ 数据库已准备就绪，可以部署');
      console.log('\n🚀 下一步：');
      console.log('1. 执行 npm run build 构建生产版本');
      console.log('2. 提交代码到Git仓库');
      console.log('3. 推送到Vercel进行自动部署');
      return true;
    } else {
      console.log('⚠️ 需要先创建数据库表');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    return false;
  }
}

function printCreateTableSQL() {
  const sql = `
-- 创建排除销售配置表
CREATE TABLE excluded_sales_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wechat_name VARCHAR(255) NOT NULL,
  sales_code VARCHAR(255),
  sales_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  excluded_by VARCHAR(255),
  reason TEXT,
  excluded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引提高查询性能
CREATE INDEX idx_excluded_sales_active ON excluded_sales_config(is_active);
CREATE INDEX idx_excluded_sales_code ON excluded_sales_config(sales_code);
CREATE INDEX idx_excluded_wechat ON excluded_sales_config(wechat_name);

-- 创建操作日志表（可选）
CREATE TABLE excluded_sales_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wechat_name VARCHAR(255),
  sales_code VARCHAR(255),
  action VARCHAR(50),
  reason TEXT,
  operated_by VARCHAR(255),
  affected_orders_count INTEGER,
  affected_amount DECIMAL(10,2),
  affected_commission DECIMAL(10,2),
  operated_at TIMESTAMP DEFAULT NOW()
);
`;
  console.log(sql);
}

// 执行验证
verifyProductionDatabase();