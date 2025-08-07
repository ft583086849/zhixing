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
        const key = `${order.customer_name}-${order.customer_phone}`;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email,
            first_order: order.created_at,
            order_count: 1,
            total_amount: parseFloat(order.amount || 0)
          });
        } else {
          const customer = customerMap.get(key);
          customer.order_count++;
          customer.total_amount += parseFloat(order.amount || 0);
        }
      });

      const customers = Array.from(customerMap.values());
      
      const result = {
        success: true,
        data: customers,
        message: '获取客户列表成功'
      };

      CacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      return handleError(error, '获取客户列表');
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
   * 注册一级销售
   */
  async registerPrimary(salesData) {
    try {
      // 生成唯一的销售代码
      salesData.sales_code = salesData.sales_code || `PRI${Date.now()}`;
      salesData.secondary_registration_code = salesData.secondary_registration_code || `SEC${Date.now()}`;
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
      // 生成唯一的销售代码
      salesData.sales_code = salesData.sales_code || `SEC${Date.now()}`;
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
      // 生成订单号
      orderData.order_number = orderData.order_number || `ORD${Date.now()}`;
      orderData.created_at = new Date().toISOString();
      orderData.status = orderData.status || 'pending';
      orderData.payment_status = orderData.payment_status || 'pending';
      
      // 计算佣金（基于销售代码）
      if (orderData.sales_code) {
        try {
          const salesInfo = await this.calculateCommission(orderData.sales_code, orderData.amount);
          orderData.commission_amount = salesInfo.commission;
          orderData.sales_type = salesInfo.type;
        } catch (error) {
          console.warn('计算佣金失败:', error.message);
          // 即使佣金计算失败，订单仍然可以创建
        }
      }
      
      const newOrder = await SupabaseService.createOrder(orderData);
      
      CacheManager.clear(); // 清除所有缓存
      
      return {
        success: true,
        data: newOrder,
        message: '订单创建成功'
      };
    } catch (error) {
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