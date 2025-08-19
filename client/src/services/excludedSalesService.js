/**
 * 销售统计排除服务
 * 管理被排除在统计之外的销售账号
 */

import { supabase } from './supabase';

class ExcludedSalesService {
  /**
   * 获取当前生效的排除名单
   */
  static async getExcludedSales() {
    try {
      const { data, error } = await supabase
        .from('excluded_sales_config')
        .select('*')
        .eq('is_active', true)
        .order('excluded_at', { ascending: false });

      if (error) {
        console.error('获取排除名单失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取排除名单异常:', error);
      return [];
    }
  }

  /**
   * 获取排除的销售代码列表
   */
  static async getExcludedSalesCodes() {
    try {
      const excludedList = await this.getExcludedSales();
      const codes = excludedList
        .filter(item => item.sales_code)
        .map(item => item.sales_code);
      
      return [...new Set(codes)]; // 去重
    } catch (error) {
      console.error('获取排除销售代码失败:', error);
      return [];
    }
  }

  /**
   * 获取排除的微信号列表
   */
  static async getExcludedWechatNames() {
    try {
      const excludedList = await this.getExcludedSales();
      const names = excludedList
        .filter(item => item.wechat_name)
        .map(item => item.wechat_name);
      
      return [...new Set(names)]; // 去重
    } catch (error) {
      console.error('获取排除微信号失败:', error);
      return [];
    }
  }

  /**
   * 添加销售到排除名单
   */
  static async addExcludedSales(params) {
    const {
      wechat_name,
      sales_code,
      sales_type,
      reason,
      excluded_by = 'admin'
    } = params;

    try {
      // 1. 检查是否已存在
      const { data: existing } = await supabase
        .from('excluded_sales_config')
        .select('*')
        .eq('wechat_name', wechat_name)
        .eq('is_active', true)
        .single();

      if (existing) {
        return {
          success: false,
          message: '该销售已在排除名单中'
        };
      }

      // 2. 计算影响的数据量
      const impact = await this.calculateExclusionImpact(wechat_name, sales_code);

      // 3. 添加到排除名单
      const { data, error } = await supabase
        .from('excluded_sales_config')
        .insert({
          wechat_name,
          sales_code,
          sales_type,
          reason,
          excluded_by
        })
        .select()
        .single();

      if (error) {
        console.error('添加排除失败:', error);
        return {
          success: false,
          message: '添加失败：' + error.message
        };
      }

      // 4. 记录操作日志
      await this.logExclusionAction({
        wechat_name,
        sales_code,
        action: 'exclude',
        reason,
        operated_by: excluded_by,
        ...impact
      });

      return {
        success: true,
        data,
        impact,
        message: `成功排除销售 ${wechat_name}`
      };
    } catch (error) {
      console.error('添加排除异常:', error);
      return {
        success: false,
        message: '操作失败：' + error.message
      };
    }
  }

  /**
   * 从排除名单中恢复销售
   */
  static async restoreExcludedSales(wechat_name, operated_by = 'admin') {
    try {
      // 1. 查找当前排除记录
      const { data: current } = await supabase
        .from('excluded_sales_config')
        .select('*')
        .eq('wechat_name', wechat_name)
        .eq('is_active', true)
        .single();

      if (!current) {
        return {
          success: false,
          message: '该销售不在排除名单中'
        };
      }

      // 2. 更新为非激活状态
      const { error } = await supabase
        .from('excluded_sales_config')
        .update({ is_active: false })
        .eq('id', current.id);

      if (error) {
        console.error('恢复失败:', error);
        return {
          success: false,
          message: '恢复失败：' + error.message
        };
      }

      // 3. 记录操作日志
      await this.logExclusionAction({
        wechat_name,
        sales_code: current.sales_code,
        action: 'restore',
        reason: '恢复统计',
        operated_by
      });

      return {
        success: true,
        message: `成功恢复销售 ${wechat_name} 的统计`
      };
    } catch (error) {
      console.error('恢复异常:', error);
      return {
        success: false,
        message: '操作失败：' + error.message
      };
    }
  }

  /**
   * 计算排除影响
   */
  static async calculateExclusionImpact(wechat_name, sales_code) {
    try {
      let query = supabase
        .from('orders_optimized')
        .select('amount, actual_payment_amount');

      // 优先使用sales_code查询
      if (sales_code) {
        query = query.eq('sales_code', sales_code);
      } else {
        // 如果没有sales_code，通过sales表查找
        const { data: salesData } = await supabase
          .from('sales_optimized')
          .select('sales_code')
          .eq('wechat_name', wechat_name)
          .single();

        if (salesData?.sales_code) {
          query = query.eq('sales_code', salesData.sales_code);
        } else {
          return {
            affected_orders_count: 0,
            affected_amount: 0,
            affected_commission: 0
          };
        }
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('计算影响失败:', error);
        return {
          affected_orders_count: 0,
          affected_amount: 0,
          affected_commission: 0
        };
      }

      // 计算影响
      const affected_orders_count = orders?.length || 0;
      const affected_amount = orders?.reduce((sum, o) => 
        sum + parseFloat(o.actual_payment_amount || o.amount || 0), 0) || 0;

      // 获取佣金数据
      let commissionQuery = supabase
        .from('sales_optimized')
        .select('total_commission');

      if (sales_code) {
        commissionQuery = commissionQuery.eq('sales_code', sales_code);
      } else {
        commissionQuery = commissionQuery.eq('wechat_name', wechat_name);
      }

      const { data: salesData } = await commissionQuery.single();
      const affected_commission = salesData?.total_commission || 0;

      return {
        affected_orders_count,
        affected_amount: Math.round(affected_amount * 100) / 100,
        affected_commission: Math.round(affected_commission * 100) / 100
      };
    } catch (error) {
      console.error('计算影响异常:', error);
      return {
        affected_orders_count: 0,
        affected_amount: 0,
        affected_commission: 0
      };
    }
  }

  /**
   * 记录操作日志
   */
  static async logExclusionAction(params) {
    try {
      const { error } = await supabase
        .from('excluded_sales_log')
        .insert(params);

      if (error) {
        console.error('记录日志失败:', error);
      }
    } catch (error) {
      console.error('记录日志异常:', error);
    }
  }

  /**
   * 获取操作日志
   */
  static async getExclusionLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('excluded_sales_log')
        .select('*')
        .order('operated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取日志失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取日志异常:', error);
      return [];
    }
  }

  /**
   * 检查销售是否被排除
   */
  static async isSalesExcluded(wechat_name) {
    try {
      const { data, error } = await supabase
        .from('excluded_sales_config')
        .select('id')
        .eq('wechat_name', wechat_name)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('检查排除状态失败:', error);
      return false;
    }
  }

  /**
   * 获取排除统计信息
   */
  static async getExclusionStats() {
    try {
      const excludedList = await this.getExcludedSales();
      
      let totalOrders = 0;
      let totalAmount = 0;
      let totalCommission = 0;

      for (const item of excludedList) {
        const impact = await this.calculateExclusionImpact(
          item.wechat_name,
          item.sales_code
        );
        totalOrders += impact.affected_orders_count;
        totalAmount += impact.affected_amount;
        totalCommission += impact.affected_commission;
      }

      return {
        excluded_count: excludedList.length,
        excluded_orders: totalOrders,
        excluded_amount: Math.round(totalAmount * 100) / 100,
        excluded_commission: Math.round(totalCommission * 100) / 100
      };
    } catch (error) {
      console.error('获取排除统计失败:', error);
      return {
        excluded_count: 0,
        excluded_orders: 0,
        excluded_amount: 0,
        excluded_commission: 0
      };
    }
  }
}

export default ExcludedSalesService;