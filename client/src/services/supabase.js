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

  // 获取一级销售结算数据（修复版：直接从表中查询）
  static async getPrimarySalesSettlement(params) {
    try {
      // 1. 直接从一级销售表获取数据（不依赖不存在的视图）
      let salesQuery = supabase
        .from('primary_sales')
        .select('*');
      
      if (params.wechat_name) {
        // 精确匹配微信号
        salesQuery = salesQuery.eq('wechat_name', params.wechat_name);
      }
      if (params.sales_code) {
        salesQuery = salesQuery.eq('sales_code', params.sales_code);
      }
      
      const { data: primarySale, error: salesError } = await salesQuery.single();
      
      if (salesError) {
        console.error('查询一级销售失败:', salesError);
        throw new Error('未找到匹配的一级销售，请输入完整的微信号（如：一级销售张三）');
      }
      
      // 构建统计数据对象（兼容原有结构）
      const primaryStats = {
        ...primarySale,
        total_orders: 0,
        total_amount: 0,
        total_commission: 0,
        month_orders: 0,
        month_amount: 0,
        month_commission: 0
      };
      
      // 2. 获取该一级销售的所有二级销售（直接从表查询）
      // 🔧 修复：显示所有二级销售，不管有没有订单
      const { data: secondarySales, error: secondaryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primaryStats.id)
        .order('created_at', { ascending: false });
      
      if (secondaryError) {
        console.error('查询二级销售失败:', secondaryError);
      }
      
      // 为每个二级销售计算统计信息
      const secondaryStats = [];
      if (secondarySales && secondarySales.length > 0) {
        for (const sale of secondarySales) {
          // 获取该二级销售的所有订单（包括未确认的）
          const { data: allOrders, error: allOrdersErr } = await supabase
            .from('orders')
            .select('amount, actual_payment_amount, status')
            .eq('sales_code', sale.sales_code);
          
          // 分别计算已确认和全部订单
          const confirmedOrders = allOrders?.filter(o => 
            ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
          ) || [];
          
          const totalAmount = confirmedOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
          const allOrdersAmount = allOrders?.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0) || 0;
          
          // 使用佣金率计算佣金，如果没有设置则为0
          const commissionRate = sale.commission_rate || 0;
          const commissionAmount = totalAmount * commissionRate;
          
          secondaryStats.push({
            ...sale,
            total_orders: allOrders?.length || 0,  // 所有订单数
            confirmed_orders: confirmedOrders.length,  // 已确认订单数
            total_amount: totalAmount,  // 已确认订单金额
            all_orders_amount: allOrdersAmount,  // 所有订单金额
            total_commission: commissionAmount,
            order_count: allOrders?.length || 0,
            commission_rate: commissionRate  // 确保返回佣金率，即使是0
          });
        }
      }
      
      // 3. 获取订单列表（直接从orders表查询）
      let allSalesCodes = [primaryStats.sales_code];
      if (secondaryStats && secondaryStats.length > 0) {
        const secondaryCodes = secondaryStats.map(s => s.sales_code);
        allSalesCodes = [...allSalesCodes, ...secondaryCodes];
      }
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')  // 直接从订单表查询
        .select('*')
        .in('sales_code', allSalesCodes)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])  // 只获取确认的订单
        .order('created_at', { ascending: false })
        .limit(100);  // 限制返回数量
      
      if (ordersError) {
        console.error('查询订单失败:', ordersError);
      }
      
      // 4. 获取待催单订单
      const { data: reminderOrders } = await supabase
        .from('orders')
        .select('*')
        .in('sales_code', allSalesCodes)
        .in('status', ['pending_payment', 'pending_config'])
        .order('created_at', { ascending: false });
      
      // 5. 计算一级销售的订单统计
      const { data: primaryOrders } = await supabase
        .from('orders')
        .select('amount, actual_payment_amount, status')
        .eq('sales_code', primaryStats.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active']);
      
      if (primaryOrders) {
        primaryStats.total_orders = primaryOrders.length;
        primaryStats.total_amount = primaryOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
        primaryStats.total_commission = primaryStats.total_amount * (primaryStats.commission_rate || 0.4);
      }
      
      // 🔧 修复：计算所有二级销售的订单总数和金额
      let secondaryTotalOrders = 0;
      let secondaryTotalAmount = 0;
      let secondaryTotalCommission = 0;
      
      if (secondaryStats && secondaryStats.length > 0) {
        secondaryStats.forEach(ss => {
          secondaryTotalOrders += ss.total_orders || 0;
          secondaryTotalAmount += ss.total_amount || 0;
          secondaryTotalCommission += ss.total_commission || 0;
        });
      }
      
      // 6. 计算综合统计（一级 + 所有二级）
      const totalStats = {
        // 🔧 修复：总计应包含一级自己的订单 + 所有二级的订单
        totalOrders: (primaryStats.total_orders || 0) + secondaryTotalOrders,
        totalAmount: (primaryStats.total_amount || 0) + secondaryTotalAmount,
        totalCommission: (primaryStats.total_commission || 0) + secondaryTotalCommission,
        // 本月
        monthOrders: primaryStats.month_orders,
        monthAmount: primaryStats.month_amount,
        monthCommission: primaryStats.month_commission,
        // 待处理
        pendingReminderCount: reminderOrders?.length || 0
      };
      
      // 加上二级销售的数据
      if (secondaryStats && secondaryStats.length > 0) {
        secondaryStats.forEach(ss => {
          totalStats.totalOrders += ss.total_orders;
          totalStats.totalAmount += ss.total_amount;
          totalStats.totalCommission += ss.total_commission;
          totalStats.monthOrders += ss.month_orders;
          totalStats.monthAmount += ss.month_amount;
          totalStats.monthCommission += ss.month_commission;
        });
      }
      
      return {
        sales: {
          id: primaryStats.id,
          wechat_name: primaryStats.wechat_name,
          sales_code: primaryStats.sales_code,
          commission_rate: primaryStats.commission_rate,
          payment_account: primaryStats.payment_account,
          payment_method: primaryStats.payment_method,
          // 自己的统计
          direct_orders: primaryStats.total_orders,
          direct_amount: primaryStats.total_amount,
          direct_commission: primaryStats.total_commission
        },
        orders: orders || [],
        secondarySales: secondaryStats || [],
        reminderOrders: reminderOrders || [],
        stats: totalStats
      };
    } catch (error) {
      console.error('获取一级销售结算数据失败:', error);
      throw error;
    }
  }

  // 获取二级销售结算数据（修复版：直接从表中查询）
  static async getSecondarySalesSettlement(params) {
    try {
      // 1. 直接从二级销售表获取数据（不依赖不存在的视图）
      let salesQuery = supabase
        .from('secondary_sales')
        .select('*');
      
      if (params.wechat_name) {
        // 精确匹配微信号
        salesQuery = salesQuery.eq('wechat_name', params.wechat_name);
      }
      if (params.sales_code) {
        salesQuery = salesQuery.eq('sales_code', params.sales_code);
      }
      
      const { data: secondarySale, error: salesError } = await salesQuery.single();
      
      if (salesError) {
        console.error('查询二级销售失败:', salesError);
        throw new Error('未找到匹配的二级销售，请输入完整的微信号（如：一级下的二级王五）');
      }
      
      // 计算订单统计
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('sales_code', secondarySale.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active']);
      
      const totalOrders = orders?.length || 0;
      const totalAmount = orders?.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0) || 0;
      const totalCommission = totalAmount * (secondarySale.commission_rate || 0.3);
      
      // 构建统计数据对象（兼容原有结构）
      const salesStats = {
        ...secondarySale,
        total_orders: totalOrders,
        total_amount: totalAmount,
        total_commission: totalCommission,
        month_orders: totalOrders,  // 简化处理，本月数据等于总数据
        month_amount: totalAmount,
        month_commission: totalCommission
      };
      
      // 2. 获取确认的订单详情（用于显示列表）
      let ordersQuery = supabase
        .from('orders')  // 直接从订单表查询
        .select('*')
        .eq('sales_code', salesStats.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])  // 只获取确认的订单
        .order('created_at', { ascending: false })
        .limit(50);  // 限制返回数量，提高性能
      
      // 添加日期筛选
      if (params.payment_date_range) {
        const [startDate, endDate] = params.payment_date_range.split(',');
        ordersQuery = ordersQuery
          .gte('payment_time', startDate)  // 使用payment_time字段
          .lte('payment_time', endDate);
      }
      
      const { data: confirmedOrders, error: ordersError } = await ordersQuery;
      
      if (ordersError) {
        console.error('查询订单失败:', ordersError);
      }
      
      // 3. 获取待催单（未确认的订单）
      const { data: reminderOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('sales_code', salesStats.sales_code)
        .in('status', ['pending_payment', 'pending_config'])
        .order('created_at', { ascending: false });
      
      // 为订单计算到期时间
      const calculateExpiryTime = (order) => {
        if (!order.effective_time && !order.created_at) return null;
        
        const startDate = new Date(order.effective_time || order.created_at);
        const expiryDate = new Date(startDate);
        
        // 根据购买时长计算到期时间
        switch(order.duration) {
          case '7days':
            expiryDate.setDate(expiryDate.getDate() + 7);
            break;
          case '1month':
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            break;
          case '3months':
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            break;
          case '6months':
            expiryDate.setMonth(expiryDate.getMonth() + 6);
            break;
          case '1year':
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            break;
          default:
            return null;
        }
        
        return expiryDate.toISOString();
      };
      
      // 为所有订单添加到期时间
      if (confirmedOrders) {
        confirmedOrders.forEach(order => {
          order.expiry_time = calculateExpiryTime(order);
        });
      }
      
      if (reminderOrders) {
        reminderOrders.forEach(order => {
          order.expiry_time = calculateExpiryTime(order);
          // 计算剩余天数
          if (order.expiry_time) {
            const now = new Date();
            const expiry = new Date(order.expiry_time);
            const diffTime = expiry - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            order.daysUntilExpiry = diffDays;
          }
        });
      }
      
      // 4. 返回整合的数据
      return {
        sales: {
          id: salesStats.id,
          wechat_name: salesStats.wechat_name,
          sales_code: salesStats.sales_code,
          commission_rate: salesStats.commission_rate,
          payment_account: salesStats.payment_account,
          payment_method: salesStats.payment_method,
          // 总计数据
          total_orders: salesStats.total_orders,
          total_amount: salesStats.total_amount,
          total_commission: salesStats.total_commission,
          // 本月数据
          month_orders: salesStats.month_orders,
          month_amount: salesStats.month_amount,
          month_commission: salesStats.month_commission
        },
        orders: confirmedOrders || [],
        reminderOrders: reminderOrders || [],
        stats: {
          // 总计
          totalOrders: salesStats.total_orders,
          totalAmount: salesStats.total_amount,
          totalCommission: salesStats.total_commission,
          // 本月
          monthOrders: salesStats.month_orders,
          monthAmount: salesStats.month_amount,
          monthCommission: salesStats.month_commission,
          // 待处理
          pendingReminderCount: reminderOrders?.length || 0,
          // 当前佣金率
          commissionRate: salesStats.commission_rate
        }
      };
    } catch (error) {
      console.error('获取二级销售结算数据失败:', error);
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
          // 只使用wechat_name字段，不存在则显示'-'
          order.sales_wechat_name = salesInfo.wechat_name || '-';
          order.sales_name = salesInfo.name || '-';
          order.sales_phone = salesInfo.phone || '-';
          
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

  // 带过滤条件的订单查询
  static async getOrdersWithFilters(params = {}) {
    let query = supabase
      .from('orders')
      .select('*');
    
    // 销售类型过滤
    let salesCodesToFilter = [];
    
    if (params.sales_type) {
      // 根据销售类型获取对应的销售代码
      if (params.sales_type === 'primary') {
        const { data: primarySales } = await supabase
          .from('primary_sales')
          .select('sales_code');
        salesCodesToFilter = (primarySales || []).map(s => s.sales_code);
      } else if (params.sales_type === 'secondary') {
        // 二级销售（有上级的）
        const { data: secondarySales } = await supabase
          .from('secondary_sales')
          .select('sales_code, primary_sales_id')
          .not('primary_sales_id', 'is', null);
        salesCodesToFilter = (secondarySales || []).map(s => s.sales_code);
      } else if (params.sales_type === 'independent') {
        // 独立销售（没有上级的二级销售）
        const { data: independentSales } = await supabase
          .from('secondary_sales')
          .select('sales_code')
          .is('primary_sales_id', null);
        salesCodesToFilter = (independentSales || []).map(s => s.sales_code);
      }
    }
    
    // 销售微信号搜索（精确匹配）
    if (params.sales_wechat) {
      // 先获取销售信息 - 使用精确匹配
      let primarySales = [];
      let secondarySales = [];
      
      // 如果已经筛选了销售类型，只查询对应类型
      if (params.sales_type === 'primary') {
        const { data } = await supabase
          .from('primary_sales')
          .select('sales_code')
          .eq('wechat_name', params.sales_wechat);
        primarySales = data || [];
      } else if (params.sales_type === 'secondary') {
        const { data } = await supabase
          .from('secondary_sales')
          .select('sales_code')
          .eq('wechat_name', params.sales_wechat);
        secondarySales = data || [];
      } else {
        // 没有指定类型，查询两种类型
        const { data: primaryData } = await supabase
          .from('primary_sales')
          .select('sales_code')
          .eq('wechat_name', params.sales_wechat);
        
        const { data: secondaryData } = await supabase
          .from('secondary_sales')
          .select('sales_code')
          .eq('wechat_name', params.sales_wechat);
        
        primarySales = primaryData || [];
        secondarySales = secondaryData || [];
      }
      
      const salesCodes = [
        ...primarySales.map(s => s.sales_code),
        ...secondarySales.map(s => s.sales_code)
      ];
      
      if (salesCodes.length > 0) {
        salesCodesToFilter = salesCodes;
      } else {
        // 如果没有找到匹配的销售，返回空结果
        return [];
      }
    }
    
    // 应用销售代码过滤
    if (salesCodesToFilter.length > 0) {
      query = query.in('sales_code', salesCodesToFilter);
    }
    
    // 用户微信号搜索
    if (params.customer_wechat) {
      query = query.ilike('customer_wechat', `%${params.customer_wechat}%`);
    }
    
    // TradingView用户名搜索
    if (params.tradingview_username) {
      query = query.ilike('tradingview_username', `%${params.tradingview_username}%`);
    }
    
    // 订单状态过滤
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    // 支付方式过滤
    if (params.payment_method) {
      query = query.eq('payment_method', params.payment_method);
    }
    
    // 购买方式过滤
    if (params.purchase_type) {
      query = query.eq('purchase_type', params.purchase_type);
    }
    
    // 日期范围过滤
    if (params.start_date && params.end_date) {
      query = query
        .gte('created_at', params.start_date)
        .lte('created_at', params.end_date + ' 23:59:59');
    }
    
    // 付款日期范围过滤
    if (params.payment_start_date && params.payment_end_date) {
      query = query
        .gte('payment_time', params.payment_start_date)
        .lte('payment_time', params.payment_end_date + ' 23:59:59');
    }
    
    // 配置日期范围过滤
    if (params.config_start_date && params.config_end_date) {
      query = query
        .gte('effective_time', params.config_start_date)
        .lte('effective_time', params.config_end_date + ' 23:59:59');
    }
    
    // 到期日期范围过滤
    if (params.expiry_start_date && params.expiry_end_date) {
      query = query
        .gte('expiry_time', params.expiry_start_date)
        .lte('expiry_time', params.expiry_end_date + ' 23:59:59');
    }
    
    // 排序
    query = query.order('created_at', { ascending: false });
    
    const { data: orders, error } = await query;
    
    if (error) throw error;
    
    // 如果没有订单，直接返回空数组
    if (!orders || orders.length === 0) {
      return [];
    }
    
    // 复用getOrders的销售信息关联逻辑
    // 收集所有需要查询的销售ID和代码
    const salesCodes = [...new Set(orders.map(order => order.sales_code).filter(Boolean))];
    const primarySalesIds = [...new Set(orders.map(order => order.primary_sales_id).filter(Boolean))];
    const secondarySalesIds = [...new Set(orders.map(order => order.secondary_sales_id).filter(Boolean))];
    
    // 并行获取销售数据
    const queries = [];
    
    if (salesCodes.length > 0) {
      queries.push(
        supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('sales_code', salesCodes),
        supabase.from('secondary_sales').select('id, sales_code, name, wechat_name, phone, primary_sales_id').in('sales_code', salesCodes)
      );
    }
    
    if (primarySalesIds.length > 0) {
      queries.push(
        supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('id', primarySalesIds)
      );
    }
    
    if (secondarySalesIds.length > 0) {
      queries.push(
        supabase.from('secondary_sales').select('id, sales_code, name, wechat_name, phone, primary_sales_id').in('id', secondarySalesIds)
      );
    }
    
    if (queries.length > 0) {
      const results = await Promise.all(queries);
      
      // 创建映射
      const primarySalesByCode = new Map();
      const primarySalesById = new Map();
      const secondarySalesByCode = new Map();
      const secondarySalesById = new Map();
      
      results.forEach(result => {
        if (result.data) {
          result.data.forEach(sale => {
            // 判断是一级还是二级销售
            if (sale.primary_sales_id !== undefined) {
              // 是二级销售
              if (sale.sales_code) secondarySalesByCode.set(sale.sales_code, sale);
              if (sale.id) secondarySalesById.set(sale.id, sale);
            } else {
              // 是一级销售
              if (sale.sales_code) primarySalesByCode.set(sale.sales_code, sale);
              if (sale.id) primarySalesById.set(sale.id, sale);
            }
          });
        }
      });
      
      // 为每个订单添加销售信息
      orders.forEach(order => {
        let salesInfo = null;
        let salesType = null;
        
        // 多重匹配逻辑
        if (order.primary_sales_id && primarySalesById.has(order.primary_sales_id)) {
          salesInfo = primarySalesById.get(order.primary_sales_id);
          salesType = 'primary';
        } else if (order.secondary_sales_id && secondarySalesById.has(order.secondary_sales_id)) {
          salesInfo = secondarySalesById.get(order.secondary_sales_id);
          salesType = 'secondary';
        } else if (order.sales_code) {
          if (primarySalesByCode.has(order.sales_code)) {
            salesInfo = primarySalesByCode.get(order.sales_code);
            salesType = 'primary';
          } else if (secondarySalesByCode.has(order.sales_code)) {
            salesInfo = secondarySalesByCode.get(order.sales_code);
            salesType = 'secondary';
          }
        }
        
        if (salesInfo) {
          order.sales_type = salesType;
          order.sales_wechat_name = salesInfo.wechat_name || '-';
          order.sales_name = salesInfo.name || '-';
          order.sales_phone = salesInfo.phone || '-';
          
          // 如果是二级销售，尝试获取其一级销售信息
          if (salesType === 'secondary' && salesInfo.primary_sales_id) {
            const primarySales = primarySalesById.get(salesInfo.primary_sales_id);
            if (primarySales) {
              order.secondary_sales = {
                ...salesInfo,
                primary_sales: primarySales
              };
            } else {
              order.secondary_sales = salesInfo;
            }
          } else if (salesType === 'primary') {
            order.primary_sales = salesInfo;
          } else if (salesType === 'secondary') {
            order.secondary_sales = salesInfo;
          }
        }
        
        // 计算生效时间和到期时间
        if (order.created_at && order.duration) {
          const createdDate = new Date(order.created_at);
          order.effective_time = order.created_at;
          
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
    
    return orders;
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
            // 第二个链配置
            crypto2_chain_name: configData.crypto2_chain_name,
            crypto2_address: configData.crypto2_address,
            crypto2_qr_code: configData.crypto2_qr_code,
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
            // 第二个链配置
            crypto2_chain_name: configData.crypto2_chain_name,
            crypto2_address: configData.crypto2_address,
            crypto2_qr_code: configData.crypto2_qr_code,
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

  // 获取收益分配配置
  static async getProfitDistribution() {
    try {
      const { data, error } = await supabase
        .from('profit_distribution')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // 表不存在或没有数据，返回默认值
        console.log('收益分配配置不存在，使用默认值');
        return {
          public_ratio: 40,
          zhixing_ratio: 35,
          zijun_ratio: 25
        };
      }
      
      if (error) throw error;
      
      return {
        public_ratio: parseFloat(data.public_ratio) || 40,
        zhixing_ratio: parseFloat(data.zhixing_ratio) || 35,
        zijun_ratio: parseFloat(data.zijun_ratio) || 25
      };
    } catch (error) {
      console.error('获取收益分配配置失败:', error);
      // 返回默认值
      return {
        public_ratio: 40,
        zhixing_ratio: 35,
        zijun_ratio: 25
      };
    }
  }

  // 更新收益分配配置
  static async updateProfitDistribution(ratios) {
    try {
      console.log('SupabaseService: 更新收益分配配置', ratios);
      
      // 先将所有现有配置设为非激活
      await supabase
        .from('profit_distribution')
        .update({ is_active: false })
        .eq('is_active', true);
      
      // 创建新的激活配置
      const { data, error } = await supabase
        .from('profit_distribution')
        .insert({
          public_ratio: ratios.public || 40,
          zhixing_ratio: ratios.zhixing || 35,
          zijun_ratio: ratios.zijun || 25,
          is_active: true,
          created_by: 'admin'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('SupabaseService: 收益分配配置更新成功', data);
      return data;
    } catch (error) {
      console.error('SupabaseService: 更新收益分配配置失败', error);
      throw error;
    }
  }
}

console.log('🚀 Supabase服务层初始化完成');