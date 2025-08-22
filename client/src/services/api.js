/**
 * 统一API业务逻辑层
 * 提供高级业务接口，封装复杂的数据操作逻辑
 * v2.13.0 - Added excluded sales filtering - 2025-01-20
 */

import { message } from 'antd';
import { SupabaseService } from './supabase.js';
import { AuthService } from './auth.js';
import ExcludedSalesService from './excludedSalesService.js';

/**
 * 统一错误处理
 */
const handleError = (error, operation = 'API操作') => {
  console.error(`${operation}失败:`, error);
  console.error('错误详情:', {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    stack: error?.stack
  });
  
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
  
  const errorMessage = error?.message || `${operation}失败，请重试`;
  message.error(errorMessage);
  throw error;
};

/**
 * 缓存管理 - 仅缓存配置数据，业务数据实时获取
 */
class CacheManager {
  static cache = new Map();
  static CACHE_DURATION = 30 * 1000; // 默认30秒，仅用于防止短时间内重复请求
  
  // 只缓存配置类数据，业务数据不缓存或极短缓存
  static CACHE_TIMES = {
    stats: 0,                   // 统计数据：不缓存，实时获取
    sales: 0,                   // 销售数据：不缓存，实时获取
    orders: 0,                  // 订单数据：不缓存，实时获取
    customers: 0,               // 客户数据：不缓存，实时获取
    config: 5 * 60 * 1000       // 配置数据：5分钟（很少变化）
  };
  
