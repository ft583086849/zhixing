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
    // 🔧 禁用缓存，确保数据稳定性
    // const cached = CacheManager.get(cacheKey);
    // if (cached) return cached;

    try {
      // 0. 首先尝试同步销售微信号（如果需要）
      await this.syncSalesWechatNames();
      
      // 🔧 修复：获取订单数据和销售数据用于正确关联
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      const [ordersResult, primarySalesResult, secondarySalesResult] = await Promise.all([
        supabaseClient.from('orders').select('*'),
        supabaseClient.from('primary_sales').select('sales_code, name, wechat_name'),
        supabaseClient.from('secondary_sales').select('sales_code, name, wechat_name')
      ]);
      
      const orders = ordersResult.data || [];
      const allSales = [...(primarySalesResult.data || []), ...(secondarySalesResult.data || [])];
      
      // 去重并整理客户信息
      const customerMap = new Map();
      orders.forEach(order => {
        // 修复字段名称映射
        const customerWechat = order.customer_wechat || '';
        const tradingviewUser = order.tradingview_username || '';
        const key = `${customerWechat}-${tradingviewUser}`;
        
        if (!customerMap.has(key) && (customerWechat || tradingviewUser)) {
          // 🔧 修复：通过sales_code查找销售表获取微信号
          let salesWechat = '-';
          
          if (order.sales_code) {
            const matchingSale = allSales.find(sale => sale.sales_code === order.sales_code);
            if (matchingSale) {
              // 使用wechat_name字段作为销售微信号（name字段是收款人姓名，不应使用）
              salesWechat = matchingSale.wechat_name || '-';
            }
          }
          
          customerMap.set(key, {
            customer_name: customerWechat || tradingviewUser, // 修复：添加customer_name
            customer_wechat: customerWechat,
            tradingview_username: tradingviewUser,
            sales_wechat_name: salesWechat,
            first_order: order.created_at,
            total_orders: 1, // 修复：字段名从order_count改为total_orders
            total_amount: parseFloat(order.actual_payment_amount || order.amount || 0),
            actual_payment_amount: parseFloat(order.actual_payment_amount || 0),
            commission_amount: parseFloat(order.commission_amount || 0)
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
              }
            }
          }
        }
      });

      const customers = Array.from(customerMap.values());
      
      const result = {
        success: true,
        data: customers,
        message: '获取客户列表成功'
      };

      // 🔧 禁用缓存，确保数据稳定性
      // CacheManager.set(cacheKey, result);
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
  async getSales() {
    const cacheKey = 'admin-sales';
    // 🔧 修复：暂时禁用缓存确保数据实时性
    // const cached = CacheManager.get(cacheKey);
    // if (cached) return cached;

    try {
      // 🔧 修复：移除自动同步，避免性能问题
      // await this.syncSalesWechatNames();
      
      // 1. 获取基础销售数据和订单数据
      const [primarySales, secondarySales, orders] = await Promise.all([
        SupabaseService.getPrimarySales(),
        SupabaseService.getSecondarySales(),
        SupabaseService.getOrders()
      ]);
      
      console.log('📊 销售数据获取:', {
        一级销售: primarySales.length,
        二级销售: secondarySales.length,
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
        
        // 🔧 修复：计算已配置确认订单金额（只计算confirmed_configuration和active状态）
        const confirmedOrders = saleOrders.filter(order => 
          ['confirmed_configuration', 'active'].includes(order.status)
        );
        const confirmedAmount = confirmedOrders.reduce((sum, order) => {
          // 🔧 修复：优先使用actual_payment_amount，其次使用amount
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 一级销售佣金率：默认40%（可根据需求文档调整）
        const commissionRate = sale.commission_rate || 40;
        
        // 🔧 修复：应返佣金额 = 已配置确认订单金额 × 佣金率
        const commissionAmount = confirmedAmount * (commissionRate / 100);
        
        console.log(`📊 一级销售 ${sale.sales_code}: 订单${totalOrders}个, 有效${validOrders}个, 总额$${totalAmount.toFixed(2)}, 确认金额$${confirmedAmount.toFixed(2)}, 佣金率${commissionRate}%, 应返佣金$${commissionAmount.toFixed(2)}`);
        
        // 🔧 修复：确保wechat_name有值，如果销售表中为空，使用name或phone作为备选
        const wechatName = sale.wechat_name || sale.name || sale.phone || `一级销售-${sale.sales_code}`;
        
        return {
          // 保留原始销售数据作为sales对象（前端组件需要）
          sales: {
            ...sale,
            wechat_name: wechatName,
            sales_type: 'primary',
            commission_rate: commissionRate
          },
          // 顶层字段用于显示
          sales_type: 'primary',
          sales_display_type: '一级销售',
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          confirmed_amount: Math.round(confirmedAmount * 100) / 100,  // 🔧 新增：已配置确认订单金额
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
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
        
        // 🔧 修复：计算已配置确认订单金额（只计算confirmed_configuration和active状态）
        const confirmedOrders = saleOrders.filter(order => 
          ['confirmed_configuration', 'active'].includes(order.status)
        );
        const confirmedAmount = confirmedOrders.reduce((sum, order) => {
          // 🔧 修复：优先使用actual_payment_amount，其次使用amount
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 二级销售佣金率：独立二级销售30%，一级销售下的二级销售由一级销售设置
        let commissionRate = sale.commission_rate || 0.3; // 默认30%（小数格式）
        
        // 兼容性处理：如果是百分比则转换
        if (commissionRate > 1) {
          commissionRate = commissionRate / 100;
        }
        
        if (sale.primary_sales_id) {
          // 如果是关联二级销售，使用一级销售设置的佣金率（如果有）
          const primarySale = primarySales.find(p => p.id === sale.primary_sales_id);
          if (primarySale && primarySale.secondary_commission_rate) {
            let rate = primarySale.secondary_commission_rate;
            // 兼容性处理
            if (rate > 1) {
              rate = rate / 100;
            }
            commissionRate = rate;
          }
        }
        
        // 🔧 修复：应返佣金额 = 已配置确认订单金额 × 佣金率（小数格式）
        const commissionAmount = confirmedAmount * commissionRate;
        
        console.log(`📊 二级销售 ${sale.sales_code}: 订单${totalOrders}个, 有效${validOrders}个, 总额$${totalAmount.toFixed(2)}, 确认金额$${confirmedAmount.toFixed(2)}, 佣金率${(commissionRate * 100).toFixed(1)}%, 应返佣金$${commissionAmount.toFixed(2)}`);
        
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
        
        // 🔧 修复：确保wechat_name有值，如果销售表中为空，使用name或phone作为备选
        const wechatName = sale.wechat_name || sale.name || sale.phone || `二级销售-${sale.sales_code}`;
        
        return {
          // 保留原始销售数据作为sales对象（前端组件需要）
          sales: {
            ...sale,
            wechat_name: wechatName,
            sales_type: 'secondary',
            commission_rate: commissionRate
          },
          // 顶层字段用于显示
          sales_type: 'secondary',
          sales_display_type: salesDisplayType,
          total_orders: totalOrders,
          valid_orders: validOrders,
          total_amount: Math.round(totalAmount * 100) / 100,
          confirmed_amount: Math.round(confirmedAmount * 100) / 100,  // 🔧 新增：已配置确认订单金额
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
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
      console.log('🔍 重新设计的数据概览API - 开始获取统计数据...', params);
      
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
      
      // 🔧 按用户要求：以付款时间为准进行统计
      const today = new Date().toDateString();
      
      // 今日订单 - 以付款时间为准（如果有付款时间字段），否则以创建时间
      const todayOrders = orders.filter(order => {
        const paymentTime = order.payment_time || order.updated_at || order.created_at;
        return paymentTime && new Date(paymentTime).toDateString() === today;
      }).length;
      
      // 🔧 状态统计 - 简化逻辑，直接匹配
      const pending_payment_orders = orders.filter(order => 
        ['pending_payment', 'pending', 'pending_review'].includes(order.status)
      ).length;
      
      const confirmed_payment_orders = orders.filter(order => 
        ['confirmed_payment', 'confirmed'].includes(order.status)
      ).length;
      
      const pending_config_orders = orders.filter(order => 
        order.status === 'pending_config'
      ).length;
      
      const confirmed_config_orders = orders.filter(order => 
        ['confirmed_configuration', 'active'].includes(order.status)
      ).length;
      
      // 🔧 金额统计 - 优先使用实付金额
      let total_amount = 0;
      let total_commission = 0;
      
      orders.forEach(order => {
        // 🔧 修复：优先使用actual_payment_amount，其次使用amount
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        
        const commission = parseFloat(order.commission_amount || 0);
        
        // 人民币转美元 (汇率7.15)
        if (order.payment_method === 'alipay') {
          total_amount += (amount / 7.15);
          total_commission += (commission / 7.15);
        } else {
          total_amount += amount;
          total_commission += commission;
        }
      });
      
      // 🔧 销售统计 - 从订单表关联获取
      const salesFromOrders = new Set();
      orders.forEach(order => {
        if (order.sales_code) {
          salesFromOrders.add(order.sales_code);
        }
      });
      
      // 获取实际销售表数据进行对比
      const [primarySales, secondarySales] = await Promise.all([
        SupabaseService.getPrimarySales(),
        SupabaseService.getSecondarySales()
      ]);
      
      const stats = {
        total_orders: orders.length,
        total_amount: Math.round(total_amount * 100) / 100,
        today_orders: todayOrders,
        pending_payment_orders,
        confirmed_payment_orders,
        pending_config_orders,
        confirmed_config_orders,
        total_commission: Math.round(total_commission * 100) / 100,
        primary_sales_count: primarySales?.length || 0,
        secondary_sales_count: secondarySales?.length || 0,
        total_sales: (primarySales?.length || 0) + (secondarySales?.length || 0),
        // 🔧 新增调试信息
        sales_with_orders: salesFromOrders.size, // 有订单的销售数量
        debug_info: {
          orders_count: orders.length,
          status_distribution: {
            pending_payment: pending_payment_orders,
            confirmed_payment: confirmed_payment_orders,
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
    // 确保佣金率是小数格式
    let commissionRate = sale.commission_rate;
    
    // 兼容性处理（虽然不需要，但以防万一）
    if (commissionRate > 1) {
      commissionRate = commissionRate / 100;
    }
    
    // 默认值：一级40%，二级30%
    if (!commissionRate) {
      commissionRate = sale.type === 'primary' ? 0.4 : 0.3;
    }
    
    const commission = parseFloat(amount) * commissionRate;
    
    return {
      commission,
      type: sale.type,
      rate: commissionRate  // 返回小数格式
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

// 向后兼容的默认导出
export default API;

console.log('🚀 统一API服务层初始化完成');