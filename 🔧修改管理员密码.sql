-- 🔧 修改管理员密码
-- 更新管理员账户的用户名和密码

-- ============================================================================
-- 方案1：修改现有管理员账户
-- ============================================================================

-- 查看当前管理员账户
SELECT '=== 当前管理员账户 ===' as info;
SELECT id, username, role, created_at FROM admins;

-- 方案1a：保留现有ID，只修改用户名和密码
-- 注意：请你提供想要的用户名和密码，我来生成加密后的密码哈希

-- 临时示例（请替换为你想要的用户名和密码）
UPDATE admins 
SET 
    username = 'your_username',  -- 替换为你想要的用户名
    password_hash = '$2b$10$your_new_password_hash',  -- 需要生成密码哈希
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- ============================================================================
-- 方案2：删除现有管理员，创建新的
-- ============================================================================

-- 删除现有管理员账户
-- DELETE FROM admins WHERE username = 'admin';

-- 创建新的管理员账户
-- INSERT INTO admins (username, password_hash, role, created_at, updated_at) 
-- VALUES ('your_username', '$2b$10$your_new_password_hash', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- 验证结果
-- ============================================================================

-- 显示修改后的管理员账户
SELECT '=== 修改后的管理员账户 ===' as info;
SELECT id, username, role, created_at, updated_at FROM admins;

-- 完成通知
DO $$ 
BEGIN
    RAISE NOTICE '✅ 管理员账户密码修改完成！';
    RAISE NOTICE '🔑 请使用新的用户名和密码登录';
    RAISE NOTICE '⚠️  请确保密码哈希正确生成';
END $$;