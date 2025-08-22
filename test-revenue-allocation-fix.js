#!/usr/bin/env node
/**
 * 🧪 测试收益分配保存问题修复
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 测试收益分配保存问题修复...\n');

async function testRevenueAllocationFix() {
  try {
    // 模拟前端传递的完整数据结构
    const profitRatios = {
      public: 40,
      marketing: 10,
      dividend: 15,
      development: 15,
      zhixing: 35,
      zijun: 25
    };

    console.log('📊 测试数据:', profitRatios);
    console.log('总占比:', profitRatios.public + profitRatios.zhixing + profitRatios.zijun);

    // 测试1：用原始方法（可能失败）
    console.log('\n🔍 测试1：使用原始方法...');
    
    try {
      // 先将所有现有配置设为非激活
      await supabase
        .from('profit_distribution')
        .update({ is_active: false })
        .eq('is_active', true);
      
      // 使用原始的不完整字段插入
      const { data: originalData, error: originalError } = await supabase
        .from('profit_distribution')
        .insert({
          public_ratio: profitRatios.public || 40,
          zhixing_ratio: profitRatios.zhixing || 35,
          zijun_ratio: profitRatios.zijun || 25,
          is_active: true,
          created_by: 'test-original'
        })
        .select()
        .single();
      
      if (originalError) {
        console.log('❌ 原始方法失败:', originalError);
        console.log('💡 这可能就是用户遇到的问题');
      } else {
        console.log('✅ 原始方法意外成功:', originalData);
        
        // 清理测试数据
        await supabase
          .from('profit_distribution')
          .delete()
          .eq('id', originalData.id);
      }
    } catch (error) {
      console.log('❌ 原始方法异常:', error);
    }

    // 测试2：用修复后的方法（应该成功）
    console.log('\n🔍 测试2：使用修复后的方法...');
    
    try {
      // 先将所有现有配置设为非激活
      await supabase
        .from('profit_distribution')
        .update({ is_active: false })
        .eq('is_active', true);
      
      // 使用完整字段插入
      const { data: fixedData, error: fixedError } = await supabase
        .from('profit_distribution')
        .insert({
          public_ratio: profitRatios.public || 40,
          marketing_ratio: profitRatios.marketing || 10,
          dividend_ratio: profitRatios.dividend || 15,
          development_ratio: profitRatios.development || 15,
          zhixing_ratio: profitRatios.zhixing || 35,
          zijun_ratio: profitRatios.zijun || 25,
          is_active: true,
          created_by: 'test-fixed'
        })
        .select()
        .single();
      
      if (fixedError) {
        console.log('❌ 修复方法失败:', fixedError);
      } else {
        console.log('✅ 修复方法成功:', fixedData);
        
        // 清理测试数据
        await supabase
          .from('profit_distribution')
          .delete()
          .eq('id', fixedData.id);
        
        console.log('✅ 测试数据已清理');
      }
    } catch (error) {
      console.log('❌ 修复方法异常:', error);
    }

    // 测试3：检查数据库表的约束
    console.log('\n🔍 测试3：检查数据库约束...');
    
    const { data: constraints, error: constraintError } = await supabase
      .from('profit_distribution')
      .select('*')
      .limit(1);
    
    if (constraintError) {
      console.log('❌ 查询约束失败:', constraintError);
    } else {
      console.log('✅ 可以正常查询表');
      
      if (constraints.length > 0) {
        console.log('📊 表字段示例:', Object.keys(constraints[0]));
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 执行测试
testRevenueAllocationFix()
  .then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });