/**
 * 快速诊断数据问题 - 浏览器控制台版本
 * 直接复制粘贴到浏览器控制台运行
 */

console.log('='.repeat(50));
console.log('🔍 开始诊断数据问题');
console.log('='.repeat(50));

// 1. 检查window对象上的关键组件
console.log('\n📋 步骤1：检查关键组件');
console.log('window.store存在:', !!window.store);
console.log('window.adminAPI存在:', !!window.adminAPI);

// 2. 检查Redux Store状态
if (window.store) {
  const state = window.store.getState();
  console.log('\n📋 步骤2：Redux Store状态');
  console.log('Admin登录状态:', !!state.auth.admin);
  console.log('Admin数据:', state.auth.admin);
  console.log('Stats数据:', state.admin.stats);
  console.log('Loading状态:', state.admin.loading);
}

// 3. 直接使用fetch测试Supabase API
console.log('\n📋 步骤3：直接测试Supabase连接');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 测试orders表
fetch(`${supabaseUrl}/rest/v1/orders?select=*&limit=1`, {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
  }
})
.then(response => {
  console.log('\n📊 Orders表查询响应:');
  console.log('状态码:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  if (response.status === 200) {
    const count = response.headers.get('content-range');
    console.log('记录数信息:', count);
  }
  
  return response.json();
})
.then(data => {
  if (Array.isArray(data)) {
    console.log('✅ Orders表查询成功，返回', data.length, '条数据');
    if (data.length > 0) {
      console.log('第一条数据:', data[0]);
    } else {
      console.log('⚠️ Orders表存在但没有数据');
    }
  } else if (data.message) {
    console.error('❌ 查询失败:', data.message);
    
    // 分析错误类型
    if (data.message.includes('row-level security') || 
        data.message.includes('RLS') ||
        data.message.includes('permission denied')) {
      console.log('\n🔴 诊断结果：RLS（行级安全）策略阻止了数据访问！');
      console.log('这是最常见的问题，需要在Supabase控制台修复');
    }
  }
})
.catch(error => {
  console.error('❌ 请求失败:', error);
});

// 测试其他表
const tables = ['primary_sales', 'secondary_sales', 'admins'];

tables.forEach(table => {
  fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (Array.isArray(data)) {
      console.log(`✅ ${table}表: ${data.length > 0 ? '有数据' : '无数据'}`);
    } else {
      console.log(`❌ ${table}表: ${data.message || '查询失败'}`);
    }
  });
});

// 4. 测试AdminAPI
console.log('\n📋 步骤4：测试AdminAPI.getStats()');
if (window.adminAPI) {
  window.adminAPI.getStats()
    .then(stats => {
      console.log('✅ AdminAPI.getStats()成功:', stats);
    })
    .catch(error => {
      console.error('❌ AdminAPI.getStats()失败:', error);
    });
} else {
  console.log('❌ window.adminAPI未定义');
}

// 5. 提供解决方案
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📝 解决方案：');
  console.log('='.repeat(50));
  console.log(`
如果看到"row-level security"或权限错误：

1. 登录Supabase控制台：https://app.supabase.com
2. 选择您的项目
3. 进入SQL Editor
4. 执行以下SQL禁用RLS（临时解决）：

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE primary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

5. 执行后刷新页面查看效果
  `);
}, 3000);
