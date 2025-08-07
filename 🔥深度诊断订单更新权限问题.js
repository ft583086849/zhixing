/**
 * 深度诊断订单更新权限问题
 * 在浏览器控制台运行此脚本
 */

console.log('='.repeat(50));
console.log('🔍 深度诊断订单更新权限问题');
console.log('='.repeat(50));

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 1. 获取一个测试订单
console.log('\n📋 步骤1：获取测试订单');
fetch(`${supabaseUrl}/rest/v1/orders?select=*&limit=1`, {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
  }
})
.then(r => r.json())
.then(async (orders) => {
  if (!orders || orders.length === 0) {
    console.log('❌ 没有找到订单');
    return;
  }
  
  const testOrder = orders[0];
  console.log('测试订单:', {
    id: testOrder.id,
    order_number: testOrder.order_number,
    status: testOrder.status,
    id类型: typeof testOrder.id
  });
  
  // 2. 尝试更新（使用PATCH方法）
  console.log('\n📋 步骤2：尝试PATCH更新');
  const patchResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${testOrder.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: 'test_status',
      updated_at: new Date().toISOString()
    })
  });
  
  console.log('PATCH响应状态:', patchResponse.status);
  const patchResult = await patchResponse.text();
  
  if (patchResponse.ok) {
    console.log('✅ PATCH更新成功');
    try {
      const data = JSON.parse(patchResult);
      console.log('更新后的数据:', data);
    } catch (e) {
      console.log('响应内容:', patchResult);
    }
  } else {
    console.error('❌ PATCH更新失败:', patchResult);
    
    // 分析错误
    if (patchResult.includes('permission') || patchResult.includes('denied')) {
      console.log('\n🔴 诊断：权限被拒绝');
      console.log('需要在Supabase执行：');
      console.log('GRANT UPDATE ON orders TO anon;');
    }
    if (patchResult.includes('RLS') || patchResult.includes('row-level')) {
      console.log('\n🔴 诊断：RLS策略阻止更新');
      console.log('需要在Supabase执行：');
      console.log('ALTER TABLE orders DISABLE ROW LEVEL SECURITY;');
    }
  }
  
  // 3. 检查字段结构
  console.log('\n📋 步骤3：检查表结构');
  const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=*&limit=0`, {
    method: 'HEAD',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Prefer': 'count=exact'
    }
  });
  
  console.log('表结构响应headers:');
  for (let [key, value] of schemaResponse.headers.entries()) {
    if (key.includes('content') || key.includes('range')) {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  // 4. 测试通过window.adminAPI
  console.log('\n📋 步骤4：测试AdminAPI');
  if (window.adminAPI) {
    try {
      const result = await window.adminAPI.updateOrderStatus(testOrder.id, 'confirmed_payment');
      console.log('✅ AdminAPI更新成功:', result);
    } catch (error) {
      console.error('❌ AdminAPI更新失败:', error);
      console.log('错误详情:', {
        message: error.message,
        stack: error.stack
      });
    }
  } else {
    console.log('⚠️ window.adminAPI未定义');
  }
});

console.log('\n📝 解决方案：');
console.log('在Supabase SQL Editor执行以下命令：');
console.log(`
-- 1. 完全禁用RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 2. 授予UPDATE权限
GRANT UPDATE ON orders TO anon;
GRANT UPDATE ON orders TO authenticated;

-- 3. 如果还不行，授予所有权限
GRANT ALL PRIVILEGES ON orders TO anon;
GRANT ALL PRIVILEGES ON orders TO authenticated;

-- 4. 检查权限
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='orders';
`);
