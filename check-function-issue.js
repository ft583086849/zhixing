const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkFunctionIssue() {
  console.log('========== 分析函数错误原因 ==========\n');
  
  console.log('错误信息：');
  console.log('function update_single_sales_stats(character varying, numeric, numeric, timestamp with time zone, character varying) does not exist\n');
  
  console.log('分析：');
  console.log('1. 函数调用的参数类型：');
  console.log('   - 参数1: character varying (sales_code)');
  console.log('   - 参数2: numeric (amount)');
  console.log('   - 参数3: numeric (commission)');
  console.log('   - 参数4: timestamp with time zone (order_time)');
  console.log('   - 参数5: character varying (operation)\n');
  
  console.log('2. SQL文件中定义的参数类型：');
  console.log('   - 参数1: VARCHAR(50)');
  console.log('   - 参数2: DECIMAL(10,2)');
  console.log('   - 参数3: DECIMAL(10,2)');
  console.log('   - 参数4: TIMESTAMP');
  console.log('   - 参数5: VARCHAR(10)\n');
  
  console.log('问题根源：');
  console.log('❌ 参数类型不匹配！');
  console.log('   - 调用时使用 timestamp with time zone');
  console.log('   - 定义时使用 TIMESTAMP (without time zone)\n');
  
  console.log('解决方案：');
  console.log('修改函数定义，将 TIMESTAMP 改为 TIMESTAMP WITH TIME ZONE\n');
  
  // 检查是否有相关函数存在
  try {
    const checkSQL = `
      SELECT 
        proname as function_name,
        pg_get_function_arguments(oid) as arguments
      FROM pg_proc
      WHERE proname LIKE '%update%sales%stats%'
        OR proname = 'update_single_sales_stats'
        OR proname = 'update_sales_statistics';
    `;
    
    // 尝试通过 Supabase 执行查询
    const { data, error } = await supabase.rpc('exec_sql', { sql: checkSQL }).catch(() => null);
    
    if (data) {
      console.log('数据库中相关函数：');
      console.log(data);
    }
  } catch (e) {
    console.log('无法直接查询函数信息');
  }
  
  console.log('\n========== 修复方案 ==========\n');
  console.log('需要创建修复后的函数定义：');
  console.log('将生成 fix-function-types.sql 文件...\n');
  
  // 生成修复的SQL
  const fixSQL = `-- =====================================================
-- 修复函数参数类型问题
-- 问题：timestamp with time zone 与 timestamp 类型不匹配
-- =====================================================

-- 1. 删除旧函数（如果存在）
DROP FUNCTION IF EXISTS update_single_sales_stats(VARCHAR(50), DECIMAL(10,2), DECIMAL(10,2), TIMESTAMP, VARCHAR(10));
DROP FUNCTION IF EXISTS update_single_sales_stats(character varying, numeric, numeric, timestamp without time zone, character varying);

-- 2. 创建新函数，使用正确的参数类型
CREATE OR REPLACE FUNCTION update_single_sales_stats(
    p_sales_code VARCHAR(50),
    p_amount NUMERIC,  -- 使用 NUMERIC 而不是 DECIMAL
    p_commission NUMERIC,  -- 使用 NUMERIC 而不是 DECIMAL
    p_order_time TIMESTAMP WITH TIME ZONE,  -- 明确指定 WITH TIME ZONE
    p_operation VARCHAR(10)
) RETURNS VOID AS $$
DECLARE
    v_china_today_start TIMESTAMP WITH TIME ZONE;
    v_china_today_end TIMESTAMP WITH TIME ZONE;
    v_is_today BOOLEAN;
    v_multiplier INTEGER;
BEGIN
    -- 设置乘数（ADD=1, SUBTRACT=-1）
    v_multiplier := CASE WHEN p_operation = 'SUBTRACT' THEN -1 ELSE 1 END;
    
    -- 计算中国时区的今日时间范围（UTC+8）
    v_china_today_start := date_trunc('day', NOW() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'UTC';
    v_china_today_end := v_china_today_start + INTERVAL '1 day';
    
    -- 判断订单是否是今日的
    v_is_today := p_order_time >= v_china_today_start AND p_order_time < v_china_today_end;
    
    -- 更新销售统计
    UPDATE sales_optimized
    SET 
        -- 总计统计
        total_orders = GREATEST(0, COALESCE(total_orders, 0) + v_multiplier),
        total_amount = GREATEST(0, COALESCE(total_amount, 0) + p_amount),
        total_direct_orders = GREATEST(0, COALESCE(total_direct_orders, 0) + v_multiplier),
        total_direct_amount = GREATEST(0, COALESCE(total_direct_amount, 0) + p_amount),
        direct_commission = GREATEST(0, COALESCE(direct_commission, 0) + p_commission),
        total_commission = GREATEST(0, COALESCE(total_commission, 0) + p_commission),
        
        -- 今日统计（仅当订单是今日的）
        today_orders = CASE 
            WHEN v_is_today THEN GREATEST(0, COALESCE(today_orders, 0) + v_multiplier)
            ELSE today_orders 
        END,
        today_amount = CASE 
            WHEN v_is_today THEN GREATEST(0, COALESCE(today_amount, 0) + p_amount)
            ELSE today_amount 
        END,
        today_commission = CASE 
            WHEN v_is_today THEN GREATEST(0, COALESCE(today_commission, 0) + p_commission)
            ELSE today_commission 
        END,
        
        updated_at = NOW()
    WHERE sales_code = p_sales_code;
END;
$$ LANGUAGE plpgsql;

-- 3. 验证函数创建成功
SELECT 
    '函数 update_single_sales_stats 已修复' as message,
    pg_get_function_arguments(oid) as "参数定义"
FROM pg_proc
WHERE proname = 'update_single_sales_stats'
LIMIT 1;`;

  require('fs').writeFileSync('fix-function-types.sql', fixSQL);
  console.log('✅ 已生成 fix-function-types.sql');
  console.log('请在 Supabase SQL Editor 中执行此文件修复问题');
  
  process.exit(0);
}

checkFunctionIssue();