-- ========================================
-- Duration字段自动规范化触发器
-- ========================================
-- 作用：自动将所有新插入或更新的duration值转换为中文格式
-- 这样即使前端传入英文值，数据库也会自动转换

-- 创建规范化函数
CREATE OR REPLACE FUNCTION normalize_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- 规范化duration字段为中文
  IF NEW.duration IS NOT NULL THEN
    CASE NEW.duration
      -- 7天相关
      WHEN '7days', '7 days', '7日', '七天', '7天免费' THEN
        NEW.duration := '7天';
      
      -- 1个月相关
      WHEN '1month', '1 month', '1月', '一个月', '30天', '30 days' THEN
        NEW.duration := '1个月';
      
      -- 3个月相关
      WHEN '3months', '3 months', '3月', '三个月', '90天', '90 days' THEN
        NEW.duration := '3个月';
      
      -- 6个月相关
      WHEN '6months', '6 months', '6月', '六个月', '180天', '180 days', '半年' THEN
        NEW.duration := '6个月';
      
      -- 1年相关
      WHEN '1year', '1 year', '一年', '12个月', '12 months', '365天', '365 days' THEN
        NEW.duration := '1年';
      
      ELSE
        -- 如果已经是标准中文格式，保持不变
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS normalize_duration_trigger ON orders_optimized;

-- 创建新触发器
CREATE TRIGGER normalize_duration_trigger
  BEFORE INSERT OR UPDATE OF duration
  ON orders_optimized
  FOR EACH ROW
  EXECUTE FUNCTION normalize_duration();

-- 测试触发器
-- INSERT INTO orders_optimized (duration, ...) VALUES ('7days', ...);
-- 结果：duration会自动变成'7天'

COMMENT ON TRIGGER normalize_duration_trigger ON orders_optimized IS 
'自动规范化duration字段，确保所有值都是中文格式：7天, 1个月, 3个月, 6个月, 1年';