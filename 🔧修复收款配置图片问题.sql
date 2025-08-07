-- 修复收款配置图片问题
-- 目前payment_config表中的图片字段为NULL，需要管理员重新上传

-- 1. 检查当前配置状态
SELECT 
    'Current config status' as info,
    alipay_account,
    alipay_name,
    alipay_qr_code IS NOT NULL as has_alipay_qr,
    crypto_chain_name,
    crypto_address,
    crypto_qr_code IS NOT NULL as has_crypto_qr,
    is_active
FROM payment_config 
WHERE is_active = true;

-- 提示：
-- 1. 管理员需要在收款配置页面重新上传支付宝收款码和加密货币收款码图片
-- 2. 图片上传后，用户购买页面就能正常显示收款二维码了
-- 3. 买家的付款截图功能已经实现，会保存到orders表的screenshot_data字段中
