-- 🛠️ 数据完整性修复 - 为现有记录填充必需的值
-- 解决 NOT NULL 约束错误

-- ============================================================================
-- 1. 修复 primary_sales 表的空值
-- ============================================================================

-- 为缺少 sales_code 的记录生成销售代码
UPDATE primary_sales 
SET 
    sales_code = 'PS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12)),
    secondary_registration_code = COALESCE(secondary_registration_code, 'SR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))),
    wechat_name = COALESCE(wechat_name, 'auto_generated_' || id),
    payment_method = COALESCE(payment_method, 'alipay'),
    payment_address = COALESCE(payment_address, 'default_address'),
    commission_rate = COALESCE(commission_rate, 40.00),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE sales_code IS NULL 
   OR secondary_registration_code IS NULL 
   OR wechat_name IS NULL 
   OR payment_method IS NULL 
   OR payment_address IS NULL;

-- ============================================================================
-- 2. 修复 secondary_sales 表的空值
-- ============================================================================

-- 为缺少 sales_code 的记录生成销售代码
UPDATE secondary_sales 
SET 
    sales_code = 'SS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12)),
    wechat_name = COALESCE(wechat_name, 'auto_generated_' || id),
    payment_method = COALESCE(payment_method, 'alipay'),
    payment_address = COALESCE(payment_address, 'default_address'),
    commission_rate = COALESCE(commission_rate, 30.00),
    status = COALESCE(status, 'active'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE sales_code IS NULL 
   OR wechat_name IS NULL 
   OR payment_method IS NULL 
   OR payment_address IS NULL;

-- ============================================================================
-- 3. 修复 orders 表的空值
-- ============================================================================

-- 为缺少必需字段的订单记录填充默认值
UPDATE orders 
SET 
    order_number = COALESCE(order_number, 'ORD_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))),
    sales_code = COALESCE(sales_code, 'UNKNOWN_' || id),
    sales_type = COALESCE(sales_type, 'unknown'),
    tradingview_username = COALESCE(tradingview_username, 'unknown_user_' || id),
    duration = COALESCE(duration, '1month'),
    amount = COALESCE(amount, 0.00),
    payment_method = COALESCE(payment_method, 'alipay'),
    payment_time = COALESCE(payment_time, CURRENT_TIMESTAMP),
    status = COALESCE(status, 'pending_payment'),
    commission_rate = COALESCE(commission_rate, 0.3000),
    commission_amount = COALESCE(commission_amount, 0.00),
    config_confirmed = COALESCE(config_confirmed, FALSE),
    purchase_type = COALESCE(purchase_type, 'immediate'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE order_number IS NULL 
   OR sales_code IS NULL 
   OR sales_type IS NULL 
   OR tradingview_username IS NULL 
   OR duration IS NULL 
   OR amount IS NULL 
   OR payment_method IS NULL 
   OR payment_time IS NULL;

-- ============================================================================
-- 4. 删除测试数据（清理无效记录）
-- ============================================================================

-- 删除可能的测试记录
DELETE FROM orders WHERE tradingview_username LIKE '%test_field_check%';
DELETE FROM primary_sales WHERE wechat_name LIKE '%test_field_check%';
DELETE FROM secondary_sales WHERE wechat_name LIKE '%test_field_check%';

-- ============================================================================
-- 5. 验证修复结果
-- ============================================================================

-- 检查是否还有空值
SELECT '=== PRIMARY_SALES 空值检查 ===' as info;
SELECT 
    COUNT(*) as total_records,
    COUNT(sales_code) as has_sales_code,
    COUNT(wechat_name) as has_wechat_name,
    COUNT(payment_method) as has_payment_method,
    COUNT(payment_address) as has_payment_address
FROM primary_sales;

SELECT '=== SECONDARY_SALES 空值检查 ===' as info;
SELECT 
    COUNT(*) as total_records,
    COUNT(sales_code) as has_sales_code,
    COUNT(wechat_name) as has_wechat_name,
    COUNT(payment_method) as has_payment_method,
    COUNT(payment_address) as has_payment_address
FROM secondary_sales;

SELECT '=== ORDERS 空值检查 ===' as info;
SELECT 
    COUNT(*) as total_records,
    COUNT(order_number) as has_order_number,
    COUNT(sales_code) as has_sales_code,
    COUNT(tradingview_username) as has_tradingview_username,
    COUNT(amount) as has_amount
FROM orders;

-- 显示更新后的数据样本
SELECT '=== PRIMARY_SALES 样本数据 ===' as info;
SELECT id, wechat_name, sales_code, secondary_registration_code, payment_method 
FROM primary_sales 
LIMIT 3;

SELECT '=== SECONDARY_SALES 样本数据 ===' as info;
SELECT id, wechat_name, sales_code, primary_sales_id, payment_method 
FROM secondary_sales 
LIMIT 3;

SELECT '=== ORDERS 样本数据 ===' as info;
SELECT id, order_number, sales_code, tradingview_username, amount, status 
FROM orders 
LIMIT 3;

-- 完成通知
DO $$ 
BEGIN
    RAISE NOTICE '✅ 数据完整性修复完成！';
    RAISE NOTICE '🔧 已为所有空值字段填充默认值';
    RAISE NOTICE '🧹 已清理测试数据';
    RAISE NOTICE '🧪 现在可以运行功能测试验证';
END $$;