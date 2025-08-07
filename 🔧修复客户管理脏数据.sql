-- 🔧 修复客户管理页面脏数据问题
-- 在 Supabase SQL Editor 中执行

-- =====================================================
-- 步骤1: 备份数据（强烈建议先执行）
-- =====================================================

-- 创建订单表备份
CREATE TABLE IF NOT EXISTS orders_backup_20250118 AS 
SELECT * FROM orders;

-- 创建销售表备份
CREATE TABLE IF NOT EXISTS primary_sales_backup_20250118 AS 
SELECT * FROM primary_sales;

CREATE TABLE IF NOT EXISTS secondary_sales_backup_20250118 AS 
SELECT * FROM secondary_sales;

-- =====================================================
-- 步骤2: 检查数据问题
-- =====================================================

-- 2.1 查看缺少 sales_code 的订单数量
SELECT COUNT(*) as no_sales_code_count
FROM orders 
WHERE sales_code IS NULL OR sales_code = '';

-- 2.2 查看有 sales_code 但无法匹配销售的订单
SELECT DISTINCT o.sales_code, COUNT(*) as order_count
FROM orders o
WHERE o.sales_code IS NOT NULL 
  AND o.sales_code != ''
  AND NOT EXISTS (
    SELECT 1 FROM primary_sales ps WHERE ps.sales_code = o.sales_code
    UNION
    SELECT 1 FROM secondary_sales ss WHERE ss.sales_code = o.sales_code
  )
GROUP BY o.sales_code;

-- 2.3 查看销售表中缺少 wechat_name 的记录
SELECT 'primary_sales' as table_name, COUNT(*) as missing_wechat_count
FROM primary_sales 
WHERE wechat_name IS NULL OR wechat_name = ''
UNION
SELECT 'secondary_sales' as table_name, COUNT(*) as missing_wechat_count
FROM secondary_sales 
WHERE wechat_name IS NULL OR wechat_name = '';

-- =====================================================
-- 步骤3: 修复数据（根据实际情况选择执行）
-- =====================================================

-- 3.1 修复订单表的 sales_code（根据实际情况调整）
-- 示例：如果知道某个客户微信对应的销售代码
/*
UPDATE orders 
SET sales_code = 'PS_YOUR_SALES_CODE'
WHERE customer_wechat = 'YOUR_CUSTOMER_WECHAT'
  AND (sales_code IS NULL OR sales_code = '');
*/

-- 3.2 通过销售ID关联修复 sales_code
-- 如果订单有 primary_sales_id 但没有 sales_code
UPDATE orders o
SET sales_code = ps.sales_code
FROM primary_sales ps
WHERE o.primary_sales_id = ps.id
  AND (o.sales_code IS NULL OR o.sales_code = '')
  AND ps.sales_code IS NOT NULL;

-- 如果订单有 secondary_sales_id 但没有 sales_code
UPDATE orders o
SET sales_code = ss.sales_code
FROM secondary_sales ss
WHERE o.secondary_sales_id = ss.id
  AND (o.sales_code IS NULL OR o.sales_code = '')
  AND ss.sales_code IS NOT NULL;

-- 3.3 修复销售表的 wechat_name（根据实际情况调整）
-- 示例：更新特定销售的微信号
/*
UPDATE primary_sales 
SET wechat_name = '销售微信号'
WHERE sales_code = 'PS_YOUR_SALES_CODE'
  AND (wechat_name IS NULL OR wechat_name = '');
*/

-- =====================================================
-- 步骤4: 添加缺失的佣金计算字段（如果需要）
-- =====================================================

-- 4.1 为订单添加佣金金额字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'commission_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- 4.2 计算并更新佣金金额（基于销售的佣金率）
-- 注意：这需要先在销售表中设置正确的 commission_rate
UPDATE orders o
SET commission_amount = o.actual_payment_amount * (ps.commission_rate / 100)
FROM primary_sales ps
WHERE o.sales_code = ps.sales_code
  AND o.commission_amount = 0
  AND o.actual_payment_amount > 0
  AND ps.commission_rate > 0;

UPDATE orders o
SET commission_amount = o.actual_payment_amount * (ss.commission_rate / 100)
FROM secondary_sales ss
WHERE o.sales_code = ss.sales_code
  AND o.commission_amount = 0
  AND o.actual_payment_amount > 0
  AND ss.commission_rate > 0;

-- =====================================================
-- 步骤5: 验证修复结果
-- =====================================================

-- 5.1 查看修复后的统计
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN sales_code IS NOT NULL AND sales_code != '' THEN 1 END) as with_sales_code,
  COUNT(CASE WHEN sales_code IS NULL OR sales_code = '' THEN 1 END) as without_sales_code,
  COUNT(CASE WHEN commission_amount > 0 THEN 1 END) as with_commission
FROM orders;

-- 5.2 查看客户汇总数据
WITH customer_summary AS (
  SELECT 
    customer_wechat,
    tradingview_username,
    COUNT(*) as total_orders,
    SUM(amount) as total_amount,
    SUM(actual_payment_amount) as total_actual_payment,
    SUM(commission_amount) as total_commission,
    STRING_AGG(DISTINCT o.sales_code, ', ') as sales_codes
  FROM orders o
  WHERE customer_wechat IS NOT NULL OR tradingview_username IS NOT NULL
  GROUP BY customer_wechat, tradingview_username
)
SELECT 
  cs.*,
  COALESCE(ps.wechat_name, ss.wechat_name, '-') as sales_wechat_name
FROM customer_summary cs
LEFT JOIN primary_sales ps ON cs.sales_codes LIKE '%' || ps.sales_code || '%'
LEFT JOIN secondary_sales ss ON cs.sales_codes LIKE '%' || ss.sales_code || '%'
ORDER BY cs.total_amount DESC
LIMIT 10;

-- =====================================================
-- 步骤6: 创建数据完整性约束（可选）
-- =====================================================

-- 6.1 为未来的订单添加触发器，自动填充 sales_code
CREATE OR REPLACE FUNCTION auto_fill_sales_code()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果有 primary_sales_id 但没有 sales_code
  IF NEW.primary_sales_id IS NOT NULL AND (NEW.sales_code IS NULL OR NEW.sales_code = '') THEN
    SELECT sales_code INTO NEW.sales_code
    FROM primary_sales
    WHERE id = NEW.primary_sales_id;
  END IF;
  
  -- 如果有 secondary_sales_id 但没有 sales_code
  IF NEW.secondary_sales_id IS NOT NULL AND (NEW.sales_code IS NULL OR NEW.sales_code = '') THEN
    SELECT sales_code INTO NEW.sales_code
    FROM secondary_sales
    WHERE id = NEW.secondary_sales_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS auto_fill_sales_code_trigger ON orders;
CREATE TRIGGER auto_fill_sales_code_trigger
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_fill_sales_code();

-- =====================================================
-- 注意事项：
-- 1. 执行前请先备份数据
-- 2. 根据实际情况调整UPDATE语句中的条件
-- 3. 建议分步执行，每步执行后验证结果
-- 4. 如果数据量大，建议在低峰期执行
-- =====================================================
