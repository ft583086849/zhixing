#!/usr/bin/env node

/**
 * 🔍 查看一级销售表和二级销售表的微信号字段结构
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 查看销售表的微信号字段结构和实际数据...\n');

async function checkWeChatFields() {
  try {
    // 1. 查看一级销售表样例数据
    console.log('📊 一级销售表 (primary_sales) 数据样例:');
    console.log('='.repeat(60));
    
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('*')
      .limit(3);
    
    if (primaryError) {
      console.error('❌ 查询一级销售表失败:', primaryError);
    } else if (primarySales && primarySales.length > 0) {
      console.log(`\n找到 ${primarySales.length} 条一级销售记录:\n`);
      
      primarySales.forEach((sale, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log('  ID:', sale.id);
        console.log('  销售码 (sales_code):', sale.sales_code);
        console.log('  微信字段1 (name):', sale.name || '(空)');
        console.log('  微信字段2 (wechat_name):', sale.wechat_name || '(空)');
        console.log('  邀请码 (invite_code):', sale.invite_code || '(空)');
        console.log('  支付宝账号:', sale.alipay_account || '(空)');
        console.log('  支付宝姓名:', sale.alipay_name || '(空)');
        console.log('  创建时间:', sale.created_at);
        console.log('  所有字段:', Object.keys(sale).join(', '));
        console.log('-'.repeat(40));
      });
    } else {
      console.log('⚠️  一级销售表暂无数据');
    }

    // 2. 查看二级销售表样例数据
    console.log('\n\n📊 二级销售表 (secondary_sales) 数据样例:');
    console.log('='.repeat(60));
    
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*')
      .limit(3);
    
    if (secondaryError) {
      console.error('❌ 查询二级销售表失败:', secondaryError);
    } else if (secondarySales && secondarySales.length > 0) {
      console.log(`\n找到 ${secondarySales.length} 条二级销售记录:\n`);
      
      secondarySales.forEach((sale, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log('  ID:', sale.id);
        console.log('  销售码 (sales_code):', sale.sales_code);
        console.log('  微信字段1 (name):', sale.name || '(空)');
        console.log('  微信字段2 (wechat_name):', sale.wechat_name || '(空)');
        console.log('  所属一级销售 (primary_sales_code):', sale.primary_sales_code || '(空)');
        console.log('  支付宝账号:', sale.alipay_account || '(空)');
        console.log('  支付宝姓名:', sale.alipay_name || '(空)');
        console.log('  佣金比率:', sale.commission_rate || '(空)');
        console.log('  创建时间:', sale.created_at);
        console.log('  所有字段:', Object.keys(sale).join(', '));
        console.log('-'.repeat(40));
      });
    } else {
      console.log('⚠️  二级销售表暂无数据');
    }

    // 3. 统计微信号字段使用情况
    console.log('\n\n📈 微信号字段使用统计:');
    console.log('='.repeat(60));
    
    // 统计一级销售
    const { data: allPrimary } = await supabase
      .from('primary_sales')
      .select('name, wechat_name');
    
    if (allPrimary) {
      let nameCount = 0, wechatNameCount = 0, bothCount = 0;
      
      allPrimary.forEach(sale => {
        if (sale.name && sale.wechat_name) {
          bothCount++;
        } else if (sale.name) {
          nameCount++;
        } else if (sale.wechat_name) {
          wechatNameCount++;
        }
      });
      
      console.log('\n一级销售表统计:');
      console.log(`  总记录数: ${allPrimary.length}`);
      console.log(`  只有name字段有值: ${nameCount}`);
      console.log(`  只有wechat_name字段有值: ${wechatNameCount}`);
      console.log(`  两个字段都有值: ${bothCount}`);
      console.log(`  两个字段都为空: ${allPrimary.length - nameCount - wechatNameCount - bothCount}`);
    }
    
    // 统计二级销售
    const { data: allSecondary } = await supabase
      .from('secondary_sales')
      .select('name, wechat_name');
    
    if (allSecondary) {
      let nameCount = 0, wechatNameCount = 0, bothCount = 0;
      
      allSecondary.forEach(sale => {
        if (sale.name && sale.wechat_name) {
          bothCount++;
        } else if (sale.name) {
          nameCount++;
        } else if (sale.wechat_name) {
          wechatNameCount++;
        }
      });
      
      console.log('\n二级销售表统计:');
      console.log(`  总记录数: ${allSecondary.length}`);
      console.log(`  只有name字段有值: ${nameCount}`);
      console.log(`  只有wechat_name字段有值: ${wechatNameCount}`);
      console.log(`  两个字段都有值: ${bothCount}`);
      console.log(`  两个字段都为空: ${allSecondary.length - nameCount - wechatNameCount - bothCount}`);
    }

    // 4. 总结
    console.log('\n\n📝 总结:');
    console.log('='.repeat(60));
    console.log('销售表中有两个可能存储微信号的字段:');
    console.log('1. name字段 - 主要用于存储销售的微信号/名称');
    console.log('2. wechat_name字段 - 备用微信名称字段');
    console.log('\n根据之前的记录 [[memory:5327972]]，销售表的微信号主要存储在name字段中');
    console.log('\n查询建议:');
    console.log('- 优先查询name字段');
    console.log('- 如果name字段没有结果，再查询wechat_name字段');
    console.log('- 可以使用OR条件同时查询两个字段');

  } catch (error) {
    console.error('\n❌ 查询过程出错:', error);
  }
}

// 运行查询
checkWeChatFields().then(() => {
  console.log('\n✅ 查询完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 查询失败:', error);
  process.exit(1);
});
