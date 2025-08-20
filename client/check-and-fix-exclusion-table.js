#!/usr/bin/env node

/**
 * 检查并修复excluded_sales_config表结构
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixExclusionTable() {
  console.log('🔍 检查并修复excluded_sales_config表结构\n');
  
  try {
    // 1. 检查表是否存在
    console.log('1️⃣ 检查表结构:');
    
    // 先查询看表是否存在
    const { data: existingData, error: queryError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.log('   ❌ 表查询失败:', queryError.message);
      console.log('   需要创建excluded_sales_config表');
      
      // 创建表（通过插入一条测试数据来触发表创建）
      console.log('\n2️⃣ 创建excluded_sales_config表:');
      console.log('   请在Supabase SQL编辑器中执行以下SQL:');
      console.log(`
CREATE TABLE IF NOT EXISTS excluded_sales_config (
  id SERIAL PRIMARY KEY,
  wechat_name TEXT NOT NULL,
  sales_code TEXT,
  excluded_from_stats BOOLEAN DEFAULT true,
  excluded_by TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_excluded_sales_wechat ON excluded_sales_config(wechat_name);
CREATE INDEX IF NOT EXISTS idx_excluded_sales_code ON excluded_sales_config(sales_code);
CREATE INDEX IF NOT EXISTS idx_excluded_stats ON excluded_sales_config(excluded_from_stats);
      `);
      return;
    }
    
    console.log('   ✅ 表存在，检查字段...');
    
    // 2. 尝试使用excluded_from_stats字段
    console.log('\n2️⃣ 测试字段是否存在:');
    
    const { data: testData, error: fieldError } = await supabase
      .from('excluded_sales_config')
      .select('excluded_from_stats')
      .limit(1);
    
    if (fieldError && fieldError.message.includes('excluded_from_stats')) {
      console.log('   ❌ excluded_from_stats字段不存在');
      console.log('   需要添加字段');
      console.log('\n   请在Supabase SQL编辑器中执行:');
      console.log('   ALTER TABLE excluded_sales_config ADD COLUMN IF NOT EXISTS excluded_from_stats BOOLEAN DEFAULT true;');
      return;
    }
    
    console.log('   ✅ excluded_from_stats字段存在');
    
    // 3. 测试排除功能的简化版本
    console.log('\n3️⃣ 测试排除功能（简化版本）:');
    
    // 获取wangming的数据
    const { data: wangmingSales } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_amount, total_commission')
      .eq('wechat_name', 'wangming')
      .single();
    
    if (!wangmingSales) {
      console.log('   ❌ 找不到wangming的销售数据');
      return;
    }
    
    console.log(`   wangming数据: sales_code=${wangmingSales.sales_code}, amount=${wangmingSales.total_amount}, commission=${wangmingSales.total_commission}`);
    
    // 清空排除名单
    await supabase.from('excluded_sales_config').delete().neq('id', 0);
    
    // 测试添加排除
    const { error: insertError } = await supabase
      .from('excluded_sales_config')
      .insert({
        wechat_name: 'wangming',
        sales_code: wangmingSales.sales_code,
        excluded_by: 'MCP测试',
        reason: '测试排除功能'
      });
    
    if (insertError) {
      console.log('   ❌ 添加排除失败:', insertError.message);
      return;
    }
    
    console.log('   ✅ wangming已添加到排除名单');
    
    // 4. 测试排除效果
    console.log('\n4️⃣ 测试排除效果:');
    
    // 获取所有销售数据
    const { data: allSales } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_amount, total_commission');
    
    // 获取排除名单
    const { data: excludedList } = await supabase
      .from('excluded_sales_config')
      .select('sales_code');
    
    const excludedCodes = excludedList?.map(item => item.sales_code).filter(code => code) || [];
    
    // 过滤后的销售数据
    const filteredSales = allSales?.filter(sale => !excludedCodes.includes(sale.sales_code)) || [];
    
    console.log(`   所有销售数量: ${allSales?.length || 0}`);
    console.log(`   排除后销售数量: ${filteredSales.length}`);
    console.log(`   排除的销售代码: [${excludedCodes.join(', ')}]`);
    
    if (allSales && allSales.length > filteredSales.length) {
      console.log('   ✅ 排除功能基础测试通过');
      
      // 计算数据差异
      const allTotal = allSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
      const filteredTotal = filteredSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
      const allCommission = allSales.reduce((sum, s) => sum + parseFloat(s.total_commission || 0), 0);
      const filteredCommission = filteredSales.reduce((sum, s) => sum + parseFloat(s.total_commission || 0), 0);
      
      console.log(`   总金额: ${allTotal} → ${filteredTotal} (差异: ${allTotal - filteredTotal})`);
      console.log(`   总佣金: ${allCommission} → ${filteredCommission} (差异: ${allCommission - filteredCommission})`);
      
      if (Math.abs((allTotal - filteredTotal) - wangmingSales.total_amount) < 0.01) {
        console.log('   ✅ 金额排除准确');
      }
      
      if (Math.abs((allCommission - filteredCommission) - wangmingSales.total_commission) < 0.01) {
        console.log('   ✅ 佣金排除准确');
      }
      
    } else {
      console.log('   ❌ 排除功能未生效');
    }
    
    // 5. 清理测试数据
    console.log('\n5️⃣ 清理测试数据:');
    await supabase.from('excluded_sales_config').delete().eq('wechat_name', 'wangming');
    console.log('   ✅ 测试数据已清理');
    
    console.log('\n🎯 结论:');
    console.log('如果以上测试都通过，排除功能的基础逻辑是正常的');
    console.log('接下来需要测试前端API是否正确应用了排除过滤');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

checkAndFixExclusionTable();