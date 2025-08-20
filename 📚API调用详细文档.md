# 📚 知行财库系统 - API调用详细文档

> 生成时间：2025-01-13
> API版本：v2.12.0
> 技术栈：Supabase + 自定义业务逻辑层

---

## 🏗️ API架构设计

### 三层架构模式

```
┌─────────────────────────────────────┐
│         前端组件 (React)             │
└──────────────┬──────────────────────┘
               ↓ 调用
┌─────────────────────────────────────┐
│      业务API层 (api.js)             │
│   - 业务逻辑封装                    │
│   - 缓存管理                        │
│   - 错误处理                        │
└──────────────┬──────────────────────┘
               ↓ 调用
┌─────────────────────────────────────┐
│   Supabase服务层 (supabase.js)      │
│   - 数据库操作                      │
│   - 实时订阅                        │
│   - 认证管理                        │
└──────────────┬──────────────────────┘
               ↓ 请求
┌─────────────────────────────────────┐
│     Supabase Cloud (PostgreSQL)     │
└─────────────────────────────────────┘
```

---

## 🔌 Supabase连接配置

```javascript
// 文件：client/src/services/supabase.js

import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // 自动刷新Token
    persistSession: true,       // 持久化会话
    detectSessionInUrl: false   // 不检测URL中的会话
  }
});
```

---

## 📊 Supabase数据库操作API

### 1. 基础CRUD操作模式

#### 查询数据（SELECT）
```javascript
// 单条查询
const { data, error } = await supabase
  .from('表名')
  .select('*')
  .eq('字段', '值')
  .single();

// 多条查询
const { data, error } = await supabase
  .from('表名')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

// 关联查询
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    sales:secondary_sales(*)
  `)
  .eq('status', 'active');
```

#### 插入数据（INSERT）
```javascript
const { data, error } = await supabase
  .from('表名')
  .insert([
    { 
      field1: 'value1',
      field2: 'value2'
    }
  ])
  .select()  // 返回插入的数据
  .single();
```

#### 更新数据（UPDATE）
```javascript
const { data, error } = await supabase
  .from('表名')
  .update({ 
    field1: 'new_value' 
  })
  .eq('id', id)
  .select()
  .single();
```

#### 删除数据（DELETE）
```javascript
const { error } = await supabase
  .from('表名')
  .delete()
  .eq('id', id);
```

### 2. 高级查询功能

#### 条件过滤
```javascript
// 多条件查询
let query = supabase
  .from('orders')
  .select('*');

// 状态过滤
if (status) {
  query = query.eq('status', status);
}

// 时间范围过滤
if (startDate && endDate) {
  query = query
    .gte('created_at', startDate)
    .lte('created_at', endDate);
}

// 模糊搜索
if (searchText) {
  query = query.or(`customer_wechat.ilike.%${searchText}%,tradingview_username.ilike.%${searchText}%`);
}

// 执行查询
const { data, error } = await query;
```

#### 聚合查询
```javascript
// 获取总数
const { count, error } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true });

// 分页查询
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .range((page - 1) * pageSize, page * pageSize - 1);
```

---

## 💼 业务API层实现

### 1. 缓存管理机制

```javascript
// 文件：client/src/services/api.js

class CacheManager {
  static cache = new Map();
  
  // 缓存策略配置
  static CACHE_TIMES = {
    stats: 0,                   // 统计数据：不缓存
    sales: 0,                   // 销售数据：不缓存
    orders: 0,                  // 订单数据：不缓存
    customers: 0,               // 客户数据：不缓存
    config: 5 * 60 * 1000       // 配置数据：5分钟
  };
  
