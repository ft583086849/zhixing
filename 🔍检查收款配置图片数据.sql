-- 检查收款配置图片数据
-- 诊断用户购买页面图片不显示问题

-- 1. 检查payment_config表结构和数据
SELECT 
    '=== 收款配置表数据 ===' as info,
    id,
    alipay_account,
    alipay_name,
    alipay_qr_code IS NOT NULL as has_alipay_qr,
    LENGTH(alipay_qr_code) as alipay_qr_length,
    crypto_chain_name,
    crypto_address,
    crypto_qr_code IS NOT NULL as has_crypto_qr,
    LENGTH(crypto_qr_code) as crypto_qr_length,
    is_active,
    created_at,
    updated_at
FROM payment_config 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;

-- 2. 检查图片数据的前100个字符（看格式）
SELECT 
    '=== 图片数据格式 ===' as info,
    LEFT(alipay_qr_code, 100) as alipay_qr_preview,
    LEFT(crypto_qr_code, 100) as crypto_qr_preview
FROM payment_config 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;
