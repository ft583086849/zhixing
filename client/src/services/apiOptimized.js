/**
 * API服务优化版本
 * 使用 sales_optimized 表提升性能
 * 
 * 主要优化：
 * 1. 查询单表 sales_optimized
 * 2. 减少JOIN操作
 * 3. 使用预计算字段
 * 4. 批量处理优化
 */

import { supabase } from '../config/supabase';

// 判断是否使用优化表
const USE_OPTIMIZED = process.env.REACT_APP_USE_OPTIMIZED_TABLES === 'true';

export const AdminAPIOptimized = {
  /**
   * 获取优化后的销售数据
   */
  async getSalesOptimized(params = {}) {
    try {
      // 构建查询
      let query = supabase
        .from('sales_optimized')
        .select(`
          *,
          total_orders,
          total_amount,
          total_commission,
          total_direct_orders,
          total_direct_amount,
          total_team_orders,
          total_team_amount,
          primary_commission_amount,
          secondary_commission_amount,
          team_size,
          paid_commission
        `);
      
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
      
      if (params.start_date && params.end_date) {
        query = query.gte('created_at', params.start_date)
                    .lte('created_at', params.end_date);
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
      
      // 返回处理后的数据
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
   * 更新销售佣金率
   */
  async updateSalesCommission(salesId, commissionRate) {
    try {
      const { data, error } = await supabase
        .from('sales_optimized')
        .update({ 
          commission_rate: commissionRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesId)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          message: error.message
        };
      }
      
      // 触发重新计算佣金
      await this.recalculateCommissions(salesId);
      
      return {
        success: true,
        data,
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
   * 重新计算销售佣金
   */
  async recalculateCommissions(salesId) {
    try {
      // 获取销售信息
      const { data: sale, error: saleError } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('id', salesId)
        .single();
      
      if (saleError) {
        throw saleError;
      }
      
      // 根据销售类型计算佣金
      let updates = {};
      
      if (sale.sales_type === 'primary') {
        // 一级销售：计算直销和分销收益
        const { data: orders } = await supabase
          .from('orders_optimized')
          .select('amount, secondary_sales_id')
          .eq('sales_code', sale.sales_code);
        
        let directAmount = 0;
        let teamAmount = 0;
        
        orders?.forEach(order => {
          if (!order.secondary_sales_id) {
            directAmount += order.amount;
          } else {
            teamAmount += order.amount;
          }
        });
        
        updates.primary_commission_amount = directAmount * sale.commission_rate;
        
        // 计算分销收益（需要获取二级销售的佣金率）
        if (teamAmount > 0) {
          const { data: secondarySales } = await supabase
            .from('sales_optimized')
            .select('commission_rate')
            .eq('parent_sales_id', salesId);
          
          let shareCommission = 0;
          secondarySales?.forEach(secondary => {
            const diff = sale.commission_rate - secondary.commission_rate;
            shareCommission += teamAmount * diff;
          });
          
          updates.secondary_commission_amount = shareCommission;
        }
        
        updates.total_commission = (updates.primary_commission_amount || 0) + 
                                  (updates.secondary_commission_amount || 0);
        
      } else {
        // 二级/独立销售：只计算自己的佣金
        const { data: orders } = await supabase
          .from('orders_optimized')
          .select('amount')
          .eq('sales_code', sale.sales_code);
        
        const totalAmount = orders?.reduce((sum, o) => sum + o.amount, 0) || 0;
        updates.primary_commission_amount = totalAmount * sale.commission_rate;
        updates.total_commission = updates.primary_commission_amount;
      }
      
      // 更新佣金数据
      await supabase
        .from('sales_optimized')
        .update(updates)
        .eq('id', salesId);
      
      return true;
      
    } catch (error) {
      console.error('recalculateCommissions error:', error);
      return false;
    }
  },
  
  /**
   * 获取销售统计数据
   */
  async getSalesStatistics() {
    try {
      const { data, error } = await supabase
        .from('sales_optimized')
        .select(`
          sales_type,
          total_amount,
          total_commission,
          paid_commission
        `);
      
      if (error) {
        throw error;
      }
      
      // 汇总统计
      const stats = {
        totalSales: data.length,
        primaryCount: 0,
        secondaryCount: 0,
        independentCount: 0,
        totalAmount: 0,
        totalCommission: 0,
        paidCommission: 0,
        pendingCommission: 0
      };
      
      data.forEach(sale => {
        // 类型统计
        switch(sale.sales_type) {
          case 'primary':
            stats.primaryCount++;
            break;
          case 'secondary':
            stats.secondaryCount++;
            break;
          case 'independent':
            stats.independentCount++;
            break;
        }
        
        // 金额统计
        stats.totalAmount += sale.total_amount || 0;
        stats.totalCommission += sale.total_commission || 0;
        stats.paidCommission += sale.paid_commission || 0;
      });
      
      stats.pendingCommission = stats.totalCommission - stats.paidCommission;
      
      return {
        success: true,
        data: stats,
        message: '获取统计数据成功'
      };
      
    } catch (error) {
      console.error('getSalesStatistics error:', error);
      return {
        success: false,
        message: error.message,
        data: {}
      };
    }
  },
  
  /**
   * 批量更新已返佣金
   */
  async batchUpdatePaidCommissions(updates) {
    try {
      const promises = updates.map(({ salesId, paidAmount }) => 
        supabase
          .from('sales_optimized')
          .update({ 
            paid_commission: paidAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', salesId)
      );
      
      await Promise.all(promises);
      
      return {
        success: true,
        message: '批量更新成功'
      };
      
    } catch (error) {
      console.error('batchUpdatePaidCommissions error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// 扩展原有AdminAPI
export const extendAdminAPI = (AdminAPI) => {
  // 根据环境变量决定使用哪个版本
  if (USE_OPTIMIZED) {
    AdminAPI.getSalesOptimized = AdminAPIOptimized.getSalesOptimized;
    AdminAPI.updateSalesCommission = AdminAPIOptimized.updateSalesCommission;
    AdminAPI.recalculateCommissions = AdminAPIOptimized.recalculateCommissions;
    AdminAPI.getSalesStatistics = AdminAPIOptimized.getSalesStatistics;
    AdminAPI.batchUpdatePaidCommissions = AdminAPIOptimized.batchUpdatePaidCommissions;
  } else {
    // 保持向后兼容，使用原版本但添加别名
    AdminAPI.getSalesOptimized = AdminAPI.getSales;
    AdminAPI.updateSalesCommission = AdminAPI.updateCommissionRate;
  }
  
  return AdminAPI;
};