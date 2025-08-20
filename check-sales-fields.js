// 检查sales_optimized表的字段结构
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalesFields() {
  console.log('🔍 检查sales_optimized表的字段和数据...\n');
  
  // 获取前5条销售数据，按金额排序
  const { data: sales, error } = await supabase
    .from('sales_optimized')
    .select('*')
    .order('total_amount', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  if (!sales || sales.length === 0) {
    console.log('❌ 没有销售数据');
    return;
  }
  
  console.log(`✅ 找到 ${sales.length} 条销售数据\n`);
  
  // 分析第一条记录的所有字段
  const firstSale = sales[0];
  console.log('📋 第一条销售记录的所有字段:');
  console.log('─'.repeat(60));
  Object.keys(firstSale).forEach(key => {
    const value = firstSale[key];
    console.log(`${key}: ${value === null ? 'NULL' : value} (${typeof value})`);
  });
  
  console.log('\n📊 Top5销售数据分析:');
  console.log('─'.repeat(60));
  
  sales.forEach((sale, index) => {
    console.log(`\n${index + 1}. 销售ID: ${sale.id}`);
    console.log(`   总金额: $${sale.total_amount || 0}`);
    
    // 检查可能的名称字段
    const possibleNameFields = ['name', 'wechat_name', 'sales_name', 'username', 'nickname'];
    const nameField = possibleNameFields.find(field => sale[field]);
    console.log(`   名称字段检查:`);
    possibleNameFields.forEach(field => {
      console.log(`     ${field}: ${sale[field] || 'NULL'}`);
    });
    console.log(`   → 使用名称: ${nameField ? sale[nameField] : '无名称'}`);
    
    // 检查销售类型
    console.log(`   销售类型: ${sale.sales_type || 'NULL'}`);
    
    // 检查可能的上级销售字段
    const possibleParentFields = ['primary_sales_name', 'parent_sales_name', 'parent_id', 'primary_sales_id'];
    const parentField = possibleParentFields.find(field => sale[field]);
    console.log(`   上级销售字段检查:`);
    possibleParentFields.forEach(field => {
      console.log(`     ${field}: ${sale[field] || 'NULL'}`);
    });
    console.log(`   → 所属一级: ${parentField ? sale[parentField] : '无上级'}`);
  });
  
  console.log('\n🔧 问题诊断:');
  console.log('─'.repeat(60));
  
  // 检查名称字段问题
  const hasNames = sales.some(s => s.name || s.wechat_name || s.sales_name);
  if (!hasNames) {
    console.log('❌ 问题1: 所有销售记录都缺少名称字段');
    console.log('   建议: 检查数据库中的实际字段名，可能是其他字段名');
  } else {
    console.log('✅ 问题1: 名称字段存在');
  }
  
  // 检查上级销售字段问题
  const hasParents = sales.some(s => s.primary_sales_name || s.parent_sales_name);
  if (!hasParents) {
    console.log('❌ 问题2: 所有销售记录都缺少上级销售字段');
    console.log('   建议: 需要查询orders表关联获取上级销售信息');
  } else {
    console.log('✅ 问题2: 上级销售字段存在');
  }
}

checkSalesFields();