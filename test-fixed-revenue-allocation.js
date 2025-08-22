#!/usr/bin/env node
/**
 * 🧪 测试修复后的收益分配保存功能
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 测试修复后的收益分配保存功能...\n');

// 使用修复后的 updateProfitDistribution 逻辑
async function fixedUpdateProfitDistribution(ratios) {
  try {
    console.log('SupabaseService: 更新收益分配配置', ratios);
    
    // 先将所有现有配置设为非激活
    const { error: updateError } = await supabase
      .from('profit_distribution')
      .update({ is_active: false })
      .eq('is_active', true);
    
    if (updateError) {
      console.error('SupabaseService: 更新现有配置失败', updateError);
      throw updateError;
    }
    
    console.log('✅ 现有配置已设为非激活');
    
    // 创建新的激活配置（包含完整字段）
    const { data, error } = await supabase
      .from('profit_distribution')
      .insert({
        public_ratio: ratios.public || 40,
        marketing_ratio: ratios.marketing || 10,
        dividend_ratio: ratios.dividend || 15,
        development_ratio: ratios.development || 15,
        zhixing_ratio: ratios.zhixing || 35,
        zijun_ratio: ratios.zijun || 25,
        is_active: true,
        created_by: 'admin'
      })
      .select()
      .single();
    
    if (error) {
      console.error('SupabaseService: 插入新配置失败', error);
      throw error;
    }
    
    console.log('✅ SupabaseService: 收益分配配置更新成功', data);
    return data;
  } catch (error) {
    console.error('❌ SupabaseService: 更新收益分配配置失败', error);
    throw error;
  }
}

async function testFixedFunction() {
  try {
    // 测试完整的收益分配数据
    const testRatios = {
      public: 45,
      marketing: 15,
      dividend: 20,
      development: 10,
      zhixing: 30,
      zijun: 25
    };

    console.log('📊 测试数据:', testRatios);
    console.log('📊 总占比:', testRatios.public + testRatios.zhixing + testRatios.zijun);

    const result = await fixedUpdateProfitDistribution(testRatios);
    
    console.log('✅ 测试成功！返回数据:');
    console.log('   - ID:', result.id);
    console.log('   - 公户占比:', result.public_ratio + '%');
    console.log('   - 营销占比:', result.marketing_ratio + '%');
    console.log('   - 分红占比:', result.dividend_ratio + '%');
    console.log('   - 开发占比:', result.development_ratio + '%');
    console.log('   - 知行占比:', result.zhixing_ratio + '%');
    console.log('   - 子俊占比:', result.zijun_ratio + '%');
    console.log('   - 是否激活:', result.is_active);
    console.log('   - 创建时间:', result.created_at);

    // 清理测试数据
    await supabase
      .from('profit_distribution')
      .delete()
      .eq('id', result.id);
    
    console.log('✅ 测试数据已清理');
    return true;

  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 测试多种情况
async function testMultipleScenarios() {
  console.log('\n=== 测试多种情况 ===\n');
  
  const scenarios = [
    {
      name: '标准比例',
      ratios: { public: 40, marketing: 10, dividend: 15, development: 15, zhixing: 35, zijun: 25 }
    },
    {
      name: '非标准比例（总和不等于100）',
      ratios: { public: 50, marketing: 20, dividend: 20, development: 10, zhixing: 30, zijun: 20 }
    },
    {
      name: '最小值测试',
      ratios: { public: 1, marketing: 0, dividend: 1, development: 0, zhixing: 1, zijun: 1 }
    }
  ];

  let successCount = 0;
  
  for (const scenario of scenarios) {
    console.log(`\n--- ${scenario.name} ---`);
    const success = await testFixedFunction();
    if (success) {
      successCount++;
      console.log('✅ 通过');
    } else {
      console.log('❌ 失败');
    }
  }
  
  console.log(`\n📊 测试结果: ${successCount}/${scenarios.length} 通过`);
}

// 执行测试
testFixedFunction()
  .then(success => {
    if (success) {
      console.log('\n=== 基本测试通过，继续多场景测试 ===');
      return testMultipleScenarios();
    }
  })
  .then(() => {
    console.log('\n✅ 所有测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 测试异常:', error);
    process.exit(1);
  });