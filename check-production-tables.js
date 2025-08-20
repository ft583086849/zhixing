/**
 * 检查生产环境数据库表的状态
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductionStatus() {
  console.log('🔍 检查生产环境数据库状态...\n');
  
  try {
    // 1. 检查orders表
    console.log('1️⃣ 检查orders表:');
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
      
    if (ordersError) {
      console.log('   ❌ orders表不存在或无法访问');
      console.log('   错误:', ordersError.message);
    } else {
      console.log('   ✅ orders表存在');
      console.log('   📊 记录数:', ordersCount);
    }
    
    // 2. 检查orders_optimized表
    console.log('\n2️⃣ 检查orders_optimized表:');
    const { count: optimizedCount, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true });
      
    if (optimizedError) {
      console.log('   ❌ orders_optimized表不存在');
      console.log('   错误:', optimizedError.message);
    } else {
      console.log('   ✅ orders_optimized表存在');
      console.log('   📊 记录数:', optimizedCount);
    }
    
    // 3. 检查字段是否存在
    if (!optimizedError) {
      console.log('\n3️⃣ 检查orders_optimized表的字段:');
      const { data: sampleData, error: fieldError } = await supabase
        .from('orders_optimized')
        .select('id, primary_commission_amount, secondary_commission_amount, duration_text')
        .limit(1);
        
      if (fieldError) {
        if (fieldError.message.includes('primary_commission_amount')) {
          console.log('   ❌ primary_commission_amount字段不存在');
        }
        if (fieldError.message.includes('secondary_commission_amount')) {
          console.log('   ❌ secondary_commission_amount字段不存在');
        }
        if (fieldError.message.includes('duration_text')) {
          console.log('   ❌ duration_text字段不存在');
        }
        console.log('   需要添加缺失的字段');
      } else {
        console.log('   ✅ 佣金拆分字段存在');
        if (sampleData && sampleData.length > 0) {
          console.log('   示例数据:', sampleData[0]);
        }
      }
    }
    
    // 4. 比较数据差异
    if (!ordersError && !optimizedError) {
      console.log('\n4️⃣ 数据同步状态:');
      const diff = ordersCount - optimizedCount;
      if (diff === 0) {
        console.log('   ✅ 两表记录数一致');
      } else if (diff > 0) {
        console.log(`   ⚠️  orders表比orders_optimized表多 ${diff} 条记录`);
        console.log('   需要同步数据');
      } else {
        console.log(`   ⚠️  orders_optimized表比orders表多 ${Math.abs(diff)} 条记录`);
        console.log('   可能有测试数据');
      }
    }
    
    // 5. 最终建议
    console.log('\n📋 总结:');
    if (!optimizedError) {
      console.log('✅ orders_optimized表已存在');
      if (ordersCount === optimizedCount) {
        console.log('✅ 数据已同步');
        console.log('\n可以直接切换前端代码使用orders_optimized表');
      } else {
        console.log('⚠️  需要先同步数据');
        console.log('执行: simple-switch-to-optimized.sql');
      }
    } else {
      console.log('❌ orders_optimized表不存在');
      console.log('需要先创建表:');
      console.log('1. 执行 create-orders-optimized-table.sql');
      console.log('2. 执行 sync-orders-to-optimized.sql');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 执行检查
checkProductionStatus();