  static get(key) {
    const cached = this.cache.get(key);
    const duration = this.getCacheDuration(key);
    
    if (duration === 0) return null;  // 不使用缓存
    
    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`📦 缓存命中: ${key}`);
      return cached.data;
    }
    return null;
  }
  
  static set(key, data) {
    const duration = this.getCacheDuration(key);
    if (duration === 0) return;  // 不缓存
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

### 2. 统一错误处理

```javascript
const handleError = (error, operation = 'API操作') => {
  console.error(`${operation}失败:`, error);
  
  // JWT过期处理
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
    message.error('登录已过期，请重新登录');
    AuthService.logout();
    return;
  }
  
  // 唯一性冲突
  if (error.code === '23505') {
    message.error('数据已存在，请检查输入');
    throw error;
  }
  
  // 外键约束
  if (error.code === '23503') {
    message.error('关联数据不存在，请检查输入');
    throw error;
  }
  
  const errorMessage = error.message || `${operation}失败，请重试`;
  message.error(errorMessage);
  throw error;
};
```

---

## 🔐 认证相关API

### 管理员登录
```javascript
// API调用
const result = await AdminAPI.login({
  username: 'admin',
  password: '123456'
});

// 内部实现
async login(credentials) {
  try {
    // 1. 查询管理员信息
    const admin = await SupabaseService.getAdminByUsername(credentials.username);
    
    // 2. 验证密码（简单比对，实际应该用bcrypt）
    if (admin.password_hash !== credentials.password) {
      throw new Error('用户名或密码错误');
    }
    
    // 3. 生成Token（使用Supabase Auth或自定义JWT）
    const token = generateToken(admin);
    
    // 4. 保存到localStorage
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(admin));
    
    return {
      success: true,
      data: { user: admin, token },
      message: '登录成功'
    };
  } catch (error) {
    return handleError(error, '管理员登录');
  }
}
```

---

## 📦 订单相关API

### 创建订单
```javascript
// API调用
const orderData = {
  customer_wechat: 'user123',
  tradingview_username: 'tv_user',
  duration: '1month',
  amount: 188,
  payment_method: 'crypto',
  payment_time: '2025-01-13T10:00:00',
  screenshot_data: 'base64...',
  sales_code: 'SEC123456'
};

const result = await OrderAPI.createOrder(orderData);

// Supabase实现
static async createOrder(orderData) {
  // 1. 生成订单号
  const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  
  // 2. 准备数据
  const order = {
    order_number: orderNumber,
    ...orderData,
    status: orderData.duration === '7days' ? 'pending_config' : 'pending_payment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // 3. 插入数据库
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 更新订单状态
```javascript
// API调用
await AdminAPI.updateOrderStatus(orderId, 'confirmed_payment');

// Supabase实现
static async updateOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString(),
      // 如果状态是confirmed_config，自动设置config_confirmed
      ...(newStatus === 'confirmed_config' ? { config_confirmed: true } : {})
    })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

---

## 💰 销售相关API

### 注册一级销售
```javascript
// API调用
const salesData = {
  wechat_name: 'sales001',
  payment_method: 'crypto',
  payment_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
  chain_name: 'TRC20'
};

const result = await SalesAPI.registerPrimarySales(salesData);

// 实现逻辑
static async registerPrimarySales(salesData) {
  // 1. 生成唯一代码
  const linkCode = this.generateLinkCode();
  const registrationCode = `REG${Date.now()}`;
  
  // 2. 准备数据
  const sales = {
    ...salesData,
    sales_code: linkCode,
    registration_code: registrationCode,
    sales_type: 'primary',
    commission_rate: 0.4,  // 40%固定
    created_at: new Date().toISOString()
  };
  
  // 3. 插入数据库
  const { data, error } = await supabase
    .from('secondary_sales')  // 注意：实际使用secondary_sales表
    .insert([sales])
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    purchase_link: `https://zhixing-seven.vercel.app/purchase/${linkCode}`,
    registration_link: `https://zhixing-seven.vercel.app/secondary-sales?code=${registrationCode}`
  };
}
```

### 获取销售统计
```javascript
// API调用
const stats = await AdminAPI.getSalesStats();

// 复杂的业务逻辑实现
static async getSalesStats() {
  // 1. 并行获取所有数据
  const [primarySales, secondarySales, orders] = await Promise.all([
    supabase.from('secondary_sales').select('*').eq('sales_type', 'primary'),
    supabase.from('secondary_sales').select('*').eq('sales_type', 'secondary'),
    supabase.from('orders').select('*').neq('status', 'rejected')
  ]);
  
  // 2. 计算一级销售统计
  const primaryStats = primarySales.data.map(sale => {
    // 获取直销订单
    const directOrders = orders.data.filter(o => o.sales_code === sale.sales_code);
    const directAmount = this.calculateAmount(directOrders);
    const directCommission = directAmount * 0.4;
    
    // 获取分销订单
    const managedSales = secondarySales.data.filter(s => s.primary_sales_id === sale.id);
    let distributionProfit = 0;
    
    managedSales.forEach(secondary => {
      const secOrders = orders.data.filter(o => o.sales_code === secondary.sales_code);
      const secAmount = this.calculateAmount(secOrders);
      const secRate = secondary.commission_rate || 0.25;
      distributionProfit += secAmount * (0.4 - secRate);
    });
    
    return {
      ...sale,
      direct_orders: directOrders.length,
      direct_amount: directAmount,
      direct_commission: directCommission,
      distribution_profit: distributionProfit,
      total_commission: directCommission + distributionProfit
    };
  });
  
  return primaryStats;
}
```

---

## 📊 统计数据API

### 获取Dashboard统计
```javascript
// API调用
const overview = await AdminAPI.getOverview();

