#!/usr/bin/env node

/**
 * 修复排除配置表中缺失的sales_code
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

async function fixExcludedSalesCode() {
  console.log('🔧 修复排除配置表中缺失的sales_code\n');
  
  try {
    // 1. 获取所有排除记录
    console.log('1️⃣ 获取排除记录...');
    const { data: excludedList, error: excludedError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .eq('is_active', true);
    
    if (excludedError) {
      console.error('❌ 查询失败:', excludedError);
      return;
    }
    
    console.log(`✅ 找到 ${excludedList.length} 条排除记录`);
    
    // 2. 检查并修复缺失的sales_code
    for (const record of excludedList) {
      if (!record.sales_code && record.wechat_name) {
        console.log(`\n🔍 处理: ${record.wechat_name}`);
        
        // 从sales_optimized表查找sales_code
        const { data: salesData, error: salesError } = await supabase
          .from('sales_optimized')
          .select('sales_code, sales_type')
          .eq('wechat_name', record.wechat_name);
        
        if (salesError) {
          console.error(`❌ 查询销售数据失败:`, salesError);
          continue;
        }
        
        if (salesData && salesData.length > 0) {
          const salesCode = salesData[0].sales_code;
          const salesType = salesData[0].sales_type;
          
          console.log(`   找到销售代码: ${salesCode}`);
          console.log(`   销售类型: ${salesType}`);
          
          // 更新记录
          const { error: updateError } = await supabase
            .from('excluded_sales_config')
            .update({
              sales_code: salesCode,
              sales_type: salesType || record.sales_type
            })
            .eq('id', record.id);
          
          if (updateError) {
            console.error(`❌ 更新失败:`, updateError);
          } else {
            console.log(`✅ 已更新销售代码`);
          }
        } else {
          console.log(`⚠️ 未找到对应的销售记录`);
        }
      } else if (record.sales_code) {
        console.log(`✅ ${record.wechat_name} 已有销售代码: ${record.sales_code}`);
      }
    }
    
    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    const { data: updatedList, error: verifyError } = await supabase
      .from('excluded_sales_config')
      .select('wechat_name, sales_code, sales_type')
      .eq('is_active', true);
    
    if (!verifyError && updatedList) {
      console.log('\n📋 更新后的排除名单:');
      updatedList.forEach(item => {
        console.log(`   ${item.wechat_name}: ${item.sales_code || '❌ 缺失'} (${item.sales_type})`);
      });
      
      const missingCount = updatedList.filter(item => !item.sales_code).length;
      if (missingCount === 0) {
        console.log('\n✅ 所有记录都有销售代码了！');
      } else {
        console.log(`\n⚠️ 仍有 ${missingCount} 条记录缺少销售代码`);
      }
    }
    
    console.log('\n✨ 修复完成！现在排除功能应该正常工作了。');
    console.log('请刷新管理后台页面查看效果。');
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

// 执行修复
fixExcludedSalesCode();