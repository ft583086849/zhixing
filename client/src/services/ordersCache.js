/**
 * 订单数据缓存管理器
 * 用于优化AdminOrders页面性能
 */

class OrdersCacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 3 * 60 * 1000; // 3分钟缓存
    this.indexCache = new Map(); // 索引缓存
  }

  /**
   * 生成缓存键
   */
  generateKey(params = {}) {
    // 排序参数键以确保一致性
    const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});
    return JSON.stringify(sortedParams);
  }

  /**
   * 获取缓存数据
   */
  get(params = {}) {
    const key = this.generateKey(params);
    const cached = this.cache.get(key);
    
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.cacheDuration) {
        console.log('📦 使用缓存的订单数据');
        return cached.data;
      }
      // 缓存过期，删除
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * 设置缓存数据
   */
  set(params, data) {
    const key = this.generateKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 建立索引
    this.buildIndexes(data);
    
    console.log('💾 订单数据已缓存');
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
    this.indexCache.clear();
    console.log('🗑️ 订单缓存已清除');
  }

  /**
   * 建立索引以加速查询
   */
  buildIndexes(orders) {
    if (!Array.isArray(orders)) return;
    
    const startTime = Date.now();
    
    // 按状态索引
    const byStatus = new Map();
    // 按销售代码索引
    const bySalesCode = new Map();
    // 按客户邮箱索引
    const byEmail = new Map();
    // 按订单号索引
    const byOrderNumber = new Map();
    
    orders.forEach(order => {
      // 状态索引
      if (order.status) {
        if (!byStatus.has(order.status)) {
          byStatus.set(order.status, []);
        }
        byStatus.get(order.status).push(order);
      }
      
      // 销售代码索引
      if (order.sales_code) {
        if (!bySalesCode.has(order.sales_code)) {
          bySalesCode.set(order.sales_code, []);
        }
        bySalesCode.get(order.sales_code).push(order);
      }
      
      // 客户邮箱索引
      if (order.customer_email) {
        if (!byEmail.has(order.customer_email)) {
          byEmail.set(order.customer_email, []);
        }
        byEmail.get(order.customer_email).push(order);
      }
      
      // 订单号索引
      if (order.order_number) {
        byOrderNumber.set(order.order_number, order);
      }
    });
    
    // 保存索引
    this.indexCache.set('byStatus', byStatus);
    this.indexCache.set('bySalesCode', bySalesCode);
    this.indexCache.set('byEmail', byEmail);
    this.indexCache.set('byOrderNumber', byOrderNumber);
    
    const duration = Date.now() - startTime;
    console.log(`🔍 索引构建完成，耗时: ${duration}ms`);
  }

  /**
   * 使用索引快速查询
   */
  queryByIndex(indexName, key) {
    const index = this.indexCache.get(indexName);
    if (!index) return null;
    return index.get(key);
  }

  /**
   * 批量处理订单数据（优化性能）
   */
  processOrders(orders, salesData = []) {
    const startTime = Date.now();
    console.log('⚡ 开始批量处理订单数据...');
    
    // 建立销售信息映射
    const salesMap = new Map();
    salesData.forEach(sale => {
      if (sale.sales_code) {
        salesMap.set(sale.sales_code, sale);
      }
    });
    
    // 处理订单数据
    const processedOrders = orders.map(order => {
      // 添加销售信息
      const salesInfo = salesMap.get(order.sales_code);
      
      // 添加前端期望的字段结构
      let primary_sales = null;
      let secondary_sales = null;
      let sales_wechat_name = '-';
      
      if (salesInfo) {
        // 设置销售微信号
        sales_wechat_name = salesInfo.wechat_name || salesInfo.sales?.wechat_name || '-';
        
        if (salesInfo.sales_type === 'primary') {
          // 一级销售
          primary_sales = {
            id: salesInfo.id,
            wechat_name: salesInfo.wechat_name || salesInfo.sales?.wechat_name,
            sales_code: salesInfo.sales_code,
            sales_type: 'primary',
            commission_rate: salesInfo.commission_rate
          };
        } else {
          // 二级或独立销售
          secondary_sales = {
            id: salesInfo.id,
            wechat_name: salesInfo.wechat_name || salesInfo.sales?.wechat_name,
            sales_code: salesInfo.sales_code,
            sales_type: salesInfo.sales_type || 'secondary',
            primary_sales_id: salesInfo.primary_sales_id,
            commission_rate: salesInfo.commission_rate
          };
          
          // 如果有上级，尝试获取一级销售信息
          if (salesInfo.primary_sales_id) {
            const primarySale = salesData.find(s => 
              s.id === salesInfo.primary_sales_id && s.sales_type === 'primary'
            );
            if (primarySale) {
              primary_sales = {
                id: primarySale.id,
                wechat_name: primarySale.wechat_name || primarySale.sales?.wechat_name,
                sales_code: primarySale.sales_code,
                sales_type: 'primary',
                commission_rate: primarySale.commission_rate
              };
              // 设置二级销售的primary_sales属性
              secondary_sales.primary_sales = primary_sales;
            }
          }
        }
      }
      
      // 计算订单状态标签
      const statusInfo = this.getOrderStatusInfo(order.status);
      
      // 计算时间信息
      const timeInfo = this.calculateTimeInfo(order);
      
      return {
        ...order,
        primary_sales,      // 前端期望的字段
        secondary_sales,    // 前端期望的字段
        sales_wechat_name,  // 兼容旧代码
        salesInfo,          // 保留原有字段以兼容
        statusInfo,
        timeInfo,
        // 添加显示用的格式化字段
        displayAmount: this.formatAmount(order),
        displayDuration: this.formatDuration(order.duration),
        displayDate: this.formatDate(order.created_at)
      };
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ 批量处理完成，处理${orders.length}个订单，耗时: ${duration}ms`);
    
    return processedOrders;
  }

  /**
   * 获取订单状态信息
   */
  getOrderStatusInfo(status) {
    const statusMap = {
      'pending': { text: '待处理', color: 'default' },
      'pending_payment': { text: '待付款确认', color: 'orange' },
      'confirmed_payment': { text: '已付款确认', color: 'blue' },
      'pending_config': { text: '待配置确认', color: 'gold' },
      'confirmed_config': { text: '已配置确认', color: 'green' },
      'confirmed_configuration': { text: '已配置确认', color: 'green' },
      'active': { text: '生效中', color: 'success' },
      'rejected': { text: '已拒绝', color: 'red' },
      'cancelled': { text: '已取消', color: 'default' },
      'expired': { text: '已过期', color: 'gray' }
    };
    
    return statusMap[status] || { text: status, color: 'default' };
  }

  /**
   * 计算时间信息
   */
  calculateTimeInfo(order) {
    const now = new Date();
    const created = new Date(order.created_at);
    const daysSinceCreated = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    let expiryInfo = null;
    if (order.expiry_date) {
      const expiry = new Date(order.expiry_date);
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      expiryInfo = {
        date: expiry,
        daysRemaining: daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7
      };
    }
    
    return {
      created,
      daysSinceCreated,
      expiryInfo
    };
  }

  /**
   * 格式化金额
   */
  formatAmount(order) {
    const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
    if (order.payment_method === 'alipay') {
      return `¥${amount.toFixed(2)} (≈$${(amount / 7.15).toFixed(2)})`;
    }
    return `$${amount.toFixed(2)}`;
  }

  /**
   * 格式化时长
   */
  formatDuration(duration) {
    const durationMap = {
      'free_trial': '7天试用',
      '7days': '7天试用',
      '1month': '1个月',
      '3months': '3个月',
      '6months': '6个月',
      '1year': '1年',
      'yearly': '1年'
    };
    return durationMap[duration] || duration;
  }

  /**
   * 格式化日期
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 获取统计信息
   */
  getStatistics(orders) {
    if (!Array.isArray(orders) || orders.length === 0) {
      return {
        total: 0,
        byStatus: {},
        byDuration: {},
        totalAmount: 0,
        averageAmount: 0
      };
    }
    
    const stats = {
      total: orders.length,
      byStatus: {},
      byDuration: {},
      totalAmount: 0,
      confirmedAmount: 0
    };
    
    orders.forEach(order => {
      // 按状态统计
      if (order.status) {
        stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      }
      
      // 按时长统计
      if (order.duration) {
        stats.byDuration[order.duration] = (stats.byDuration[order.duration] || 0) + 1;
      }
      
      // 计算金额
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
      stats.totalAmount += amountUSD;
      
      if (['confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)) {
        stats.confirmedAmount += amountUSD;
      }
    });
    
    stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;
    
    return stats;
  }
}

// 导出单例
export const ordersCacheManager = new OrdersCacheManager();