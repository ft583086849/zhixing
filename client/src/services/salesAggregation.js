/**
 * 销售数据聚合服务
 * 从 orders_optimized 表聚合真实的销售业绩数据
 */

import { SupabaseService } from './supabase';

class SalesAggregationService {
  /**
   * 获取所有销售的基本信息
   */
  static async getSalesInfo() {
    try {
      // 获取一级销售
      const { data: primarySales, error: primaryError } = await SupabaseService.supabase
        .from('primary_sales')
        .select('*');
      
      if (primaryError) throw primaryError;
      
      // 获取二级销售
      const { data: secondarySales, error: secondaryError } = await SupabaseService.supabase
        .from('secondary_sales')
        .select('*');
      
      if (secondaryError) throw secondaryError;
      
      // 合并销售数据
      const allSales = [
        ...(primarySales || []).map(s => ({
          ...s,
          sales_type: 'primary',
          sales_code: s.sales_code,
          wechat_name: s.wechat_name || s.name
        })),
        ...(secondarySales || []).map(s => ({
          ...s,
          sales_type: s.is_independent ? 'independent' : 'secondary',
          sales_code: s.sales_code,
          wechat_name: s.wechat_name || s.name,
          parent_sales_id: s.primary_sales_id
        }))
      ];
      
      return allSales;
    } catch (error) {
      console.error('获取销售信息失败:', error);
      return [];
    }
  }
  
  /**
   * 从 orders_optimized 聚合销售业绩
   */
  static async aggregateSalesPerformance() {
    try {
      // 获取所有有效订单
      const { data: orders, error } = await SupabaseService.supabase
        .from('orders_optimized')
        .select(`
          id,
          order_number,
          sales_code,
          sales_type,
          primary_sales_id,
          secondary_sales_id,
          amount,
          actual_payment_amount,
          commission_amount,
          primary_commission_amount,
          secondary_commission_amount,
          commission_rate,
          secondary_commission_rate,
          status,
          created_at
        `)
        .neq('status', 'rejected');
      
      if (error) throw error;
      
      // 按销售代码聚合数据
      const performanceMap = new Map();
      
      (orders || []).forEach(order => {
        if (!order.sales_code) return;
        
        const salesCode = order.sales_code;
        
        if (!performanceMap.has(salesCode)) {
          performanceMap.set(salesCode, {
            sales_code: salesCode,
            total_orders: 0,
            total_amount: 0,
            // 佣金明细
            direct_commission: 0,     // 直销佣金（自己的订单）
            team_commission: 0,        // 团队分成（下级的订单给的分成）
            total_commission: 0,
            // 订单明细
            direct_orders: 0,         // 直销订单数
            team_orders: 0,           // 团队订单数
            direct_amount: 0,         // 直销金额
            team_amount: 0            // 团队销售额
          });
        }
        
        const stats = performanceMap.get(salesCode);
        const orderAmount = order.actual_payment_amount || order.amount || 0;
        
        // 统计订单
        stats.total_orders++;
        stats.total_amount += orderAmount;
        
        // 计算佣金
        // 这个订单的销售获得的佣金
        stats.direct_commission += order.commission_amount || 0;
        stats.direct_orders++;
        stats.direct_amount += orderAmount;
      });
      
      // 处理团队分成（一级销售从下级订单获得的分成）
      // 需要找出所有二级销售的订单，把 secondary_commission_amount 加给其上级
      (orders || []).forEach(order => {
        // 如果这个订单有 secondary_commission_amount，说明有上级分成
        if (order.secondary_commission_amount > 0 && order.primary_sales_id) {
          // 找到上级销售的 sales_code
          // 这里需要通过 primary_sales_id 查找对应的 sales_code
          // 暂时通过 primary_sales 表的 ID 匹配
          const primarySalesCode = this.getPrimarySalesCode(order.primary_sales_id);
          if (primarySalesCode && performanceMap.has(primarySalesCode)) {
            const primaryStats = performanceMap.get(primarySalesCode);
            primaryStats.team_commission += order.secondary_commission_amount;
            primaryStats.team_orders++;
            primaryStats.team_amount += order.actual_payment_amount || order.amount || 0;
          }
        }
      });
      
      // 计算总佣金
      performanceMap.forEach(stats => {
        stats.total_commission = stats.direct_commission + stats.team_commission;
      });
      
      return performanceMap;
    } catch (error) {
      console.error('聚合销售业绩失败:', error);
      return new Map();
    }
  }
  
  /**
   * 根据 primary_sales_id 获取 sales_code
   * 注意：这个方法需要优化，可以在初始化时缓存映射关系
   */
  static primarySalesMap = new Map();
  
  static async initPrimarySalesMap() {
    try {
      const { data: primarySales } = await SupabaseService.supabase
        .from('primary_sales')
        .select('id, sales_code');
      
      (primarySales || []).forEach(sale => {
        this.primarySalesMap.set(sale.id, sale.sales_code);
      });
    } catch (error) {
      console.error('初始化一级销售映射失败:', error);
    }
  }
  
  static getPrimarySalesCode(primarySalesId) {
    return this.primarySalesMap.get(primarySalesId);
  }
  
  /**
   * 合并销售信息和业绩数据
   */
  static mergeSalesData(salesInfo, performanceMap) {
    return salesInfo.map(sale => {
      const performance = performanceMap.get(sale.sales_code) || {
        total_orders: 0,
        total_amount: 0,
        direct_commission: 0,
        team_commission: 0,
        total_commission: 0,
        direct_orders: 0,
        team_orders: 0,
        direct_amount: 0,
        team_amount: 0
      };
      
      return {
        ...sale,
        ...performance,
        // 添加计算字段
        commission_rate: sale.commission_rate || (sale.sales_type === 'primary' ? 0.4 : 0.25),
        paid_commission: sale.paid_commission || 0,
        pending_commission: performance.total_commission - (sale.paid_commission || 0)
      };
    });
  }
  
  /**
   * 获取完整的销售数据（包含基本信息和业绩）
   */
  static async getCompleteSalesData() {
    try {
      // 初始化映射
      await this.initPrimarySalesMap();
      
      // 获取销售信息
      const salesInfo = await this.getSalesInfo();
      
      // 聚合业绩数据
      const performanceMap = await this.aggregateSalesPerformance();
      
      // 合并数据
      const completeSalesData = this.mergeSalesData(salesInfo, performanceMap);
      
      return {
        success: true,
        data: completeSalesData,
        message: '获取销售数据成功'
      };
    } catch (error) {
      console.error('获取完整销售数据失败:', error);
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }
}

export default SalesAggregationService;