# 🔧 正确解决线上地址码收款 name 字段问题

## 问题分析
- ❌ **错误方案**：在前端自动填充 name = wechat_name（会产生脏数据）
- ✅ **正确思路**：要么让用户填写，要么在数据库层面处理

## 解决方案选择

### 方案 A：为线上地址码也添加姓名输入框（推荐）
```javascript
// client/src/pages/SalesPage.js
// 在线上地址码部分也添加姓名输入

{/* 线上地址码收款信息 */}
{paymentMethod === 'crypto' && (
  <>
    <Form.Item
      name="payment_address"
      label="线上收款地址"
      rules={[{ required: true, message: '请输入线上收款地址' }]}
    >
      <Input 
        prefix={<WalletOutlined />} 
        placeholder="请输入线上收款地址"
        size="large"
      />
    </Form.Item>
    
    {/* 添加姓名输入框 */}
    <Form.Item
      name="name"
      label="姓名"
      rules={[{ required: true, message: '请输入姓名' }]}
    >
      <Input 
        placeholder="请输入您的姓名"
        size="large"
      />
    </Form.Item>
  </>
)}
```

### 方案 B：修改数据库，让 name 字段可为空
```sql
-- 在 Supabase SQL Editor 执行
ALTER TABLE primary_sales 
ALTER COLUMN name DROP NOT NULL;

-- 或者设置默认值
ALTER TABLE primary_sales 
ALTER COLUMN name SET DEFAULT '匿名用户';
```

### 方案 C：在数据库添加触发器（自动处理）
```sql
-- 创建触发器，只在 name 为 NULL 时设置默认值
CREATE OR REPLACE FUNCTION handle_primary_sales_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在 name 为 NULL 时设置默认值
  IF NEW.name IS NULL THEN
    NEW.name = '线上用户';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
DROP TRIGGER IF EXISTS handle_primary_sales_name_trigger ON primary_sales;
CREATE TRIGGER handle_primary_sales_name_trigger
BEFORE INSERT ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION handle_primary_sales_name();
```

## 推荐方案

**推荐方案 A + 方案 C 的组合**：
1. 前端添加姓名输入框，让用户自己填写真实信息
2. 数据库添加触发器作为保护，防止意外情况

## 为什么不应该自动填充？

1. **数据准确性**：wechat_name 是微信号，name 是真实姓名，两者含义不同
2. **业务逻辑**：可能需要真实姓名用于财务对账或其他用途
3. **数据质量**：自动填充会产生不准确的数据

## 立即可用的解决方案

如果需要紧急修复，可以先在数据库执行：

```sql
-- 临时解决方案：修改 name 字段允许为空
ALTER TABLE primary_sales 
ALTER COLUMN name DROP NOT NULL;

-- 更新现有的空值数据
UPDATE primary_sales 
SET name = '线上用户' 
WHERE name IS NULL OR name = '';
```

然后再逐步实施前端改进。
