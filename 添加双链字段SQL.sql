-- 在 Supabase SQL Editor 中运行此脚本
-- 为 payment_config 表添加第二个链的配置字段

-- 添加第二个链名字段
ALTER TABLE payment_config 
ADD COLUMN IF NOT EXISTS crypto2_chain_name TEXT DEFAULT 'BSC';

-- 添加第二个链地址字段
ALTER TABLE payment_config 
ADD COLUMN IF NOT EXISTS crypto2_address TEXT DEFAULT '0xAE25E29d3baCD91B0fFd0807859531419a85375a';

-- 添加第二个链二维码字段
ALTER TABLE payment_config 
ADD COLUMN IF NOT EXISTS crypto2_qr_code TEXT;

-- 更新现有记录，设置默认值
UPDATE payment_config 
SET 
    crypto2_chain_name = COALESCE(crypto2_chain_name, 'BSC'),
    crypto2_address = COALESCE(crypto2_address, '0xAE25E29d3baCD91B0fFd0807859531419a85375a')
WHERE is_active = true;

-- 查看结果
SELECT 
    id,
    crypto_chain_name,
    crypto_address,
    crypto2_chain_name,
    crypto2_address,
    crypto2_qr_code
FROM payment_config 
WHERE is_active = true;
