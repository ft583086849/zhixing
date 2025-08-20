#!/usr/bin/env node

/**
 * 检查excluded_sales_config表的当前状态和内容
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExclusionTableStatus() {
  console.log('🔍 检查excluded_sales_config表的当前状态\n');
  
  try {
    // 1. 查看表中的所有数据
    console.log('1️⃣ 表中的当前数据:');
    const { data: allData, error: queryError } = await supabase
      .from('excluded_sales_config')
      .select('*');
    
    if (queryError) {
      console.log('   查询失败:', queryError.message);
      return;
    }
    
    if (allData && allData.length > 0) {
      console.log('   找到', allData.length, '条记录:');
      allData.forEach((record, index) => {
        console.log(`\n   记录 ${index + 1}:`);
        Object.keys(record).forEach(key => {
          if (record[key] !== null) {
            console.log(`   • ${key}: ${record[key]}`);
          }
        });
      });
    } else {
      console.log('   表是空的，没有任何数据');
    }
    
    // 2. 查看表的字段结构
    console.log('\n2️⃣ 表的字段结构:');
    if (allData && allData.length > 0) {
      const fields = Object.keys(allData[0]);
      console.log('   当前字段:');
      fields.forEach(field => {
        console.log(`   • ${field}`);
      });
    } else {
      // 插入一条临时记录来获取字段结构
      const { data: tempData } = await supabase
        .from('excluded_sales_config')
        .select('*')
        .limit(0);
      
      console.log('   无法确定字段结构（表为空）');
    }
    
    // 3. 解释表的用途
    console.log('\n3️⃣ 表的设计用途:');
    console.log('   📋 excluded_sales_config表的作用:');
    console.log('   • 存储需要从管理员统计中排除的销售账号');
    console.log('   • 管理员看到的统计数据会过滤掉这些账号');
    console.log('   • 但被排除的销售自己仍能看到完整数据');
    console.log('   • 实现"双层数据访问"策略');
    
    console.log('\n   🔧 各字段的含义:');
    console.log('   • wechat_name: 被排除的销售微信名');
    console.log('   • sales_code: 销售代码（用于关联订单）');
    console.log('   • excluded_from_stats: 是否从统计中排除（布尔值）');
    console.log('   • excluded_by: 谁执行的排除操作');
    console.log('   • reason: 排除的原因');
    console.log('   • created_at: 创建时间');
    console.log('   • updated_at: 更新时间');
    
    console.log('\n4️⃣ 为什么需要excluded_from_stats字段:');
    console.log('   • 用于标记是否真的要排除该销售');
    console.log('   • 可以临时禁用排除而不删除记录');
    console.log('   • 提供更灵活的控制');
    
    console.log('\n5️⃣ 当前状态总结:');
    if (allData && allData.length > 0) {
      console.log('   ⚠️ 表中有数据但缺少excluded_from_stats字段');
      console.log('   需要添加该字段才能正常工作');
    } else {
      console.log('   ✅ 表是空的，可以直接测试排除功能');
      console.log('   缺少excluded_from_stats字段需要先添加');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkExclusionTableStatus();