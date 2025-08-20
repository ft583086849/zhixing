# MCP数据和逻辑记录
> 项目：知行财库 (W项目)
> 更新时间：2025-01-13
> 用途：供MCP工具理解项目数据结构和业务逻辑

## 核心数据结构

### 数据库表结构
```
orders (订单表)
├── id
├── order_number (订单号)
├── sales_code (销售代码)
├── tradingview_username (TV用户名)
├── customer_wechat (客户微信)
├── amount (订单金额)
├── actual_payment_amount (实际支付金额)
├── payment_method (支付方式: crypto)
├── duration (时长: 7days/1month/3months/6months/1year)
├── status (状态)
├── commission_rate (佣金率)
├── commission_amount (佣金金额)
├── config_confirmed (配置确认)
├── screenshot_data (截图 - 问题：全部NULL)
└── created_at/updated_at

secondary_sales (销售表 - 包含所有类型销售)
├── id
├── sales_code (销售代码)
├── wechat_name (微信名)
├── sales_type (类型: primary/secondary/independent)
├── commission_rate (佣金率: 0-1小数)
├── payment_method (收款方式)
├── payment_address (收款地址)
├── chain_name (链名: TRC20/ERC20/BSC)
├── primary_sales_id (上级销售ID)
└── created_at

⚠️ primary_sales表 - 不存在但代码大量引用
```

### 佣金计算规则
```javascript
// 一级销售
直销佣金 = 订单金额 * 40%
分销利润 = 订单金额 * (40% - 二级佣金率)

// 二级销售
佣金 = 订单金额 * commission_rate (0-25%)

// 独立销售
佣金 = 订单金额 * commission_rate (0-25%)
```

### 关键业务逻辑

#### 1. 订单流程
```
用户下单 → 上传截图 → 管理员确认支付 → 配置权限 → 订单完成
```

#### 2. 销售层级
```
一级销售(40%固定)
    ├── 二级销售A(0-25%可调)
    ├── 二级销售B(0-25%可调)
    └── 独立销售C(0-25%可调)
```

#### 3. 状态流转
```
pending_payment → confirmed_payment → pending_config → confirmed_config → active
```

## 当前系统问题

### 🔴 严重问题
1. **primary_sales表不存在**
   - 15处代码引用不存在的表
   - 导致一级销售功能失效

2. **截图数据丢失**
   - screenshot_data全部为NULL
   - 管理员无法查看付款凭证

3. **佣金计算不一致**
   - 不同页面计算逻辑不同
   - 导致显示金额不一致

### 🟡 中等问题
1. sales_id字段分裂(primary_sales_id/secondary_sales_id)
2. 缺少registration_code、link_code字段
3. 二级销售链接硬编码

### 🟢 低优先级
1. 统计字段需要实时计算，影响性能

## API关键信息

### Supabase配置
```javascript
URL: https://itvmeamoqthfqtkpubdv.supabase.co
生产环境: https://zhixing-seven.vercel.app
```

### 关键文件位置
- 数据库操作: client/src/services/supabase.js
- 业务逻辑: client/src/services/api.js
- 购买页面: client/src/pages/PurchasePage.js
- 销售管理: client/src/components/admin/AdminSales.js

## 修复历史
- v2.11.1 (2025-01-07): 回滚佣金计算逻辑
- v2.12.0: 佣金系统v2.0，区分直销和分销
- 销售管理按创建时间降序排序已实现
- 客户管理按最新订单时间排序已实现

## 注意事项
1. 修改前务必备份
2. 测试环境验证后再上线
3. 注意缓存清理(Vercel缓存问题)
4. 佣金计算优先使用数据库值，其次实时计算