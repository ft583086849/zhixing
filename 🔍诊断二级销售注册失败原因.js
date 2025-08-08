/**
 * 🔍 诊断二级销售注册失败原因
 * 测试二级销售注册API并找出错误原因
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSecondaryRegistration() {
  console.log('🔍 开始诊断二级销售注册问题...\n');
  
  try {
    // 1. 测试基本的数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const { data: tables, error: tablesError } = await supabase
      .from('secondary_sales')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ 无法访问secondary_sales表:', tablesError);
      return;
    }
    console.log('✅ 数据库连接正常\n');
    
    // 2. 检查表的权限
    console.log('2️⃣ 检查表权限...');
    
    // 测试创建权限
    const testData = {
      wechat_name: `测试二级销售_${Date.now()}`,
      payment_method: 'crypto',
      chain_name: 'ETH',
      payment_address: '0x1234567890123456789012345678901234567890',
      sales_code: `TEST_SEC_${Date.now()}`,
      sales_type: 'secondary',
      created_at: new Date().toISOString()
    };
    
    console.log('尝试插入测试数据:', testData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('secondary_sales')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 插入失败:', insertError);
      console.log('\n可能的原因:');
      
      if (insertError.code === '42501') {
        console.log('- 权限不足：需要在Supabase中配置RLS策略');
      }
      if (insertError.code === '23505') {
        console.log('- 唯一性冲突：可能是wechat_name或sales_code重复');
      }
      if (insertError.code === '23502') {
        console.log('- 必填字段缺失');
      }
      if (insertError.message?.includes('violates check constraint')) {
        console.log('- 违反检查约束');
      }
      
      // 检查RLS策略
      console.log('\n3️⃣ 检查RLS策略...');
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies', { table_name: 'secondary_sales' })
        .catch(() => ({ data: null, error: 'RPC not available' }));
      
      if (policies) {
        console.log('当前RLS策略:', policies);
      } else {
        console.log('⚠️ 无法获取RLS策略信息，请在Supabase控制台检查');
      }
      
    } else {
      console.log('✅ 插入成功:', insertResult);
      
      // 清理测试数据
      const { error: deleteError } = await supabase
        .from('secondary_sales')
        .delete()
        .eq('id', insertResult.id);
      
      if (deleteError) {
        console.log('⚠️ 清理测试数据失败:', deleteError);
      } else {
        console.log('✅ 测试数据已清理');
      }
    }
    
    // 4. 检查必填字段
    console.log('\n4️⃣ 检查表结构...');
    
    // 尝试获取表的列信息（这个可能需要特殊权限）
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, data_type')
      .eq('table_name', 'secondary_sales')
      .catch(() => ({ data: null, error: 'No access to schema' }));
    
    if (columns) {
      console.log('表字段:', columns);
    } else {
      console.log('⚠️ 无法获取表结构信息，请在Supabase控制台检查');
    }
    
    // 5. 检查是否有触发器或约束
    console.log('\n5️⃣ 建议检查项:');
    console.log('- 在Supabase控制台检查secondary_sales表的RLS策略');
    console.log('- 确认是否启用了RLS（Row Level Security）');
    console.log('- 如果启用了RLS，需要添加INSERT策略允许匿名用户插入');
    console.log('- 检查是否有唯一性约束（wechat_name字段）');
    console.log('- 检查是否有触发器阻止插入');
    
    console.log('\n✅ 诊断完成！');
    
  } catch (error) {
    console.error('❌ 诊断过程出错:', error);
  }
}

// 运行诊断
testSecondaryRegistration();
