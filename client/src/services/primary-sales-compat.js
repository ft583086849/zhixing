/**
 * primary_sales表兼容层
 * 由于数据库中不存在primary_sales表，这里提供兼容方法
 * 所有对primary_sales的查询都转向secondary_sales表
 */

import { SupabaseService } from './supabase';
const { supabase } = SupabaseService;

class PrimarySalesCompat {
  /**
   * 获取所有一级销售（兼容方法）
   */
  static async getPrimarySales() {
    try {
      // 使用secondary_sales表，筛选sales_type为primary
      const { data, error } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('sales_type', 'primary')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取一级销售失败:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('getPrimarySales error:', error);
      return { data: null, error };
    }
  }

  /**
   * 创建一级销售（兼容方法）
   */
  static async createPrimarySales(salesData) {
    try {
      // 确保sales_type为primary
      const dataWithType = {
        ...salesData,
        sales_type: 'primary'
      };

      const { data, error } = await supabase
        .from('secondary_sales')
        .insert([dataWithType])
        .select();

      if (error) {
        console.error('创建一级销售失败:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('createPrimarySales error:', error);
      return { data: null, error };
    }
  }

  /**
   * 更新一级销售（兼容方法）
   */
  static async updatePrimarySales(id, updates) {
    try {
      const { data, error } = await supabase
        .from('secondary_sales')
        .update(updates)
        .eq('id', id)
        .eq('sales_type', 'primary')
        .select();

      if (error) {
        console.error('更新一级销售失败:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('updatePrimarySales error:', error);
      return { data: null, error };
    }
  }

  /**
   * 删除一级销售（兼容方法）
   */
  static async deletePrimarySales(id) {
    try {
      const { data, error } = await supabase
        .from('secondary_sales')
        .delete()
        .eq('id', id)
        .eq('sales_type', 'primary');

      if (error) {
        console.error('删除一级销售失败:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('deletePrimarySales error:', error);
      return { data: null, error };
    }
  }

  /**
   * 根据sales_code获取一级销售
   */
  static async getPrimarySalesByCode(salesCode) {
    try {
      const { data, error } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('sales_code', salesCode)
        .eq('sales_type', 'primary')
        .single();

      if (error) {
        console.error('根据代码获取一级销售失败:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('getPrimarySalesByCode error:', error);
      return { data: null, error };
    }
  }
}

export default PrimarySalesCompat;