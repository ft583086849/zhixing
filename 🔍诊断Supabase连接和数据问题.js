/**
 * 诊断Supabase连接和数据问题
 * 请在浏览器控制台运行此脚本
 */

async function diagnoseSupabaseIssue() {
  console.log('='.repeat(50));
  console.log('🔍 开始诊断Supabase数据问题');
  console.log('='.repeat(50));
  
  // 1. 检查Supabase客户端是否存在
  console.log('\n📋 步骤1：检查Supabase客户端');
  const { createClient } = await import('@supabase/supabase-js');
  
  // 使用您项目中的实际配置
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase客户端创建成功');
  
  // 2. 测试数据库连接
  console.log('\n📋 步骤2：测试数据库连接');
  try {
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ 连接失败:', testError);
      
      // 检查是否是RLS问题
      if (testError.message?.includes('row-level security') || 
          testError.message?.includes('RLS') ||
          testError.code === '42501') {
        console.log('⚠️ 问题诊断：RLS（行级安全）策略阻止了数据访问');
        console.log('解决方案：需要在Supabase控制台中配置RLS策略或临时禁用RLS');
      }
    } else {
      console.log('✅ 数据库连接成功');
    }
  } catch (e) {
    console.error('❌ 连接异常:', e);
  }
  
  // 3. 尝试查询各个表的数据
  console.log('\n📋 步骤3：检查各表数据');
  
  const tables = ['orders', 'primary_sales', 'secondary_sales', 'admins'];
  
  for (const table of tables) {
    console.log(`\n📊 查询 ${table} 表:`);
    
    try {
      // 先尝试获取记录数
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`❌ ${table}表查询失败:`, countError.message);
        continue;
      }
      
      console.log(`✅ ${table}表有 ${count || 0} 条记录`);
      
      // 如果有数据，获取前3条
      if (count > 0) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3);
        
        if (!error && data) {
          console.log(`📝 前${Math.min(3, data.length)}条数据:`, data);
        }
      }
    } catch (e) {
      console.error(`❌ ${table}表查询异常:`, e);
    }
  }
  
  // 4. 测试直接SQL查询（如果RLS是问题）
  console.log('\n📋 步骤4：测试RLS状态');
  try {
    // 尝试使用rpc调用（如果有定义的话）
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('check_rls_status');
    
    if (rlsError) {
      console.log('⚠️ 无法直接检查RLS状态（需要在Supabase控制台查看）');
    } else {
      console.log('RLS状态:', rlsCheck);
    }
  } catch (e) {
    console.log('⚠️ RLS状态检查不可用');
  }
  
  // 5. 提供解决方案
  console.log('\n' + '='.repeat(50));
  console.log('📝 诊断总结和解决方案：');
  console.log('='.repeat(50));
  
  console.log(`
🔧 如果是RLS问题，请按以下步骤操作：

1. 登录Supabase控制台: https://app.supabase.com
2. 选择您的项目
3. 进入 Authentication → Policies
4. 检查各表的RLS策略

临时解决方案（仅用于测试）：
- 在Supabase控制台SQL编辑器中执行：
  ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE primary_sales DISABLE ROW LEVEL SECURITY;
  ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;
  
永久解决方案：
- 创建合适的RLS策略允许匿名用户读取数据
- 或使用service_role密钥（仅在服务器端）

🔧 如果是数据问题：
- 确认数据是否已经插入到Supabase数据库
- 在Supabase控制台的Table Editor中查看数据
  `);
  
  // 6. 测试AdminAPI.getStats()
  console.log('\n📋 步骤5：测试AdminAPI.getStats()');
  if (window.adminAPI) {
    try {
      const stats = await window.adminAPI.getStats();
      console.log('📊 AdminAPI.getStats()返回:', stats);
    } catch (e) {
      console.error('❌ AdminAPI.getStats()失败:', e);
    }
  } else {
    console.log('⚠️ window.adminAPI未定义');
  }
  
  console.log('\n✅ 诊断完成！');
}

// 执行诊断
diagnoseSupabaseIssue();
