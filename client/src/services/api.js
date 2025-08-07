/**
 * 统一API业务逻辑层
 * 提供高级业务接口，封装复杂的数据操作逻辑
 */

import { message } from 'antd';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

/**
 * 统一错误处理
 */
const handleError = (error, operation = 'API操作') => {
  console.error(`${operation}失败:`, error);
  
  // 根据错误类型显示不同的提示
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        message.error('登录已过期，请重新登录');
    AuthService.logout();
    return;
  }
  
  if (error.code === '23505') { // unique_violation
    message.error('数据已存在，请检查输入');
    throw error;
  }
  
  if (error.code === '23503') { // foreign_key_violation
    message.error('关联数据不存在，请检查输入');
    throw error;
  }
  
  const errorMessage = error.message || `${operation}失败，请重试`;
  message.error(errorMessage);
  throw error;
};

/**
 * 缓存管理
 */
class CacheManager {
  static cache = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5分钟
  
  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
    return cached.data;
  }
  return null;
  }

  static set(key, data) {
    this.cache.set(key, {
    data,
    timestamp: Date.now()
  });
  }
  
  static clear(pattern = null) {
    if (pattern) {
      // 清除匹配模式的缓存
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

/**
 * 管理员API
 */
export const AdminAPI = {
  /**
   * 管理员登录
   */
  async login(credentials) {
    try {
      const result = await AuthService.login(credentials.username, credentials.password);
      CacheManager.clear(); // 登录后清除缓存
      return {
        success: true,
        data: result,
        message: '登录成功'
      };
    } catch (error) {
      return handleError(error, '管理员登录');
    }
  },

  /**
   * 获取管理员概览数据
   */
  async getOverview() {
    const cacheKey = 'admin-overview';
    const cached = CacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const [orderStats, salesStats] = await Promise.all([
        SupabaseService.getOrderStats(),
        SupabaseService.getSalesStats()
      ]);

      const result = {
        success: true,
        data: {
          totalOrders: orderStats.total,
          totalAmount: orderStats.totalAmount,
          todayOrders: orderStats.todayOrders,
          totalSales: salesStats.totalSales,
          primarySales: salesStats.primaryCount,
          secondarySales: salesStats.secondaryCount
        },
        message: '获取概览数据成功'
      };

      CacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      return handleError(error, '获取概览数据');
    }
  },

  /**
   * 获取所有订单
   */
  async getOrders() {
    const cacheKey = 'admin-orders';
    const cached = CacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const orders = await SupabaseService.getOrders();
      
      const result = {
        success: true,
        data: orders,
        message: '获取订单列表成功'
      };

      CacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      return handleError(error, '获取订单列表');
    }
  },

  /**
   * 获取客户列表（从订单中提取）
   */
  async getCustomers() {
    const cacheKey = 'admin-customers';
    const cached = CacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const orders = await SupabaseService.getOrders();
      
      // 去重并整理客户信息
      const customerMap = new Map();
      orders.forEach(order => {
        // 修复字段名称映射
        const customerWechat = order.customer_wechat || '';
        const tradingviewUser = order.tradingview_username || '';
        const key = `${customerWechat}-${tradingviewUser}`;
        
        if (!customerMap.has(key) && (customerWechat || tradingviewUser)) {
          // 获取销售微信号 - 多种策略确保获取到数据
          const salesWechat = order.sales_wechat_name || 
                            order.primary_sales?.wechat_name || 
                            order.secondary_sales?.wechat_name || 
                            order.sales_name || 
                            '-';
          
          customerMap.set(key, {
            customer_name: customerWechat || tradingviewUser, // 修复：添加customer_name
            customer_wechat: customerWechat,
            tradingview_username: tradingviewUser,
            sales_wechat_name: salesWechat,
            first_order: order.created_at,
            total_orders: 1, // 修复：字段名从order_count改为total_orders
            total_amount: parseFloat(order.amount || 0),
            actual_payment_amount: parseFloat(order.actual_payment_amount || 0),
            commission_amount: parseFloat(order.commission_amount || 0)
          });
        } else if (customerMap.has(key)) {
          const customer = customerMap.get(key);
          customer.total_orders++; // 修复：使用正确的字段名
          customer.total_amount += parseFloat(order.amount || 0);
          customer.actual_payment_amount += parseFloat(order.actual_payment_amount || 0);
          customer.commission_amount += parseFloat(order.commission_amount || 0);
          
          // 确保销售微信号不为空
          if (!customer.sales_wechat_name || customer.sales_wechat_name === '') {
            customer.sales_wechat_name = order.sales_wechat_name || 
                                       order.primary_sales?.wechat_name || 
                                       order.secondary_sales?.wechat_name || 
                                       order.sales_name || 
                                       '-';
          }
        }
      });

      const customers = Array.from(customerMap.values());
      
      const result = {
        success: true,
        data: customers,
        message: '获取客户列表成功'
      };

      CacheManager.set(cacheKey, result);
      return result.data; // 修复：直接返回customers数组，保持与其他API一致
    } catch (error) {
      console.error('获取客户列表失败:', error);
      // 返回空数组而不是抛出错误，确保页面不崩溃
      console.log('返回空客户数组');
      return [];
    }
  },

  /**
   * 获取支付配置
   */
  async getPaymentConfig() {
    const cacheKey = 'payment-config';
    const cached = CacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const config = await SupabaseService.getPaymentConfig();
      
      const result = {
        success: true,
        data: config,
        message: '获取支付配置成功'
      };

      CacheManager.set(cacheKey, result);
      return result.data; // 直接返回配置数据
    } catch (error) {
      console.error('获取支付配置失败:', error);
      // 返回默认配置
      return {
        alipay_account: '752304285@qq.com',
        alipay_name: '梁',
        crypto_chain_name: 'TRC10/TRC20',
        crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
        alipay_qr_code: null,
        crypto_qr_code: null
      };
    }
  },

  /**
   * 更新支付配置
   */
  async updatePaymentConfig(configData) {
    try {
      console.log('正在更新支付配置到数据库:', configData);
      
      const updatedConfig = await SupabaseService.updatePaymentConfig(configData);
      
      // 清除缓存，确保下次获取最新数据
      CacheManager.remove('payment-config');
      
      const result = {
        success: true,
        data: updatedConfig,
        message: '支付配置更新成功'
      };

      return result.data; // 直接返回更新后的配置数据
    } catch (error) {
      console.error('更新支付配置失败:', error);
      return handleError(error, '更新支付配置');
    }
  },

  /**
   * 获取销售列表 - 包含订单关联和佣金计算
   */
  async getSales() {
    const cacheKey = 'admin-sales';
    const cached = CacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      // 1. 获取基础销售数据和订单数据
      const [primarySales, secondarySales, orders] = await Promise.all([
        SupabaseService.getPrimarySales(),
        SupabaseService.getSecondarySales(),
        SupabaseService.getOrders()
      ]);
      
      console.log('销售数据获取:', {
        一级销售: primarySales.length,
        二级销售: secondarySales.length,
        订单数: orders.length
      });
      
      // 2. 处理一级销售数据
      const processedPrimarySales = primarySales.map(sale => {
        // 获取该销售的所有订单
        const saleOrders = orders.filter(order => 
          order.sales_code === sale.sales_code || 
          order.primary_sales_id === sale.id
        );
        
        // 计算订单统计
        const totalOrders = saleOrders.length;
        const validOrders = saleOrders.filter(order => 
          ['confirmed_payment', 'pending_config', 'confirmed_configuration', 'active'].includes(order.status)
        ).length;
        
        // 计算总金额和佣金
        const totalAmount = saleOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 计算佣金金额
        const commissionAmount = saleOrders.reduce((sum, order) => {
          const commission = parseFloat(order.commission_amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (commission / 7.15);
          }
          return sum + commission;
        }, 0);
        
        // 一级销售佣金率计算逻辑
        let commissionRate = 40; // 默认40%
        if (totalOrders > 0) {
          // 这里使用简化的佣金率计算，可以后续根据需求文档完善
          commissionRate = commissionAmount > 0 ? Math.round((commissionAmount / totalAmount) * 100) : 40;
        }
        
        return {
          ...sale,
          sales_type: 'primary',
          sales_display_type: '一级销售', // 新增：用于显示的销售类型
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
          orders: saleOrders,
          hierarchy_info: '一级销售'
        };
      });
      
      // 3. 处理二级销售数据
      const processedSecondarySales = secondarySales.map(sale => {
        // 获取该销售的所有订单
        const saleOrders = orders.filter(order => 
          order.sales_code === sale.sales_code || 
          order.secondary_sales_id === sale.id
        );
        
        // 计算订单统计
        const totalOrders = saleOrders.length;
        const validOrders = saleOrders.filter(order => 
          ['confirmed_payment', 'pending_config', 'confirmed_configuration', 'active'].includes(order.status)
        ).length;
        
        // 计算总金额和佣金
        const totalAmount = saleOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 计算佣金金额
        const commissionAmount = saleOrders.reduce((sum, order) => {
          const commission = parseFloat(order.commission_amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (commission / 7.15);
          }
          return sum + commission;
        }, 0);
        
        // 二级销售佣金率：独立二级销售30%，一级销售下的二级销售由一级销售设置
        let commissionRate = 30; // 默认30%
        if (sale.commission_rate) {
          commissionRate = sale.commission_rate;
        } else if (commissionAmount > 0 && totalAmount > 0) {
          commissionRate = Math.round((commissionAmount / totalAmount) * 100);
        }
        
        // 判断二级销售类型
        let salesDisplayType = '';
        let hierarchyInfo = '';
        
        if (sale.primary_sales_id) {
          // 关联二级销售
          const primarySale = primarySales.find(p => p.id === sale.primary_sales_id);
          if (primarySale) {
            salesDisplayType = '关联二级销售';
            hierarchyInfo = `${primarySale.name || primarySale.wechat_name} 的二级销售`;
          } else {
            salesDisplayType = '关联二级销售';
            hierarchyInfo = `关联销售ID: ${sale.primary_sales_id}`;
          }
        } else {
          // 独立二级销售
          salesDisplayType = '独立二级销售';
          hierarchyInfo = '独立运营';
        }
        
        return {
          ...sale,
          sales_type: 'secondary',
          sales_display_type: salesDisplayType, // 新增：用于显示的销售类型
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
          orders: saleOrders,
          hierarchy_info: hierarchyInfo
        };
      });
      
      // 4. 合并所有销售数据
      const allSales = [...processedPrimarySales, ...processedSecondarySales];
      
      console.log('处理后的销售数据:', {
        总数: allSales.length,
        一级销售: processedPrimarySales.length,
        二级销售: processedSecondarySales.length
      });
      
      const result = {
        success: true,
        data: allSales,
        message: '获取销售列表成功'
      };

      CacheManager.set(cacheKey, result);
      return result.data; // 直接返回销售数组
    } catch (error) {
      console.error('获取销售列表失败:', error);
      // 返回空数组而不是抛出错误，确保页面不崩溃
      console.log('返回空销售数组');
      return [];
    }
  },

  /**
   * 获取统计数据
   */
  async getStats() {
    const cacheKey = 'admin-stats';
    // 暂时禁用缓存，强制获取最新数据
    CacheManager.remove(cacheKey);
    // const cached = CacheManager.get(cacheKey);
    // if (cached) return cached;

    try {
      console.log('开始获取统计数据...');
      const [orderStats, salesStats] = await Promise.all([
        SupabaseService.getOrderStats(),
        SupabaseService.getSalesStats()
      ]);
      
      console.log('原始统计数据:', { orderStats, salesStats });
      console.log('orderStats.total:', orderStats?.total);
      console.log('orderStats类型:', typeof orderStats);
      
      const stats = {
        total_orders: orderStats.total || 0,
        total_amount: orderStats.totalAmount || 0,
        today_orders: orderStats.todayOrders || 0,
        pending_payment_orders: orderStats.pendingPayment || 0,
        confirmed_payment_orders: orderStats.confirmedPayment || 0,
        pending_config_orders: orderStats.pendingConfig || 0,
        confirmed_config_orders: orderStats.confirmedConfig || 0,
        total_commission: orderStats.totalCommission || 0,
        primary_sales_count: salesStats.primaryCount || 0,
        secondary_sales_count: salesStats.secondaryCount || 0,
        total_sales: salesStats.totalSales || 0
      };
      
      console.log('处理后的统计数据:', stats);
      
      const result = {
        success: true,
        data: stats,
        message: '获取统计数据成功'
      };

      CacheManager.set(cacheKey, result);
      return result.data; // 直接返回统计数据
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 返回默认的空统计数据，而不是抛出错误
      const defaultStats = {
        total_orders: 0,
        total_amount: 0,
        today_orders: 0,
        pending_payment_orders: 0,
        confirmed_payment_orders: 0,
        pending_config_orders: 0,
        confirmed_config_orders: 0,
        total_commission: 0,
        primary_sales_count: 0,
        secondary_sales_count: 0,
        total_sales: 0
      };
      console.log('返回默认统计数据:', defaultStats);
      return defaultStats;
    }
  },

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId, status) {
    try {
      console.log('更新订单状态:', { orderId, status });
      
      const updatedOrder = await SupabaseService.updateOrderStatus(orderId, status);
      
      const result = {
        success: true,
        data: { orderId, status, order: updatedOrder },
        message: '订单状态更新成功'
      };

      // 清除相关缓存
      CacheManager.remove('admin-orders');
      CacheManager.remove('admin-stats');
      
      return result;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      return handleError(error, '更新订单状态');
    }
  }
};

