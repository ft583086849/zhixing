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

  // 获取一级销售结算数据（优化版：复用销售管理页面数据）
  static async getPrimarySalesSettlement(params) {
    try {
      console.log('🔍 获取一级销售结算数据，参数:', params);
      
      // 1. 从 sales_optimized 表获取一级销售数据
      let salesQuery = supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_type', 'primary');
      
      if (params.wechat_name) {
        salesQuery = salesQuery.eq('wechat_name', params.wechat_name);
      }
      if (params.sales_code) {
        salesQuery = salesQuery.eq('sales_code', params.sales_code);
      }
      
      const { data: primarySale, error: salesError } = await salesQuery.single();
      
      if (salesError) {
        console.error('查询一级销售失败:', salesError);
        throw new Error('未找到匹配的一级销售');
      }
      
      // 构建统计数据对象（保持数据库中的真实值）
      const primaryStats = {
        ...primarySale,
        // 🔧 修复：不要覆盖数据库中的真实数据，只设置缺失的字段
        total_orders: primarySale.total_orders || 0,
        total_amount: primarySale.total_amount || 0,
        total_commission: primarySale.total_commission || 0,
        month_orders: primarySale.month_orders || 0,
        month_amount: primarySale.month_amount || 0,
        month_commission: primarySale.month_commission || 0,
        today_orders: primarySale.today_orders || 0,
        today_amount: primarySale.today_amount || 0,
        today_commission: primarySale.today_commission || 0
      };
      
      // 2. 获取该一级销售的所有二级销售（直接从表查询）
      // 🔧 修复：显示所有二级销售，不管有没有订单
      const { data: secondarySales, error: secondaryError } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('parent_sales_code', primaryStats.sales_code)
        .order('created_at', { ascending: false });
      
      if (secondaryError) {
        console.error('查询二级销售失败:', secondaryError);
      }
      
      // 为每个二级销售计算统计信息
      const secondaryStats = [];
      if (secondarySales && secondarySales.length > 0) {
        // 获取当前月份的开始和结束时间
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        // 获取今天的开始和结束时间
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        for (const sale of secondarySales) {
          // 获取该二级销售的所有订单（包括未确认的）
          const { data: allOrders, error: allOrdersErr } = await supabase
            .from('orders_optimized')
            .select('amount, actual_payment_amount, status, payment_time, created_at')
            .eq('sales_code', sale.sales_code);
          
          // 🔧 修复：排除已拒绝的订单
          const nonRejectedOrders = allOrders?.filter(o => o.status !== 'rejected') || [];
          
          // 分别计算已确认和全部订单（不包括rejected）
          const confirmedOrders = nonRejectedOrders.filter(o => 
            ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
          ) || [];
          
          // 筛选本月订单（基于payment_time）
          const monthOrders = confirmedOrders.filter(o => {
            const paymentTime = new Date(o.payment_time || o.created_at);
            return paymentTime >= currentMonthStart && paymentTime <= currentMonthEnd;
          });
          
          // 筛选今日订单（基于payment_time）
          const todayOrders = confirmedOrders.filter(o => {
            const paymentTime = new Date(o.payment_time || o.created_at);
            return paymentTime >= todayStart && paymentTime <= todayEnd;
          });
          
          const totalAmount = confirmedOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
          const monthAmount = monthOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
          const todayAmount = todayOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
          const allOrdersAmount = nonRejectedOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0) || 0;
          
          // 使用佣金率计算佣金，如果没有设置则为0
          const commissionRate = sale.commission_rate || 0;
          const commissionAmount = totalAmount * commissionRate;
          const monthCommission = monthAmount * commissionRate;
          const todayCommission = todayAmount * commissionRate;
          
          secondaryStats.push({
            ...sale,
            // 🔧 修复：total_orders 应该只统计已确认的订单，排除已拒绝的订单
            total_orders: confirmedOrders.length,  // 已确认订单数（与一级销售统计口径一致）
            confirmed_orders: confirmedOrders.length,  // 已确认订单数
            total_amount: totalAmount,  // 已确认订单金额
            all_orders_amount: allOrdersAmount,  // 所有订单金额（不包括rejected）
            total_commission: commissionAmount,
            // 本月数据（基于payment_time）
            month_orders: monthOrders.length,
            month_amount: monthAmount,
            month_commission: monthCommission,
            // 当日数据（基于payment_time）
            today_orders: todayOrders.length,
            today_amount: todayAmount,
            today_commission: todayCommission,
            order_count: nonRejectedOrders.length,  // 🔧 修复：使用非rejected订单数
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
        .from('orders_optimized')  // 直接从订单表查询
        .select('*')
        .in('sales_code', allSalesCodes)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])  // 只获取确认的订单
        .order('created_at', { ascending: false })
        .limit(100);  // 限制返回数量
      
      if (ordersError) {
        console.error('查询订单失败:', ordersError);
      }
      
      // 4. 获取待催单订单（已生效但即将到期的订单）
      const { data: allActiveOrders } = await supabase
        .from('orders_optimized')
        .select('*')
        .in('sales_code', allSalesCodes)
        .in('status', ['confirmed_config', 'active'])
        .order('created_at', { ascending: false });
      
      // 为订单计算到期时间并筛选需要催单的
      let reminderOrders = [];
      if (allActiveOrders && allActiveOrders.length > 0) {
        // 计算到期时间
        const calculateExpiryTime = (order) => {
          if (!order.effective_time && !order.created_at) return null;
          
          const startDate = new Date(order.effective_time || order.created_at);
          const expiryDate = new Date(startDate);
          
          // 根据购买时长计算到期时间
          switch(order.duration) {
            case '7天':
            case '7days':
              expiryDate.setDate(expiryDate.getDate() + 7);
              break;
            case '1个月':
            case '1month':
              expiryDate.setMonth(expiryDate.getMonth() + 1);
              break;
            case '3个月':
            case '3months':
              expiryDate.setMonth(expiryDate.getMonth() + 3);
              break;
            case '6个月':
            case '6months':
              expiryDate.setMonth(expiryDate.getMonth() + 6);
              break;
            case '1年':
            case '1year':
              expiryDate.setFullYear(expiryDate.getFullYear() + 1);
              break;
            default:
              return null;
          }
          
          return expiryDate.toISOString();
        };
        
        // 为所有已生效订单添加到期时间
        allActiveOrders.forEach(order => {
          order.expiry_time = calculateExpiryTime(order);
        });
        
        // 筛选需要催单的订单（复用客户管理页面逻辑）
        reminderOrders = allActiveOrders.filter(order => {
          if (!order.expiry_time) return false;
          
          const now = new Date();
          const expiry = new Date(order.expiry_time);
          const diffTime = expiry - now;
          const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // 判断是否有金额（与客户管理页面逻辑一致）
          const hasAmount = (order.total_amount || order.amount || 0) > 0;
          const reminderDays = hasAmount ? 7 : 3; // 有金额7天，无金额3天
          
          // 催单条件：即将到期 + 已过期30天内
          const needReminder = (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) || // 即将到期
                              (daysUntilExpiry < 0 && Math.abs(daysUntilExpiry) <= 30); // 已过期30天内
          
          // 排除已催单的订单
          const isNotReminded = !order.is_reminded;
          
          if (needReminder && isNotReminded) {
            // 计算剩余天数供前端显示
            order.daysUntilExpiry = daysUntilExpiry;
            // 为催单功能添加客户信息
            order.customer_wechat = order.customer_wechat || order.wechat_name;
            order.parent_sales_code = order.parent_sales_code || (
              // 判断是否是二级销售的订单
              secondaryStats.find(s => s.sales_code === order.sales_code)?.parent_sales_code || null
            );
          }
          
          return needReminder && isNotReminded;
        });
      }
      
      // 5. 计算一级销售的订单统计
      const { data: primaryOrders } = await supabase
        .from('orders_optimized')
        .select('amount, actual_payment_amount, status, payment_time, created_at')
        .eq('sales_code', primaryStats.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active']);
      
      if (primaryOrders) {
        // 获取当前月份的开始和结束时间
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        // 获取今天的开始和结束时间
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        // 筛选本月订单（基于payment_time）
        const monthOrders = primaryOrders.filter(o => {
          const paymentTime = new Date(o.payment_time || o.created_at);
          return paymentTime >= currentMonthStart && paymentTime <= currentMonthEnd;
        });
        
        // 筛选今日订单（基于payment_time）
        const todayOrders = primaryOrders.filter(o => {
          const paymentTime = new Date(o.payment_time || o.created_at);
          return paymentTime >= todayStart && paymentTime <= todayEnd;
        });
        
        primaryStats.total_orders = primaryOrders.length;
        primaryStats.total_amount = primaryOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
        
        // 本月数据（基于payment_time）
        primaryStats.month_orders = monthOrders.length;
        primaryStats.month_amount = monthOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
        
        // 当日数据（基于payment_time）
        primaryStats.today_orders = todayOrders.length;
        primaryStats.today_amount = todayOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
        
        // 🔧 修复：正确处理佣金率为0的情况
        const rate = (primaryStats.commission_rate !== null && primaryStats.commission_rate !== undefined) 
          ? primaryStats.commission_rate 
          : 0.4;
        primaryStats.total_commission = primaryStats.total_amount * rate;
        primaryStats.month_commission = primaryStats.month_amount * rate;
        primaryStats.today_commission = primaryStats.today_amount * rate;
      }
      
      // 🔧 修复：计算所有二级销售的订单总数和金额
      let secondaryTotalOrders = 0;
      let secondaryTotalAmount = 0;
      let secondaryTotalCommission = 0;
      let secondaryMonthOrders = 0;
      let secondaryMonthAmount = 0;
      let secondaryMonthCommission = 0;
      let secondaryTodayOrders = 0;
      let secondaryTodayAmount = 0;
      let secondaryTodayCommission = 0;
      
      if (secondaryStats && secondaryStats.length > 0) {
        secondaryStats.forEach(ss => {
          secondaryTotalOrders += ss.total_orders || 0;
          secondaryTotalAmount += ss.total_amount || 0;
          secondaryTotalCommission += ss.total_commission || 0;
          secondaryMonthOrders += ss.month_orders || 0;
          secondaryMonthAmount += ss.month_amount || 0;
          secondaryMonthCommission += ss.month_commission || 0;
          secondaryTodayOrders += ss.today_orders || 0;
          secondaryTodayAmount += ss.today_amount || 0;
          secondaryTodayCommission += ss.today_commission || 0;
        });
      }
      
      // 🚀 佣金系统v2.0 - 详细拆分计算
      const primaryDirectAmount = primaryStats.total_amount || 0;  // 一级直接订单金额
      const primaryBaseRate = 0.4;  // 一级基础佣金率40%
      const teamTotalAmount = primaryDirectAmount + secondaryTotalAmount;  // 团队总金额
      
      // 1. 计算一级直销佣金
      const primaryDirectCommission = primaryDirectAmount * primaryBaseRate;
      
      // 2. 计算二级分销收益（差额收益）
      const secondaryShareCommission = secondaryTotalAmount * primaryBaseRate - secondaryTotalCommission;
      
      // 3. 计算总佣金
      const primaryTotalCommission = primaryDirectCommission + secondaryShareCommission;
      
      // 4. 计算加权平均二级佣金率
      let secondaryAvgRate = 0;
      if (secondaryTotalAmount > 0) {
        // 加权平均 = Σ(佣金率×订单额) ÷ Σ订单额
        let weightedSum = 0;
        secondaryStats.forEach(ss => {
          const rate = ss.commission_rate || 0.25;
          const amount = ss.total_amount || 0;
          weightedSum += rate * amount;
        });
        secondaryAvgRate = weightedSum / secondaryTotalAmount;
      }
      
      // 5. 更新primaryStats - 添加详细的佣金拆分数据
      primaryStats.base_commission_rate = primaryBaseRate;  // 固定40%
      primaryStats.direct_orders_amount = primaryDirectAmount;  // 一级直销订单金额
      primaryStats.direct_commission = primaryDirectCommission;  // 一级直销佣金
      
      primaryStats.secondary_orders_amount = secondaryTotalAmount;  // 二级订单总额
      primaryStats.secondary_avg_rate = secondaryAvgRate;  // 加权平均二级佣金率
      primaryStats.secondary_share_commission = secondaryShareCommission;  // 二级分销收益
      
      primaryStats.total_commission = primaryTotalCommission;  // 总佣金（直销+分销）
      
      // 保留动态佣金率（用于兼容旧代码）
      const dynamicRate = teamTotalAmount > 0 ? primaryTotalCommission / teamTotalAmount : primaryBaseRate;
      primaryStats.dynamic_commission_rate = dynamicRate;
      primaryStats.commission_rate = dynamicRate;
      
      // 6. 计算月度和当日佣金明细
      const monthDirectCommission = (primaryStats.month_amount || 0) * primaryBaseRate;
      const monthShareCommission = secondaryMonthAmount * primaryBaseRate - secondaryMonthCommission;
      primaryStats.month_commission = monthDirectCommission + monthShareCommission;
      primaryStats.month_direct_commission = monthDirectCommission;
      primaryStats.month_share_commission = monthShareCommission;
      
      const todayDirectCommission = (primaryStats.today_amount || 0) * primaryBaseRate;
      const todayShareCommission = secondaryTodayAmount * primaryBaseRate - secondaryTodayCommission;
      primaryStats.today_commission = todayDirectCommission + todayShareCommission;
      primaryStats.today_direct_commission = todayDirectCommission;
      primaryStats.today_share_commission = todayShareCommission;
      
      console.log('佣金系统v2.0计算结果:', {
        一级直销: {
          订单金额: primaryDirectAmount,
          佣金率: '40%',
          佣金: primaryDirectCommission
        },
        二级分销: {
          订单金额: secondaryTotalAmount,
          平均佣金率: (secondaryAvgRate * 100).toFixed(2) + '%',
          分销收益: secondaryShareCommission
        },
        总计: {
          团队总金额: teamTotalAmount,
          总佣金: primaryTotalCommission,
          综合佣金率: (dynamicRate * 100).toFixed(2) + '%'
        }
      });
      
      // 6. 计算综合统计（一级 + 所有二级）
      const totalStats = {
        // 🔧 一二级总订单数：包含一级自己的订单 + 所有二级的订单
        totalOrders: (primaryStats.total_orders || 0) + secondaryTotalOrders,
        totalAmount: (primaryStats.total_amount || 0) + secondaryTotalAmount,
        // 🚀 使用动态佣金率计算的总佣金（如果有二级销售）
        totalCommission: primaryStats.total_commission || 0,  // 已经在动态计算中更新过了
        // 本月（包含一级和二级）
        monthOrders: (primaryStats.month_orders || 0) + secondaryMonthOrders,
        monthAmount: (primaryStats.month_amount || 0) + secondaryMonthAmount,
        // 🚀 本月佣金使用动态佣金率
        monthCommission: primaryStats.month_commission || 0,  // 已经在动态计算中更新过了
        // 当日（包含一级和二级）
        todayOrders: (primaryStats.today_orders || 0) + secondaryTodayOrders,
        todayAmount: (primaryStats.today_amount || 0) + secondaryTodayAmount,
        // 🚀 当日佣金使用动态佣金率
        todayCommission: primaryStats.today_commission || 0,  // 已经在动态计算中更新过了
        // 待处理
        pendingReminderCount: reminderOrders?.length || 0,
        // 当前佣金率（动态计算后的）
        currentCommissionRate: primaryStats.commission_rate || 0.4
      }
      
      return {
        sales: {
          id: primaryStats.id,
          wechat_name: primaryStats.wechat_name,
          sales_code: primaryStats.sales_code,
          secondary_registration_code: primaryStats.secondary_registration_code,  // 添加二级销售注册码
          commission_rate: primaryStats.commission_rate,
          payment_account: primaryStats.payment_account,
          payment_method: primaryStats.payment_method,
          
          // 🚀 v2.0佣金系统字段（从计算结果获取，兼容数据库字段不存在的情况）
          total_commission: primaryStats.total_commission || 0,  // 总佣金
          direct_commission: primaryStats.direct_commission || primaryStats.total_amount * 0.4 || 0,  // 直销佣金
          secondary_avg_rate: primaryStats.secondary_avg_rate || secondaryAvgRate || 0,  // 平均二级佣金率
          secondary_share_commission: primaryStats.secondary_share_commission || secondaryShareCommission || 0,  // 二级佣金收益
          secondary_orders_amount: primaryStats.secondary_orders_amount || secondaryTotalAmount || 0,  // 二级销售订单总额
          
          // 基础统计
          direct_orders: primaryStats.total_orders,
          direct_amount: primaryStats.total_amount,
          
          // 时间统计（本月/当日）
          month_commission: primaryStats.month_commission || (primaryStats.month_amount * 0.4 || 0),
          today_commission: primaryStats.today_commission || (primaryStats.today_amount * 0.4 || 0),
          month_orders: primaryStats.month_orders,
          today_orders: primaryStats.today_orders,
          month_amount: primaryStats.month_amount,
          today_amount: primaryStats.today_amount
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
      // 1. 从sales_optimized表获取二级销售数据
      let salesQuery = supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_type', 'secondary');
      
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
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', secondarySale.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active']);
      
      // 获取当前时间范围
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      // 筛选本月和今日订单
      const monthOrders = orders?.filter(o => {
        const paymentTime = new Date(o.payment_time || o.created_at);
        return paymentTime >= currentMonthStart && paymentTime <= currentMonthEnd;
      }) || [];
      
      const todayOrders = orders?.filter(o => {
        const paymentTime = new Date(o.payment_time || o.created_at);
        return paymentTime >= todayStart && paymentTime <= todayEnd;
      }) || [];
      
      const totalOrders = orders?.length || 0;
      const totalAmount = orders?.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0) || 0;
      const monthAmount = monthOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
      const todayAmount = todayOrders.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
      
      // 🔧 修复：正确处理佣金率为0的情况
      const commissionRate = (secondarySale.commission_rate !== null && secondarySale.commission_rate !== undefined)
        ? secondarySale.commission_rate
        : 0.3;
      const totalCommission = totalAmount * commissionRate;
      const monthCommission = monthAmount * commissionRate;
      const todayCommission = todayAmount * commissionRate;
      
      // 构建统计数据对象（兼容原有结构）
      const salesStats = {
        ...secondarySale,
        total_orders: totalOrders,
        total_amount: totalAmount,
        total_commission: totalCommission,
        month_orders: monthOrders.length,
        month_amount: monthAmount,
        month_commission: monthCommission,
        today_orders: todayOrders.length,
        today_amount: todayAmount,
        today_commission: todayCommission
      };
      
      // 2. 获取确认的订单详情（用于显示列表）
      let ordersQuery = supabase
        .from('orders_optimized')  // 直接从订单表查询
        .select('*')
        .eq('sales_code', salesStats.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])  // 只获取确认的订单
        .order('created_at', { ascending: false });
      
      // 添加付款时间筛选
      if (params.start_date && params.end_date) {
        // 将结束日期设置为当天的23:59:59
        const endDate = new Date(params.end_date);
        endDate.setHours(23, 59, 59, 999);
        
        ordersQuery = ordersQuery
          .gte('payment_time', params.start_date)
          .lte('payment_time', endDate.toISOString());
      }
      
      ordersQuery = ordersQuery.limit(50);  // 限制返回数量，提高性能
      
      // 添加日期筛选（旧代码，保留兼容性）
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
      
      // 3. 获取待催单订单（统一客户管理页面逻辑）
      // 查询已生效的订单，然后筛选需要催单的
      const { data: allActiveOrders } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', salesStats.sales_code)
        .in('status', ['confirmed_config', 'active'])
        .order('created_at', { ascending: false});
      
      // 为订单计算到期时间
      const calculateExpiryTime = (order) => {
        if (!order.effective_time && !order.created_at) return null;
        
        const startDate = new Date(order.effective_time || order.created_at);
        const expiryDate = new Date(startDate);
        
        // 根据购买时长计算到期时间（支持中文和英文）
        switch(order.duration) {
          case '7days':
          case '7天':
            expiryDate.setDate(expiryDate.getDate() + 7);
            break;
          case '1month':
          case '1个月':
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            break;
          case '3months':
          case '3个月':
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            break;
          case '6months':
          case '6个月':
            expiryDate.setMonth(expiryDate.getMonth() + 6);
            break;
          case '1year':
          case '1年':
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
          // 如果数据库没有expiry_time，则计算它
          if (!order.expiry_time) {
            order.expiry_time = calculateExpiryTime(order);
          }
        });
      }
      
      // 筛选需要催单的订单（复用客户管理页面逻辑）
      let reminderOrders = [];
      if (allActiveOrders && allActiveOrders.length > 0) {
        // 为所有已生效订单添加到期时间
        allActiveOrders.forEach(order => {
          order.expiry_time = calculateExpiryTime(order);
        });
        
        // 筛选需要催单的订单
        reminderOrders = allActiveOrders.filter(order => {
          if (!order.expiry_time) return false;
          
          const now = new Date();
          const expiry = new Date(order.expiry_time);
          const diffTime = expiry - now;
          const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // 判断是否有金额（与客户管理页面逻辑一致）
          const hasAmount = (order.total_amount || order.amount || 0) > 0;
          const reminderDays = hasAmount ? 7 : 3; // 有金额7天，无金额3天
          
          // 催单条件：即将到期 + 已过期30天内
          const needReminder = (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) || // 即将到期
                              (daysUntilExpiry < 0 && Math.abs(daysUntilExpiry) <= 30); // 已过期30天内
          
          // 排除已催单的客户：如果订单标记为已催单，则不显示在催单列表中
          const isNotReminded = !order.is_reminded; // 只显示未催单的客户
          
          if (needReminder && isNotReminded) {
            // 计算剩余天数供前端显示
            order.daysUntilExpiry = daysUntilExpiry;
          }
          
          return needReminder && isNotReminded;
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
          month_commission: salesStats.month_commission,
          // 当日数据
          today_orders: salesStats.today_orders,
          today_amount: salesStats.today_amount,
          today_commission: salesStats.today_commission
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
          // 当日
          todayOrders: salesStats.today_orders,
          todayAmount: salesStats.today_amount,
          todayCommission: salesStats.today_commission,
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
      .from('orders_optimized')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createOrder(orderData) {
    const { data, error } = await supabase
      .from('orders_optimized')
      .insert([orderData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateOrder(id, updates) {
    const { data, error } = await supabase
      .from('orders_optimized')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateOrderStatus(orderId, status) {
    // 先获取订单信息
    const { data: order } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', orderId)
      .single();
    
    const updates = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    // 如果状态改为confirmed_config，需要设置到期时间
    if (status === 'confirmed_config' && order) {
      const now = new Date();
      let expiryDate;
      
      // 根据订单时长计算到期时间
      switch(order.duration || order.price_plan) {
        case '7days':
        case '7_days':
          expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '1month':
        case '1_month':
        case '30days':
          expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
        case '3_months':
        case '90days':
          expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case '6months':
        case '6_months':
        case '180days':
          expiryDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
        case '12months':
        case '365days':
          expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          // 默认30天
          expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
      
      updates.expiry_time = expiryDate.toISOString();
      updates.config_time = now.toISOString(); // 记录配置时间
    }
    
    const { data, error } = await supabase
      .from('orders_optimized')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
    
    // 同步更新orders表
    await supabase
      .from('orders_optimized')
      .update(updates)
      .eq('id', orderId);
    
    console.log('订单状态更新成功:', data);
    return data;
  }

  // 订单查询
  static async getOrders() {
    const { data: orders, error } = await supabase
      .from('orders_optimized')
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
          supabase.from('sales_optimized').select('id, sales_code, name, wechat_name, phone').in('sales_code', salesCodes)
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
          supabase.from('sales_optimized').select('id, sales_code, name, wechat_name, phone').in('id', secondarySalesIds)
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
          // 支持中文和英文的duration值
          const expiryDate = new Date(createdDate);
          if ((order.duration === '7天' || order.duration === '7days') || order.duration === '7天') {
            expiryDate.setDate(expiryDate.getDate() + 7);
          } else if ((order.duration === '1个月' || order.duration === '1month') || order.duration === '1个月') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          } else if ((order.duration === '3个月' || order.duration === '3months') || order.duration === '3个月') {
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          } else if ((order.duration === '6个月' || order.duration === '6months') || order.duration === '6个月') {
            expiryDate.setMonth(expiryDate.getMonth() + 6);
          } else if ((order.duration === '1年' || order.duration === '1year') || order.duration === '1年') {
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
      .from('orders_optimized')
      .select('*');
    
    // 🚫 应用排除的销售代码
    if (params.excludedSalesCodes && params.excludedSalesCodes.length > 0) {
      query = query.not('sales_code', 'in', `(${params.excludedSalesCodes.join(',')})`);
      console.log('📊 SupabaseService: 应用排除过滤，排除销售代码:', params.excludedSalesCodes);
    }
    
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
    
    // 🔧 新增：默认排除已拒绝的订单
    if (params.excludeRejected && !params.status) {
      query = query.neq('status', 'rejected');
    }
    
    // 订单状态过滤
    // 🔧 修复：待配置确认订单包含多种状态
    if (params.status === 'pending_config') {
      // 特殊处理：包含所有待配置的订单（与Dashboard统计一致）
      query = query.or(`status.eq.pending_config,status.eq.confirmed_payment,and(duration.eq.7days,status.in.(pending,pending_payment))`);
    } else if (params.status) {
      query = query.eq('status', params.status);
    }
    
    // 🔧 修复：按订单金额筛选（支持多选）
    if (params.amount !== undefined && params.amount !== null && params.amount !== '') {
      if (Array.isArray(params.amount) && params.amount.length > 0) {
        // 多选情况，使用 in 查询
        query = query.in('amount', params.amount);
      } else if (!Array.isArray(params.amount)) {
        // 单个值情况，使用 eq 查询
        query = query.eq('amount', params.amount);
      }
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
    
    // 🔧 修复：先获取所有二级销售，以便获取他们的primary_sales_id
    // 并行获取销售数据
    const queries = [];
    
    if (salesCodes.length > 0) {
      queries.push(
        supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('sales_code', salesCodes),
        supabase.from('sales_optimized').select('id, sales_code, name, wechat_name, phone, primary_sales_id').in('sales_code', salesCodes)
      );
    }
    
    if (primarySalesIds.length > 0) {
      queries.push(
        supabase.from('primary_sales').select('id, sales_code, name, wechat_name, phone').in('id', primarySalesIds)
      );
    }
    
    if (secondarySalesIds.length > 0) {
      queries.push(
        supabase.from('sales_optimized').select('id, sales_code, name, wechat_name, phone, primary_sales_id').in('id', secondarySalesIds)
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
      
      // 🔧 修复：收集二级销售的primary_sales_id，并查询缺失的一级销售
      const missingPrimaryIds = [];
      secondarySalesByCode.forEach(sale => {
        if (sale.primary_sales_id && !primarySalesById.has(sale.primary_sales_id)) {
          missingPrimaryIds.push(sale.primary_sales_id);
        }
      });
      secondarySalesById.forEach(sale => {
        if (sale.primary_sales_id && !primarySalesById.has(sale.primary_sales_id)) {
          missingPrimaryIds.push(sale.primary_sales_id);
        }
      });
      
      // 如果有缺失的一级销售，查询它们
      if (missingPrimaryIds.length > 0) {
        const uniqueMissingIds = [...new Set(missingPrimaryIds)];
        const { data: missingPrimarySales } = await supabase
          .from('primary_sales')
          .select('id, sales_code, name, wechat_name, phone')
          .in('id', uniqueMissingIds);
        
        if (missingPrimarySales) {
          missingPrimarySales.forEach(sale => {
            primarySalesById.set(sale.id, sale);
            if (sale.sales_code) primarySalesByCode.set(sale.sales_code, sale);
          });
        }
      }
      
      // 为每个订单添加销售信息
      orders.forEach(order => {
        let salesInfo = null;
        let salesType = null;
        
        // 🔧 修复：正确的匹配优先级 - sales_code优先（最准确）
        if (order.sales_code) {
          // 先通过sales_code判断是谁实际出的单
          if (secondarySalesByCode.has(order.sales_code)) {
            salesInfo = secondarySalesByCode.get(order.sales_code);
            salesType = 'secondary';
          } else if (primarySalesByCode.has(order.sales_code)) {
            salesInfo = primarySalesByCode.get(order.sales_code);
            salesType = 'primary';
          }
        } else if (order.secondary_sales_id && secondarySalesById.has(order.secondary_sales_id)) {
          // 其次使用secondary_sales_id
          salesInfo = secondarySalesById.get(order.secondary_sales_id);
          salesType = 'secondary';
        } else if (order.primary_sales_id && primarySalesById.has(order.primary_sales_id)) {
          // 最后才使用primary_sales_id（仅当没有sales_code和secondary_sales_id时）
          salesInfo = primarySalesById.get(order.primary_sales_id);
          salesType = 'primary';
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
          if ((order.duration === '7天' || order.duration === '7days')) {
            expiryDate.setDate(expiryDate.getDate() + 7);
          } else if ((order.duration === '1个月' || order.duration === '1month')) {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          } else if ((order.duration === '3个月' || order.duration === '3months')) {
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          } else if ((order.duration === '1年' || order.duration === '1year')) {
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
      .from('orders_optimized')
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