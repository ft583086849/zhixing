/**
 * 统一API业务逻辑层
 * 提供高级业务接口，封装复杂的数据操作逻辑
 */

import { message } from 'antd';
import { SupabaseService } from './supabase.js';
import { AuthService } from './auth.js';

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
    // 如果有参数，不使用缓存（用于搜索）
    if (Object.keys(params).length > 0) {
      try {
        const orders = await SupabaseService.getOrdersWithFilters(params);
        
        const result = {
          success: true,
          data: orders,
          message: '获取订单列表成功'
        };
        
        return result;
      } catch (error) {
        return handleError(error, '获取订单列表');
      }
    }
    
    // 无参数时使用缓存
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
      
      // 🔧 修复：获取订单数据和销售数据用于正确关联
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 构建订单查询
      let ordersQuery = supabaseClient.from('orders').select('*');
      
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
            
            if (order.duration === '7days') {
              expiryDate.setDate(expiryDate.getDate() + 7);
            } else if (order.duration === '1month') {
              expiryDate.setMonth(expiryDate.getMonth() + 1);
            } else if (order.duration === '3months') {
              expiryDate.setMonth(expiryDate.getMonth() + 3);
            } else if (order.duration === '6months') {
              expiryDate.setMonth(expiryDate.getMonth() + 6);
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
            
            if (order.duration === '7days') {
              expiryDate.setDate(expiryDate.getDate() + 7);
            } else if (order.duration === '1month') {
              expiryDate.setMonth(expiryDate.getMonth() + 1);
            } else if (order.duration === '3months') {
              expiryDate.setMonth(expiryDate.getMonth() + 3);
            } else if (order.duration === '6months') {
              expiryDate.setMonth(expiryDate.getMonth() + 6);
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
          
          const needReminder = daysDiff <= 7 && daysDiff >= 0 && 
                              customer.status !== 'confirmed_config' && 
                              customer.status !== 'active' && 
                              customer.status !== 'expired';
          
          return params.reminder_suggestion === 'need_reminder' ? needReminder : !needReminder;
        });
      }
      
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
    // 🔧 修复：重置时也要获取最新数据，不使用缓存
    // 只有在页面初次加载时才使用缓存
    const hasParams = Object.keys(params).length > 0;
    
    // 暂时禁用缓存，确保数据实时性
    // if (!hasParams) {
    //   const cacheKey = 'admin-sales';
    //   const cached = CacheManager.get(cacheKey);
    //   if (cached) return cached;
    // }

    try {
      // 🔧 修复：移除自动同步，避免性能问题
      // await this.syncSalesWechatNames();
      
      // 构建查询条件
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 获取一级销售查询
      const primaryQuery = supabaseClient.from('primary_sales').select('*');
      const secondaryQuery = supabaseClient.from('secondary_sales').select('*');
      
      // 销售类型过滤
      let primarySales = [];
      let secondarySales = [];
      
      if (params.sales_type === 'primary') {
        // 只获取一级销售
        primarySales = (await primaryQuery).data || [];
        secondarySales = [];
      } else if (params.sales_type === 'secondary') {
        // 只获取二级销售（有上级的）
        primarySales = [];
        const allSecondary = (await secondaryQuery).data || [];
        secondarySales = allSecondary.filter(s => s.primary_sales_id);
      } else if (params.sales_type === 'independent') {
        // 只获取独立销售（没有上级的二级销售）
        primarySales = [];
        const allSecondary = (await secondaryQuery).data || [];
        secondarySales = allSecondary.filter(s => !s.primary_sales_id);
      } else {
        // 获取所有销售（但应用查询条件）
        [primarySales, secondarySales] = await Promise.all([
          primaryQuery.then(result => result.data || []),
          secondaryQuery.then(result => result.data || [])
        ]);
        
        // 🔧 调试：确认获取了所有数据
        console.log('📊 重置时获取的原始数据:', {
          一级销售数量: primarySales.length,
          二级销售数量: secondarySales.length,
          总计: primarySales.length + secondarySales.length
        });
      }
      
      // 销售微信号搜索
      // 🔧 修复：搜索一级销售时，也显示其下的二级销售，支持部分匹配
      if (params.wechat_name) {
        const searchTerm = params.wechat_name.toLowerCase();
        
        // 先筛选匹配的一级销售（不区分大小写）
        const matchedPrimarySales = primarySales.filter(sale => {
          // 检查多个字段进行匹配
          const wechatMatch = sale.wechat_name && sale.wechat_name.toLowerCase().includes(searchTerm);
          const nameMatch = sale.name && sale.name.toLowerCase().includes(searchTerm);
          const codeMatch = sale.sales_code && sale.sales_code.toLowerCase().includes(searchTerm);
          return wechatMatch || nameMatch || codeMatch;
        });
        
        // 获取这些一级销售的ID
        const primarySalesIds = matchedPrimarySales.map(p => p.id);
        
        // 筛选二级销售：直接匹配的 + 属于匹配的一级销售的
        secondarySales = secondarySales.filter(sale => {
          // 直接匹配
          const wechatMatch = sale.wechat_name && sale.wechat_name.toLowerCase().includes(searchTerm);
          const nameMatch = sale.name && sale.name.toLowerCase().includes(searchTerm);
          const codeMatch = sale.sales_code && sale.sales_code.toLowerCase().includes(searchTerm);
          const directMatch = wechatMatch || nameMatch || codeMatch;
          
          // 或者属于匹配的一级销售
          const belongsToMatchedPrimary = sale.primary_sales_id && primarySalesIds.includes(sale.primary_sales_id);
          
          return directMatch || belongsToMatchedPrimary;
        });
        
        primarySales = matchedPrimarySales;
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
      
      // 🔧 修复：在过滤之前先获取所有二级销售用于计算管理数量
      const allSecondarySales = await SupabaseService.getSecondarySales();
      
      console.log('📊 销售数据获取:', {
        一级销售: primarySales.length,
        二级销售: secondarySales.length,
        所有二级销售: allSecondarySales.length,
        订单总数: orders.length
      });
      
      // 🔧 添加订单统计日志
      const ordersBySalesCode = {};
      orders.forEach(order => {
        if (order.sales_code) {
          ordersBySalesCode[order.sales_code] = (ordersBySalesCode[order.sales_code] || 0) + 1;
        }
      });
      console.log('📊 订单按sales_code分布:', ordersBySalesCode);
      
      // 2. 处理一级销售数据
      // 🔧 v2.5.6: 统一使用一级销售对账页面的数据逻辑
      const processedPrimarySales = primarySales.map(sale => {
        // 恢复原有逻辑，不强制使用统一数据源
        // 获取该销售的所有订单（排除已拒绝的订单）
        const saleOrders = orders.filter(order => 
          (order.sales_code === sale.sales_code || 
          order.primary_sales_id === sale.id) &&
          order.status !== 'rejected'
        );
        
        // 计算订单统计（不包含已拒绝的订单）
        const totalOrders = saleOrders.length;
        const validOrders = saleOrders.filter(order => 
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
        ).length;
        
        // 计算总金额（所有订单金额）
        const totalAmount = saleOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 计算已配置确认订单金额
        const confirmedOrders = saleOrders.filter(order => 
          ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'].includes(order.status)
        );
        const confirmedAmount = confirmedOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
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
        
        // 使用固定佣金规则（40%总池）
        const commissionAmount = confirmedAmount * (commissionRate / 100);
        
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
            payment_account: sale.payment_account
          },
          // 顶层字段用于显示
          sales_type: 'primary',
          sales_display_type: '一级销售',
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          confirmed_amount: Math.round(confirmedAmount * 100) / 100,
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
          hierarchy_info: '一级销售',
          secondary_sales_count: managedSecondaryCount,
          links: links
        };
      });
      
      // 3. 处理二级销售数据
      const processedSecondarySales = secondarySales.map(sale => {
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
        const confirmedOrders = saleOrders.filter(order => 
          ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'].includes(order.status)
        );
        const confirmedAmount = confirmedOrders.reduce((sum, order) => {
          // 🔧 修复：优先使用actual_payment_amount，其次使用amount
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
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
            commission_rate: commissionRate
          },
          // 顶层字段用于显示
          sales_type: actualSalesType,  // 🔧 修复：独立销售应该是'independent'
          sales_display_type: salesDisplayType,
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          confirmed_amount: Math.round(confirmedAmount * 100) / 100,  // 🔧 新增：已配置确认订单金额
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
          hierarchy_info: hierarchyInfo,
          links: links  // 🔧 新增：销售链接
        };
      });
      
      // 4. 合并所有销售数据
      const allSales = [...processedPrimarySales, ...processedSecondarySales];
      
      console.log('处理后的销售数据:', {
        总数: allSales.length,
        一级销售: processedPrimarySales.length,
        二级销售: processedSecondarySales.length,
        搜索参数: params,
        是否有搜索条件: Object.keys(params).length > 0
      });
      
      const result = {
        success: true,
        data: allSales,
        message: '获取销售列表成功'
      };

      // 🔧 禁用缓存，确保数据稳定性
      // CacheManager.set(cacheKey, result);
      return result.data; // 直接返回销售数组
    } catch (error) {
      console.error('获取销售列表失败:', error);
      // 返回空数组而不是抛出错误，确保页面不崩溃
      console.log('返回空销售数组');
      return [];
    }
  },

  /**
   * 获取统计数据 - 重新设计：直接从订单表计算，以付款时间为准
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
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*');
      
      if (error) {
        console.error('❌ 订单数据获取失败:', error);
        throw error;
      }
      
      console.log(`📊 直接查询订单数据: ${orders?.length || 0} 个订单`);
      
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
      const pending_payment_orders = ordersToProcess.filter(order => 
        ['pending_payment', 'pending', 'pending_review'].includes(order.status)
      ).length;
      
      // 删除已付款确认订单统计（用户要求）
      // const confirmed_payment_orders = ...
      
      const pending_config_orders = ordersToProcess.filter(order => 
        ['pending_config', 'confirmed_payment'].includes(order.status)  // confirmed_payment也是待配置状态
      ).length;
      
      // 已确认订单 - 只统计这些状态
      const confirmedStatuses = ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'];
      const confirmed_config_orders = ordersToProcess.filter(order => 
        confirmedStatuses.includes(order.status)
      ).length;
      
      // 🔧 金额统计 - 优先使用实付金额
      let total_amount = 0;
      let total_commission = 0;  // 应返佣金总额（已确认订单）
      
      ordersToProcess.forEach(order => {
        // 🔧 修复：排除已拒绝的订单计算总收入和佣金
        if (order.status !== 'rejected') {
          // 🔧 修复：优先使用actual_payment_amount，其次使用amount
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          
          // 人民币转美元 (汇率7.15)
          const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
          total_amount += amountUSD;
          
          // 根据订单状态计算佣金
          const commission = parseFloat(order.commission_amount || (amountUSD * 0.4));
          
          if (confirmedStatuses.includes(order.status)) {
            // 已确认订单 - 应返佣金
            total_commission += commission;
          }
        }
      });
      
      // 🔧 修复：待返佣金额 = 应返佣金额 - 已返佣金额
      // 由于当前系统还没有记录已返佣金，所以待返佣金额等于应返佣金额
      const pending_commission = total_commission;  // 目前没有已返记录，所以待返=应返
      
      // 🔧 销售统计 - 从订单表关联获取
      const salesFromOrders = new Set();
      ordersToProcess.forEach(order => {
        if (order.sales_code) {
          salesFromOrders.add(order.sales_code);
        }
      });
      
      // 获取实际销售表数据进行对比
      const [primarySales, secondarySales] = await Promise.all([
        SupabaseService.getPrimarySales(),
        SupabaseService.getSecondarySales()
      ]);
      
      // 🔧 修复：区分二级销售和独立销售
      const linkedSecondarySales = secondarySales?.filter(s => s.primary_sales_id) || [];
      const independentSales = secondarySales?.filter(s => !s.primary_sales_id) || [];
      
      // 计算销售业绩 - 只计算确认的订单
      let primary_sales_amount = 0;
      let linked_secondary_sales_amount = 0;  // 二级销售（有上级）
      let independent_sales_amount = 0;  // 独立销售
      
      ordersToProcess.forEach(order => {
        // 只计算确认状态的订单
        if (['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'].includes(order.status)) {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
          
          if (order.sales_code) {
            const isPrimarySale = primarySales?.some(ps => ps.sales_code === order.sales_code);
            const linkedSecondary = linkedSecondarySales?.find(ss => ss.sales_code === order.sales_code);
            const independentSale = independentSales?.find(ss => ss.sales_code === order.sales_code);
            
            if (isPrimarySale) {
              primary_sales_amount += amountUSD;
            } else if (linkedSecondary) {
              linked_secondary_sales_amount += amountUSD;
            } else if (independentSale) {
              independent_sales_amount += amountUSD;
            }
          }
        }
      });
      
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
        if (duration === 'free' || duration === '7days' || duration === 'trial') {
          orderDurationStats.free_trial_orders++;
        } else if (duration === '1month' || duration === 'month') {
          orderDurationStats.one_month_orders++;
        } else if (duration === '3months') {
          orderDurationStats.three_month_orders++;
        } else if (duration === '6months') {
          orderDurationStats.six_month_orders++;
        } else if (duration === '1year' || duration === 'yearly' || duration === 'annual') {
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
      const non_rejected_orders = ordersToProcess.filter(order => order.status !== 'rejected');
      
      const stats = {
        total_orders: non_rejected_orders.length,  // 🔧 修复：不包含已拒绝的订单
        total_amount: Math.round(total_amount * 100) / 100,
        confirmed_amount: Math.round(confirmed_amount * 100) / 100,  // 🔧 新增：已确认订单实付金额
        today_orders: todayOrders,
        pending_payment_orders,
        // confirmed_payment_orders已删除
        pending_config_orders,
        confirmed_config_orders,
        total_commission: Math.round(total_commission * 100) / 100,
        commission_amount: Math.round(total_commission * 100) / 100,  // 销售返佣金额
        // 待返佣金额 = 应返佣金额 - 已返佣金额（暂时设为应返佣金额，因为还没有已返记录）
        pending_commission_amount: Math.round(pending_commission * 100) / 100,  // 待返佣金额
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
      
      // 🔧 禁用缓存，确保数据实时性和稳定性
      // CacheManager.set(cacheKey, stats);
      
      return stats;
    } catch (error) {
      console.error('❌ 新数据概览API失败:', error);
      return this.getEmptyStats();
    }
  },

  /**
   * 更新佣金率 - 添加到AdminAPI
   */
  async updateCommissionRate(salesId, commissionRate, salesType) {
    // 直接调用SalesAPI的方法
    return SalesAPI.updateCommissionRate(salesId, commissionRate, salesType);
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
      // 生成唯一的销售代码 - 增强唯一性
      salesData.sales_code = salesData.sales_code || this.generateUniqueSalesCode('SEC');
      salesData.sales_type = 'secondary';  // 添加sales_type字段
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
    // 暂时返回成功
    return {
      success: true,
      data: null,
      message: '催单成功'
    };
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
          
          // 🔒 核心业务逻辑 - 未经用户确认不可修改
          // PROTECTED: Sales ID Association - DO NOT MODIFY
          // 添加销售ID关联，解决无法区分独立二级和一级下属二级的问题
          processedOrderData.primary_sales_id = salesInfo.primarySalesId;
          processedOrderData.secondary_sales_id = salesInfo.secondarySalesId;
          
        } catch (error) {
          console.warn('计算佣金失败:', error.message);
          // 免费订单或计算失败时的默认值
          processedOrderData.commission_amount = 0;
          processedOrderData.commission_rate = 0;
          processedOrderData.primary_sales_id = null;
          processedOrderData.secondary_sales_id = null;
        }
      } else {
        // 免费订单
        processedOrderData.commission_amount = 0;
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
  urgeOrder: SalesAPI.urgeOrder
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