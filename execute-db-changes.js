const SupabaseService = require('./client/src/services/supabase.js');
const fs = require('fs');

async function executeDatabaseChanges() {
  console.log('🚀 开始执行数据库更改...\n');
  console.log('⚠️  注意：所有更改仅在测试环境执行，不会推送到生产环境\n');
  
  const supabase = SupabaseService.supabase;
  
  // 读取生成的SQL
  const sqlContent = fs.readFileSync('database/add-fields-indexes-generated.sql', 'utf8');
  
  // 分割SQL语句
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('=='));
  
  console.log(`📊 准备执行 ${statements.length} 条SQL语句\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // 由于Supabase客户端API不支持DDL操作，我们需要使用其他方式
  // 这里我们先检查现有表结构
  console.log('📋 检查当前表结构...\n');
  
  // 检查orders表
  try {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (!error && ordersData) {
      console.log('✅ orders表存在');
      
      // 检查是否有新字段
      const sample = ordersData[0] || {};
      const newFields = ['user_id', 'customer_became_sales', 'sales_conversion_date', 
                        'link_type', 'parent_sales_type', 'commission_rate_snapshot',
                        'is_first_order', 'referral_source'];
      
      const missingFields = newFields.filter(f => !(f in sample));
      if (missingFields.length > 0) {
        console.log(`   ⚠️ 缺少字段: ${missingFields.join(', ')}`);
      } else {
        console.log('   ✅ 所有预留字段已存在');
      }
    }
  } catch (e) {
    console.log('❌ orders表检查失败:', e.message);
  }
  
  // 检查customers表
  try {
    const { data: customersData, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (!error && customersData) {
      console.log('✅ customers表存在');
      
      const sample = customersData[0] || {};
      const newFields = ['user_id', 'is_sales', 'sales_type', 'became_sales_at',
                        'sales_code', 'sales_link', 'parent_sales_id', 'parent_sales_type',
                        'commission_rate', 'payment_qr_code', 'payment_address', 'lifetime_value'];
      
      const missingFields = newFields.filter(f => !(f in sample));
      if (missingFields.length > 0) {
        console.log(`   ⚠️ 缺少字段: ${missingFields.join(', ')}`);
      } else {
        console.log('   ✅ 所有预留字段已存在');
      }
    }
  } catch (e) {
    console.log('❌ customers表检查失败:', e.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 SQL执行说明');
  console.log('='.repeat(60));
  console.log('由于Supabase客户端限制，无法直接执行DDL语句。');
  console.log('请按以下步骤操作：\n');
  console.log('1. 打开Supabase控制台 (https://app.supabase.com)');
  console.log('2. 选择你的项目');
  console.log('3. 进入 SQL Editor');
  console.log('4. 复制并执行 database/add-fields-indexes-generated.sql');
  console.log('\n或者使用Supabase CLI:');
  console.log('npx supabase db push --db-url "postgresql://..."');
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 生成的SQL已保存到:');
  console.log('='.repeat(60));
  console.log('✅ database/add-fields-indexes-generated.sql');
  
  // 同时生成一个可以通过psql执行的脚本
  const psqlScript = `#!/bin/bash
# 使用psql执行数据库更改
# 仅在测试环境执行

DATABASE_URL="${process.env.DATABASE_URL || process.env.REACT_APP_SUPABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ 未找到数据库连接信息"
    echo "请设置 DATABASE_URL 环境变量"
    exit 1
fi

echo "🚀 开始执行数据库更改..."
echo "⚠️  确认这是测试环境！"
read -p "输入 'yes' 继续: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 1
fi

psql "$DATABASE_URL" < database/add-fields-indexes-generated.sql

echo "✅ 数据库更改执行完成"
`;
  
  fs.writeFileSync('execute-db-changes.sh', psqlScript);
  fs.chmodSync('execute-db-changes.sh', '755');
  
  console.log('✅ execute-db-changes.sh (可通过psql执行)');
  
  console.log('\n⚠️  重要提醒:');
  console.log('   这些更改仅应在测试环境执行');
  console.log('   不要将这些更改推送到生产环境');
  console.log('   所有代码修改都保留在本地');
  
  process.exit(0);
}

executeDatabaseChanges();