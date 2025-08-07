#!/usr/bin/env node

/**
 * 🔍 查询一级销售表中微信名为87050101的销售记录
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 查询一级销售表中微信名为 87050101 的记录...\n');

async function querySales() {
  try {
    // 方法1: 在primary_sales表中查询name字段
    console.log('📊 方法1: 查询primary_sales表的name字段...');
    const { data: primaryByName, error: primaryNameError } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('name', '87050101');
    
    if (primaryNameError) {
      console.error('❌ 查询name字段失败:', primaryNameError);
    } else if (primaryByName && primaryByName.length > 0) {
      console.log('✅ 在name字段找到记录:');
      primaryByName.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log('  ID:', record.id);
        console.log('  销售码:', record.sales_code);
        console.log('  微信名(name):', record.name);
        console.log('  微信名(wechat_name):', record.wechat_name);
        console.log('  邀请码:', record.invite_code);
        console.log('  创建时间:', record.created_at);
        console.log('  完整记录:', JSON.stringify(record, null, 2));
      });
    } else {
      console.log('⚠️  在name字段未找到记录');
    }

    // 方法2: 在primary_sales表中查询wechat_name字段（备用）
    console.log('\n📊 方法2: 查询primary_sales表的wechat_name字段（备用）...');
    const { data: primaryByWechat, error: primaryWechatError } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', '87050101');
    
    if (primaryWechatError) {
      console.error('❌ 查询wechat_name字段失败:', primaryWechatError);
    } else if (primaryByWechat && primaryByWechat.length > 0) {
      console.log('✅ 在wechat_name字段找到记录:');
      primaryByWechat.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log('  ID:', record.id);
        console.log('  销售码:', record.sales_code);
        console.log('  微信名(name):', record.name);
        console.log('  微信名(wechat_name):', record.wechat_name);
        console.log('  邀请码:', record.invite_code);
        console.log('  创建时间:', record.created_at);
      });
    } else {
      console.log('⚠️  在wechat_name字段未找到记录');
    }

    // 方法3: 模糊查询（如果精确查询没有结果）
    console.log('\n📊 方法3: 模糊查询包含87050101的记录...');
    const { data: fuzzyResults, error: fuzzyError } = await supabase
      .from('primary_sales')
      .select('*')
      .or(`name.ilike.%87050101%,wechat_name.ilike.%87050101%`);
    
    if (fuzzyError) {
      console.error('❌ 模糊查询失败:', fuzzyError);
    } else if (fuzzyResults && fuzzyResults.length > 0) {
      console.log(`✅ 找到 ${fuzzyResults.length} 条包含87050101的记录:`);
      fuzzyResults.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log('  销售码:', record.sales_code);
        console.log('  微信名(name):', record.name);
        console.log('  微信名(wechat_name):', record.wechat_name);
      });
    } else {
      console.log('⚠️  模糊查询未找到记录');
    }

    // 方法4: 也查询二级销售表（完整性检查）
    console.log('\n📊 方法4: 同时查询secondary_sales表...');
    const { data: secondaryResults, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*')
      .or(`name.eq.87050101,wechat_name.eq.87050101`);
    
    if (secondaryError) {
      console.error('❌ 查询二级销售表失败:', secondaryError);
    } else if (secondaryResults && secondaryResults.length > 0) {
      console.log('✅ 在二级销售表找到记录:');
      secondaryResults.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log('  销售码:', record.sales_code);
        console.log('  微信名(name):', record.name);
        console.log('  微信名(wechat_name):', record.wechat_name);
        console.log('  所属一级销售:', record.primary_sales_code);
      });
    } else {
      console.log('⚠️  在二级销售表未找到记录');
    }

    // 总结
    console.log('\n' + '='.repeat(50));
    console.log('📝 查询总结:');
    console.log('1. SQL查询语句示例:');
    console.log('   SELECT * FROM primary_sales WHERE name = \'87050101\';');
    console.log('   SELECT * FROM primary_sales WHERE wechat_name = \'87050101\';');
    console.log('\n2. Supabase JS查询代码:');
    console.log('   const { data, error } = await supabase');
    console.log('     .from(\'primary_sales\')');
    console.log('     .select(\'*\')');
    console.log('     .eq(\'name\', \'87050101\');');
    console.log('\n3. 如果需要查询该销售的所有订单:');
    console.log('   先获取sales_code，然后查询orders表');

  } catch (error) {
    console.error('\n❌ 查询过程出错:', error);
  }
}

// 运行查询
querySales().then(() => {
  console.log('\n✅ 查询完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 查询失败:', error);
  process.exit(1);
});
