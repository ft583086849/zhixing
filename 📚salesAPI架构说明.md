a# 📚 salesAPI 架构和逻辑说明

## 一、整体架构

```
前端页面
    ↓
salesAPI (client/src/services/api.js)
    ↓
SupabaseService (client/src/services/supabase.js)  
    ↓
Supabase Database
```

## 二、salesAPI 的核心功能模块

### 1. 销售注册模块
- **registerPrimary** - 注册一级销售
  - 生成唯一销售代码 (PRI前缀)
  - 生成二级销售注册码
  - 创建购买链接和二级注册链接
  
- **registerSecondary** - 注册二级销售
  - 验证注册码
  - 生成唯一销售代码 (SEC前缀)
  - 关联到一级销售

### 2. 销售查询模块
- **getSalesByCode** - 根据销售代码查询
  - 自动识别一级/二级销售
  - 返回销售类型和详细信息

- **getSalesByLink** - 根据链接代码查询（别名）

### 3. 结算查询模块（核心功能）
- **getPrimarySalesSettlement** - 一级销售结算
  - 查询一级销售信息
  - 获取所有关联的二级销售
  - 统计直接订单和二级销售订单
  - 计算总佣金

- **getSecondarySalesSettlement** - 二级销售结算（新增）
  - 查询二级销售信息
  - 获取该销售的所有订单
  - 计算佣金（基于佣金率）
  - 统计待催单

### 4. 管理功能模块
- **updateCommissionRate** - 更新佣金率
- **removeSecondarySales** - 移除二级销售
- **urgeOrder** - 催单功能

## 三、数据流程

### 销售注册流程
```
1. 一级销售注册
   ├── 生成 sales_code (如: PRI1734567890123)
   ├── 生成 secondary_registration_code
   └── 创建链接
       ├── 用户购买链接: /purchase?sales_code=xxx
       └── 二级注册链接: /secondary-sales?registration_code=xxx

2. 二级销售注册
   ├── 验证 registration_code
   ├── 获取对应的 primary_sales_id
   ├── 生成 sales_code (如: SEC1734567890456)
   └── 创建二级销售记录
```

### 结算查询流程
```
1. 一级销售查询
   ├── 输入: 微信号或销售代码
   ├── 查询 primary_sales 表
   ├── 获取关联的 secondary_sales
   ├── 汇总所有订单
   └── 计算总佣金

2. 二级销售查询（Zhixing的情况）
   ├── 输入: 微信号 "Zhixing"
   ├── 查询 secondary_sales 表
   ├── 获取该销售的订单
   ├── 计算佣金（订单金额 × 佣金率）
   └── 返回统计数据
```

## 四、数据结构

### salesAPI 导出对象
```javascript
export const salesAPI = {
  // 核心方法（来自 SalesAPI）
  ...SalesAPI,
  
  // 向后兼容的别名方法
  createPrimarySales: SalesAPI.registerPrimary,
  createSecondarySales: SalesAPI.registerSecondary,
  getPrimarySalesSettlement: SalesAPI.getPrimarySalesSettlement,
  getSecondarySalesSettlement: SalesAPI.getSecondarySalesSettlement, // 新增
  getPrimarySalesStats: SalesAPI.getPrimarySalesStats,
  getPrimarySalesOrders: SalesAPI.getPrimarySalesOrders,
  updateSecondarySalesCommission: SalesAPI.updateSecondarySalesCommission,
  removeSecondarySales: SalesAPI.removeSecondarySales,
  urgeOrder: SalesAPI.urgeOrder
};
```

### 返回数据格式
```javascript
// 二级销售结算查询返回格式
{
  success: true,
  data: {
    sales: {
      id: 1,
      wechat_name: "Zhixing",
      sales_code: "SEC_xxx",
      commission_rate: 0.1,
      total_orders: 1,
      total_amount: 1000,
      total_commission: 100
    },
    orders: [...],  // 订单列表
    reminderOrders: [...],  // 待催单列表
    stats: {
      totalOrders: 1,
      totalAmount: 1000,
      totalCommission: 100,
      pendingReminderCount: 0
    }
  },
  message: "获取二级销售结算数据成功"
}
```

## 五、权限逻辑

### 页面访问权限
- **/sales-reconciliation** - 销售对账页面
  - 一级销售：可查看自己和所有下级的数据
  - 二级销售：只能查看自己的数据
  - 通过输入微信号来识别身份

### 数据访问权限
- 无需登录验证（简化模式）
- 通过微信号或销售代码查询
- 数据隔离：只能看到自己相关的数据

## 六、问题诊断

### 当前 Zhixing 的问题
1. **数据层面**：✅ 正常
   - Zhixing 已注册为二级销售
   - 有1笔订单记录

2. **代码层面**：✅ 已修复
   - 添加了 getSecondarySalesSettlement 方法
   - 更新了 salesAPI 导出

3. **部署层面**：❌ 待处理
   - 代码还在本地，未部署到 Vercel
   - 线上环境还是旧版本代码

## 七、部署方案

### 方式1：Git 推送自动部署
```bash
git add .
git commit -m "feat: 添加二级销售结算查询功能"
git push origin main
# Vercel 会自动构建和部署
```

### 方式2：手动部署
```bash
npm run build  # 本地构建
vercel --prod  # 手动部署到生产环境
```

### 部署后验证
1. 访问 https://zhixing-seven.vercel.app/sales-reconciliation
2. 输入微信号 "Zhixing"
3. 点击查询，应该能看到结算数据

## 八、缓存管理

salesAPI 使用 CacheManager 进行缓存：
- 缓存时间：5分钟
- 清除策略：数据更新时自动清除
- 缓存键：基于查询参数生成

## 九、错误处理

统一的错误处理机制：
- JWT过期：自动退出登录
- 数据不存在：返回友好提示
- 网络错误：显示重试建议
- 权限错误：提示无权限访问

