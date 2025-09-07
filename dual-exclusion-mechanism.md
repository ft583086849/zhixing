# 双层排除机制实现方案

## 🎯 用户需求
- PRI17554350234757516 永远不参与统计
- 但其订单在管理后台的显示可通过"排除名单"控制

## 🔧 实现架构

### 1. 测试账号永久排除层
```javascript
// 配置文件或环境变量
const PERMANENT_EXCLUDED_SALES = [
  'PRI17554350234757516',  // 测试账号
  // 可添加其他永久排除账号
];

// 应用位置：所有统计API
- getStats() - 数据概览统计
- getSalesConversionStats() - 转化率统计  
- getPrimarySalesStats() - 销售排行
- 财务统计、佣金计算等
```

### 2. 显示控制排除层  
```javascript
// 使用现有 excluded_sales_config 表
// 只影响显示，不影响统计

// 应用位置：管理界面查询
- getOrders() - 订单管理显示
- getCustomers() - 客户管理显示
- (统计API不使用这个排除)
```

## 📊 具体修改方案

### Step 1: 创建永久排除配置
```sql
-- 方案A: 新建配置表
CREATE TABLE permanent_excluded_sales (
  id SERIAL PRIMARY KEY,
  sales_code VARCHAR(50) UNIQUE NOT NULL,
  reason VARCHAR(200) DEFAULT '测试账号',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 插入测试账号
INSERT INTO permanent_excluded_sales (sales_code, reason) 
VALUES ('PRI17554350234757516', '测试账号永久排除');
```

### Step 2: 修改统计API逻辑
```javascript
// 统计类API的排除逻辑
async function getStatsExcludedSales() {
  // 获取永久排除 + 统计排除
  const [permanentExcluded, statsExcluded] = await Promise.all([
    getPermanentExcludedSales(),  // 测试账号等
    getStatsExcludedSales()       // 统计排除名单
  ]);
  
  return [...permanentExcluded, ...statsExcluded];
}

// 应用到统计API
async getStats(params) {
  const excludedSales = await getStatsExcludedSales();
  // 查询时排除这些销售
}
```

### Step 3: 修改显示API逻辑  
```javascript
// 显示类API的排除逻辑（订单管理、客户管理）
async function getDisplayExcludedSales() {
  // 只获取显示排除，不获取永久排除
  return await getDisplayExcludedFromConfig();
}

// 应用到显示API
async getOrders(params) {
  const excludedSales = await getDisplayExcludedSales();
  // 查询时排除这些销售（测试账号可能显示也可能不显示）
}
```

## 🎮 控制效果

### 场景1：PRI17554350234757516 不在排除名单
- ✅ 订单管理：显示测试订单
- ✅ 客户管理：显示测试客户  
- ❌ 数据概览：不计入统计
- ❌ 转化率：不计入统计
- ❌ Top5排行：不出现

### 场景2：PRI17554350234757516 在排除名单  
- ❌ 订单管理：不显示测试订单
- ❌ 客户管理：不显示测试客户
- ❌ 数据概览：不计入统计（双重排除）
- ❌ 转化率：不计入统计（双重排除）  
- ❌ Top5排行：不出现（双重排除）

## 🔄 当前问题解决

**现状**：PRI17554350234757516 在 excluded_sales_config 表中
- 结果：订单不显示 + 不参与统计

**修复后**：
1. 从 excluded_sales_config 删除 PRI17554350234757516
2. 加入 permanent_excluded_sales 表  
3. 修改API逻辑区分两种排除

**最终效果**：
- ✅ 订单管理显示测试订单（可调试）
- ❌ 统计数据永不包含（保持纯净）

## 💡 实现优先级
1. **立即修复**：删除排除记录，恢复订单显示
2. **后续优化**：实现双层排除机制
3. **用户控制**：通过排除名单开关控制显示