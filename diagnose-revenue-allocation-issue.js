#!/usr/bin/env node
/**
 * 🔍 诊断收益分配保存失败问题
 * 用户反馈：收益分配方案，点了保存分配方案，保存失败：保存失败，请重试
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 诊断收益分配保存失败问题...\n');

async function diagnoseRevenueAllocationIssue() {
  try {
    // 1. 检查 profit_distribution 表是否存在
    console.log('📊 1. 检查 profit_distribution 表...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profit_distribution');
    
    if (tablesError) {
      console.error('❌ 查询表信息失败:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ profit_distribution 表存在');
    } else {
      console.log('❌ profit_distribution 表不存在！');
    }

    // 2. 尝试查询 profit_distribution 表的结构
    console.log('\n📊 2. 检查 profit_distribution 表结构...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'profit_distribution')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ 查询列信息失败:', columnsError);
    } else if (columns && columns.length > 0) {
      console.log('✅ profit_distribution 表字段:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ 无法获取 profit_distribution 表字段');
    }

    // 3. 尝试查询现有数据
    console.log('\n📊 3. 检查现有收益分配配置...');
    
    const { data: existingData, error: queryError } = await supabase
      .from('profit_distribution')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (queryError) {
      console.error('❌ 查询现有配置失败:', queryError);
      console.log('💡 可能原因：');
      console.log('   1. profit_distribution 表不存在');
      console.log('   2. 缺少查询权限');
      console.log('   3. 表结构有问题');
    } else {
      console.log(`✅ 查询到 ${existingData.length} 个配置记录`);
      existingData.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, 是否激活: ${record.is_active}`);
        console.log(`      公户: ${record.public_ratio}%, 知行: ${record.zhixing_ratio}%, 子俊: ${record.zijun_ratio}%`);
        console.log(`      创建时间: ${record.created_at}`);
      });
    }

    // 4. 测试保存权限
    console.log('\n📊 4. 测试保存权限...');
    
    const testRatios = {
      public: 40,
      zhixing: 35,
      zijun: 25
    };
    
    // 先尝试将现有激活配置设为非激活
    const { error: updateError } = await supabase
      .from('profit_distribution')
      .update({ is_active: false })
      .eq('is_active', true);
    
    if (updateError) {
      console.error('❌ 更新现有配置失败:', updateError);
      console.log('💡 可能原因：');
      console.log('   1. 缺少 UPDATE 权限');
      console.log('   2. RLS 策略限制');
      console.log('   3. 字段约束问题');
      return;
    } else {
      console.log('✅ 更新现有配置权限正常');
    }
    
    // 尝试插入新配置
    const { data: insertData, error: insertError } = await supabase
      .from('profit_distribution')
      .insert({
        public_ratio: testRatios.public,
        zhixing_ratio: testRatios.zhixing,
        zijun_ratio: testRatios.zijun,
        marketing_ratio: 10,
        dividend_ratio: 15,
        development_ratio: 15,
        is_active: true,
        created_by: 'test-diagnosis'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 插入新配置失败:', insertError);
      console.log('💡 错误分析：');
      console.log(`   - 错误代码: ${insertError.code}`);
      console.log(`   - 错误消息: ${insertError.message}`);
      
      if (insertError.code === '23505') {
        console.log('   - 可能是唯一性约束冲突');
      } else if (insertError.code === '23502') {
        console.log('   - 可能是非空字段约束');
      } else if (insertError.code === '42501') {
        console.log('   - 可能是权限问题');
      }
    } else {
      console.log('✅ 插入新配置成功:', insertData);
      
      // 立即删除测试记录
      const { error: deleteError } = await supabase
        .from('profit_distribution')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.log('⚠️  删除测试记录失败，请手动删除:', deleteError);
      } else {
        console.log('✅ 测试记录已清理');
      }
    }

    // 5. 检查系统配置表作为替代
    console.log('\n📊 5. 检查系统配置表...');
    
    const { data: systemConfig, error: configError } = await supabase
      .from('system_config')
      .select('*')
      .like('config_key', '%profit%');
    
    if (configError) {
      console.log('❌ 查询系统配置失败:', configError);
    } else {
      console.log(`✅ 系统配置中相关记录: ${systemConfig.length} 个`);
      systemConfig.forEach(config => {
        console.log(`   - ${config.config_key}: ${config.config_value}`);
      });
    }

    // 6. 测试完整的保存流程模拟
    console.log('\n📊 6. 模拟前端保存流程...');
    
    try {
      // 模拟前端的完整流程
      const ratios = { public: 40, zhixing: 35, zijun: 25 };
      
      // 第一步：更新现有激活配置为非激活
      await supabase
        .from('profit_distribution')
        .update({ is_active: false })
        .eq('is_active', true);
      
      // 第二步：插入新配置
      const { data, error } = await supabase
        .from('profit_distribution')
        .insert({
          public_ratio: ratios.public || 40,
          zhixing_ratio: ratios.zhixing || 35, 
          zijun_ratio: ratios.zijun || 25,
          marketing_ratio: 10,
          dividend_ratio: 15,
          development_ratio: 15,
          is_active: true,
          created_by: 'admin'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ 完整保存流程测试成功');
      
      // 清理测试数据
      await supabase
        .from('profit_distribution')
        .delete()
        .eq('id', data.id);
      
    } catch (error) {
      console.error('❌ 完整保存流程失败:', error);
      console.log('💡 这就是用户遇到的问题！');
    }

  } catch (error) {
    console.error('❌ 诊断过程中出现错误:', error);
  }
}

// 执行诊断
diagnoseRevenueAllocationIssue()
  .then(() => {
    console.log('\n✅ 诊断完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 诊断失败:', error);
    process.exit(1);
  });