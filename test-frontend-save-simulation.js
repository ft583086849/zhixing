#!/usr/bin/env node
/**
 * 🧪 完整模拟前端收益分配保存流程
 * 包括 AdminAPI 和 SupabaseService 的完整调用链
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 完整模拟前端收益分配保存流程...\n');

// 模拟 SupabaseService.updateProfitDistribution
async function mockUpdateProfitDistribution(ratios) {
  try {
    console.log('SupabaseService: 更新收益分配配置', ratios);
    
    // 先将所有现有配置设为非激活
    const updateResult = await supabase
      .from('profit_distribution')
      .update({ is_active: false })
      .eq('is_active', true);
    
    if (updateResult.error) {
      console.error('❌ 更新现有配置失败:', updateResult.error);
      throw updateResult.error;
    }
    
    console.log('✅ 现有配置已设为非激活');
    
    // 创建新的激活配置
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
      console.error('❌ 插入新配置失败:', error);
      throw error;
    }
    
    console.log('✅ SupabaseService: 收益分配配置更新成功', data);
    return data;
  } catch (error) {
    console.error('❌ SupabaseService: 更新收益分配配置失败', error);
    throw error;
  }
}

// 模拟 AdminAPI.saveProfitDistribution
async function mockSaveProfitDistribution(ratios) {
  try {
    console.log('\n📊 AdminAPI: 开始保存收益分配配置...');
    
    const result = await mockUpdateProfitDistribution(ratios);
    console.log('✅ AdminAPI: 保存收益分配配置成功:', result);
    
    return {
      success: true,
      data: result,
      message: '收益分配配置已保存'
    };
  } catch (error) {
    console.error('❌ AdminAPI: 保存收益分配配置失败', error);
    return {
      success: false,
      error: error.message,
      message: '保存失败，请重试'
    };
  }
}

// 模拟前端保存流程
async function mockFrontendSaveFlow() {
  try {
    // 模拟前端的 profitRatios 状态
    const profitRatios = {
      public: 40,
      marketing: 10,
      dividend: 15,
      development: 15,
      zhixing: 35,
      zijun: 25
    };

    console.log('🎯 前端: 开始保存流程');
    console.log('📊 前端数据:', profitRatios);

    // 检查总和
    const total = profitRatios.public + profitRatios.zhixing + profitRatios.zijun;
    console.log(`📊 总占比: ${total}%`);

    if (total !== 100) {
      console.log(`⚠️ 总占比不是100%，但继续保存`);
    }

    // 调用 API
    const result = await mockSaveProfitDistribution(profitRatios);
    
    if (result.success) {
      console.log('✅ 前端: 保存成功!', result.message);
      return true;
    } else {
      console.log('❌ 前端: 保存失败!', result.message);
      console.log('❌ 错误详情:', result.error);
      return false;
    }

  } catch (error) {
    console.error('❌ 前端: 保存过程异常:', error);
    return false;
  }
}

async function testMultipleSaveAttempts() {
  console.log('\n🔄 测试多次保存...');
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- 第${i}次保存 ---`);
    
    const success = await mockFrontendSaveFlow();
    
    if (success) {
      console.log(`✅ 第${i}次保存成功`);
    } else {
      console.log(`❌ 第${i}次保存失败`);
    }
    
    // 延迟一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 测试并发保存（可能导致冲突）
async function testConcurrentSaves() {
  console.log('\n⚡ 测试并发保存（模拟用户快速点击）...');
  
  const promises = [];
  for (let i = 1; i <= 3; i++) {
    promises.push(mockFrontendSaveFlow());
  }
  
  const results = await Promise.all(promises);
  
  const successCount = results.filter(r => r).length;
  console.log(`📊 并发保存结果: ${successCount}/3 成功`);
  
  if (successCount < 3) {
    console.log('💡 并发保存可能导致竞态条件');
  }
}

// 执行测试
async function runTests() {
  try {
    // 测试1：正常保存
    console.log('=== 测试1: 正常保存流程 ===');
    await mockFrontendSaveFlow();
    
    // 测试2：多次保存
    console.log('\n=== 测试2: 多次保存 ===');
    await testMultipleSaveAttempts();
    
    // 测试3：并发保存
    console.log('\n=== 测试3: 并发保存 ===');
    await testConcurrentSaves();
    
  } catch (error) {
    console.error('❌ 测试异常:', error);
  }
}

runTests()
  .then(() => {
    console.log('\n✅ 所有测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });