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

  // 订单查询
    static async getOrders() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // 手动关联销售信息（基于sales_code）
    if (orders && orders.length > 0) {
      const salesCodes = [...new Set(orders.map(order => order.sales_code).filter(Boolean))];
      
      // 并行获取一级和二级销售数据
      const [primarySales, secondarySales] = await Promise.all([
        supabase.from('primary_sales').select('sales_code, name, wechat_name, phone').in('sales_code', salesCodes),
        supabase.from('secondary_sales').select('sales_code, name, wechat_name, phone').in('sales_code', salesCodes)
      ]);
      
      // 创建销售映射
      const primarySalesMap = new Map();
      const secondarySalesMap = new Map();
      
      if (primarySales.data) {
        primarySales.data.forEach(sale => primarySalesMap.set(sale.sales_code, sale));
      }
      
      if (secondarySales.data) {
        secondarySales.data.forEach(sale => secondarySalesMap.set(sale.sales_code, sale));
      }
      
      // 为每个订单添加销售信息
      orders.forEach(order => {
        if (order.sales_code) {
          const primarySale = primarySalesMap.get(order.sales_code);
          const secondarySale = secondarySalesMap.get(order.sales_code);
          
          if (primarySale) {
            order.primary_sales = primarySale;
            order.sales_type = 'primary';
          } else if (secondarySale) {
            order.secondary_sales = secondarySale;
            order.sales_type = 'secondary';
          }
        }
      });
    }
    
    return orders || [];
  }

  // 统计查询
  static async getOrderStats() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('amount, created_at, status');
    
    if (error) throw error;
    
    const total = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
      new Date(order.created_at).toDateString() === today
    ).length;
    
    return { total, totalAmount, todayOrders };
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
}

console.log('🚀 Supabase服务层初始化完成');