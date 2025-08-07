/**
 * Supabase数据库服务层
 * 负责与Supabase数据库的直接交互
 */

import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

/**
 * 数据库操作基础类
 */
export class SupabaseService {
  // 添加静态属性以便其他地方访问
  static supabase = supabase;
  
  // 管理员操作
  static async getAdminByUsername(username) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createAdmin(adminData) {
    const { data, error } = await supabase
      .from('admins')
      .insert([adminData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // 一级销售操作
  static async getPrimarySales() {
    const { data, error } = await supabase
      .from('primary_sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getSecondarySales() {
    const { data, error } = await supabase
      .from('secondary_sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getPrimarySalesByCode(salesCode) {
    const { data, error } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('sales_code', salesCode)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createPrimarySales(salesData) {
    const { data, error } = await supabase
      .from('primary_sales')
      .insert([salesData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePrimarySales(id, updates) {
    const { data, error } = await supabase
      .from('primary_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // 二级销售操作
  static async getSecondarySalesByCode(salesCode) {
    const { data, error } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('sales_code', salesCode)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createSecondarySales(salesData) {
    const { data, error } = await supabase
      .from('secondary_sales')
      .insert([salesData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateSecondarySales(id, updates) {
    const { data, error } = await supabase
      .from('secondary_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // 获取一级销售结算数据
  static async getPrimarySalesSettlement(params) {
    try {
      // 1. 首先根据微信号或销售代码查询一级销售
      let primarySalesQuery = supabase.from('primary_sales').select('*');
      
      if (params.wechat_name) {
        primarySalesQuery = primarySalesQuery.eq('wechat_name', params.wechat_name);
      }
      if (params.sales_code) {
        primarySalesQuery = primarySalesQuery.eq('sales_code', params.sales_code);
      }
      
      const { data: primarySales, error: salesError } = await primarySalesQuery.single();
      
      if (salesError) {
        console.error('查询一级销售失败:', salesError);
        throw new Error('未找到匹配的一级销售');
      }
      
      // 2. 获取该一级销售的所有订单（通过sales_code关联）
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('sales_code', primarySales.sales_code)
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('查询订单失败:', ordersError);
      }
      
      // 3. 获取该一级销售的所有二级销售
      const { data: secondarySales, error: secondaryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primarySales.id)
        .order('created_at', { ascending: false });
      
      if (secondaryError) {
        console.error('查询二级销售失败:', secondaryError);
      }
      
      // 4. 计算统计数据
      const confirmedOrders = orders?.filter(order => order.config_confirmed === true) || [];
      const totalCommission = confirmedOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
      const totalOrders = confirmedOrders.length;
      
      // 5. 获取待催单订单
      const reminderOrders = orders?.filter(order => 
        order.status === 'pending_payment' || 
        order.status === 'pending_config'
      ) || [];
      
      // 6. 为二级销售计算统计数据
      const secondarySalesWithStats = (secondarySales || []).map(sales => {
        const salesOrders = confirmedOrders.filter(order => order.secondary_sales_name === sales.wechat_name);
        const totalAmount = salesOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        const totalCommission = salesOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
        
        return {
          ...sales,
          order_count: salesOrders.length,
          total_amount: totalAmount,
          total_commission: totalCommission,
          commission_rate: sales.commission_rate || 0.1 // 默认10%
        };
      });
      
      return {
        sales: primarySales,
        orders: confirmedOrders,
        secondarySales: secondarySalesWithStats,
        reminderOrders: reminderOrders,
        stats: {
          totalCommission: totalCommission,
          totalOrders: totalOrders,
          pendingReminderCount: reminderOrders.length
        }
      };
    } catch (error) {
      console.error('获取一级销售结算数据失败:', error);
      throw error;
    }
  }

  // 验证二级销售注册码
  static async validateSecondaryRegistrationCode(registrationCode) {
    const { data, error } = await supabase
      .from('primary_sales')
      .select('id, wechat_name, secondary_registration_code')
      .eq('secondary_registration_code', registrationCode)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      throw error;
    }
    
    return {
      primary_sales_id: data.id,
      primary_wechat_name: data.wechat_name,
      registration_code: data.secondary_registration_code
    };
  }

  // 订单操作

  static async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createOrder(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateOrder(id, updates) {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateOrderStatus(orderId, status) {
    const updates = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
    
    console.log('订单状态更新成功:', data);
    return data;
  }

  // 订单查询
  static async getOrders() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // 增强版销售信息关联（支持多种关联方式）
    if (orders && orders.length > 0) {
      // 收集所有需要查询的销售ID和代码
      const salesCodes = [...new Set(orders.map(order => order.sales_code).filter(Boolean))];
      const primarySalesIds = [...new Set(orders.map(order => order.primary_sales_id).filter(Boolean))];
      const secondarySalesIds = [...new Set(orders.map(order => order.secondary_sales_id).filter(Boolean))];
      
      console.log('关联数据收集:', { salesCodes, primarySalesIds, secondarySalesIds });
      
      // 并行获取销售数据（支持ID和code两种方式）
      const queries = [];
      
      // 通过sales_code查询
      if (salesCodes.length > 0) {
        queries.push(
          supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('sales_code', salesCodes),
          supabase.from('secondary_sales').select('id, sales_code, name, wechat_name, phone').in('sales_code', salesCodes)
        );
      }
      
      // 通过ID查询
      if (primarySalesIds.length > 0) {
        queries.push(
          supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('id', primarySalesIds)
        );
      }
      
      if (secondarySalesIds.length > 0) {
        queries.push(
          supabase.from('secondary_sales').select('id, sales_code, name, wechat_name, phone').in('id', secondarySalesIds)
        );
      }
      
      const results = await Promise.all(queries);
      
      // 创建多种映射方式
      const primarySalesByCode = new Map();
      const primarySalesById = new Map();
      const secondarySalesByCode = new Map();
      const secondarySalesById = new Map();
      
      // 处理查询结果
      results.forEach(result => {
        if (result.data) {
          result.data.forEach(sale => {
            // 根据查询来源判断是一级还是二级销售
            const tableName = result.data.length > 0 ? 
              (Object.prototype.hasOwnProperty.call(sale, 'primary_sales_id') ? 'secondary' : 
               result === results[0] || result === results[2] ? 'primary' : 'secondary') : '';
            
            if (sale.sales_code) {
              if (tableName === 'primary' || !tableName) {
                primarySalesByCode.set(sale.sales_code, sale);
                primarySalesById.set(sale.id, sale);
              } else {
                secondarySalesByCode.set(sale.sales_code, sale);
                secondarySalesById.set(sale.id, sale);
              }
            }
          });
        }
      });
      
      console.log('销售数据映射:', { 
        primaryByCode: primarySalesByCode.size, 
        primaryById: primarySalesById.size,
        secondaryByCode: secondarySalesByCode.size,
        secondaryById: secondarySalesById.size
      });
      
      // 为每个订单添加销售信息（多重匹配逻辑）
      orders.forEach(order => {
        let salesInfo = null;
        let salesType = null;
        
        // 优先级1: 使用primary_sales_id
        if (order.primary_sales_id && primarySalesById.has(order.primary_sales_id)) {
          salesInfo = primarySalesById.get(order.primary_sales_id);
          salesType = 'primary';
        }
        // 优先级2: 使用secondary_sales_id
        else if (order.secondary_sales_id && secondarySalesById.has(order.secondary_sales_id)) {
          salesInfo = secondarySalesById.get(order.secondary_sales_id);
          salesType = 'secondary';
        }
        // 优先级3: 使用sales_code匹配一级销售
        else if (order.sales_code && primarySalesByCode.has(order.sales_code)) {
          salesInfo = primarySalesByCode.get(order.sales_code);
          salesType = 'primary';
        }
        // 优先级4: 使用sales_code匹配二级销售
        else if (order.sales_code && secondarySalesByCode.has(order.sales_code)) {
          salesInfo = secondarySalesByCode.get(order.sales_code);
          salesType = 'secondary';
        }
        
        // 设置销售信息
        if (salesInfo) {
          if (salesType === 'primary') {
            order.primary_sales = salesInfo;
          } else {
            order.secondary_sales = salesInfo;
          }
          
          // 设置统一的销售字段（前端期望的格式）
          order.sales_type = salesType;
          order.sales_wechat_name = salesInfo.wechat_name;
          order.sales_name = salesInfo.name;
          order.sales_phone = salesInfo.phone;
          
          console.log(`订单 ${order.order_number} 关联${salesType}销售:`, salesInfo.name);
        } else {
          console.warn(`订单 ${order.order_number} 无法关联销售信息`);
        }
        
        // 计算生效时间和到期时间 - 所有订单都显示
        if (order.created_at && order.duration) {
          const createdDate = new Date(order.created_at);
          
          // 生效时间：统一使用创建时间
          order.effective_time = order.created_at;
          
          // 到期时间计算 - 基于创建时间计算
          const expiryDate = new Date(createdDate);
          if (order.duration === '7days') {
            expiryDate.setDate(expiryDate.getDate() + 7);
          } else if (order.duration === '1month') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          } else if (order.duration === '3months') {
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          } else if (order.duration === '1year') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          }
          order.expiry_time = expiryDate.toISOString();
        }
      });
    }
    
    return orders || [];
  }

  // 统计查询
  static async getOrderStats() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('amount, actual_payment_amount, payment_method, created_at, status, commission_amount');
    
    if (error) throw error;
    
    const total = orders.length;
    
    // 计算总金额（美元）- 人民币按7.15汇率换算
    const totalAmount = orders.reduce((sum, order) => {
      const actualAmount = parseFloat(order.actual_payment_amount || 0);
      const paymentMethod = order.payment_method;
      
      // 如果是支付宝支付（人民币），按7.15汇率换算为美元
      if (paymentMethod === 'alipay' && actualAmount > 0) {
        return sum + (actualAmount / 7.15);
      }
      
      // 如果是加密货币或其他，直接按美元计算
      return sum + actualAmount;
    }, 0);
    
    // 计算今日订单
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
      new Date(order.created_at).toDateString() === today
    ).length;
    
    // 按状态统计订单 - 兼容多种状态格式
    const pendingPayment = orders.filter(order => 
      ['pending_payment', 'pending', 'pending_review'].includes(order.status)
    ).length;
    const confirmedPayment = orders.filter(order => 
      ['confirmed_payment', 'confirmed'].includes(order.status)
    ).length;
    const pendingConfig = orders.filter(order => order.status === 'pending_config').length;
    const confirmedConfig = orders.filter(order => order.status === 'confirmed_config').length;
    
    // 计算总佣金（美元）
    const totalCommission = orders.reduce((sum, order) => {
      const commissionAmount = parseFloat(order.commission_amount || 0);
      const paymentMethod = order.payment_method;
      
      // 如果原订单是人民币，佣金也按7.15汇率换算
      if (paymentMethod === 'alipay' && commissionAmount > 0) {
        return sum + (commissionAmount / 7.15);
      }
      
      return sum + commissionAmount;
    }, 0);
    
    return { 
      total, 
      totalAmount: Math.round(totalAmount * 100) / 100, // 保留2位小数
      todayOrders,
      pendingPayment,
      confirmedPayment,
      pendingConfig,
      confirmedConfig,
      totalCommission: Math.round(totalCommission * 100) / 100
    };
  }

  static async getSalesStats() {
    const [primarySales, secondarySales] = await Promise.all([
      this.getPrimarySales(),
      this.getSecondarySales()
    ]);
    
    return {
      primaryCount: primarySales.length,
      secondaryCount: secondarySales.length,
      totalSales: primarySales.length + secondarySales.length
    };
  }

  // 获取支付配置
  static async getPaymentConfig() {
    const { data: config, error } = await supabase
      .from('payment_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (error) {
      console.error('获取支付配置失败:', error);
      throw error;
    }
    
    return config;
  }

  static async updatePaymentConfig(configData) {
    try {
      console.log('SupabaseService: 更新支付配置', configData);
      
      // 首先检查是否已有配置记录
      const { data: existingConfig } = await supabase
        .from('payment_config')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      let result;
      if (existingConfig) {
        // 更新现有配置
        const { data, error } = await supabase
          .from('payment_config')
          .update({
            alipay_account: configData.alipay_account,
            alipay_name: configData.alipay_name,
            alipay_qr_code: configData.alipay_qr_code,
            crypto_chain_name: configData.crypto_chain_name,
            crypto_address: configData.crypto_address,
            crypto_qr_code: configData.crypto_qr_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // 创建新配置
        const { data, error } = await supabase
          .from('payment_config')
          .insert({
            alipay_account: configData.alipay_account,
            alipay_name: configData.alipay_name,
            alipay_qr_code: configData.alipay_qr_code,
            crypto_chain_name: configData.crypto_chain_name,
            crypto_address: configData.crypto_address,
            crypto_qr_code: configData.crypto_qr_code,
            is_active: true
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      console.log('SupabaseService: 支付配置更新成功', result);
      return result;
    } catch (error) {
      console.error('SupabaseService: 更新支付配置失败', error);
      throw error;
    }
  }
}

console.log('🚀 Supabase服务层初始化完成');