  static get(key, customDuration = null) {
    const cached = this.cache.get(key);
    const duration = customDuration || this.getCacheDuration(key);
    
    // 如果缓存时间为0，直接返回null（不使用缓存）
    if (duration === 0) {
      return null;
    }
    
    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`📦 缓存命中: ${key}`);
      return cached.data;
    }
    return null;
  }

  static set(key, data) {
    // 如果数据类型不需要缓存，直接返回
    const duration = this.getCacheDuration(key);
    if (duration === 0) {
      return;
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  static remove(key) {
    this.cache.delete(key);
  }
  
  static getCacheDuration(key) {
    // 根据key类型返回不同的缓存时间
    if (key.includes('stats')) return this.CACHE_TIMES.stats;
    if (key.includes('sales')) return this.CACHE_TIMES.sales;
    if (key.includes('orders')) return this.CACHE_TIMES.orders;
    if (key.includes('customers')) return this.CACHE_TIMES.customers;
    if (key.includes('config')) return this.CACHE_TIMES.config;
    return 0; // 默认不缓存
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
  async getOrders(params = {}) {
    // 导入订单缓存管理器
    const { ordersCacheManager } = await import('./ordersCache.js');
    
    // 尝试从缓存获取
    const cached = ordersCacheManager.get(params);
    if (cached) {
      return {
        success: true,
        data: cached,
        message: '获取订单列表成功（缓存）'
      };
    }

    try {
      console.log('📋 getOrders 参数:', params);
      
      // 🚫 获取排除的销售代码（只在管理员查看时应用）
      const isAdminView = !params.skipExclusion; // 默认应用排除
      let excludedSalesCodes = [];
      
      if (isAdminView) {
        try {
          excludedSalesCodes = await ExcludedSalesService.getExcludedSalesCodes();
          if (excludedSalesCodes.length > 0) {
            console.log(`🚫 getOrders将排除 ${excludedSalesCodes.length} 个销售的订单`);
          }
        } catch (err) {
          console.warn('获取排除名单失败，继续执行:', err);
        }
      }
      
      // 添加排除条件到参数中
      const queryParams = excludedSalesCodes.length > 0 
        ? { ...params, excludedSalesCodes }
        : params;
      
      // 根据是否有参数决定查询方式
      const orders = Object.keys(queryParams).length > 0 
        ? await SupabaseService.getOrdersWithFilters(queryParams)
        : await SupabaseService.getOrders();
      
      // 🔧 修复：获取完整的销售数据，包括一级和二级销售信息
      const [salesOptimized, primarySalesData, secondarySalesData] = await Promise.all([
        this.getSalesOptimized(),
        SupabaseService.supabase.from('primary_sales').select('*'),
        SupabaseService.supabase.from('secondary_sales').select('*, primary_sales:primary_sales_id(*)')
      ]);
      
      // 合并销售数据
      const salesData = [...(salesOptimized.data || []), 
                         ...(primarySalesData.data || []),
                         ...(secondarySalesData.data || [])];
      
      // 批量处理订单数据
      const processedOrders = ordersCacheManager.processOrders(orders, salesData);
      
      // 保存到缓存
      ordersCacheManager.set(params, processedOrders);
      
      // 获取统计信息
      const stats = ordersCacheManager.getStatistics(processedOrders);
      console.log('📊 订单统计:', stats);
      
      const result = {
        success: true,
        data: processedOrders,
        message: '获取订单列表成功',
        stats
      };

      return result;
    } catch (error) {
      return handleError(error, '获取订单列表');
    }
  },

  /**
   * 获取客户列表（从订单中提取）
   */
  async getCustomers(params = {}) {
    // 🔧 修复：重置时也要获取最新数据，暂时禁用缓存
    const hasParams = Object.keys(params).length > 0;
    
    // 暂时禁用缓存，确保数据实时性
    // if (!hasParams) {
    //   const cacheKey = 'admin-customers';
    //   const cached = CacheManager.get(cacheKey);
    //   if (cached) return cached;
    // }

    try {
      // 0. 首先尝试同步销售微信号（如果需要）
      await this.syncSalesWechatNames();
      
      // 🚫 获取排除的销售代码（只在管理员查看时应用）
      const isAdminView = !params.skipExclusion; // 默认应用排除
      let excludedSalesCodes = [];
      
      if (isAdminView) {
        try {
          excludedSalesCodes = await ExcludedSalesService.getExcludedSalesCodes();
          if (excludedSalesCodes.length > 0) {
            console.log(`🚫 getCustomers将排除 ${excludedSalesCodes.length} 个销售的客户`);
          }
        } catch (err) {
          console.warn('获取排除名单失败，继续执行:', err);
        }
      }
      
      // 🔧 修复：获取订单数据和销售数据用于正确关联
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 构建订单查询
      let ordersQuery = supabaseClient.from('orders_optimized').select('*');
      
      // 应用排除过滤
      if (excludedSalesCodes.length > 0) {
        ordersQuery = ordersQuery.not('sales_code', 'in', `(${excludedSalesCodes.join(',')})`);
      }
      
      // 销售微信号搜索
      if (params.sales_wechat) {
        // 先获取匹配的销售
        const [primarySalesResult, secondarySalesResult] = await Promise.all([
          supabaseClient.from('primary_sales').select('sales_code').ilike('wechat_name', `%${params.sales_wechat}%`),
          supabaseClient.from('secondary_sales').select('sales_code').ilike('wechat_name', `%${params.sales_wechat}%`)
        ]);
        
        const salesCodes = [
          ...(primarySalesResult.data || []).map(s => s.sales_code),
          ...(secondarySalesResult.data || []).map(s => s.sales_code)
        ];
        
        if (salesCodes.length > 0) {
          ordersQuery = ordersQuery.in('sales_code', salesCodes);
        } else if (params.sales_wechat) {
          // 没有找到匹配的销售，返回空结果
          return [];
        }
      }
      
      // 客户微信号搜索
      if (params.customer_wechat) {
        ordersQuery = ordersQuery.ilike('customer_wechat', `%${params.customer_wechat}%`);
      }
      
      // 提醒状态过滤
      if (params.is_reminded !== undefined && params.is_reminded !== '') {
        ordersQuery = ordersQuery.eq('is_reminded', params.is_reminded === 'true' || params.is_reminded === true);
      }
      
      // 日期范围过滤
      if (params.start_date && params.end_date) {
        ordersQuery = ordersQuery
          .gte('created_at', params.start_date)
          .lte('created_at', params.end_date + ' 23:59:59');
      }
      
      // 🔧 新增：金额筛选 - 参考订单管理页面的实现
      // 多选金额筛选
      if (params.amount && Array.isArray(params.amount) && params.amount.length > 0) {
        // 转换为数字数组并使用 in 查询
        const amounts = params.amount.map(a => parseFloat(a));
        ordersQuery = ordersQuery.in('amount', amounts);
      }
      
      // 金额范围筛选
      if (params.min_amount !== undefined && params.min_amount !== '') {
        ordersQuery = ordersQuery.gte('amount', parseFloat(params.min_amount));
      }
      if (params.max_amount !== undefined && params.max_amount !== '') {
        ordersQuery = ordersQuery.lte('amount', parseFloat(params.max_amount));
      }
      
      // 执行查询
      const [ordersResult, primarySalesResult, secondarySalesResult] = await Promise.all([
        ordersQuery,
        supabaseClient.from('primary_sales').select('id, sales_code, name, wechat_name'),
        supabaseClient.from('secondary_sales').select('id, sales_code, name, wechat_name, primary_sales_id')
      ]);
      
      const orders = ordersResult.data || [];
      const primarySales = primarySalesResult.data || [];
      const secondarySales = secondarySalesResult.data || [];
      const allSales = [...primarySales, ...secondarySales];
      
      // 创建映射以便快速查找
      const primarySalesMap = new Map(primarySales.map(s => [s.id, s]));
      const secondarySalesMap = new Map(secondarySales.map(s => [s.id, s]));
      
      // 🔒 核心业务逻辑 - 未经用户确认不可修改
      // PROTECTED: Customer filtering logic - DO NOT MODIFY without user confirmation
      // 去重并整理客户信息 - 包括特殊标记的订单（如"XX下的直接购买"）
      const customerMap = new Map();
      orders.forEach(order => {
        // 🔧 修复：排除已拒绝的订单
        if (order.status === 'rejected') {
          return; // 跳过已拒绝的订单
        }
        
        // 修复字段名称映射
        const customerWechat = order.customer_wechat || '';
        const tradingviewUser = order.tradingview_username || '';
        const key = `${customerWechat}-${tradingviewUser}`;
        
        // 🔒 核心逻辑：允许所有有customer_wechat或tradingview_username的订单
        // 包括销售直接购买订单（如"89一级下的直接购买"）
        if (!customerMap.has(key) && (customerWechat || tradingviewUser)) {
          // 🔧 修复：通过sales_code查找销售表获取微信号和层级信息
          let salesWechat = '-';
          let salesType = null;
          let primarySalesName = null;
          
          if (order.sales_code) {
            const matchingSale = allSales.find(sale => sale.sales_code === order.sales_code);
            if (matchingSale) {
              // 使用wechat_name字段作为销售微信号（name字段是收款人姓名，不应使用）
              salesWechat = matchingSale.wechat_name || '-';
              
              // 判断销售类型
              if (primarySales.some(s => s.sales_code === order.sales_code)) {
                salesType = 'primary';
              } else if (secondarySales.some(s => s.sales_code === order.sales_code)) {
                salesType = 'secondary';
                // 获取上级销售信息
                const secondarySale = secondarySales.find(s => s.sales_code === order.sales_code);
                if (secondarySale && secondarySale.primary_sales_id) {
                  const primarySale = primarySalesMap.get(secondarySale.primary_sales_id);
                  if (primarySale) {
                    primarySalesName = primarySale.wechat_name;
                  }
                }
              }
            }
          }
          
          // 计算到期时间
          let expiryTime = null;
          if (order.created_at && order.duration) {
            const createdDate = new Date(order.created_at);
            const expiryDate = new Date(createdDate);
            
            if (order.duration === '7days' || order.duration === '7天') {
              expiryDate.setDate(expiryDate.getDate() + 7);
            } else if (order.duration === '1month' || order.duration === '1个月') {
              expiryDate.setMonth(expiryDate.getMonth() + 1);
            } else if (order.duration === '3months' || order.duration === '3个月') {
              expiryDate.setMonth(expiryDate.getMonth() + 3);
            } else if (order.duration === '6months' || order.duration === '6个月') {
              expiryDate.setMonth(expiryDate.getMonth() + 6);
            } else if (order.duration === '1year' || order.duration === '1年') {
              expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            }
            
            expiryTime = expiryDate.toISOString();
          }
          
          customerMap.set(key, {
            customer_name: customerWechat || tradingviewUser, // 修复：添加customer_name
            customer_wechat: customerWechat,
            tradingview_username: tradingviewUser,
            sales_wechat_name: salesWechat,
            sales_type: salesType,
            primary_sales_name: primarySalesName,
            first_order: order.created_at,
            total_orders: 1, // 修复：字段名从order_count改为total_orders
            total_amount: parseFloat(order.actual_payment_amount || order.amount || 0),
            actual_payment_amount: parseFloat(order.actual_payment_amount || 0),
            commission_amount: parseFloat(order.commission_amount || 0),
            is_reminded: order.is_reminded || false,
            status: order.status,
            expiry_time: expiryTime,
            expiry_date: expiryTime // 兼容字段名
          });
        } else if (customerMap.has(key)) {
          // 已拒绝订单不累加到已有客户
          if (order.status === 'rejected') {
            return;
          }
          
          const customer = customerMap.get(key);
          customer.total_orders++; // 修复：使用正确的字段名
          customer.total_amount += parseFloat(order.actual_payment_amount || order.amount || 0);
          customer.actual_payment_amount += parseFloat(order.actual_payment_amount || 0);
          customer.commission_amount += parseFloat(order.commission_amount || 0);
          
          // 🔧 修复：确保销售微信号不为空，使用正确的关联逻辑
          if (!customer.sales_wechat_name || customer.sales_wechat_name === '-') {
            if (order.sales_code) {
              const matchingSale = allSales.find(sale => sale.sales_code === order.sales_code);
              if (matchingSale) {
                // 使用wechat_name字段作为销售微信号（name字段是收款人姓名，不应使用）
                customer.sales_wechat_name = matchingSale.wechat_name || '-';
                
                // 更新销售类型信息
                if (!customer.sales_type) {
                  if (primarySales.some(s => s.sales_code === order.sales_code)) {
                    customer.sales_type = 'primary';
                  } else if (secondarySales.some(s => s.sales_code === order.sales_code)) {
                    customer.sales_type = 'secondary';
                    // 获取上级销售信息
                    const secondarySale = secondarySales.find(s => s.sales_code === order.sales_code);
                    if (secondarySale && secondarySale.primary_sales_id) {
                      const primarySale = primarySalesMap.get(secondarySale.primary_sales_id);
                      if (primarySale) {
                        customer.primary_sales_name = primarySale.wechat_name;
                      }
                    }
                  }
                }
              }
            }
          }
          
          // 更新提醒状态（如果有任何订单被提醒过，则标记为已提醒）
          if (order.is_reminded) {
            customer.is_reminded = true;
          }
          
          // 更新到期时间（使用最晚的到期时间）
          if (order.created_at && order.duration) {
            const createdDate = new Date(order.created_at);
            const expiryDate = new Date(createdDate);
            
            if (order.duration === '7days' || order.duration === '7天') {
              expiryDate.setDate(expiryDate.getDate() + 7);
            } else if (order.duration === '1month' || order.duration === '1个月') {
              expiryDate.setMonth(expiryDate.getMonth() + 1);
            } else if (order.duration === '3months' || order.duration === '3个月') {
              expiryDate.setMonth(expiryDate.getMonth() + 3);
            } else if (order.duration === '6months' || order.duration === '6个月') {
              expiryDate.setMonth(expiryDate.getMonth() + 6);
            } else if (order.duration === '1year' || order.duration === '1年') {
              expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            }
            
            const newExpiryTime = expiryDate.toISOString();
            if (!customer.expiry_time || new Date(newExpiryTime) > new Date(customer.expiry_time)) {
              customer.expiry_time = newExpiryTime;
              customer.expiry_date = newExpiryTime;
              customer.status = order.status;
            }
          }
        }
      });

      let customers = Array.from(customerMap.values());
      
      // 处理催单建议筛选
      if (params.reminder_suggestion) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        customers = customers.filter(customer => {
          if (!customer.expiry_time) {
            return params.reminder_suggestion === 'no_reminder';
          }
          
          const expiryDate = new Date(customer.expiry_time);
          expiryDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          // 🔧 修复：催单逻辑应该针对已生效的订单
          // 催单条件：1) 状态为confirmed_config或active（已生效）
          //          2) 即将到期（未来7天）或已过期30天内
          //          3) 未被催单过
          const isActiveOrder = customer.status === 'confirmed_config' || customer.status === 'active';
          const isInReminderTimeRange = (daysDiff <= 7 && daysDiff >= -30); // 未来7天到过去30天
          const needReminder = isActiveOrder && isInReminderTimeRange && !customer.is_reminded;
          
          return params.reminder_suggestion === 'need_reminder' ? needReminder : !needReminder;
        });
      }
      
      // 🔧 修复：按最新订单时间排序（新的在前）
      customers.sort((a, b) => {
        const getLatestTime = (customer) => {
          // 优先使用最新订单时间，其次使用首单时间
          if (customer.latest_order_time) return new Date(customer.latest_order_time);
          if (customer.first_order) return new Date(customer.first_order);
          return new Date(0);
        };
        
        return getLatestTime(b) - getLatestTime(a);
      });
      
      // 如果没有参数，缓存结果
      if (!hasParams) {
        const cacheKey = 'admin-customers';
        CacheManager.set(cacheKey, customers);
      }
      
      return customers; // 修复：直接返回customers数组
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
        crypto_chain_name: 'BSC/TRC20',
        crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
        alipay_qr_code: null,
        crypto_qr_code: null
      };
    }
  },

  /**
   * 获取收益分配配置
   */
  async getProfitDistribution() {
    try {
      const ratios = await SupabaseService.getProfitDistribution();
      console.log('获取收益分配配置成功:', ratios);
      return ratios;
    } catch (error) {
      console.error('获取收益分配配置失败:', error);
      // 返回默认配置
      return {
        public_ratio: 40,
        zhixing_ratio: 35,
        zijun_ratio: 25
      };
    }
  },

  /**
   * 保存收益分配配置
   */
  async saveProfitDistribution(ratios) {
    try {
      // 清除缓存
      CacheManager.clearAll();
      
      const result = await SupabaseService.updateProfitDistribution(ratios);
      console.log('保存收益分配配置成功:', result);
      
      return {
        success: true,
        data: result,
        message: '收益分配配置已保存'
      };
    } catch (error) {
      console.error('保存收益分配配置失败:', error);
      return {
        success: false,
        error: error.message,
        message: '保存失败，请重试'
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
   * 同步销售微信号 - 确保销售表有微信号数据
   */
  async syncSalesWechatNames() {
    try {
      console.log('开始同步销售微信号...');
      
      // 1. 获取所有销售数据
      const [primarySales, secondarySales] = await Promise.all([
        SupabaseService.getPrimarySales(),
        SupabaseService.getSecondarySales()
      ]);
      
      // 2. 确保每个销售都有微信号（如果没有，使用name或phone作为备用）
      let primaryUpdated = 0;
      for (const sale of primarySales) {
        if (!sale.wechat_name) {
          // 使用name作为微信号，如果name也没有则使用phone或sales_code
          const wechatName = sale.name || sale.phone || `销售_${sale.sales_code}`;
          try {
            await SupabaseService.updatePrimarySales(sale.id, { wechat_name: wechatName });
            primaryUpdated++;
            console.log(`更新一级销售 ${sale.sales_code} 的微信号为: ${wechatName}`);
          } catch (error) {
            console.error(`更新一级销售 ${sale.sales_code} 失败:`, error);
          }
        }
      }
      
      // 3. 更新二级销售的微信号
      let secondaryUpdated = 0;
      for (const sale of secondarySales) {
        if (!sale.wechat_name) {
          const wechatName = sale.name || sale.phone || `销售_${sale.sales_code}`;
          try {
            await SupabaseService.updateSecondarySales(sale.id, { wechat_name: wechatName });
            secondaryUpdated++;
            console.log(`更新二级销售 ${sale.sales_code} 的微信号为: ${wechatName}`);
          } catch (error) {
            console.error(`更新二级销售 ${sale.sales_code} 失败:`, error);
          }
        }
      }
      
      console.log(`同步完成: 更新了 ${primaryUpdated} 个一级销售，${secondaryUpdated} 个二级销售`);
      
      // 4. 清除缓存，确保下次获取最新数据
      CacheManager.clear('admin-sales');
      CacheManager.clear('admin-customers');
      
      return {
        success: true,
        primaryUpdated,
        secondaryUpdated,
        message: `成功同步销售微信号: 更新了 ${primaryUpdated} 个一级销售，${secondaryUpdated} 个二级销售`
      };
    } catch (error) {
      console.error('同步销售微信号失败:', error);
      return {
        success: false,
        error: error.message,
        message: '同步销售微信号失败'
      };
    }
  },

  /**
   * 获取销售列表 - 包含订单关联和佣金计算
   */
  async getSales(params = {}) {
    // 导入销售缓存管理器
    const { salesCacheManager } = await import('./salesCache.js');
    
    // 尝试从缓存获取
    const cached = salesCacheManager.get(params);
    if (cached) {
      return cached;
    }

    try {
      // 🔧 修复：移除自动同步，避免性能问题
      // await this.syncSalesWechatNames();
      
      // 构建查询条件
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 🚫 获取排除的销售（只在管理员统计时应用）
      const isAdminView = !params.skipExclusion; // 默认应用排除
      let excludedWechatNames = [];
      
      if (isAdminView) {
        try {
          excludedWechatNames = await ExcludedSalesService.getExcludedWechatNames();
          if (excludedWechatNames.length > 0) {
            console.log(`🚫 getSales将排除 ${excludedWechatNames.length} 个销售`);
          }
        } catch (err) {
          console.warn('获取排除名单失败，继续执行:', err);
        }
      }
      
      // 从 sales_optimized 表获取数据
      let salesQuery = supabaseClient
        .from('sales_optimized')
        .select('*')
        .order('total_amount', { ascending: false });
      
      // 应用排除过滤
      if (excludedWechatNames.length > 0) {
        salesQuery = salesQuery.not('wechat_name', 'in', `(${excludedWechatNames.map(n => `"${n}"`).join(',')})`);
      }
      
      // 销售类型过滤
      let primarySales = [];
      let secondarySales = [];
      
      // 执行查询
      const { data: salesData, error } = await salesQuery;
      
      if (error) {
        console.error('获取销售数据失败:', error);
        throw error;
      }
      
      // 分离一级和二级销售
      const allPrimary = salesData?.filter(s => s.sales_type === 'primary') || [];
      const allSecondary = salesData?.filter(s => s.sales_type === 'secondary') || [];
      
      if (params.sales_type === 'primary') {
        // 只获取一级销售
        primarySales = allPrimary;
        secondarySales = [];
      } else if (params.sales_type === 'secondary') {
        // 只获取二级销售（有上级的）
        primarySales = [];
        secondarySales = allSecondary.filter(s => s.primary_sales_id);
      } else if (params.sales_type === 'independent') {
        // 只获取独立销售（没有上级的二级销售）
        primarySales = [];
        secondarySales = allSecondary.filter(s => !s.primary_sales_id);
      } else {
        // 获取所有销售
        primarySales = allPrimary;
        secondarySales = allSecondary;
              }
      
      // 🔧 调试：确认获取了所有数据
      console.log('📊 销售类型筛选后的数据:', {
        筛选类型: params.sales_type || '全部',
        一级销售数量: primarySales.length,
        二级销售数量: secondarySales.length,
        总计: primarySales.length + secondarySales.length
      });
      
      // 销售微信号搜索
      // 🔧 修复：智能匹配 - 支持特殊关键词和精确匹配
      if (params.wechat_name) {
        const searchTerm = params.wechat_name.toLowerCase().trim();
        
        // 特殊关键词处理
        if (searchTerm === '一级' || searchTerm === '一级销售') {
          // 显示所有一级销售及其下属二级销售
          const allPrimaryIds = primarySales.map(p => p.id);
          secondarySales = secondarySales.filter(sale => 
            sale.primary_sales_id && allPrimaryIds.includes(sale.primary_sales_id)
          );
          // primarySales保持不变（显示所有一级销售）
          console.log('🔍 智能搜索：显示所有一级销售及其下属');
        } 
        else if (searchTerm === '二级' || searchTerm === '二级销售') {
          // 只显示二级销售
          primarySales = [];
          // secondarySales保持不变（显示所有二级销售）
          console.log('🔍 智能搜索：只显示二级销售');
        }
        else {
          // 普通搜索：精确匹配
          // 先筛选匹配的一级销售（精确匹配，不区分大小写）
          const matchedPrimarySales = primarySales.filter(sale => {
            // 检查多个字段进行精确匹配
            const wechatMatch = sale.wechat_name && sale.wechat_name.toLowerCase() === searchTerm;
            const nameMatch = sale.name && sale.name.toLowerCase() === searchTerm;
            const codeMatch = sale.sales_code && sale.sales_code.toLowerCase() === searchTerm;
            return wechatMatch || nameMatch || codeMatch;
          });
          
          // 获取这些一级销售的ID
          const primarySalesIds = matchedPrimarySales.map(p => p.id);
          
          // 筛选二级销售：直接匹配的 + 属于匹配的一级销售的
          secondarySales = secondarySales.filter(sale => {
            // 直接精确匹配
            const wechatMatch = sale.wechat_name && sale.wechat_name.toLowerCase() === searchTerm;
            const nameMatch = sale.name && sale.name.toLowerCase() === searchTerm;
            const codeMatch = sale.sales_code && sale.sales_code.toLowerCase() === searchTerm;
            const directMatch = wechatMatch || nameMatch || codeMatch;
            
            // 或者属于匹配的一级销售
            const belongsToMatchedPrimary = sale.primary_sales_id && primarySalesIds.includes(sale.primary_sales_id);
            
            return directMatch || belongsToMatchedPrimary;
          });
          
          primarySales = matchedPrimarySales;
          console.log(`🔍 精确搜索"${searchTerm}"：找到${matchedPrimarySales.length}个一级销售，${secondarySales.length}个相关二级销售`);
        }
      }
      
      // 手机号搜索
      if (params.phone) {
        primarySales = primarySales.filter(sale => 
          sale.phone && sale.phone.includes(params.phone)
        );
        secondarySales = secondarySales.filter(sale => 
          sale.phone && sale.phone.includes(params.phone)
        );
      }
      
      // 佣金比率过滤
      if (params.commission_rate) {
        const rate = parseFloat(params.commission_rate);
        primarySales = primarySales.filter(sale => 
          sale.commission_rate === rate
        );
        secondarySales = secondarySales.filter(sale => 
          sale.commission_rate === rate
        );
      }
      
      // 获取所有订单
      const orders = await SupabaseService.getOrders();
      
      // 🔧 修复：使用之前获取的全部二级销售数据，用于计算管理数量
      const allSecondarySales = allSecondary || [];
      
      console.log('📊 销售数据获取:', {
        一级销售: primarySales.length,
        二级销售: secondarySales.length,
        所有二级销售: allSecondarySales.length,
        订单总数: orders.length
      });
      
      // 使用批量处理优化性能
      const processedData = salesCacheManager.batchProcessSales(
        primarySales, 
        secondarySales, 
        orders
      );
      
      // 分离处理结果
      const processedPrimarySales = processedData.filter(s => s.sales_type === 'primary');
      const processedSecondarySales = processedData.filter(s => s.sales_type !== 'primary');
      
      // 合并数据（跳过原有的处理逻辑）
      const skipOldProcessing = true;
      if (skipOldProcessing) {
        const allSales = [...processedPrimarySales, ...processedSecondarySales];
        
        // 按创建时间降序排序
        allSales.sort((a, b) => {
          const timeA = new Date(a.created_at || 0);
          const timeB = new Date(b.created_at || 0);
          return timeB - timeA;
        });
        
        console.log('使用批量处理优化后的销售数据:', {
          总数: allSales.length,
          一级销售: processedPrimarySales.length,
          二级销售: processedSecondarySales.length
        });
        
        // 保存到缓存并返回
        salesCacheManager.set(params, allSales);
        return allSales;
      }
      
      // 原有处理逻辑（保留以防需要回滚）
      const processedPrimarySalesOld = primarySales.map(sale => {
        // 恢复原有逻辑，不强制使用统一数据源
        // 获取该销售的所有订单（排除已拒绝的订单）
        const saleOrders = orders.filter(order => 
          (order.sales_code === sale.sales_code || 
          order.primary_sales_id === sale.id) &&
          order.status !== 'rejected'
        );
        
        // 🔧 新增：获取管理的二级销售的订单
        const managedSecondaries = allSecondarySales.filter(s => s.primary_sales_id === sale.id);
        
        // 🔧 修复：使用 Map 按订单编号去重，避免订单被重复计算
        const orderMap = new Map();
        
        // 添加一级销售自己的订单
        saleOrders.forEach(order => {
          if (order.order_number) {
            orderMap.set(order.order_number, order);
          }
        });
        
        // 添加管理的二级销售的订单（如果订单号已存在则不会重复添加）
        managedSecondaries.forEach(secondary => {
          const secOrders = orders.filter(order => 
            order.sales_code === secondary.sales_code &&
            order.status !== 'rejected'
          );
          secOrders.forEach(order => {
            if (order.order_number) {
              orderMap.set(order.order_number, order);
            }
          });
        });
        
        // 转换为去重后的订单数组
        const allRelatedOrders = Array.from(orderMap.values());
        const totalOrders = allRelatedOrders.length;
        const validOrders = allRelatedOrders.filter(order => 
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
        ).length;
        
        // 计算总金额（所有订单金额）
        const totalAmount = allRelatedOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 计算已配置确认订单金额（包括一级和二级的订单）
        // v2.10.3回滚：使用数据库中的confirmed_amount或实时计算
        let confirmedAmount = 0;
        
        // 首先尝试从数据库获取confirmed_amount
        if (sale.confirmed_amount !== undefined && sale.confirmed_amount !== null) {
          confirmedAmount = sale.confirmed_amount;
        } else {
          // 如果数据库没有，则实时计算
          const confirmedOrders = allRelatedOrders.filter(order => 
            ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'].includes(order.status)
          );
          confirmedAmount = confirmedOrders.reduce((sum, order) => {
            const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
            if (order.payment_method === 'alipay') {
              return sum + (amount / 7.15);
            }
            return sum + amount;
          }, 0);
        }
        
        // 佣金率处理 - 使用固定规则
        let commissionRate;
        if (sale.commission_rate !== null && sale.commission_rate !== undefined) {
          commissionRate = sale.commission_rate;
          // 如果是小数格式（0.4），转换为百分比（40）
          if (commissionRate > 0 && commissionRate < 1) {
            commissionRate = commissionRate * 100;
          }
        } else {
          commissionRate = 40; // 默认40%
        }
        
        // 🚀 佣金系统v2.0 - 详细拆分计算
        // 1. 计算一级直销订单（不包括二级的订单）
        const primaryDirectOrders = allRelatedOrders.filter(order => 
          order.sales_code === sale.sales_code &&
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
        );
        
        const primaryDirectAmount = primaryDirectOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 2. 计算二级销售订单总额
        let secondaryOrdersAmount = 0;
        let secondaryTotalCommission = 0;
        let secondaryWeightedSum = 0;  // 用于计算加权平均
        
        managedSecondaries.forEach(secondary => {
          const secOrders = orders.filter(order => 
            order.sales_code === secondary.sales_code &&
            ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
          );
          
          const secConfirmedAmount = secOrders.reduce((sum, order) => {
            const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
            if (order.payment_method === 'alipay') {
              return sum + (amount / 7.15);
            }
            return sum + amount;
          }, 0);
          
          // 二级销售的佣金率处理
          let secCommissionRate = secondary.commission_rate || 0.25;
          if (secCommissionRate > 1) {
            secCommissionRate = secCommissionRate / 100;
          }
          
          secondaryOrdersAmount += secConfirmedAmount;
          secondaryTotalCommission += secConfirmedAmount * secCommissionRate;
          secondaryWeightedSum += secCommissionRate * secConfirmedAmount;
        });
        
        // 3. 计算加权平均二级佣金率
        const secondaryAvgRate = secondaryOrdersAmount > 0 
          ? secondaryWeightedSum / secondaryOrdersAmount 
          : 0;
        
        // 4. 计算一级销售佣金明细
        const primaryBaseRate = 0.4;  // 固定40%
        const primaryDirectCommission = primaryDirectAmount * primaryBaseRate;  // 直销佣金
        const secondaryShareCommission = secondaryOrdersAmount * primaryBaseRate - secondaryTotalCommission;  // 分销收益
        const commissionAmount = primaryDirectCommission + secondaryShareCommission;  // 总佣金
        
        // 获取管理的二级销售数量
        const managedSecondaryCount = allSecondarySales.filter(s => s.primary_sales_id === sale.id).length;
        
        // 生成销售链接
        const baseUrl = window.location.origin;
        const purchaseLink = `${baseUrl}/purchase/${sale.sales_code}`;
        const salesRegisterLink = `${baseUrl}/secondary-registration/${sale.sales_code}`;
        
        const links = [
          {
            type: 'purchase',
            title: '用户购买链接',
            code: sale.sales_code,
            fullUrl: purchaseLink,
            description: '分享给用户进行购买'
          },
          {
            type: 'sales_register',
            title: '分销注册链接',
            code: sale.sales_code,
            fullUrl: salesRegisterLink,
            description: '招募二级销售注册'
          }
        ];
        
        const wechatName = sale.wechat_name || sale.name || sale.phone || `一级销售-${sale.sales_code}`;
        
        return {
          // 保留原始销售数据作为sales对象（前端组件需要）
          sales: {
            ...sale,
            wechat_name: wechatName,
            sales_type: 'primary',
            commission_rate: commissionRate,
            payment_method: sale.payment_method,
            payment_account: sale.payment_address,  // 🔧 统一使用 payment_address 字段
            chain_name: sale.chain_name,  // 🔧 添加chain_name字段
            paid_commission: sale.paid_commission || 0,  // 🔧 添加数据库中的已返佣金额
            last_commission_paid_at: sale.last_commission_paid_at  // 🔧 添加最后支付时间
          },
          // 顾层字段用于显示
          created_at: sale.created_at,  // 🔧 修复：添加创建时间到顶层
          sales_type: 'primary',
          sales_display_type: '一级销售',
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          confirmed_amount: Math.round(confirmedAmount * 100) / 100,
          commission_rate: commissionRate,
          // 🚀 佣金系统v2.0 - 新增字段
          base_commission_rate: primaryBaseRate,  // 基础佣金率（固定40%）
          primary_direct_amount: Math.round(primaryDirectAmount * 100) / 100,  // 一级销售配置确认订单金额（仅直销）
          secondary_orders_amount: Math.round(secondaryOrdersAmount * 100) / 100,  // 二级销售配置确认订单金额
          secondary_avg_rate: secondaryAvgRate,  // 平均二级佣金率（加权）
          primary_direct_commission: Math.round(primaryDirectCommission * 100) / 100,  // 一级直销佣金
          secondary_share_commission: Math.round(secondaryShareCommission * 100) / 100,  // 二级分销收益
          
          // 保留原字段（兼容）
          commission_amount: sale.total_commission || Math.round(commissionAmount * 100) / 100,
          paid_commission: sale.paid_commission || 0,  // 🔧 添加数据库中的已返佣金额
          hierarchy_info: '一级销售',
          secondary_sales_count: managedSecondaryCount,
          links: links
        };
      });
      
      // 3. 处理二级销售数据
      const processedSecondarySalesOld = secondarySales.map(sale => {
        // 获取该销售的所有订单（排除已拒绝的订单）
        const saleOrders = orders.filter(order => 
          (order.sales_code === sale.sales_code || 
          order.secondary_sales_id === sale.id) &&
          order.status !== 'rejected'
        );
        
        // 计算订单统计（不包含已拒绝的订单）
        const totalOrders = saleOrders.length;
        // 🔧 修复：有效订单应该是已确认的订单（移除pending_payment等待付款状态）
        const validOrders = saleOrders.filter(order => 
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
        ).length;
        
        // 计算总金额（所有订单金额）
        const totalAmount = saleOrders.reduce((sum, order) => {
          // 🔧 修复：优先使用actual_payment_amount，其次使用amount
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 🔧 修复：计算已配置确认订单金额（计算confirmed、confirmed_configuration、confirmed_config和active状态）
        // v2.10.3回滚：使用数据库中的confirmed_amount或实时计算
        let confirmedAmount = 0;
        
        // 首先尝试从数据库获取confirmed_amount
        if (sale.confirmed_amount !== undefined && sale.confirmed_amount !== null) {
          confirmedAmount = sale.confirmed_amount;
        } else {
          // 如果数据库没有，则实时计算
          const confirmedOrders = saleOrders.filter(order => 
            ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'].includes(order.status)
          );
          confirmedAmount = confirmedOrders.reduce((sum, order) => {
            // 🔧 修复：优先使用actual_payment_amount，其次使用amount
            const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
            if (order.payment_method === 'alipay') {
              return sum + (amount / 7.15);
            }
            return sum + amount;
          }, 0);
        }
        
        // 🔧 修复：二级销售佣金率 - 统一使用百分比格式，正确处理0值
        let commissionRate;
        if (sale.commission_rate !== null && sale.commission_rate !== undefined) {
          commissionRate = sale.commission_rate;
          // 如果是小数格式（0.3），转换为百分比（30）
          if (commissionRate > 0 && commissionRate < 1) {
            commissionRate = commissionRate * 100;
          }
        } else {
          // 🚀 修复：统一默认值
          // 二级销售和独立销售都默认25%
          commissionRate = 25;
        }
        
        if (sale.primary_sales_id) {
          // 如果是关联二级销售，使用一级销售设置的佣金率（如果有）
          const primarySale = primarySales.find(p => p.id === sale.primary_sales_id);
          if (primarySale && primarySale.secondary_commission_rate) {
            let rate = primarySale.secondary_commission_rate;
            // 如果是小数格式，转换为百分比
            if (rate > 0 && rate < 1) {
              rate = rate * 100;
            }
            commissionRate = rate;
          }
        }
        
        // 🔧 修复：应返佣金额 = 已配置确认订单金额 × 佣金率（百分比格式）
        const commissionAmount = confirmedAmount * (commissionRate / 100);
        
        console.log(`📊 二级销售 ${sale.sales_code}: 订单${totalOrders}个, 有效${validOrders}个, 总额$${totalAmount.toFixed(2)}, 确认金额$${confirmedAmount.toFixed(2)}, 佣金率${commissionRate}%, 应返佣金$${commissionAmount.toFixed(2)}`);
        
        // 判断二级销售类型
        let salesDisplayType = '';
        let hierarchyInfo = '';
        
        if (sale.primary_sales_id) {
          // 关联二级销售
          const primarySale = primarySales.find(p => p.id === sale.primary_sales_id);
          if (primarySale) {
            salesDisplayType = '关联二级销售';
            // 🔧 修复：确保显示正确的一级销售名称
            const primaryName = primarySale.wechat_name || primarySale.name || `一级销售-${primarySale.sales_code}`;
            hierarchyInfo = `隶属于: ${primaryName}`;
          } else {
            salesDisplayType = '关联二级销售';
            hierarchyInfo = `关联销售ID: ${sale.primary_sales_id}`;
          }
        } else {
          // 独立二级销售
          salesDisplayType = '独立二级销售';
          hierarchyInfo = '独立运营';
        }
        
        // 🔧 修复：确保wechat_name有值，如果销售表中为空，使用name或phone作为备选
        const wechatName = sale.wechat_name || sale.name || sale.phone || `二级销售-${sale.sales_code}`;
        
        // 🔧 新增：生成销售链接（二级销售只有购买链接）
        const baseUrl = window.location.origin;
        const purchaseLink = `${baseUrl}/purchase/${sale.sales_code}`;
        
        const links = [
          {
            type: 'purchase',
            title: '用户购买链接',
            code: sale.sales_code,
            fullUrl: purchaseLink,
            description: '分享给用户进行购买'
          }
        ];
        
        // 🔧 修复：根据是否有primary_sales_id来正确设置sales_type
        const actualSalesType = sale.primary_sales_id ? 'secondary' : 'independent';
        
        return {
          // 保留原始销售数据作为sales对象（前端组件需要）
          sales: {
            ...sale,
            wechat_name: wechatName,
            sales_type: actualSalesType,  // 🔧 修复：独立销售应该是'independent'
            commission_rate: commissionRate,
            payment_method: sale.payment_method,
            payment_account: sale.payment_address,  // 🔧 统一使用 payment_address 字段
            chain_name: sale.chain_name,  // 🔧 添加chain_name字段
            paid_commission: sale.paid_commission || 0,  // 🔧 添加数据库中的已返佣金额
            last_commission_paid_at: sale.last_commission_paid_at  // 🔧 添加最后支付时间
          },
          // 顶层字段用于显示
          created_at: sale.created_at,  // 🔧 修复：添加创建时间到顶层
          sales_type: actualSalesType,  // 🔧 修复：独立销售应该是'independent'
          sales_display_type: salesDisplayType,
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          confirmed_amount: Math.round(confirmedAmount * 100) / 100,  // 🔧 新增：已配置确认订单金额
          commission_rate: commissionRate,
          // 🚀 佣金系统v2.0 - 新增字段（二级/独立销售）
          base_commission_rate: null,  // 二级销售无基础率概念
          primary_direct_amount: 0,  // 二级销售无直销订单
          secondary_orders_amount: Math.round(confirmedAmount * 100) / 100,  // 二级销售配置确认订单金额（就是自己的订单）
          secondary_avg_rate: commissionRate / 100,  // 自己的佣金率（转为小数）
          primary_direct_commission: 0,  // 二级销售无直销佣金
          secondary_share_commission: Math.round(commissionAmount * 100) / 100,  // 二级分销收益（就是自己的佣金）
          
          // 保留原字段（兼容）
          commission_amount: sale.total_commission || Math.round(commissionAmount * 100) / 100,
          paid_commission: sale.paid_commission || 0,  // 🔧 添加数据库中的已返佣金额
          hierarchy_info: hierarchyInfo,
          links: links  // 🔧 新增：销售链接
        };
      });
      
      // 4. 合并所有销售数据
      const allSales = [...processedPrimarySales, ...processedSecondarySalesOld];
      
      // 🔧 修复：按创建时间降序排序（最新的在前）
      allSales.sort((a, b) => {
        const timeA = new Date(a.created_at || 0);
        const timeB = new Date(b.created_at || 0);
        return timeB - timeA; // 降序：新的在前
      });
      
      console.log('处理后的销售数据:', {
        总数: allSales.length,
        一级销售: processedPrimarySales.length,
        二级销售: processedSecondarySalesOld.length,
        搜索参数: params,
        是否有搜索条件: Object.keys(params).length > 0,
        排序: '按创建时间降序'
      });
      
      const result = {
        success: true,
        data: allSales,
        message: '获取销售列表成功'
      };

      // 保存到缓存
      salesCacheManager.set(params, result);
      
      return result; // 返回包含success和data的完整对象
    } catch (error) {
      console.error('获取销售列表失败:', error);
      // 返回错误格式的对象，确保页面不崩溃
      console.log('返回空销售数据');
      return {
        success: false,
        data: [],
        message: error.message || '获取销售列表失败'
      };
    }
  },

  /**
   * 获取销售层级统计数据 - 🔧 修复：基于实际订单数据计算
   */
  async getSalesHierarchyStats(params = {}) {
    try {
      console.log('🔍 获取销售层级统计数据...');
      
      // 🚀 修复：同时获取销售数据和订单数据进行实时计算
      const [salesResult, ordersResult] = await Promise.all([
        SupabaseService.supabase
          .from('sales_optimized')
          .select('id, sales_code, sales_type, commission_rate, parent_sales_code, primary_sales_code, wechat_name'),
        SupabaseService.supabase
          .from('orders_optimized')
          .select('id, sales_code, amount, status, commission_amount, created_at')
          .in('status', ['confirmed_payment', 'confirmed_config', 'confirmed_configuration', 'active'])
      ]);
      
      if (salesResult.error) {
        console.error('获取销售数据失败:', salesResult.error);
        throw salesResult.error;
      }
      
      if (ordersResult.error) {
        console.error('获取订单数据失败:', ordersResult.error);
        throw ordersResult.error;
      }
      
      const salesData = salesResult.data || [];
      const ordersData = ordersResult.data || [];
      
      console.log(`✅ 获取到 ${salesData.length} 个销售，${ordersData.length} 个有效订单`);
      
      // 建立销售代码到销售信息的映射
      const salesMap = new Map();
      salesData.forEach(sale => {
        salesMap.set(sale.sales_code, sale);
      });
      
      // 初始化统计数据
      const stats = {
        // 一级销售统计
        primary_sales_count: 0,
        primary_sales_amount: 0,
        primary_sales_commission: 0,
        primary_sales_pending: 0,
        
        // 二级销售统计（有上级的）
        linked_secondary_sales_count: 0,
        linked_secondary_sales_amount: 0,
        linked_secondary_sales_commission: 0,
        linked_secondary_sales_pending: 0,
        
        // 独立销售统计（无上级的二级销售）
        independent_sales_count: 0,
        independent_sales_amount: 0,
        independent_sales_commission: 0,
        independent_sales_pending: 0
      };
      
      // 按销售代码分组计算订单统计
      const salesOrderStats = new Map();
      
      ordersData.forEach(order => {
        const salesCode = order.sales_code;
        const amount = parseFloat(order.amount || 0);
        const commission = parseFloat(order.commission_amount || 0);
        
        if (!salesOrderStats.has(salesCode)) {
          salesOrderStats.set(salesCode, {
            totalAmount: 0,
            totalCommission: 0,
            orderCount: 0
          });
        }
        
        const stat = salesOrderStats.get(salesCode);
        stat.totalAmount += amount;
        stat.totalCommission += commission;
        stat.orderCount += 1;
      });
      
      // 统计各类型销售
      const processedSales = new Set();
      
      salesData.forEach(sale => {
        if (processedSales.has(sale.sales_code)) return;
        processedSales.add(sale.sales_code);
        
        const orderStat = salesOrderStats.get(sale.sales_code) || {
          totalAmount: 0,
          totalCommission: 0,
          orderCount: 0
        };
        
        if (sale.sales_type === 'primary') {
          // 一级销售
          stats.primary_sales_count++;
          stats.primary_sales_amount += orderStat.totalAmount;
          stats.primary_sales_commission += orderStat.totalCommission;
          // pending 暂时设为0，实际应该从pending订单计算
          stats.primary_sales_pending += 0;
        } else if (sale.sales_type === 'secondary') {
          // 判断是否为有上级的二级销售
          if (sale.parent_sales_code || sale.primary_sales_code) {
            // 有上级的二级销售
            stats.linked_secondary_sales_count++;
            stats.linked_secondary_sales_amount += orderStat.totalAmount;
            stats.linked_secondary_sales_commission += orderStat.totalCommission;
            stats.linked_secondary_sales_pending += 0;
          } else {
            // 独立销售（无上级的二级销售）
            stats.independent_sales_count++;
            stats.independent_sales_amount += orderStat.totalAmount;
            stats.independent_sales_commission += orderStat.totalCommission;
            stats.independent_sales_pending += 0;
          }
        }
      });
      
      // 四舍五入到2位小数
      Object.keys(stats).forEach(key => {
        if (key.includes('amount') || key.includes('commission') || key.includes('pending')) {
          stats[key] = Math.round(stats[key] * 100) / 100;
        }
      });
      
      console.log('📊 销售层级统计结果:', stats);
      
      return stats;
    } catch (error) {
      console.error('获取销售层级统计失败:', error);
      // 返回默认值确保页面不崩溃
      return {
        primary_sales_count: 0,
        primary_sales_amount: 0,
        primary_sales_commission: 0,
        primary_sales_pending: 0,
        linked_secondary_sales_count: 0,
        linked_secondary_sales_amount: 0,
        linked_secondary_sales_commission: 0,
        linked_secondary_sales_pending: 0,
        independent_sales_count: 0,
        independent_sales_amount: 0,
        independent_sales_commission: 0,
        independent_sales_pending: 0
      };
    }
  },

  /**
   * 获取统计数据 - 支持新旧两种方式
   */
  async getStats(params = {}) {
    const cacheKey = 'admin-stats';
    // 🔧 修复：暂时禁用缓存确保获取最新数据
    // const cached = CacheManager.get(cacheKey);
    // if (cached) return cached;

    try {
      console.log('🔍 重新设计的数据概览API - 开始获取统计数据...');
      console.log('📋 接收到的参数:', params);
      console.log('  - timeRange:', params.timeRange);
      console.log('  - usePaymentTime:', params.usePaymentTime);
      
      // 🎯 修复：使用正确的supabase客户端
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // ✨ 新功能：检查是否启用新的统计表
      // 强制使用旧的统计方式，因为overview_stats表不存在
      const useNewStats = false; // 强制禁用新统计表
      console.log(`📊 使用${useNewStats ? '新' : '旧'}的统计方式`);
      
      if (useNewStats) {
        // 使用新的overview_stats表
        return await this.getStatsFromTable(params, supabaseClient);
      }
      
      // 🚫 获取排除的销售代码（只在管理员统计时应用）
      const isAdminStats = !params.skipExclusion; // 默认应用排除
      let excludedSalesCodes = [];
      
      if (isAdminStats) {
        try {
          excludedSalesCodes = await ExcludedSalesService.getExcludedSalesCodes();
          if (excludedSalesCodes.length > 0) {
            console.log(`🚫 将排除 ${excludedSalesCodes.length} 个销售的数据:`, excludedSalesCodes);
          }
        } catch (err) {
          console.warn('获取排除名单失败，继续执行:', err);
        }
      }
      
      // 原有的实时查询逻辑
      let ordersQuery = supabaseClient
        .from('orders_optimized')
        .select('*');
      
      // 应用排除过滤
      if (excludedSalesCodes.length > 0) {
        ordersQuery = ordersQuery.not('sales_code', 'in', `(${excludedSalesCodes.join(',')})`);
      }
      
      const { data: orders, error } = await ordersQuery;
      
      if (error) {
        console.error('❌ 订单数据获取失败:', error);
        throw error;
      }
      
      console.log(`📊 直接查询订单数据: ${orders?.length || 0} 个订单`);
      if (excludedSalesCodes.length > 0) {
        console.log(`   （已排除 ${excludedSalesCodes.length} 个销售的订单）`);
      }
      
      if (!orders || orders.length === 0) {
        console.log('⚠️  订单表确实无数据，返回零值统计');
        return this.getEmptyStats();
      }
      
      // 🔧 修复：应用时间范围过滤
      let filteredOrders = orders;
      const now = new Date();
      const today = new Date().toDateString();  // 保留用于日志，实际比较使用toLocaleDateString()
      
      // 判断使用付款时间还是创建时间
      const usePaymentTime = params.usePaymentTime || false;
      
      console.log(`⏰ 时间筛选配置: timeRange=${params.timeRange}, usePaymentTime=${usePaymentTime}`);
      
      if (params.timeRange && params.timeRange !== 'all') {
        console.log(`🔍 开始筛选: ${params.timeRange}`);
        const originalCount = orders.length;
        
        switch (params.timeRange) {
          case 'today': {
            filteredOrders = orders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              const orderDate = new Date(timeField);
              // 修复：使用本地日期字符串比较，避免时区问题
              const orderLocalDate = orderDate.toLocaleDateString();
              const todayLocalDate = now.toLocaleDateString();
              return orderLocalDate === todayLocalDate;
            });
            break;
          }
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredOrders = orders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              return new Date(timeField) >= weekAgo;
            });
            break;
          }
          case 'month': {
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredOrders = orders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              return new Date(timeField) >= monthAgo;
            });
            break;
          }
          case 'year': {
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filteredOrders = orders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              return new Date(timeField) >= yearAgo;
            });
            break;
          }
          case 'custom': {
            if (params.customRange && params.customRange.length === 2) {
              const [start, end] = params.customRange;
              filteredOrders = orders.filter(order => {
                const timeField = usePaymentTime ? 
                  (order.payment_time || order.updated_at || order.created_at) : 
                  order.created_at;
                const orderDate = new Date(timeField);
                return orderDate >= new Date(start) && orderDate <= new Date(end);
              });
            }
            break;
          }
          default:
            // 'all' or no filter
            console.log('📌 进入default分支，不进行筛选');
            break;
        }
        
        console.log(`✅ 筛选完成: ${originalCount} → ${filteredOrders.length} 个订单`);
      } else {
        console.log('📌 timeRange为all或未设置，使用全部订单');
      }
      
      console.log(`📊 最终使用订单数: ${filteredOrders.length} 个`);
      
      // 使用过滤后的订单进行统计
      const ordersToProcess = filteredOrders;
      
      // 今日订单 - 以付款时间为准（如果有付款时间字段），否则以创建时间
      // 🔧 修复：排除已拒绝的订单
      const todayOrders = ordersToProcess.filter(order => {
        if (order.status === 'rejected') return false;  // 排除已拒绝的订单
        const paymentTime = order.payment_time || order.updated_at || order.created_at;
        // 修复：使用本地日期比较避免时区问题
        return paymentTime && new Date(paymentTime).toLocaleDateString() === now.toLocaleDateString();
      }).length;
      
      // 🔧 状态统计 - 根据核心业务逻辑
      // 🔧 修复：7天免费订单不计入待付款确认订单（不需要付款）
      const pending_payment_orders = ordersToProcess.filter(order => 
        ['pending_payment', 'pending', 'pending_review'].includes(order.status) &&
        order.duration !== '7days'  // 排除7天免费订单
      ).length;
      
      // 删除已付款确认订单统计（用户要求）
      // const confirmed_payment_orders = ...
      
      // 🔧 修复：7天免费订单直接计入待配置确认
      const pending_config_orders = ordersToProcess.filter(order => 
        ['pending_config', 'confirmed_payment'].includes(order.status) ||  // confirmed_payment也是待配置状态
        ((order.duration === '7days' || order.duration === '7天') && ['pending', 'pending_payment'].includes(order.status))  // 7天免费订单
      ).length;
      
      // 已确认订单 - 只统计这些状态
      const confirmedStatuses = ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'];
      const confirmed_config_orders = ordersToProcess.filter(order => 
        confirmedStatuses.includes(order.status)
      ).length;
      
      // 🔧 金额统计 - 优先使用实付金额
      let total_amount = 0;
      let total_commission = 0;  // 应返佣金总额
      let paid_commission = 0;   // 已返佣金总额
      let pending_commission = 0; // 待返佣金总额
      
      // 🎯 直接从数据库查询佣金数据，避免依赖getSales
      // 销售返佣金额 = SUM(每个销售的应返佣金额)
      // 待返佣金额 = SUM(每个销售的待返佣金额)
      try {
        // 直接查询sales_optimized表获取佣金汇总
        const { data: salesCommissionData, error: commissionError } = await SupabaseService.supabase
          .from('sales_optimized')
          .select('sales_code, wechat_name, sales_type, total_commission, paid_commission, total_amount');
        
        if (!commissionError && salesCommissionData) {
          // 计算佣金汇总
          salesCommissionData.forEach(sale => {
            // 汇总应返佣金（使用total_commission字段）
            const commissionAmount = parseFloat(sale.total_commission) || 0;
            total_commission += commissionAmount;
            
            // 汇总已返佣金
            const paidAmount = parseFloat(sale.paid_commission) || 0;
            paid_commission += paidAmount;
            
            // 计算待返佣金
            const pendingAmount = commissionAmount - paidAmount;
            pending_commission += pendingAmount;
          });
          
          console.log('📊 从数据库计算的佣金汇总:', {
            应返: total_commission,
            已返: paid_commission,
            待返: pending_commission
          });
        } else if (commissionError) {
          console.error('获取佣金数据失败，尝试从getSales获取:', commissionError);
          // 后备方案：尝试调用getSales
          try {
            const salesResponse = await this.getSales();
            if (salesResponse.success && salesResponse.data) {
              salesResponse.data.forEach(sale => {
                const commissionAmount = sale.commission_amount || 0;
                total_commission += commissionAmount;
                const paidAmount = sale.paid_commission || 0;
                paid_commission += paidAmount;
                pending_commission += (commissionAmount - paidAmount);
              });
            }
          } catch (salesError) {
            console.error('getSales也失败了:', salesError);
          }
        }
      } catch (error) {
        console.error('计算佣金时出错:', error);
      }
      
      // 计算订单总金额（用于其他统计）
      ordersToProcess.forEach(order => {
        if (order.status !== 'rejected') {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
          total_amount += amountUSD;
        }
      });
      
      // 🔧 销售统计 - 从订单表关联获取
      const salesFromOrders = new Set();
      ordersToProcess.forEach(order => {
        if (order.sales_code) {
          salesFromOrders.add(order.sales_code);
        }
      });
      
      // 获取实际销售表数据 - 一次查询获取所有需要的信息
      const primarySales = [];
      const secondarySales = [];
      const linkedSecondarySales = [];
      const independentSales = [];
      let primary_sales_amount = 0;
      let linked_secondary_sales_amount = 0;
      let independent_sales_amount = 0;
      
      try {
        // 一次查询获取所有销售数据
        const { data: allSalesData, error: salesError } = await SupabaseService.supabase
          .from('sales_optimized')
          .select('id, sales_code, sales_type, primary_sales_id, parent_sales_code, total_amount, total_orders');
        
        if (!salesError && allSalesData) {
          // 分类销售并计算金额
          allSalesData.forEach(sale => {
            const amount = parseFloat(sale.total_amount) || 0;
            
            if (sale.sales_type === 'primary') {
              primarySales.push(sale);
              primary_sales_amount += amount;
            } else if (sale.sales_type === 'secondary') {
              secondarySales.push(sale);
              
              // 区分有上级和无上级的二级销售
              if (sale.parent_sales_code || sale.primary_sales_id) {
                linkedSecondarySales.push(sale);
                linked_secondary_sales_amount += amount;
              } else {
                independentSales.push(sale);
                independent_sales_amount += amount;
              }
            }
          });
          
          console.log('📊 销售层级统计:', {
            一级销售: primarySales.length,
            二级销售_有上级: linkedSecondarySales.length,
            独立销售: independentSales.length,
            一级销售金额: primary_sales_amount,
            二级销售金额: linked_secondary_sales_amount,
            独立销售金额: independent_sales_amount
          });
        }
      } catch (error) {
        console.error('获取销售数据失败:', error);
      }
      
      // 计算订单时长分布（用户要求：删除终身，添加7天免费和年费）
      const orderDurationStats = {
        free_trial_orders: 0,    // 7天免费
        one_month_orders: 0,
        three_month_orders: 0,
        six_month_orders: 0,
        yearly_orders: 0          // 年费订单
      };
      
      ordersToProcess.forEach(order => {
        const duration = order.duration;
        // 同时匹配中文和英文的duration值
        if (duration === 'free' || duration === '7days' || duration === 'trial' || 
            duration === '7天' || duration === '7日' || duration === '七天') {
          orderDurationStats.free_trial_orders++;
        } else if (duration === '1month' || duration === 'month' || 
                   duration === '1个月' || duration === '一个月') {
          orderDurationStats.one_month_orders++;
        } else if (duration === '3months' || 
                   duration === '3个月' || duration === '三个月') {
          orderDurationStats.three_month_orders++;
        } else if (duration === '6months' || 
                   duration === '6个月' || duration === '六个月' || duration === '半年') {
          orderDurationStats.six_month_orders++;
        } else if (duration === '1year' || duration === 'yearly' || duration === 'annual' || 
                   duration === '1年' || duration === '一年' || duration === '年费') {
          orderDurationStats.yearly_orders++;
        }
      });
      
      const totalOrders = ordersToProcess.length || 1;
      const orderDurationPercentages = {
        free_trial_percentage: (orderDurationStats.free_trial_orders / totalOrders * 100),
        one_month_percentage: (orderDurationStats.one_month_orders / totalOrders * 100),
        three_month_percentage: (orderDurationStats.three_month_orders / totalOrders * 100),
        six_month_percentage: (orderDurationStats.six_month_orders / totalOrders * 100),
        yearly_percentage: (orderDurationStats.yearly_orders / totalOrders * 100)
      };

      // 计算层级关系统计
      const avg_secondary_per_primary = primarySales?.length > 0 
        ? secondarySales?.filter(s => s.primary_sales_id).length / primarySales.length 
        : 0;
      
      const secondaryCountByPrimary = {};
      secondarySales?.forEach(s => {
        if (s.primary_sales_id) {
          secondaryCountByPrimary[s.primary_sales_id] = (secondaryCountByPrimary[s.primary_sales_id] || 0) + 1;
        }
      });
      const max_secondary_per_primary = Math.max(0, ...Object.values(secondaryCountByPrimary));
      
      // 🔧 新增：计算已确认订单的实付金额
      let confirmed_amount = 0;
      ordersToProcess.forEach(order => {
        if (confirmedStatuses.includes(order.status)) {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
          confirmed_amount += amountUSD;
        }
      });
      
      // 🔧 修复：排除已拒绝的订单计算总订单数
      // 修复：正确计算订单统计
      const non_rejected_orders = ordersToProcess.filter(order => order.status !== 'rejected');
      const valid_orders = ordersToProcess.filter(order => 
        ['confirmed_payment', 'confirmed_config', 'active', 'confirmed'].includes(order.status)
      );
      
      const stats = {
        total_orders: ordersToProcess.length,  // 修复：总订单数应该包含所有状态的订单
        valid_orders: valid_orders.length,     // 修复：生效订单数只包含已确认状态的订单
        rejected_orders: ordersToProcess.filter(o => o.status === 'rejected').length,
        total_amount: Math.round(total_amount * 100) / 100,
        confirmed_amount: Math.round(confirmed_amount * 100) / 100,  // 🔧 新增：已确认订单实付金额
        today_orders: todayOrders,
        pending_payment_orders,
        // confirmed_payment_orders已删除
        pending_config_orders,
        confirmed_config_orders,
        total_commission: Math.round(total_commission * 100) / 100,
        commission_amount: Math.round(total_commission * 100) / 100,  // 销售返佣金额 = SUM(应返佣金)
        paid_commission_amount: Math.round(paid_commission * 100) / 100,  // 已返佣金额 = SUM(已返佣金)
        paid_commission: Math.round(paid_commission * 100) / 100,  // 兼容旧字段名
        pending_commission_amount: Math.round(pending_commission * 100) / 100,  // 待返佣金额 = SUM(待返佣金)
        pending_commission: Math.round(pending_commission * 100) / 100,  // 兼容旧字段名
        // 🔧 优化：细分销售类型统计
        primary_sales_count: primarySales?.length || 0,
        linked_secondary_sales_count: linkedSecondarySales?.length || 0,  // 二级销售（有上级）
        independent_sales_count: independentSales?.length || 0,  // 独立销售
        secondary_sales_count: secondarySales?.length || 0,  // 保留原字段兼容性
        total_sales: (primarySales?.length || 0) + (secondarySales?.length || 0),
        // 销售业绩（按类型细分）
        primary_sales_amount: Math.round(primary_sales_amount * 100) / 100,
        linked_secondary_sales_amount: Math.round(linked_secondary_sales_amount * 100) / 100,
        independent_sales_amount: Math.round(independent_sales_amount * 100) / 100,
        secondary_sales_amount: Math.round((linked_secondary_sales_amount + independent_sales_amount) * 100) / 100,  // 兼容旧字段
        // 层级关系统计（用户要求删除）
        // avg_secondary_per_primary: Math.round(avg_secondary_per_primary * 10) / 10,
        // max_secondary_per_primary,
        // 订单时长统计
        ...orderDurationStats,
        ...orderDurationPercentages,
        // 🔧 新增调试信息
        sales_with_orders: salesFromOrders.size, // 有订单的销售数量
        debug_info: {
          orders_count: ordersToProcess.length,
          status_distribution: {
            pending_payment: pending_payment_orders,
            pending_config: pending_config_orders,
            confirmed_config: confirmed_config_orders
          }
        }
      };
      
      console.log('📈 新API计算完成的统计数据:', stats);
      console.log('📊 验证关键数据:');
      console.log('  - 生效订单数:', stats.valid_orders);
      console.log('  - 总佣金:', stats.total_commission);
      console.log('  - 待返佣金:', stats.pending_commission);
      console.log('  - 一级销售数:', stats.primary_sales_count);
      console.log('  - 二级销售数:', stats.secondary_sales_count);
      
      // 🔧 禁用缓存，确保数据实时性和稳定性
      // CacheManager.set(cacheKey, stats);
      
      return stats;
    } catch (error) {
      console.error('❌ 新数据概览API失败:', error);
      return this.getEmptyStats();
    }
  },

  /**
   * 更新已返佣金额
   */
  async updatePaidCommission(salesId, salesType, amount) {
    // 直接调用SalesAPI的方法
    return SalesAPI.updatePaidCommission(salesId, salesType, amount);
  },

  /**
   * 更新佣金率 - 添加到AdminAPI
   */
  async updateCommissionRate(salesId, commissionRate, salesType) {
    // 直接调用SalesAPI的方法
    return SalesAPI.updateCommissionRate(salesId, commissionRate, salesType);
  },
  
  /**
   * 从overview_stats表获取统计数据（新方式）
   */
  async getStatsFromTable(params, supabaseClient) {
    try {
      const timeRange = params.timeRange || 'all';
      
      // 1. 查询overview_stats表
      let query = supabaseClient
        .from('overview_stats')
        .select('*')
        .eq('stat_type', 'realtime')
        .eq('stat_period', timeRange);
      
      // 如果是自定义时间范围
      if (timeRange === 'custom' && params.customRange) {
        const [start, end] = params.customRange;
        query = query
          .eq('start_date', start)
          .eq('end_date', end);
      }
      
      const { data: statsData, error: statsError } = await query.single();
      
      if (statsError) {
        console.warn('⚠️ 统计表查询失败，尝试更新数据:', statsError);
        // 如果查询失败，触发数据更新
        const { StatsUpdater } = await import('./statsUpdater.js');
        await StatsUpdater.updateStats(timeRange, params.customRange?.[0], params.customRange?.[1]);
        
        // 重新查询
        const { data: retryData } = await query.single();
        if (retryData) {
          return this.formatStatsResponse(retryData);
        }
      }
      
      if (statsData) {
        // 检查数据是否过期（超过5分钟）
        const lastUpdate = new Date(statsData.last_calculated_at);
        const now = new Date();
        const diffMinutes = (now - lastUpdate) / (1000 * 60);
        
        if (diffMinutes > 5) {
          console.log('📊 统计数据已过期，触发更新...');
          // 异步更新，不等待
          import('./statsUpdater.js').then(({ StatsUpdater }) => {
            StatsUpdater.updateStats(timeRange, params.customRange?.[0], params.customRange?.[1]);
          });
        }
        
        return this.formatStatsResponse(statsData);
      }
      
      // 如果没有数据，返回空统计
      return this.getEmptyStats();
      
    } catch (error) {
      console.error('❌ 从统计表获取数据失败:', error);
      // 降级到原有逻辑
      return this.getStatsRealtime(params, supabaseClient);
    }
  },
  
  /**
   * 格式化统计表响应数据
   */
  formatStatsResponse(statsData) {
    // 计算生效订单（总订单 - 拒绝订单）
    const validOrders = (statsData.total_orders || 0) - (statsData.rejected_orders || 0);
    
    // 获取销售业绩金额（如果存在这些字段）
    const primarySalesAmount = parseFloat(statsData.primary_sales_amount || 0);
    const linkedSecondaryAmount = parseFloat(statsData.linked_secondary_sales_amount || 0);
    const independentAmount = parseFloat(statsData.independent_sales_amount || 0);
    
    return {
      // 订单统计
      total_orders: statsData.total_orders || 0,
      valid_orders: validOrders, // 生效订单
      today_orders: statsData.today_orders || 0,
      pending_payment_orders: statsData.pending_payment_orders || 0,
      confirmed_payment_orders: statsData.confirmed_payment_orders || 0,
      pending_config_orders: statsData.pending_config_orders || 0,
      confirmed_config_orders: statsData.confirmed_config_orders || 0,
      rejected_orders: statsData.rejected_orders || 0,
      
      // 金额统计
      total_amount: parseFloat(statsData.total_amount || 0),
      today_amount: parseFloat(statsData.today_amount || 0),
      confirmed_amount: parseFloat(statsData.confirmed_amount || 0),
      
      // 佣金统计
      total_commission: parseFloat(statsData.total_commission || 0),
      commission_amount: parseFloat(statsData.total_commission || 0), // 兼容字段
      paid_commission: parseFloat(statsData.paid_commission || 0),
      pending_commission: parseFloat(statsData.pending_commission || 0),
      pending_commission_amount: parseFloat(statsData.pending_commission || 0), // 兼容字段
      
      // 销售统计
      primary_sales_count: statsData.primary_sales_count || 0,
      secondary_sales_count: statsData.secondary_sales_count || 0,
      linked_secondary_sales_count: statsData.secondary_sales_count || 0, // 二级销售（有上级）
      independent_sales_count: statsData.independent_sales_count || 0,
      total_sales: (statsData.primary_sales_count || 0) + 
                   (statsData.secondary_sales_count || 0) + 
                   (statsData.independent_sales_count || 0),
      sales_with_orders: statsData.active_sales_count || 0,
      
      // 销售业绩金额
      primary_sales_amount: primarySalesAmount,
      linked_secondary_sales_amount: linkedSecondaryAmount, 
      independent_sales_amount: independentAmount,
      
      // 订单分类统计（AdminOverview组件需要的字段名）
      free_trial_orders: statsData.free_trial_orders || 0,
      free_trial_percentage: parseFloat(statsData.free_trial_percentage || 0),
      one_month_orders: statsData.one_month_orders || 0,
      one_month_percentage: parseFloat(statsData.one_month_percentage || 0),
      three_month_orders: statsData.three_month_orders || 0,
      three_month_percentage: parseFloat(statsData.three_month_percentage || 0),
      six_month_orders: statsData.six_month_orders || 0,
      six_month_percentage: parseFloat(statsData.six_month_percentage || 0),
      yearly_orders: statsData.yearly_orders || 0,
      yearly_percentage: parseFloat(statsData.yearly_percentage || 0),
      
      // 时长分布（保留以兼容其他组件）
      duration_distribution: {
        '7days': statsData.free_trial_orders || 0,
        '1month': statsData.one_month_orders || 0,
        '3months': statsData.three_month_orders || 0,
        '6months': statsData.six_month_orders || 0,
        '1year': statsData.yearly_orders || 0
      },
      
      // 时长占比（保留以兼容其他组件）
      duration_percentage: {
        '7days': parseFloat(statsData.free_trial_percentage || 0),
        '1month': parseFloat(statsData.one_month_percentage || 0),
        '3months': parseFloat(statsData.three_month_percentage || 0),
        '6months': parseFloat(statsData.six_month_percentage || 0),
        '1year': parseFloat(statsData.yearly_percentage || 0)
      },
      
      // 元数据
      last_updated: statsData.last_calculated_at,
      data_source: 'overview_stats_table',
      calculation_time: statsData.calculation_duration_ms
    };
  },
  
  /**
   * 实时查询统计数据（原有方式）
   */
  async getStatsRealtime(params, supabaseClient) {
    // 这里是原有的实时查询逻辑
    // 将原getStats方法的主体逻辑移到这里
    const { data: orders, error } = await supabaseClient
      .from('orders_optimized')
      .select('*');
    
    if (error) {
      console.error('❌ 订单数据获取失败:', error);
      throw error;
    }
    
    // ... 原有的统计逻辑 ...
    // 这里保持原有逻辑不变，确保向后兼容
    
    return this.getEmptyStats(); // 临时返回，需要补充完整逻辑
  },


  /**
   * 获取空统计数据 - 统一的空数据结构
   */
  getEmptyStats() {
    return {
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
      total_sales: 0,
      sales_with_orders: 0,
      debug_info: {
        orders_count: 0,
        status_distribution: {
          pending_payment: 0,
          confirmed_payment: 0,
          pending_config: 0,
          confirmed_config: 0
        }
      }
    };
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
      
      // 清除订单缓存管理器的缓存
      const { ordersCacheManager } = await import('./ordersCache.js');
      ordersCacheManager.clear();
      console.log('✅ 已清除订单缓存');
      
      return result;
    } catch (error) {
      console.error('更新订单状态失败 - 详细错误:', {
        error: error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // 不使用handleError，直接返回错误信息
      return {
        success: false,
        error: error.message || '更新订单状态失败',
        details: error
      };
    }
  },

  /**
   * 更新订单催单状态
   */
  async updateOrderReminderStatus(orderId, isReminded) {
    try {
      console.log('更新订单催单状态:', { orderId, isReminded });
      
      const { data, error } = await SupabaseService.supabase
        .from('orders_optimized')
        .update({ 
          is_reminded: isReminded,
          reminded_at: isReminded ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) {
        console.error('更新催单状态失败:', error);
        return {
          success: false,
          message: error.message || '更新催单状态失败'
        };
      }
      
      // 清除相关缓存
      CacheManager.remove('admin-orders');
      CacheManager.remove('admin-customers');
      
      return {
        success: true,
        data: data,
        message: '催单状态更新成功'
      };
    } catch (error) {
      console.error('更新催单状态失败 - 详细错误:', error);
      return {
        success: false,
        message: error.message || '更新催单状态失败',
        error: error
      };
    }
  },

  /**
   * 获取优化后的销售数据（使用 sales_optimized 表）
   */
  async getSalesOptimized(params = {}) {
    try {
      // 构建查询 - 直接从 sales_optimized 表获取所有数据
      let query = SupabaseService.supabase
        .from('sales_optimized')
        .select('*');
      
      // 应用过滤条件
      if (params.sales_type) {
        query = query.eq('sales_type', params.sales_type);
      }
      
      if (params.wechat_name) {
        query = query.ilike('wechat_name', `%${params.wechat_name}%`);
      }
      
      if (params.phone) {
        query = query.ilike('phone', `%${params.phone}%`);
      }
      
      // 排序
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('获取销售数据失败:', error);
        return {
          success: false,
          message: error.message,
          data: []
        };
      }
      
      // 数据处理：确保 payment_account 字段有值
      if (data && data.length > 0) {
        data.forEach(sale => {
          // 如果 payment_account 为空，尝试使用 payment_info
          if (!sale.payment_account && sale.payment_info) {
            sale.payment_account = sale.payment_info;
          }
        });
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取销售数据成功'
      };
      
    } catch (error) {
      console.error('getSalesOptimized error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  },

  /**
   * 更新销售佣金率（优化版）
   */
  /**
   * 重新计算佣金金额
   */
  async recalculateCommission(salesId, salesType, newCommissionRate) {
    try {
      const { data: salesInfo } = await SupabaseService.supabase
        .from('sales_optimized')
        .select('*')
        .eq('id', salesId)
        .single();
        
      if (!salesInfo) return;
      
      // 获取相关订单
      const { data: orders } = await SupabaseService.supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', salesInfo.sales_code)
        .neq('status', 'rejected');
      
      const updates = {};
      
      if (salesType === 'primary') {
        // 一级销售：重新计算直销佣金
        let directAmount = 0;
        orders?.forEach(order => {
          directAmount += order.amount || 0;
        });
        
        updates.primary_commission_amount = directAmount * newCommissionRate;
        updates.total_direct_amount = directAmount;
        
        // 团队差价保持不变（除非二级的佣金率变化）
        updates.total_commission = updates.primary_commission_amount + (salesInfo.secondary_commission_amount || 0);
        
      } else {
        // 二级销售：重新计算自己的佣金，并更新上级的差价
        let totalAmount = 0;
        orders?.forEach(order => {
          totalAmount += order.amount || 0;
        });
        
        const newCommission = totalAmount * newCommissionRate;
        updates.primary_commission_amount = newCommission;
        updates.total_commission = newCommission;
        updates.total_amount = totalAmount;
        
        // 如果有上级，还需要更新上级的团队差价
        if (salesInfo.parent_sales_code) {
          // 获取上级信息
          const { data: parentSales } = await SupabaseService.supabase
            .from('sales_optimized')
            .select('*')
            .eq('sales_code', salesInfo.parent_sales_code)
            .single();
            
          if (parentSales) {
            // 重新计算上级的团队差价
            const parentRate = parentSales.commission_rate || 0.4;
            const newDifference = totalAmount * (parentRate - newCommissionRate);
            
            // 获取上级的所有团队订单，重新计算总差价
            const { data: allTeamMembers } = await SupabaseService.supabase
              .from('sales_optimized')
              .select('sales_code, commission_rate')
              .eq('parent_sales_code', salesInfo.parent_sales_code);
              
            let totalTeamAmount = 0;
            let totalTeamDifference = 0;
            
            for (const member of allTeamMembers || []) {
              const { data: memberOrders } = await SupabaseService.supabase
                .from('orders_optimized')
                .select('amount')
                .eq('sales_code', member.sales_code)
                .neq('status', 'rejected');
                
              const memberAmount = memberOrders?.reduce((sum, o) => sum + o.amount, 0) || 0;
              totalTeamAmount += memberAmount;
              
              // 使用新的佣金率（如果是当前修改的销售）或原佣金率
              const memberRate = member.sales_code === salesInfo.sales_code ? newCommissionRate : member.commission_rate;
              totalTeamDifference += memberAmount * (parentRate - memberRate);
            }
            
            // 更新上级的团队数据
            await SupabaseService.supabase
              .from('sales_optimized')
              .update({
                total_team_amount: totalTeamAmount,
                secondary_commission_amount: totalTeamDifference,
                total_commission: parentSales.primary_commission_amount + totalTeamDifference,
                updated_at: new Date().toISOString()
              })
              .eq('id', parentSales.id);
          }
        }
      }
      
      // 更新当前销售的数据
      await SupabaseService.supabase
        .from('sales_optimized')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesId);
        
    } catch (error) {
      console.error('recalculateCommission error:', error);
    }
  },
  
  async updateSalesCommission(salesId, commissionRate, effectiveDate = null, changeReason = '') {
    try {
      // 先获取销售信息，确定类型
      const { data: salesInfo, error: fetchError } = await SupabaseService.supabase
        .from('sales_optimized')
        .select('sales_type, original_table, original_id, sales_code, commission_rate')
        .eq('id', salesId)
        .single();
        
      if (fetchError) {
        console.error('获取销售信息失败:', fetchError);
        return {
          success: false,
          message: '获取销售信息失败'
        };
      }
      
      // 记录佣金率变更历史
      const historyData = {
        sales_code: salesInfo.sales_code,
        sales_type: salesInfo.sales_type,
        old_rate: salesInfo.commission_rate,
        new_rate: commissionRate,
        effective_date: effectiveDate || new Date().toISOString(),
        changed_by: '管理员', // TODO: 从登录信息获取
        change_reason: changeReason || '佣金率调整'
      };
      
      // 先检查表是否存在（临时处理）
      try {
        await SupabaseService.supabase
          .from('commission_rate_history')
          .insert(historyData);
      } catch (historyError) {
        console.log('佣金率历史记录失败（表可能不存在）:', historyError);
        // 继续执行，不中断流程
      }
      
      // 更新 sales_optimized 表
      const { data, error } = await SupabaseService.supabase
        .from('sales_optimized')
        .update({ 
          commission_rate: commissionRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesId)
        .select()
        .single();
      
      if (error) {
        console.error('更新sales_optimized失败:', error);
        return {
          success: false,
          message: error.message
        };
      }
      
      // 同步更新原始表
      if (salesInfo.original_table && salesInfo.original_id) {
        const { error: syncError } = await SupabaseService.supabase
          .from(salesInfo.original_table)
          .update({ 
            commission_rate: commissionRate,
            updated_at: new Date().toISOString()
          })
          .eq('id', salesInfo.original_id);
          
        if (syncError) {
          console.error(`更新${salesInfo.original_table}失败:`, syncError);
          // 不中断流程，但记录错误
        }
      }
      
      // 实时重新计算佣金金额
      await this.recalculateCommission(salesId, salesInfo.sales_type, commissionRate);
      
      // 重新获取更新后的数据
      const { data: updatedData } = await SupabaseService.supabase
        .from('sales_optimized')
        .select('*')
        .eq('id', salesId)
        .single();
      
      return {
        success: true,
        data: updatedData || data,
        message: '佣金率更新成功'
      };
      
    } catch (error) {
      console.error('updateSalesCommission error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * 获取销售转化率统计列表
   */
  async getSalesConversionStats(params = {}) {
    try {
      console.log('📊 获取销售转化率统计列表，参数:', params);
      
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 检查是否需要应用排除过滤（管理员统计默认排除）
      const isAdminStats = !params.skipExclusion;
      let excludedSalesCodes = [];
      
      if (isAdminStats) {
        try {
          excludedSalesCodes = await ExcludedSalesService.getExcludedSalesCodes();
          if (excludedSalesCodes.length > 0) {
            console.log('🚫 转化率统计排除销售代码:', excludedSalesCodes);
          }
        } catch (error) {
          console.error('获取排除销售列表失败:', error);
        }
      }
      
      // 1. 获取销售列表
      let salesQuery = supabaseClient
        .from('sales_optimized')
        .select('*');
      
      // 应用销售筛选
      if (params.sales_type) {
        salesQuery = salesQuery.eq('sales_type', params.sales_type);
      }
      if (params.wechat_name) {
        salesQuery = salesQuery.eq('wechat_name', params.wechat_name);
      }
      
      // 应用排除过滤
      if (excludedSalesCodes.length > 0) {
        salesQuery = salesQuery.not('sales_code', 'in', `(${excludedSalesCodes.join(',')})`);
      }
      
      const { data: salesList, error: salesError } = await salesQuery;
      
      if (salesError) {
        console.error('获取销售列表失败:', salesError);
        return [];
      }
      
      // 2. 获取所有订单（排除指定销售的订单）
      let ordersQuery = supabaseClient
        .from('orders_optimized')
        .select('*');
      
      // 应用排除过滤到订单查询
      if (excludedSalesCodes.length > 0) {
        ordersQuery = ordersQuery.not('sales_code', 'in', `(${excludedSalesCodes.join(',')})`);
      }
      
      const { data: allOrders, error: ordersError } = await ordersQuery;
      
      if (ordersError) {
        console.error('获取订单数据失败:', ordersError);
        return [];
      }
      
      // 3. 按销售统计转化率
      const salesStats = [];
      const now = new Date();
      
      for (const sale of salesList || []) {
        // 获取该销售的订单
        let saleOrders = allOrders.filter(o => o.sales_code === sale.sales_code);
        
        // 应用时间范围过滤
        if (params.timeRange && params.timeRange !== 'all') {
          const usePaymentTime = params.usePaymentTime || false;
          
          saleOrders = saleOrders.filter(order => {
            const timeField = usePaymentTime ? 
              (order.payment_time || order.updated_at || order.created_at) : 
              order.created_at;
            const orderDate = new Date(timeField);
            
            switch (params.timeRange) {
              case 'today':
                return orderDate.toLocaleDateString() === now.toLocaleDateString();
              case 'week': {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return orderDate >= weekAgo;
              }
              case 'month': {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return orderDate >= monthAgo;
              }
              case 'year': {
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                return orderDate >= yearAgo;
              }
              case 'custom':
                if (params.customRange && params.customRange.length === 2) {
                  const [startDate, endDate] = params.customRange;
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  end.setHours(23, 59, 59, 999);
                  return orderDate >= start && orderDate <= end;
                }
                return true;
              default:
                return true;
            }
          });
        }
        
        // 统计有效订单和收费订单
        const validOrders = saleOrders.filter(o => o.status !== 'rejected');
        const paidOrders = validOrders.filter(o => {
          const amount = parseFloat(o.amount || 0);
          const actualAmount = parseFloat(o.actual_payment_amount || 0);
          return amount > 0 || actualAmount > 0;
        });
        
        // 只添加有订单的销售
        if (validOrders.length > 0) {
          salesStats.push({
            wechat_name: sale.wechat_name,
            sales_type: sale.sales_type,
            sales_code: sale.sales_code,
            total_orders: validOrders.length,
            paid_orders: paidOrders.length,
            conversion_rate: validOrders.length > 0 ? 
              (paidOrders.length / validOrders.length * 100).toFixed(2) : 0
          });
        }
      }
      
      // 按转化率排序
      salesStats.sort((a, b) => parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate));
      
      console.log('📊 销售转化率统计结果:', salesStats);
      return salesStats;
      
    } catch (error) {
      console.error('获取销售转化率统计失败:', error);
      return [];
    }
  },

  /**
   * 获取转化率统计数据 - 支持时间范围和销售筛选
   */
  async getConversionStats(params = {}) {
    try {
      console.log('📊 获取转化率统计，参数:', params);
      
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 获取订单数据
      let ordersQuery = supabaseClient
        .from('orders_optimized')
        .select('*');
      
      // 如果有销售筛选，先获取对应的销售代码
      if (params.sales_type || params.wechat_name) {
        let salesQuery = supabaseClient
          .from('sales_optimized')
          .select('sales_code');
        
        if (params.sales_type) {
          salesQuery = salesQuery.eq('sales_type', params.sales_type);
        }
        if (params.wechat_name) {
          salesQuery = salesQuery.eq('wechat_name', params.wechat_name);
        }
        
        const { data: salesData } = await salesQuery;
        
        if (salesData && salesData.length > 0) {
          const salesCodes = salesData.map(s => s.sales_code);
          ordersQuery = ordersQuery.in('sales_code', salesCodes);
        } else {
          // 没有找到匹配的销售，返回空数据
          return {
            total_orders: 0,
            rejected_orders: 0,
            confirmed_config_orders: 0
          };
        }
      }
      
      const { data: orders, error } = await ordersQuery;
      
      if (error) {
        console.error('获取订单数据失败:', error);
        throw error;
      }
      
      // 应用时间范围过滤
      let filteredOrders = orders || [];
      const now = new Date();
      const usePaymentTime = params.usePaymentTime || false;
      
      if (params.timeRange && params.timeRange !== 'all') {
        switch (params.timeRange) {
          case 'today': {
            filteredOrders = filteredOrders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              const orderDate = new Date(timeField);
              return orderDate.toLocaleDateString() === now.toLocaleDateString();
            });
            break;
          }
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredOrders = filteredOrders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              return new Date(timeField) >= weekAgo;
            });
            break;
          }
          case 'month': {
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredOrders = filteredOrders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              return new Date(timeField) >= monthAgo;
            });
            break;
          }
          case 'year': {
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filteredOrders = filteredOrders.filter(order => {
              const timeField = usePaymentTime ? 
                (order.payment_time || order.updated_at || order.created_at) : 
                order.created_at;
              return new Date(timeField) >= yearAgo;
            });
            break;
          }
          case 'custom': {
            if (params.customRange && params.customRange.length === 2) {
              const [startDate, endDate] = params.customRange;
              const start = new Date(startDate);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              
              filteredOrders = filteredOrders.filter(order => {
                const timeField = usePaymentTime ? 
                  (order.payment_time || order.updated_at || order.created_at) : 
                  order.created_at;
                const orderDate = new Date(timeField);
                return orderDate >= start && orderDate <= end;
              });
            }
            break;
          }
        }
      }
      
      // 统计数据
      // 有效订单 = 所有订单 - 已拒绝订单
      const validOrders = filteredOrders.filter(o => o.status !== 'rejected');
      const rejectedOrders = filteredOrders.filter(o => o.status === 'rejected');
      
      // 收费订单 = 有金额的订单（amount > 0 或 actual_payment_amount > 0）
      const paidOrders = validOrders.filter(o => {
        const amount = parseFloat(o.amount || 0);
        const actualAmount = parseFloat(o.actual_payment_amount || 0);
        return amount > 0 || actualAmount > 0;
      });
      
      const result = {
        total_orders: validOrders.length,           // 有效订单总数
        rejected_orders: rejectedOrders.length,     // 已拒绝订单数
        confirmed_config_orders: paidOrders.length  // 收费订单数（有金额的订单）
      };
      
      console.log('📊 转化率统计结果:', result);
      return result;
      
    } catch (error) {
      console.error('获取转化率统计失败:', error);
      return {
        total_orders: 0,
        rejected_orders: 0,
        confirmed_config_orders: 0
      };
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
      // 🔧 字段映射：确保数据保存到payment_address字段（数据库实际字段）
      // payment_address 是数据库中的实际字段，不需要映射到 payment_account
      
      // 生成唯一的销售代码 - 增强唯一性
      salesData.sales_code = salesData.sales_code || this.generateUniqueSalesCode('PRI');
      salesData.secondary_registration_code = salesData.secondary_registration_code || this.generateUniqueSalesCode('SEC');
      salesData.sales_type = 'primary';  // 添加sales_type字段
      salesData.created_at = new Date().toISOString();
      salesData.updated_at = new Date().toISOString();
      
      // 🔧 移除name字段（支付宝已移除，不再需要）
      delete salesData.name;
      
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
          secondary_registration_link,
          user_sales_code: newSale.sales_code,  // 添加用户购买代码
          secondary_registration_code: newSale.secondary_registration_code  // 添加二级注册代码
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
      // 🔧 字段映射：确保数据保存到payment_address字段（数据库实际字段）
      // payment_address 是数据库中的实际字段，不需要映射到 payment_account
      
      // 生成唯一的销售代码 - 增强唯一性
      salesData.sales_code = salesData.sales_code || this.generateUniqueSalesCode('SEC');
      salesData.sales_type = 'secondary';  // 添加sales_type字段
      salesData.commission_rate = salesData.commission_rate || 25;  // 🔧 设置默认佣金率为25%
      salesData.created_at = new Date().toISOString();
      
      // 🔧 移除name字段（支付宝已移除，不再需要）
      delete salesData.name;
      
      // 🔧 确保保留primary_sales_id（如果存在）- 用于关联到一级销售
      // 如果有registration_code但没有primary_sales_id，尝试获取
      if (salesData.registration_code && !salesData.primary_sales_id) {
        const validationResult = await this.validateSecondaryRegistrationCode(salesData.registration_code);
        if (validationResult.success && validationResult.data) {
          salesData.primary_sales_id = validationResult.data.primary_sales_id;
          console.log('✅ 通过注册码获取到primary_sales_id:', salesData.primary_sales_id);
        }
      }
      
      // 记录日志以便调试
      console.log('📝 注册二级销售，primary_sales_id:', salesData.primary_sales_id || '独立销售');
      
      // 🔧 安全处理：创建副本并删除 registration_code 字段，避免数据库报错
      // 保留原始 salesData 中的验证逻辑，仅在数据库操作时移除该字段
      const dataForDB = {...salesData};
      delete dataForDB.registration_code;  // 不传给数据库，避免字段不存在错误
      
      const newSale = await SupabaseService.createSecondarySales(dataForDB);
      
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
   * 更新已返佣金额
   */
  async updatePaidCommission(salesId, salesType, amount) {
    try {
      const table = salesType === 'primary' ? 'primary_sales' : 'secondary_sales';
      
      const { data, error } = await SupabaseService.supabase
        .from(table)
        .update({ 
          paid_commission: amount,
          last_commission_paid_at: new Date().toISOString()
        })
        .eq('id', salesId)
        .select()
        .single();
      
      if (error) throw error;
      
      // 清除相关缓存
      CacheManager.clear('sales');
      CacheManager.clear('admin-sales');
      
      return { success: true, data };
    } catch (error) {
      console.error('更新已返佣金额失败:', error);
      return { 
        success: false, 
        error: error.message || '更新失败' 
      };
    }
  },

  /**
   * 更新佣金比率
   */
  async updateCommissionRate(salesId, commissionRate, salesType) {
    try {
      // 添加参数验证
      if (!salesId) {
        throw new Error('销售ID不能为空');
      }
      // 🔧 修复：允许佣金率为0
      if (commissionRate === null || commissionRate === undefined || commissionRate < 0) {
        throw new Error('佣金率无效');
      }
      
      console.log('更新佣金率参数:', { salesId, commissionRate, salesType });
      
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
      
      // 🔧 修复：清除所有相关缓存
      CacheManager.clear('sales');
      CacheManager.clear('admin-sales');
      
      return {
        success: true,
        data: updatedSale,
        message: '佣金比率更新成功'
      };
    } catch (error) {
      console.error('更新佣金比率失败详情:', {
        error,
        salesId,
        commissionRate,
        salesType,
        errorMessage: error.message,
        errorCode: error.code
      });
      
      // 🔧 修复：返回错误对象而不是抛出异常
      if (error.message?.includes('销售ID')) {
        throw new Error('销售ID无效或不存在');
      }
      if (error.message?.includes('佣金率')) {
        throw new Error('佣金率格式无效');
      }
      
      // 抛出具体的错误信息
      throw new Error(error.message || '更新佣金比率失败');
    }
  },

  /**
   * 获取一级销售结算数据
   */
  async getPrimarySalesSettlement(params) {
    try {
      const settlementData = await SupabaseService.getPrimarySalesSettlement(params);
      
      return {
        success: true,
        data: settlementData,
        message: '获取一级销售结算数据成功'
      };
    } catch (error) {
      console.error('获取一级销售结算数据失败:', error);
      throw error;
    }
  },

  /**
   * 获取二级销售结算数据
   */
  async getSecondarySalesSettlement(params) {
    try {
      const settlementData = await SupabaseService.getSecondarySalesSettlement(params);
      
      return {
        success: true,
        data: settlementData,
        message: '获取二级销售结算数据成功'
      };
    } catch (error) {
      console.error('获取二级销售结算数据失败:', error);
      throw error;
    }
  },

  /**
   * 获取一级销售统计数据
   */
  async getPrimarySalesStats() {
    // 暂时返回模拟数据
    return {
      success: true,
      data: {
        totalCommission: 0,
        monthlyCommission: 0,
        totalOrders: 0,
        monthlyOrders: 0,
        secondarySales: [],
        pendingReminderCount: 0
      },
      message: '获取统计数据成功'
    };
  },

  /**
   * 获取一级销售订单列表
   */
  async getPrimarySalesOrders(params) {
    // 暂时返回模拟数据
    return {
      success: true,
      data: {
        data: [],
        total: 0,
        page: params?.page || 1
      },
      message: '获取订单列表成功'
    };
  },

  /**
   * 更新二级销售佣金
   */
  async updateSecondarySalesCommission(secondarySalesId, commissionRate) {
    try {
      const updatedSale = await SupabaseService.updateSecondarySales(secondarySalesId, {
        commission_rate: commissionRate,
        updated_at: new Date().toISOString()
      });
      
      CacheManager.clear('sales');
      
      return {
        success: true,
        data: updatedSale,
        message: '佣金更新成功'
      };
    } catch (error) {
      return handleError(error, '更新佣金');
    }
  },

  /**
   * 移除二级销售
   */
  async removeSecondarySales(params) {
    // 暂时返回成功
    return {
      success: true,
      data: null,
      message: '移除成功'
    };
  },

  /**
   * 催单
   */
  async urgeOrder(orderId) {
    try {
      console.log('🔔 催单订单:', orderId);
      
      // 调用Supabase服务更新订单的催单状态
      const { SupabaseService } = await import('./supabase');
      
      const updatedOrder = await SupabaseService.supabase
        .from('orders_optimized')
        .update({ 
          is_reminded: true,
          reminded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (updatedOrder.error) {
        throw new Error(`催单失败: ${updatedOrder.error.message}`);
      }
      
      return {
        success: true,
        data: updatedOrder.data,
        message: `订单 ${orderId} 催单成功，已标记为已催单`
      };
    } catch (error) {
      console.error('催单失败:', error);
      return {
        success: false,
        error: error.message,
        message: '催单失败，请重试'
      };
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
          processedOrderData.primary_commission_amount = salesInfo.commission; // 同时设置新字段
          processedOrderData.sales_type = salesInfo.type;
          processedOrderData.commission_rate = salesInfo.commission / processedOrderData.amount;
          
          // 🔒 核心业务逻辑 - 未经用户确认不可修改
          // PROTECTED: Sales ID Association - DO NOT MODIFY
          // 添加销售ID关联，解决无法区分独立二级和一级下属二级的问题
          processedOrderData.primary_sales_id = salesInfo.primarySalesId;
          processedOrderData.secondary_sales_id = salesInfo.secondarySalesId;
          
        } catch (error) {
          console.warn('计算佣金失败:', error.message);
          // 免费订单或计算失败时的默认值
          processedOrderData.commission_amount = 0;
          processedOrderData.primary_commission_amount = 0; // 同时设置新字段
          processedOrderData.commission_rate = 0;
          processedOrderData.primary_sales_id = null;
          processedOrderData.secondary_sales_id = null;
        }
      } else {
        // 免费订单
        processedOrderData.commission_amount = 0;
        processedOrderData.primary_commission_amount = 0; // 同时设置新字段
        processedOrderData.commission_rate = 0;
        processedOrderData.primary_sales_id = null;
        processedOrderData.secondary_sales_id = null;
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
    // 确保佣金率是小数格式
    let commissionRate = sale.commission_rate;
    
    // 兼容性处理（虽然不需要，但以防万一）
    if (commissionRate > 1) {
      commissionRate = commissionRate / 100;
    }
    
    // 默认值：一级40%，二级25%
    if (!commissionRate) {
      commissionRate = sale.type === 'primary' ? 0.4 : 0.25;
    }
    
    const commission = parseFloat(amount) * commissionRate;
    
    // 🔒 核心业务逻辑 - 未经用户确认不可修改
    // PROTECTED: Complete Sales Information - DO NOT MODIFY
    return {
      commission,
      type: sale.type,
      rate: commissionRate,  // 返回小数格式
      // 返回销售ID和层级关系，用于订单关联
      salesId: sale.id,
      primarySalesId: sale.type === 'primary' 
        ? sale.id 
        : (sale.primary_sales_id || null),  // 二级销售的上级ID（如果有）
      secondarySalesId: sale.type === 'secondary' 
        ? sale.id 
        : null
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
// 定义独立的更新催单状态方法
const updateOrderReminderStatus = async function(orderId, isReminded) {
  try {
    console.log('更新订单催单状态:', { orderId, isReminded });
    
    const { data, error } = await SupabaseService.supabase
      .from('orders_optimized')
      .update({ 
        is_reminded: isReminded,
        reminded_at: isReminded ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      console.error('更新催单状态失败:', error);
      return {
        success: false,
        message: error.message || '更新催单状态失败'
      };
    }
    
    // 清除相关缓存
    CacheManager.remove('admin-orders');
    CacheManager.remove('admin-customers');
    
    return {
      success: true,
      data: data,
      message: '催单状态更新成功'
    };
  } catch (error) {
    console.error('更新催单状态失败 - 详细错误:', error);
    return {
      success: false,
      message: error.message || '更新催单状态失败',
      error: error
    };
  }
};

export const salesAPI = {
  ...SalesAPI,
  // 向后兼容的别名
  createPrimarySales: SalesAPI.registerPrimary,
  createSecondarySales: SalesAPI.registerSecondary,
  getPrimarySalesSettlement: SalesAPI.getPrimarySalesSettlement,
  getSecondarySalesSettlement: SalesAPI.getSecondarySalesSettlement,
  getPrimarySalesStats: SalesAPI.getPrimarySalesStats,
  getPrimarySalesOrders: SalesAPI.getPrimarySalesOrders,
  updateSecondarySalesCommission: SalesAPI.updateSecondarySalesCommission,
  removeSecondarySales: SalesAPI.removeSecondarySales,
  urgeOrder: SalesAPI.urgeOrder,
  // 添加催单状态更新方法
  updateOrderReminderStatus: updateOrderReminderStatus
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

// 🔧 将API暴露到window对象以便调试
if (typeof window !== 'undefined') {
  window.AdminAPI = AdminAPI;
  window.SalesAPI = SalesAPI;
  window.OrdersAPI = OrdersAPI;
  console.log('✅ API已暴露到window对象');
}

// 导出CacheManager类
export { CacheManager };

// 向后兼容的默认导出
export default API;

console.log('🚀 统一API服务层初始化完成');