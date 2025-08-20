// 执行客户管理优化相关的SQL脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ulhkstbblwbshzxmiwtf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsaGtzdGJibHdic2h6eG1pd3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjA5NTY2MywiZXhwIjoyMDQ3NjcxNjYzfQ.MxHY--qpW6AmaI5-6cLsh5lwvwHo3G0Tt2RJ4IjS5c4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeCustomersOptimization() {
  console.log('🚀 开始执行客户管理优化脚本...\n');
  
  try {
    // 步骤1: 检查表结构
    console.log('📋 步骤1: 检查现有表结构...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['customers', 'customers_optimized', 'orders_optimized']);
    
    if (tablesError) {
      console.error('❌ 查询表结构失败:', tablesError);
    } else {
      console.log('现有相关表:');
      tables.forEach(t => console.log(`  - ${t.table_name}`));
    }
    
    // 步骤2: 查看orders_optimized中的唯一客户数
    console.log('\n📊 步骤2: 分析orders_optimized表中的客户数据...');
    const { data: customerStats, error: statsError } = await supabase
      .rpc('get_customer_stats', {});
    
    if (statsError) {
      // 如果函数不存在，直接查询
      const { data: uniqueCustomers, error: uniqueError } = await supabase
        .from('orders_optimized')
        .select('customer_wechat')
        .not('customer_wechat', 'is', null)
        .neq('customer_wechat', '')
        .neq('customer_wechat', '1');
      
      if (!uniqueError && uniqueCustomers) {
        const uniqueWechats = [...new Set(uniqueCustomers.map(c => c.customer_wechat))];
        console.log(`  唯一客户数（按微信）: ${uniqueWechats.length}`);
      }
    } else if (customerStats) {
      console.log('  客户统计信息:', customerStats);
    }
    
    // 步骤3: 检查customers_optimized表是否已存在
    console.log('\n🔍 步骤3: 检查customers_optimized表是否存在...');
    const { data: existingTable, error: checkError } = await supabase
      .from('customers_optimized')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ customers_optimized表已存在');
      const { count, error: countError } = await supabase
        .from('customers_optimized')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`  当前记录数: ${count}`);
      }
      
      console.log('\n⚠️  表已存在，你可以：');
      console.log('  1. 在Supabase Dashboard中手动删除表后重新运行');
      console.log('  2. 直接在Supabase Dashboard中执行create-customers-from-orders.sql');
      console.log('  3. 继续使用现有表');
    } else {
      console.log('❌ customers_optimized表不存在，需要创建');
      console.log('\n📝 请在Supabase Dashboard中执行以下SQL文件：');
      console.log('  1. create-customers-from-orders.sql - 创建表并导入数据');
      console.log('  2. 可选：create-customers-sync-trigger.sql - 创建同步触发器');
    }
    
    // 步骤4: 测试优化后的查询性能
    if (!checkError) {
      console.log('\n⚡ 步骤4: 测试查询性能...');
      
      // 测试查询所有客户
      const startTime1 = Date.now();
      const { data: allCustomers, error: allError } = await supabase
        .from('customers_optimized')
        .select('*')
        .limit(100);
      const endTime1 = Date.now();
      
      if (!allError) {
        console.log(`  查询前100个客户: ${endTime1 - startTime1}ms`);
      }
      
      // 测试带筛选条件的查询
      const startTime2 = Date.now();
      const { data: filteredCustomers, error: filterError } = await supabase
        .from('customers_optimized')
        .select('*')
        .gte('total_amount', 1000)
        .order('total_amount', { ascending: false })
        .limit(10);
      const endTime2 = Date.now();
      
      if (!filterError) {
        console.log(`  查询高价值客户Top10: ${endTime2 - startTime2}ms`);
        if (filteredCustomers && filteredCustomers.length > 0) {
          console.log('\n  高价值客户示例:');
          filteredCustomers.slice(0, 3).forEach(c => {
            console.log(`    - ${c.customer_wechat}: $${c.total_amount} (${c.total_orders}单)`);
          });
        }
      }
    }
    
    console.log('\n✅ 客户管理优化检查完成！');
    console.log('\n📌 下一步操作：');
    console.log('1. 如果表未创建，请在Supabase Dashboard执行SQL脚本');
    console.log('2. 访问 http://localhost:3001/admin/customers-optimized 查看优化版页面');
    console.log('3. 对比原版和优化版的性能差异');
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

// 执行脚本
executeCustomersOptimization();