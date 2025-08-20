const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 注意：这里需要使用service_role key来执行DDL操作
// 但为了安全，我们生成SQL文件让用户在Supabase控制台执行
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function generateTriggerSQL() {
  console.log('🔧 生成数据库触发器更新SQL');
  console.log('============================\n');
  
  // 创建完整的SQL脚本
  const triggerSQL = `-- =====================================================
-- 修复触发器：确保佣金计算逻辑正确
-- 核心原则：只有 confirmed_config 状态的订单才有佣金
-- 执行时间：${new Date().toLocaleString('zh-CN')}
-- =====================================================

-- 1. 更新触发器函数
CREATE OR REPLACE FUNCTION update_order_commission_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL(5,4);
  v_sales_type VARCHAR(20);
  v_parent_sales_code VARCHAR(50);
  v_parent_rate DECIMAL(5,4);
  v_amount DECIMAL(10,2);
BEGIN
  -- 只在状态变化时处理
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- 计算使用的金额（优先使用实付金额）
    v_amount := COALESCE(NEW.actual_payment_amount, NEW.amount, 0);
    
    -- 状态不是 confirmed_config，所有佣金字段都清零
    IF NEW.status != 'confirmed_config' THEN
      NEW.commission_rate := 0;
      NEW.commission_amount := 0;
      NEW.primary_commission_amount := 0;
      NEW.secondary_commission_amount := 0;
      
    -- 状态变为 confirmed_config，计算佣金
    ELSIF NEW.status = 'confirmed_config' AND v_amount > 0 THEN
      -- 获取销售信息
      SELECT commission_rate, sales_type, parent_sales_code 
      INTO v_commission_rate, v_sales_type, v_parent_sales_code
      FROM sales_optimized
      WHERE sales_code = NEW.sales_code;
      
      -- 如果找到销售信息
      IF v_commission_rate IS NOT NULL THEN
        -- 设置佣金率
        NEW.commission_rate := v_commission_rate;
        
        -- 根据销售类型计算佣金
        IF v_sales_type = 'primary' THEN
          -- 一级销售：所有佣金归自己
          NEW.commission_amount := v_amount * v_commission_rate;
          NEW.primary_commission_amount := NEW.commission_amount;
          NEW.secondary_commission_amount := 0;
          
        ELSIF v_sales_type = 'secondary' AND v_parent_sales_code IS NOT NULL THEN
          -- 二级销售：需要给上级分成
          NEW.commission_amount := v_amount * v_commission_rate;
          
          -- 获取一级销售的佣金率
          SELECT commission_rate INTO v_parent_rate
          FROM sales_optimized
          WHERE sales_code = v_parent_sales_code;
          
          IF v_parent_rate IS NOT NULL AND v_parent_rate > v_commission_rate THEN
            -- 一级销售的分成 = 订单金额 * (一级佣金率 - 二级佣金率)
            NEW.primary_commission_amount := v_amount * (v_parent_rate - v_commission_rate);
            NEW.secondary_commission_amount := NEW.primary_commission_amount;
          ELSE
            NEW.primary_commission_amount := 0;
            NEW.secondary_commission_amount := 0;
          END IF;
          
        ELSE
          -- 独立销售：所有佣金归自己
          NEW.commission_amount := v_amount * v_commission_rate;
          NEW.primary_commission_amount := NEW.commission_amount;
          NEW.secondary_commission_amount := 0;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 重建触发器
DROP TRIGGER IF EXISTS trg_update_order_commission_on_status ON orders_optimized;
CREATE TRIGGER trg_update_order_commission_on_status
BEFORE UPDATE OF status ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_order_commission_on_status_change();

-- 3. 验证触发器创建成功
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders_optimized'
  AND trigger_name = 'trg_update_order_commission_on_status'
ORDER BY trigger_name;

-- 4. 测试说明
-- 执行完成后，可以测试：
-- UPDATE orders_optimized SET status = 'rejected' WHERE id = [某个测试订单ID];
-- 检查该订单的所有佣金字段是否都变为0`;
  
  // 保存SQL文件
  const fileName = '/Users/zzj/Documents/w/execute-trigger-update.sql';
  fs.writeFileSync(fileName, triggerSQL);
  
  console.log('✅ SQL脚本已生成：' + fileName);
  console.log('\n📋 执行步骤：');
  console.log('1. 登录 Supabase 控制台');
  console.log('2. 进入 SQL Editor');
  console.log('3. 复制并执行 execute-trigger-update.sql 中的内容');
  console.log('4. 确认执行成功');
  
  // 检查当前触发器状态
  console.log('\n📊 当前数据库状态检查：');
  
  // 检查是否有待修复的订单
  const { data: problemOrders } = await supabase
    .from('orders_optimized')
    .select('id, status')
    .neq('status', 'confirmed_config')
    .or('commission_rate.gt.0,commission_amount.gt.0,primary_commission_amount.gt.0,secondary_commission_amount.gt.0')
    .limit(1);
  
  if (problemOrders && problemOrders.length > 0) {
    console.log('⚠️ 仍有订单需要修复');
  } else {
    console.log('✅ 所有历史订单已修复完成');
  }
  
  console.log('\n💡 触发器更新后的效果：');
  console.log('- 订单状态变为 rejected/pending_payment/pending_config → 所有佣金清零');
  console.log('- 订单状态变为 confirmed_config → 自动计算正确的佣金');
  console.log('- 支持一级、二级、独立销售的不同佣金规则');
}

generateTriggerSQL();