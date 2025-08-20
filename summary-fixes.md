# 问题修复总结报告

## 已修复的问题

### 1. ✅ 订单金额搜索选项（已修复）
**问题描述**：订单金额搜索选项显示397和1997等不存在的金额
**修复位置**：
- `/client/src/components/admin/AdminOrders.js` - 行891-896
- `/client/src/pages/PrimarySalesSettlementPage.js` - 行999-1003, 1070-1074

**修复内容**：更新为实际存在的金额选项
```javascript
// 修改前
<Option value="397">三个月（$397）</Option>
<Option value="1997">一年（$1997）</Option>

// 修改后
<Option value="100">$100</Option>
<Option value="188">$188</Option>
<Option value="488">$488</Option>
<Option value="888">$888</Option>
<Option value="1588">$1588</Option>
```

### 2. ✅ 销售人员下拉框显示问题（已修复）
**问题描述**：下拉框显示销售代码而不是微信名
**修复位置**：`/client/src/pages/PrimarySalesSettlementPage.js` - 行1095-1097

**修复内容**：只显示wechat_name，去掉了fallback到sales_code
```javascript
// 修改前
{sales.wechat_name || sales.sales_code}

// 修改后
{sales.wechat_name}
```

### 3. ⚠️ 催单字段缺失（需手动添加）
**问题描述**：数据库缺少is_reminded和reminder_time字段
**解决方案**：需要在Supabase控制台执行以下SQL

```sql
-- 添加催单相关字段
ALTER TABLE orders_optimized 
ADD COLUMN is_reminded BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_time TIMESTAMP;

-- 添加索引以提高查询性能
CREATE INDEX idx_orders_reminder 
ON orders_optimized(is_reminded, status, expiry_time) 
WHERE status IN ('confirmed_config', 'active');
```

### 4. ✅ 标题文字问题（已正确）
**检查结果**：ReminderSection.js中的标题已经是"待催单客户管理"，没有"(超过24小时未处理)"文字

### 5. ℹ️ 客户微信显示"-"问题（数据问题）
**原因分析**：
- 代码逻辑正确：`{text || '-'}`
- 当sales_wechat_name字段为空时会显示"-"
- 这是数据完整性问题，不是代码问题

## 需要执行的操作

### 立即执行：
1. **在Supabase控制台添加催单字段**
   - 登录Supabase控制台
   - 进入SQL Editor
   - 执行上述ALTER TABLE语句

### 验证步骤：
1. 刷新浏览器清除缓存
2. 访问一级销售对账页面
3. 测试二级销售管理搜索功能
4. 验证催单功能是否正常

## 催单功能说明

### 工作流程：
1. 用户点击催单按钮
2. 调用`urgeOrder` API
3. 更新`is_reminded = true`和`reminder_time`
4. 刷新页面后该订单不再显示在催单列表

### 权限控制：
- **一级销售**：可以催单自己的直销订单
- **二级销售**：只能查看，不能催单（按钮禁用）

### 催单规则：
- **免费订单**：到期前3天开始催单
- **付费订单**：到期前7天开始催单
- **过期订单**：过期30天内仍可催单

## 状态检查命令

运行以下命令检查修复状态：
```bash
node execute-sql-fix.js
```

这会检查：
- 催单字段是否存在
- 销售人员数据是否正常
- 订单金额列表是否正确

## 注意事项

1. **催单状态显示"待配置"问题**：
   - 实际上是读取的订单真实状态
   - 如果显示"待配置"说明订单确实是pending_config状态
   - 这不是bug，是正确的业务逻辑

2. **客户微信显示问题**：
   - 需要确保订单数据中有customer_wechat或wechat_name字段
   - 这是数据录入时的问题，需要在创建订单时确保填写

3. **销售人员下拉框**：
   - 现在只显示有wechat_name的销售人员
   - 如果某个销售人员没有wechat_name，将不会出现在下拉框中