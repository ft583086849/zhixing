#!/usr/bin/env node

/**
 * 修复一级销售对账页面API 403错误的脚本
 * 
 * 问题分析：
 * 1. 页面调用了不存在的后端API路由 /api/admin/primary-sales-settlement
 * 2. 项目实际使用Supabase直接连接，不需要后端API服务器
 * 3. Redux中的API调用逻辑正确，但可能被错误地发送到了localhost:3001
 * 
 * 解决方案：
 * 1. 检查Supabase连接配置
 * 2. 确认API调用逻辑正确指向Supabase
 * 3. 验证销售代码PRI17547241780648255的数据
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, 'client/.env') });
require('dotenv').config({ path: path.join(__dirname, 'client/.env.local') });

console.log('🔍 开始诊断API 403错误问题...\n');

// 1. 检查环境变量配置
console.log('1. 检查环境变量配置:');
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ 已配置' : '❌ 未配置'}`);
console.log(`   SUPABASE_KEY: ${supabaseKey ? '✅ 已配置' : '❌ 未配置'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 环境变量未正确配置，请检查client/.env文件');
  process.exit(1);
}

// 2. 测试Supabase连接
console.log('2. 测试Supabase数据库连接:');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    // 测试连接
    const { data, error } = await supabase.from('sales_optimized').select('count').limit(1);
    
    if (error) {
      console.error('   ❌ Supabase连接失败:', error.message);
      return false;
    }
    
    console.log('   ✅ Supabase连接正常\n');
    return true;
  } catch (error) {
    console.error('   ❌ Supabase连接异常:', error.message);
    return false;
  }
}

// 3. 查询测试销售代码的数据
async function testSalesCodeQuery() {
  console.log('3. 测试销售代码PRI17547241780648255的数据查询:');
  
  try {
    // 查询一级销售
    const { data: primarySale, error: primaryError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', 'PRI17547241780648255')
      .eq('sales_type', 'primary')
      .single();
    
    if (primaryError) {
      console.error('   ❌ 查询一级销售失败:', primaryError.message);
      return false;
    }
    
    if (!primarySale) {
      console.log('   ❌ 未找到销售代码PRI17547241780648255的数据');
      return false;
    }
    
    console.log('   ✅ 找到一级销售数据:');
    console.log(`      微信号: ${primarySale.wechat_name || '未设置'}`);
    console.log(`      总订单数: ${primarySale.total_orders || 0}`);
    console.log(`      总佣金: ${primarySale.total_commission || 0}`);
    console.log(`      本月订单数: ${primarySale.month_orders || 0}`);
    console.log(`      本月佣金: ${primarySale.month_commission || 0}\n`);
    
    return true;
  } catch (error) {
    console.error('   ❌ 查询异常:', error.message);
    return false;
  }
}

// 4. 检查API服务配置
async function checkAPIConfiguration() {
  console.log('4. 检查前端API配置:');
  
  try {
    const fs = require('fs');
    const apiPath = path.join(__dirname, 'client/src/services/api.js');
    
    if (!fs.existsSync(apiPath)) {
      console.log('   ❌ API配置文件不存在');
      return false;
    }
    
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    // 检查是否有错误的API调用
    if (apiContent.includes('localhost:3001/api/')) {
      console.log('   ⚠️  发现可能的问题：API配置中包含localhost:3001/api/调用');
      console.log('   📋 建议：检查API配置，确保使用Supabase直接连接而非本地API服务器\n');
      return false;
    }
    
    if (apiContent.includes('SupabaseService.getPrimarySalesSettlement')) {
      console.log('   ✅ API配置正确：使用Supabase直接连接\n');
      return true;
    }
    
    console.log('   ⚠️  API配置可能有问题，请手动检查\n');
    return false;
  } catch (error) {
    console.error('   ❌ 检查API配置失败:', error.message);
    return false;
  }
}

// 5. 生成修复建议
function generateFixSuggestions() {
  console.log('5. 修复建议:');
  console.log('   📋 根据分析，403错误的可能原因和解决方案：\n');
  
  console.log('   原因分析：');
  console.log('   • 页面尝试调用不存在的后端API路由');
  console.log('   • 项目应该直接使用Supabase，不需要中间API层');
  console.log('   • 可能是开发环境配置问题\n');
  
  console.log('   解决方案：');
  console.log('   1. 确认前端直接调用Supabase服务');
  console.log('   2. 检查Redux store中的API调用逻辑');
  console.log('   3. 确保没有多余的API服务器在3001端口运行');
  console.log('   4. 验证环境变量正确加载');
  console.log('   5. 清除浏览器缓存重新测试\n');
}

// 主执行函数
async function main() {
  const connectionOK = await testSupabaseConnection();
  
  if (!connectionOK) {
    console.error('❌ Supabase连接失败，请检查环境变量配置');
    process.exit(1);
  }
  
  await testSalesCodeQuery();
  await checkAPIConfiguration();
  generateFixSuggestions();
  
  console.log('🎯 诊断完成！请根据上述建议修复问题。');
}

main().catch(console.error);