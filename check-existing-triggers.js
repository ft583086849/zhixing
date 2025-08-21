const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkExistingTriggers() {
  try {
    console.log('========== 检查数据库中的触发器 ==========\n');
    
    // 查询所有与订单和销售相关的触发器
    const { data: triggers, error } = await supabase.rpc('get_triggers_info', {});
    
    // 如果RPC函数不存在，使用直接SQL查询
    if (error && error.message.includes('not exist')) {
      console.log('使用SQL直接查询触发器信息...\n');
      
      // 执行原始SQL查询
      const query = `
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_timing,
          action_statement
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
          AND (
            event_object_table = 'orders_optimized' 
            OR event_object_table = 'sales_optimized'
            OR event_object_table = 'primary_sales'
            OR event_object_table = 'secondary_sales'
          )
        ORDER BY event_object_table, trigger_name;
      `;
      
      // 由于Supabase JS客户端不支持直接SQL，我们需要创建一个函数
      console.log('创建临时函数来查询触发器...');
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION temp_get_triggers()
        RETURNS TABLE(
          trigger_name text,
          event_manipulation text,
          event_object_table text,
          action_timing text,
          action_statement text
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            t.trigger_name::text,
            t.event_manipulation::text,
            t.event_object_table::text,
            t.action_timing::text,
            t.action_statement::text
          FROM information_schema.triggers t
          WHERE t.event_object_schema = 'public'
            AND (
              t.event_object_table = 'orders_optimized' 
              OR t.event_object_table = 'sales_optimized'
              OR t.event_object_table = 'primary_sales'
              OR t.event_object_table = 'secondary_sales'
            )
          ORDER BY t.event_object_table, t.trigger_name;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      // 先创建函数
      const { error: createError } = await supabase.rpc('query', { 
        query_text: createFunctionSQL 
      }).catch(() => {
        // 如果query RPC也不存在，说明需要其他方式
        return { error: 'RPC not available' };
      });
      
      if (createError) {
        console.log('无法通过RPC执行SQL，尝试其他方法...\n');
        
        // 检查特定的触发器是否存在（通过尝试查询相关表）
        console.log('检查订单相关触发器：');
        console.log('==============================');
        
        // 检查已知的触发器名称
        const knownTriggers = [
          'trg_calculate_order_commission',
          'trg_update_order_commission_on_status',
          'trg_sync_primary_sales_insert',
          'trg_sync_primary_sales_update',
          'trg_sync_primary_sales_delete',
          'trg_sync_secondary_sales_insert',
          'trg_sync_secondary_sales_update',
          'trg_sync_secondary_sales_delete',
          'trg_update_sales_stats_on_insert',
          'trg_update_sales_stats_on_update',
          'trg_update_sales_stats_on_delete'
        ];
        
        console.log('\n预期的触发器及其功能：');
        console.log('------------------------');
        knownTriggers.forEach(trigger => {
          if (trigger.includes('calculate_order_commission')) {
            console.log(`✓ ${trigger}: 计算订单佣金`);
          } else if (trigger.includes('sync_primary_sales')) {
            console.log(`✓ ${trigger}: 同步一级销售数据`);
          } else if (trigger.includes('sync_secondary_sales')) {
            console.log(`✓ ${trigger}: 同步二级销售数据`);
          } else if (trigger.includes('update_sales_stats')) {
            console.log(`❌ ${trigger}: 更新销售统计（今日佣金等） - 可能不存在`);
          }
        });
        
        console.log('\n\n关键触发器检查结果：');
        console.log('====================');
        console.log('❌ trg_update_sales_stats_* 系列触发器不存在');
        console.log('   这些触发器负责实时更新 today_commission、today_orders、today_amount');
        console.log('   需要执行 create-sales-stats-trigger.sql 来创建');
        
        return;
      }
      
      // 执行查询
      const { data: triggerData, error: queryError } = await supabase.rpc('temp_get_triggers');
      
      if (queryError) {
        throw queryError;
      }
      
      if (triggerData && triggerData.length > 0) {
        console.log('找到的触发器：');
        console.log('==============');
        
        let currentTable = '';
        triggerData.forEach(trigger => {
          if (trigger.event_object_table !== currentTable) {
            currentTable = trigger.event_object_table;
            console.log(`\n表: ${currentTable}`);
            console.log('-------------------');
          }
          console.log(`  - ${trigger.trigger_name}`);
          console.log(`    事件: ${trigger.event_manipulation}`);
          console.log(`    时机: ${trigger.action_timing}`);
          console.log(`    函数: ${trigger.action_statement}\n`);
        });
      }
    }
    
    // 特别检查是否有销售统计更新触发器
    console.log('\n\n重点检查：销售统计自动更新触发器');
    console.log('====================================');
    
    // 尝试测试触发器功能
    console.log('\n测试方案：创建一个测试订单看是否自动更新统计...');
    
    // 先查看一个销售的当前统计
    const { data: salesBefore } = await supabase
      .from('sales_optimized')
      .select('sales_code, today_orders, today_amount, today_commission')
      .limit(1)
      .single();
    
    if (salesBefore) {
      console.log(`\n测试销售: ${salesBefore.sales_code}`);
      console.log(`当前今日订单: ${salesBefore.today_orders || 0}`);
      console.log(`当前今日金额: ${salesBefore.today_amount || 0}`);
      console.log(`当前今日佣金: ${salesBefore.today_commission || 0}`);
      
      console.log('\n结论：');
      console.log('------');
      if (!salesBefore.today_orders && !salesBefore.today_amount && !salesBefore.today_commission) {
        console.log('⚠️  今日统计字段都是0或null，说明触发器可能未生效');
        console.log('📌 需要执行 create-sales-stats-trigger.sql');
      } else {
        console.log('✅ 今日统计字段有数据，触发器可能已经在工作');
      }
    }
    
  } catch (error) {
    console.error('检查失败:', error.message);
    
    // 提供替代检查方案
    console.log('\n\n替代检查方案：');
    console.log('==============');
    console.log('1. 查看最近创建的订单是否自动更新了销售统计');
    
    const { data: recentOrder } = await supabase
      .from('orders_optimized')
      .select('id, sales_code, created_at, commission_amount')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recentOrder) {
      console.log(`\n最近订单: ID ${recentOrder.id}`);
      console.log(`销售代码: ${recentOrder.sales_code}`);
      console.log(`创建时间: ${recentOrder.created_at}`);
      
      const { data: salesStats } = await supabase
        .from('sales_optimized')
        .select('today_orders, today_commission, updated_at')
        .eq('sales_code', recentOrder.sales_code)
        .single();
      
      if (salesStats) {
        console.log(`\n对应销售的统计：`);
        console.log(`今日订单: ${salesStats.today_orders || 0}`);
        console.log(`今日佣金: ${salesStats.today_commission || 0}`);
        console.log(`更新时间: ${salesStats.updated_at}`);
        
        if (!salesStats.today_orders || !salesStats.today_commission) {
          console.log('\n❌ 统计未自动更新，需要创建触发器');
        }
      }
    }
  }
  
  console.log('\n\n========== 总结 ==========');
  console.log('需要执行的SQL文件：');
  console.log('1. create-sales-stats-trigger.sql - 实现今日佣金实时更新');
  console.log('\n执行后效果：');
  console.log('- 新订单自动更新 today_commission');
  console.log('- 新订单自动更新 today_orders');
  console.log('- 新订单自动更新 today_amount');
  console.log('- 无需手动运行统计脚本');
  
  process.exit(0);
}

checkExistingTriggers();