/**
 * 销售API
 */
export const SalesAPI = {
  /**
   * 根据销售代码获取销售信息
   */
  async getSalesByCode(salesCode) {
    try {
      // 先查询一级销售
      try {
        const primarySale = await SupabaseService.getPrimarySalesByCode(salesCode);
        return {
          success: true,
          data: { ...primarySale, type: 'primary' },
          message: '获取一级销售信息成功'
        };
      } catch (error) {
        // 增强错误处理：处理更多错误类型
        console.log('Primary sales query failed:', error.code, error.message);
        
        // 对于所有查询失败的情况，都尝试查询二级销售
        if (error.code === 'PGRST116' || // No rows returned
            error.code === '406' || // Not Acceptable 
            error.status === 406 ||
            error.message?.includes('406') ||
            error.message?.includes('Not Acceptable')) {
          
          try {
            console.log('正在查询二级销售，sales_code:', salesCode);
            const secondarySale = await SupabaseService.getSecondarySalesByCode(salesCode);
            console.log('二级销售查询成功:', secondarySale);
            return {
              success: true,
              data: { ...secondarySale, type: 'secondary' },
              message: '获取二级销售信息成功'
            };
          } catch (secondaryError) {
            console.error('Secondary sales query failed:', {
              code: secondaryError.code,
              message: secondaryError.message,
              status: secondaryError.status,
              fullError: secondaryError
            });
            
            if (secondaryError.code === 'PGRST116') {
              throw new Error('销售代码不存在');
            }
            throw secondaryError;
          }
        }
        
        // 对于其他未知错误，也尝试查询二级销售
        try {
          console.log('其他错误情况下查询二级销售，sales_code:', salesCode);
          const secondarySale = await SupabaseService.getSecondarySalesByCode(salesCode);
          console.log('其他错误情况下二级销售查询成功:', secondarySale);
          return {
            success: true,
            data: { ...secondarySale, type: 'secondary' },
            message: '获取二级销售信息成功'
          };
        } catch (secondaryError) {
          console.error('其他错误情况下二级销售查询失败:', {
            code: secondaryError.code,
            message: secondaryError.message,
            status: secondaryError.status,
            fullError: secondaryError
          });
          // 如果两个查询都失败，抛出原始错误
          throw error;
        }
      }
    } catch (error) {
      console.error('getSalesByCode 最终错误:', error);
      throw error; // 直接抛出错误，让上层处理
    }
  },

  /**
   * 根据链接代码获取销售信息 (别名函数)
   */
  async getSalesByLink(linkCode) {
    // 复用getSalesByCode函数
    return this.getSalesByCode(linkCode);
  },

  /**
   * 生成唯一的销售代码
   */
  generateUniqueSalesCode(prefix = 'PRI') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  },

  /**
   * 注册一级销售
   */
  async registerPrimary(salesData) {
    try {
      // 生成唯一的销售代码 - 增强唯一性
      salesData.sales_code = salesData.sales_code || this.generateUniqueSalesCode('PRI');
      salesData.secondary_registration_code = salesData.secondary_registration_code || this.generateUniqueSalesCode('SEC');
      salesData.sales_type = 'primary';  // 添加sales_type字段
      salesData.created_at = new Date().toISOString();
      salesData.updated_at = new Date().toISOString();
      
      const newSale = await SupabaseService.createPrimarySales(salesData);
      
      // 生成链接
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://zhixing-seven.vercel.app';
      const user_sales_link = `${baseUrl}/purchase?sales_code=${newSale.sales_code}`;
      const secondary_registration_link = `${baseUrl}/secondary-sales?registration_code=${newSale.secondary_registration_code}`;
      
      CacheManager.clear('sales'); // 清除销售相关缓存
      
      return {
        success: true,
        data: {
          ...newSale,
          user_sales_link,
          secondary_registration_link
        },
        message: '一级销售注册成功'
      };
    } catch (error) {
      return handleError(error, '注册一级销售');
    }
  },

  /**
   * 验证二级销售注册码
   */
  async validateSecondaryRegistrationCode(registrationCode) {
    try {
      const validationData = await SupabaseService.validateSecondaryRegistrationCode(registrationCode);
      
      if (!validationData) {
        return {
          success: false,
          message: '注册码无效或已过期'
        };
      }
      
      return {
        success: true,
        data: validationData,
        message: '注册码验证成功'
      };
    } catch (error) {
      return handleError(error, '验证注册码');
    }
  },

  /**
   * 注册二级销售
   */
  async registerSecondary(salesData) {
    try {
      // 生成唯一的销售代码 - 增强唯一性
      salesData.sales_code = salesData.sales_code || this.generateUniqueSalesCode('SEC');
      salesData.sales_type = 'secondary';  // 添加sales_type字段
      salesData.created_at = new Date().toISOString();
      
      const newSale = await SupabaseService.createSecondarySales(salesData);
      
      CacheManager.clear('sales'); // 清除销售相关缓存
      
      return {
        success: true,
        data: newSale,
        message: '二级销售注册成功'
      };
    } catch (error) {
      return handleError(error, '注册二级销售');
    }
  },

  /**
   * 更新佣金比率
   */
  async updateCommissionRate(salesId, commissionRate, salesType) {
    try {
      let updatedSale;
      
      if (salesType === 'primary') {
        updatedSale = await SupabaseService.updatePrimarySales(salesId, {
          commission_rate: commissionRate,
          updated_at: new Date().toISOString()
        });
      } else {
        updatedSale = await SupabaseService.updateSecondarySales(salesId, {
          commission_rate: commissionRate,
          updated_at: new Date().toISOString()
        });
      }
      
      CacheManager.clear('sales'); // 清除销售相关缓存
      
      return {
        success: true,
        data: updatedSale,
        message: '佣金比率更新成功'
      };
    } catch (error) {
      return handleError(error, '更新佣金比率');
    }
  }
};

