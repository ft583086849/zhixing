-- 为orders表添加screenshot_data字段
-- 目标: 解决订单创建时的screenshot_data字段缺失问题

-- 1. 检查screenshot_data字段是否已存在
DO $$
BEGIN
    -- 检查字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
          AND column_name = 'screenshot_data'
          AND table_schema = 'public'
    ) THEN
        -- 添加screenshot_data字段 (存储base64图片数据)
        ALTER TABLE orders ADD COLUMN screenshot_data TEXT;
        RAISE NOTICE 'screenshot_data字段已添加到orders表';
    ELSE
        RAISE NOTICE 'screenshot_data字段已存在于orders表中';
    END IF;
END $$;

-- 2. 验证字段是否添加成功
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'screenshot_data'
  AND table_schema = 'public';