// 并行请求优化
static async getOverview() {
  // 并行执行多个查询
  const [
    { count: totalOrders },
    { data: revenueData },
    { data: commissionData },
    { data: orderTypeStats }
  ] = await Promise.all([
    // 订单总数
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    
    // 收入统计
    supabase.from('orders')
      .select('amount, actual_payment_amount, payment_method')
      .in('status', ['confirmed', 'active']),
    
    // 佣金统计
    supabase.from('orders')
      .select('commission_amount, sales_type')
      .in('status', ['confirmed', 'active']),
    
    // 订单类型分布
    supabase.from('orders')
      .select('duration')
      .neq('status', 'rejected')
  ]);
  
  // 数据处理
  const totalRevenue = this.calculateTotalRevenue(revenueData);
  const totalCommission = this.calculateTotalCommission(commissionData);
  const typeDistribution = this.calculateTypeDistribution(orderTypeStats);
  
  return {
    totalOrders,
    totalRevenue,
    totalCommission,
    typeDistribution
  };
}
```

---

## 🔄 实时订阅API

### 订阅订单变化
```javascript
// 订阅新订单
const subscription = supabase
  .from('orders')
  .on('INSERT', payload => {
    console.log('新订单创建:', payload.new);
    // 更新UI
  })
  .on('UPDATE', payload => {
    console.log('订单更新:', payload.new);
    // 更新UI
  })
  .subscribe();

// 取消订阅
subscription.unsubscribe();
```

---

## 🛠️ API调用最佳实践

### 1. 批量操作优化
```javascript
// ❌ 不好的做法：串行请求
const sales1 = await getSales(id1);
const sales2 = await getSales(id2);
const sales3 = await getSales(id3);

// ✅ 好的做法：并行请求
const [sales1, sales2, sales3] = await Promise.all([
  getSales(id1),
  getSales(id2),
  getSales(id3)
]);
```

### 2. 错误重试机制
```javascript
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// 使用
const data = await apiCallWithRetry(() => 
  supabase.from('orders').select('*')
);
```

### 3. 请求防抖
```javascript
import { debounce } from 'lodash';

// 搜索防抖
const searchSales = debounce(async (keyword) => {
  const { data, error } = await supabase
    .from('secondary_sales')
    .select('*')
    .ilike('wechat_name', `%${keyword}%`);
  
  if (!error) {
    updateSearchResults(data);
  }
}, 300);
```

---

## 📝 API响应格式

### 成功响应
```javascript
{
  success: true,
  data: {
    // 返回的数据
  },
  message: '操作成功'
}
```

### 错误响应
```javascript
{
  success: false,
  error: {
    code: '23505',
    message: '数据已存在',
    details: '...'
  },
  message: '操作失败'
}
```

---

## 🔑 环境变量配置

```javascript
// .env.local
REACT_APP_SUPABASE_URL=https://itvmeamoqthfqtkpubdv.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 API性能监控

```javascript
// API调用计时
async function measureApiCall(name, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`✅ ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${name}: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

// 使用
const orders = await measureApiCall('获取订单列表', () =>
  supabase.from('orders').select('*')
);
```

---

## 🚨 常见错误码

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| PGRST301 | JWT过期 | 重新登录 |
| 23505 | 唯一键冲突 | 提示数据已存在 |
| 23503 | 外键约束失败 | 检查关联数据 |
| 42P01 | 表不存在 | 检查表名 |
| 42703 | 列不存在 | 检查字段名 |
| 22P02 | 数据类型错误 | 检查数据格式 |

---

*文档更新时间：2025-01-13*
*版本：v2.12.0*