/**
 * 订单API
 */
export const OrdersAPI = {
  /**
   * 创建订单
   */
  async create(orderData) {
    try {
      console.log('原始订单数据:', orderData);
      
      // 字段映射和数据清理
      const processedOrderData = {
        // 基础字段
        order_number: orderData.order_number || `ORD${Date.now()}`,
        created_at: new Date().toISOString(),
        status: orderData.status || 'pending',
        payment_status: orderData.payment_status || 'pending',
        
        // 销售相关字段
        sales_code: orderData.sales_code,
        link_code: orderData.link_code || orderData.sales_code, // 兼容性
        
        // 客户信息字段映射
        customer_name: orderData.customer_wechat || orderData.customer_name || '', // 修复字段映射
        customer_wechat: orderData.customer_wechat,
        tradingview_username: orderData.tradingview_username,
        
        // 订单信息
        duration: orderData.duration,
        purchase_type: orderData.purchase_type,
        effective_time: orderData.effective_time,
        
        // 金额处理 - 确保数字类型
        amount: orderData.amount ? parseFloat(orderData.amount) : 0,
        actual_payment_amount: orderData.actual_payment_amount ? parseFloat(orderData.actual_payment_amount) : 0,
        alipay_amount: orderData.alipay_amount ? parseFloat(orderData.alipay_amount) : null,
        crypto_amount: orderData.crypto_amount ? parseFloat(orderData.crypto_amount) : null,
        
        // 支付相关
        payment_method: orderData.payment_method,
        payment_time: orderData.payment_time,
        screenshot_data: orderData.screenshot_data
      };
      
      console.log('处理后订单数据:', processedOrderData);
      
      // 计算佣金（基于销售代码）
      if (processedOrderData.sales_code && processedOrderData.amount > 0) {
        try {
          const salesInfo = await this.calculateCommission(processedOrderData.sales_code, processedOrderData.amount);
          processedOrderData.commission_amount = salesInfo.commission;
          processedOrderData.sales_type = salesInfo.type;
          processedOrderData.commission_rate = salesInfo.commission / processedOrderData.amount;
        } catch (error) {
          console.warn('计算佣金失败:', error.message);
          // 免费订单或计算失败时的默认值
          processedOrderData.commission_amount = 0;
          processedOrderData.commission_rate = 0;
        }
      } else {
        // 免费订单
        processedOrderData.commission_amount = 0;
        processedOrderData.commission_rate = 0;
      }
      
      const newOrder = await SupabaseService.createOrder(processedOrderData);
      
      CacheManager.clear(); // 清除所有缓存
      
      return {
        success: true,
        data: newOrder,
        message: '订单创建成功'
      };
    } catch (error) {
      console.error('订单创建失败:', error);
      return handleError(error, '创建订单');
    }
  },

  /**
   * 获取订单详情
   */
  async getById(orderId) {
    try {
      const order = await SupabaseService.getOrderById(orderId);
      
      return {
        success: true,
        data: order,
        message: '获取订单详情成功'
      };
    } catch (error) {
      return handleError(error, '获取订单详情');
    }
  },

  /**
   * 更新订单状态
   */
  async updateStatus(orderId, status) {
    try {
      const updatedOrder = await SupabaseService.updateOrder(orderId, {
        status,
        updated_at: new Date().toISOString()
      });
      
      CacheManager.clear('orders'); // 清除订单相关缓存
      
      return {
        success: true,
        data: updatedOrder,
        message: '订单状态更新成功'
      };
    } catch (error) {
      return handleError(error, '更新订单状态');
    }
  },

  /**
   * 计算佣金
   */
  async calculateCommission(salesCode, amount) {
    const salesResult = await SalesAPI.getSalesByCode(salesCode);
    if (!salesResult.success) {
      throw new Error('销售代码不存在');
    }
    
    const sale = salesResult.data;
    const commissionRate = sale.commission_rate || (sale.type === 'primary' ? 0.4 : 0.3);
    const commission = parseFloat(amount) * commissionRate;
    
    return {
      commission,
      type: sale.type,
      rate: commissionRate
    };
  }
};

/**
 * 统一导出
 */
export const API = {
  Admin: AdminAPI,
  Sales: SalesAPI,
  Orders: OrdersAPI,
  Auth: AuthService,
  Cache: CacheManager
};

// 向后兼容的导出（小写命名）
export const adminAPI = AdminAPI;
export const salesAPI = {
  ...SalesAPI,
  // 向后兼容的别名
  createPrimarySales: SalesAPI.registerPrimary,
  createSecondarySales: SalesAPI.registerSecondary
};
export const ordersAPI = OrdersAPI;
export const authAPI = {
  login: AdminAPI.login,
  // 向后兼容AuthService
  ...AuthService
};

// 公开API（临时占位）
export const publicAPI = {
  getPaymentConfig: async () => ({ data: {} }),
};

// 向后兼容的默认导出
export default API;

console.log('🚀 统一API服务层初始化完成');