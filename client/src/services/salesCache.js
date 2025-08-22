/**
 * 销售数据缓存管理器
 * 用于优化AdminSales页面性能
 */

class SalesCacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5分钟缓存
    this.processingCache = new Map(); // 处理后的数据缓存
  }

  /**
   * 生成缓存键
   */
  generateKey(params = {}) {
    return JSON.stringify(params || {});
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
        console.log('📦 使用缓存的销售数据');
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
    console.log('💾 销售数据已缓存');
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
    this.processingCache.clear();
    console.log('🗑️ 销售缓存已清除');
  }

  /**
   * 获取处理后的数据缓存
   */
  getProcessed(salesId) {
    return this.processingCache.get(salesId);
  }

  /**
   * 设置处理后的数据缓存
   */
  setProcessed(salesId, data) {
    this.processingCache.set(salesId, data);
  }

  /**
   * 批量处理销售数据（优化性能）
   */
  batchProcessSales(primarySales, secondarySales, orders) {
    const startTime = Date.now();
    console.log('⚡ 开始批量处理销售数据...');
    
    // 预处理：建立索引
    const ordersBySalesCode = new Map();
    const secondaryByPrimaryId = new Map();
    
    // 索引订单
    orders.forEach(order => {
      if (order.sales_code) {
        if (!ordersBySalesCode.has(order.sales_code)) {
          ordersBySalesCode.set(order.sales_code, []);
        }
        ordersBySalesCode.get(order.sales_code).push(order);
      }
    });
    
    // 索引二级销售
    secondarySales.forEach(sale => {
      if (sale.primary_sales_id) {
        if (!secondaryByPrimaryId.has(sale.primary_sales_id)) {
          secondaryByPrimaryId.set(sale.primary_sales_id, []);
        }
        secondaryByPrimaryId.get(sale.primary_sales_id).push(sale);
      }
    });
    
    // 处理一级销售
    const processedPrimary = primarySales.map(sale => {
      // 使用缓存的处理结果
      const cached = this.getProcessed(`primary_${sale.id}`);
      if (cached && cached.version === sale.updated_at) {
        return cached.data;
      }
      
      const saleOrders = ordersBySalesCode.get(sale.sales_code) || [];
      const managedSecondaries = secondaryByPrimaryId.get(sale.id) || [];
      
      // 快速计算统计数据
      const result = this.calculateSalesStats(sale, saleOrders, managedSecondaries, orders, ordersBySalesCode);
      
      // 缓存处理结果
      this.setProcessed(`primary_${sale.id}`, {
        data: result,
        version: sale.updated_at
      });
      
      return result;
    });
    
    // 处理二级销售
    const processedSecondary = secondarySales.map(sale => {
      // 使用缓存的处理结果
      const cached = this.getProcessed(`secondary_${sale.id}`);
      if (cached && cached.version === sale.updated_at) {
        return cached.data;
      }
      
      const saleOrders = ordersBySalesCode.get(sale.sales_code) || [];
      const result = this.calculateSecondarySalesStats(sale, saleOrders);
      
      // 缓存处理结果
      this.setProcessed(`secondary_${sale.id}`, {
        data: result,
        version: sale.updated_at
      });
      
      return result;
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ 批量处理完成，耗时: ${duration}ms`);
    
    return [...processedPrimary, ...processedSecondary];
  }

  /**
   * 计算一级销售统计
   */
  calculateSalesStats(sale, directOrders, managedSecondaries, allOrders, ordersBySalesCode) {
    // 过滤有效订单
    const validDirectOrders = directOrders.filter(o => o.status !== 'rejected');
    const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
    
    // 计算金额
    let totalAmount = 0;
    let confirmedAmount = 0;
    
    validDirectOrders.forEach(order => {
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
      totalAmount += amountUSD;
      
      if (confirmedStatuses.includes(order.status)) {
        confirmedAmount += amountUSD;
      }
    });
    
    // 计算二级销售相关数据
    let secondaryOrdersAmount = 0;
    let secondaryTotalCommission = 0;
    
    managedSecondaries.forEach(secondary => {
      const secOrders = (ordersBySalesCode.get(secondary.sales_code) || [])
        .filter(o => confirmedStatuses.includes(o.status));
      
      secOrders.forEach(order => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
        secondaryOrdersAmount += amountUSD;
        
        const secRate = secondary.commission_rate > 1 ? 
          secondary.commission_rate / 100 : 
          (secondary.commission_rate || 0.25);
        secondaryTotalCommission += amountUSD * secRate;
      });
    });
    
    // 计算佣金
    const primaryRate = 0.4;
    const primaryDirectCommission = confirmedAmount * primaryRate;
    const secondaryShareCommission = secondaryOrdersAmount * primaryRate - secondaryTotalCommission;
    const totalCommission = primaryDirectCommission + secondaryShareCommission;
    
    return {
      sales: {
        ...sale,
        sales_type: 'primary',
        commission_rate: primaryRate * 100,
        payment_account: sale.payment_address,
        paid_commission: sale.paid_commission || 0
      },
      sales_type: 'primary',
      total_orders: validDirectOrders.length,
      valid_orders: validDirectOrders.filter(o => confirmedStatuses.includes(o.status)).length,
      total_amount: Math.round((totalAmount + secondaryOrdersAmount) * 100) / 100,
      confirmed_amount: Math.round(confirmedAmount * 100) / 100,
      commission_rate: primaryRate * 100,
      commission_amount: Math.round(totalCommission * 100) / 100,
      paid_commission: sale.paid_commission || 0,  // 添加已返佣金字段
      secondary_sales_count: managedSecondaries.length,
      primary_direct_amount: Math.round(confirmedAmount * 100) / 100,
      primary_direct_commission: Math.round(primaryDirectCommission * 100) / 100,
      secondary_orders_amount: Math.round(secondaryOrdersAmount * 100) / 100,
      secondary_share_commission: Math.round(secondaryShareCommission * 100) / 100,
      created_at: sale.created_at,
      links: this.generateLinks(sale)
    };
  }

  /**
   * 计算二级销售统计
   */
  calculateSecondarySalesStats(sale, saleOrders) {
    const validOrders = saleOrders.filter(o => o.status !== 'rejected');
    const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
    
    let totalAmount = 0;
    let confirmedAmount = 0;
    
    validOrders.forEach(order => {
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
      totalAmount += amountUSD;
      
      if (confirmedStatuses.includes(order.status)) {
        confirmedAmount += amountUSD;
      }
    });
    
    const commissionRate = sale.commission_rate > 1 ? 
      sale.commission_rate : 
      (sale.commission_rate || 0.25) * 100;
    
    const commissionAmount = confirmedAmount * (commissionRate / 100);
    
    return {
      sales: {
        ...sale,
        sales_type: sale.primary_sales_id ? 'secondary' : 'independent',
        commission_rate: commissionRate,
        payment_account: sale.payment_address,
        paid_commission: sale.paid_commission || 0
      },
      sales_type: sale.primary_sales_id ? 'secondary' : 'independent',
      total_orders: validOrders.length,
      valid_orders: validOrders.filter(o => confirmedStatuses.includes(o.status)).length,
      total_amount: Math.round(totalAmount * 100) / 100,
      confirmed_amount: Math.round(confirmedAmount * 100) / 100,
      commission_rate: commissionRate,
      commission_amount: Math.round(commissionAmount * 100) / 100,
      paid_commission: sale.paid_commission || 0,  // 添加已返佣金字段
      created_at: sale.created_at,
      links: this.generateLinks(sale)
    };
  }

  /**
   * 生成销售链接
   */
  generateLinks(sale) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return [
      {
        type: 'purchase',
        code: sale.sales_code,
        fullUrl: `${baseUrl}/purchase/${sale.sales_code}`
      },
      {
        type: 'sales_register',
        code: sale.sales_code,
        fullUrl: `${baseUrl}/secondary-registration/${sale.sales_code}`
      }
    ];
  }
}

// 导出单例
export const salesCacheManager = new SalesCacheManager();