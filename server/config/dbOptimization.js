
// 数据库查询优化配置
const dbOptimization = {
  // 查询缓存配置
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
    maxSize: 1000
  },
  
  // 分页配置
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
    pageSizeOptions: [10, 20, 50, 100]
  },
  
  // 索引建议
  indexes: [
    'orders.created_at',
    'orders.status',
    'orders.customer_id',
    'sales.sales_id',
    'customers.created_at'
  ],
  
  // 查询优化
  queryOptimization: {
    useIndexes: true,
    limitResults: true,
    selectFields: true,
    avoidNPlusOne: true
  }
};

// 查询缓存工具
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = dbOptimization.cache.ttl;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clear() {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();
export default dbOptimization;
