/**
 * 诊断并修复客户管理数据问题
 * 在浏览器控制台运行此脚本
 */

// =======================
// 第一部分：快速诊断
// =======================
async function quickDiagnose() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 开始快速诊断客户管理数据问题');
  console.log('='.repeat(60));
  
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  // 检查各个表的 RLS 状态
  const tables = ['orders', 'primary_sales', 'secondary_sales', 'admins'];
  const results = {};
  
  for (const table of tables) {
    console.log(`\n📊 检查 ${table} 表...`);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });
      
      const data = await response.json();
      const contentRange = response.headers.get('content-range');
      
      if (response.status === 200) {
        const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        console.log(`✅ ${table} 表: 可访问，有 ${count} 条记录`);
        results[table] = { accessible: true, count, hasRLS: false };
      } else if (data.message?.includes('row-level security')) {
        console.log(`❌ ${table} 表: RLS 策略阻止访问`);
        results[table] = { accessible: false, hasRLS: true, error: data.message };
      } else {
        console.log(`⚠️ ${table} 表: 其他错误 - ${data.message}`);
        results[table] = { accessible: false, hasRLS: false, error: data.message };
      }
    } catch (error) {
      console.error(`❌ ${table} 表: 请求失败 - ${error.message}`);
      results[table] = { accessible: false, error: error.message };
    }
  }
  
  return results;
}

// =======================
// 第二部分：测试API层
// =======================
async function testAPILayer() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 测试API层功能');
  console.log('='.repeat(60));
  
  if (!window.adminAPI) {
    console.error('❌ window.adminAPI 不存在！');
    return;
  }
  
  // 测试 getCustomers
  console.log('\n📋 测试 adminAPI.getCustomers()...');
  try {
    const customers = await window.adminAPI.getCustomers();
    console.log('✅ getCustomers 成功，返回', customers?.length || 0, '个客户');
    if (customers?.length > 0) {
      console.log('示例客户:', customers[0]);
    }
  } catch (error) {
    console.error('❌ getCustomers 失败:', error);
  }
  
  // 测试 getSales
  console.log('\n📋 测试 adminAPI.getSales()...');
  try {
    const sales = await window.adminAPI.getSales();
    console.log('✅ getSales 成功，返回', sales?.length || 0, '个销售');
  } catch (error) {
    console.error('❌ getSales 失败:', error);
  }
  
  // 测试 getStats
  console.log('\n📋 测试 adminAPI.getStats()...');
  try {
    const stats = await window.adminAPI.getStats();
    console.log('✅ getStats 成功:', stats);
  } catch (error) {
    console.error('❌ getStats 失败:', error);
  }
}

// =======================
// 第三部分：检查Redux状态
// =======================
function checkReduxState() {
  console.log('\n' + '='.repeat(60));
  console.log('📦 检查Redux Store状态');
  console.log('='.repeat(60));
  
  if (!window.store) {
    console.error('❌ window.store 不存在！');
    return;
  }
  
  const state = window.store.getState();
  
  console.log('\n🔐 认证状态:');
  console.log('- 已登录:', !!state.auth.admin);
  console.log('- Admin信息:', state.auth.admin);
  
  console.log('\n📊 Admin数据状态:');
  console.log('- customers数量:', state.admin.customers?.length || 0);
  console.log('- sales数量:', state.admin.sales?.length || 0);
  console.log('- orders数量:', state.admin.orders?.length || 0);
  console.log('- loading状态:', state.admin.loading);
  console.log('- error信息:', state.admin.error);
  
  if (state.admin.customers?.length > 0) {
    console.log('- 第一个客户:', state.admin.customers[0]);
  }
}

// =======================
// 第四部分：生成修复方案
// =======================
function generateSolution(diagnosisResults) {
  console.log('\n' + '='.repeat(60));
  console.log('💡 解决方案');
  console.log('='.repeat(60));
  
  const hasRLSIssue = Object.values(diagnosisResults).some(r => r.hasRLS);
  
  if (hasRLSIssue) {
    console.log('\n🔴 检测到 RLS 权限问题！');
    console.log('\n请按以下步骤修复：');
    console.log('\n【方案一】临时禁用 RLS（快速解决）：');
    console.log('1. 登录 Supabase 控制台: https://app.supabase.com');
    console.log('2. 选择您的项目');
    console.log('3. 进入 SQL Editor');
    console.log('4. 执行以下 SQL：\n');
    
    const sqlCommands = [];
    for (const [table, result] of Object.entries(diagnosisResults)) {
      if (result.hasRLS) {
        sqlCommands.push(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
      }
    }
    
    console.log(sqlCommands.join('\n'));
    
    console.log('\n【方案二】配置正确的 RLS 策略（推荐）：');
    console.log('复制下面的 SQL 到 Supabase SQL Editor 执行：\n');
    
    const rlsPolicies = `
-- 为所有表创建读取策略（允许匿名用户读取）
CREATE POLICY "Allow anonymous read access" ON orders
FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access" ON primary_sales
FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access" ON secondary_sales
FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access" ON admins
FOR SELECT USING (true);`;
    
    console.log(rlsPolicies);
  } else {
    console.log('\n✅ 没有检测到 RLS 问题');
    console.log('可能的其他原因：');
    console.log('1. 数据库确实没有数据');
    console.log('2. API 调用链有问题');
    console.log('3. 网络连接问题');
  }
  
  console.log('\n📝 其他建议：');
  console.log('1. 清除浏览器缓存并刷新页面');
  console.log('2. 检查浏览器控制台的网络请求');
  console.log('3. 确认 Supabase 项目正常运行');
  console.log('4. 检查 API Key 是否正确');
}

// =======================
// 主执行函数
// =======================
async function diagnoseAndFix() {
  console.clear();
  console.log('🚀 开始诊断客户管理数据问题...\n');
  
  // 1. 快速诊断
  const diagnosisResults = await quickDiagnose();
  
  // 2. 测试API层
  await testAPILayer();
  
  // 3. 检查Redux状态
  checkReduxState();
  
  // 4. 生成解决方案
  generateSolution(diagnosisResults);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 诊断完成！');
  console.log('='.repeat(60));
  
  // 返回诊断结果供进一步分析
  return diagnosisResults;
}

// 自动执行诊断
diagnoseAndFix().then(results => {
  // 保存诊断结果到全局变量，方便后续查看
  window.diagnosisResults = results;
  console.log('\n💾 诊断结果已保存到 window.diagnosisResults');
});
