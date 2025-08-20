const SupabaseService = require('./client/src/services/supabase.js');

async function createTables() {
  console.log('🚀 开始创建数据库新表...\n');
  
  // Supabase不支持直接执行CREATE TABLE，需要通过SQL编辑器
  // 但我们可以验证连接并提供SQL
  
  try {
    // 测试连接
    const { data: testData, error: testError } = await SupabaseService.supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ 数据库连接失败:', testError.message);
      return;
    }
    
    console.log('✅ 数据库连接成功\n');
    
    // 检查是否已存在某些表
    const tablesToCheck = [
      'users',
      'user_sessions', 
      'overview_stats',
      'sales_statistics',
      'commission_records',
      'finance_daily_stats',
      'finance_monthly_stats',
      'user_conversion_stats',
      'trial_conversion_stats',
      'trial_conversion_details'
    ];
    
    console.log('📋 检查表是否存在...\n');
    
    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await SupabaseService.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ ${tableName} 表已存在`);
        } else if (error.code === '42P01') {
          console.log(`⚠️  ${tableName} 表不存在，需要创建`);
        } else {
          console.log(`❓ ${tableName} 检查失败:`, error.message);
        }
      } catch (e) {
        console.log(`⚠️  ${tableName} 表不存在，需要创建`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📝 创建表的方法：');
    console.log('='.repeat(50));
    console.log('1. 打开 Supabase 控制台');
    console.log('2. 进入 SQL Editor');
    console.log('3. 复制 database/需要创建的新表.sql 的内容');
    console.log('4. 执行SQL语句');
    console.log('='.repeat(50));
    
    // 尝试创建overview_stats表作为测试
    console.log('\n尝试通过API创建表（可能不支持）...');
    
    // Supabase通常不允许通过客户端API直接创建表
    // 需要使用管理员权限或在控制台执行
    
  } catch (error) {
    console.error('错误:', error);
  }
  
  process.exit(0);
}

createTables();