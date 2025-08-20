/**
 * 佣金率历史管理工具
 * 根据订单时间获取对应时期的佣金率
 */

import { SupabaseService } from '../services/supabase';

/**
 * 根据订单时间获取销售人员在该时间点的佣金率
 * @param {string} salesCode - 销售代码
 * @param {Date|string} orderDate - 订单创建时间
 * @returns {Promise<number>} 佣金率（小数形式，如0.4表示40%）
 */
export async function getCommissionRateAtTime(salesCode, orderDate) {
  try {
    // 确保日期格式正确
    const date = new Date(orderDate);
    
    // 查询该销售在订单时间点的佣金率
    // 获取生效时间小于等于订单时间的最新记录
    const { data, error } = await SupabaseService.supabase
      .from('commission_rate_history')
      .select('new_rate, effective_date')
      .eq('sales_code', salesCode)
      .lte('effective_date', date.toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('获取历史佣金率失败:', error);
      // 如果没有历史记录，从sales_optimized表获取当前佣金率
      return await getCurrentCommissionRate(salesCode);
    }
    
    return data?.new_rate || await getDefaultRateBySalesCode(salesCode);
  } catch (error) {
    console.error('获取历史佣金率出错:', error);
    return await getCurrentCommissionRate(salesCode);
  }
}

/**
 * 获取销售当前的佣金率（从sales_optimized表）
 * @param {string} salesCode - 销售代码
 * @returns {Promise<number>} 当前佣金率
 */
async function getCurrentCommissionRate(salesCode) {
  try {
    const { data, error } = await SupabaseService.supabase
      .from('sales_optimized')
      .select('commission_rate, sales_type')
      .eq('sales_code', salesCode)
      .single();
    
    if (!error && data) {
      return data.commission_rate || getDefaultRate(data.sales_type);
    }
    
    return 0.4; // 默认40%
  } catch (error) {
    console.error('获取当前佣金率失败:', error);
    return 0.4;
  }
}

/**
 * 根据销售代码获取默认佣金率
 * @param {string} salesCode - 销售代码
 * @returns {Promise<number>} 默认佣金率
 */
async function getDefaultRateBySalesCode(salesCode) {
  try {
    const { data } = await SupabaseService.supabase
      .from('sales_optimized')
      .select('sales_type')
      .eq('sales_code', salesCode)
      .single();
    
    if (data) {
      return getDefaultRate(data.sales_type);
    }
    return 0.4;
  } catch {
    return 0.4;
  }
}

/**
 * 根据销售类型获取默认佣金率
 * @param {string} salesType - 销售类型 (primary/secondary/independent)
 * @returns {number} 默认佣金率
 */
function getDefaultRate(salesType) {
  switch (salesType) {
    case 'primary':
      return 0.4; // 一级销售默认40%
    case 'secondary':
      return 0.25; // 二级销售默认25%
    case 'independent':
      return 0.25; // 独立销售默认25%
    default:
      return 0.4;
  }
}

/**
 * 计算订单佣金（使用历史佣金率）
 * @param {Object} order - 订单对象
 * @returns {Promise<Object>} 佣金信息
 */
export async function calculateOrderCommissionWithHistory(order) {
  try {
    // 获取订单创建时的佣金率
    const commissionRate = await getCommissionRateAtTime(
      order.sales_code, 
      order.created_at || new Date()
    );
    
    const orderAmount = parseFloat(order.amount) || 0;
    const primaryCommission = orderAmount * commissionRate;
    
    // 如果是二级销售的订单，计算一级销售的分成
    let secondaryCommission = 0;
    if (order.parent_sales_code) {
      // 获取一级销售在订单时间的佣金率
      const primaryRate = await getCommissionRateAtTime(
        order.parent_sales_code,
        order.created_at || new Date()
      );
      
      // 二级销售佣金
      const secondaryRate = commissionRate;
      
      // 一级销售从二级销售订单中获得的分成 = 差额
      secondaryCommission = orderAmount * (primaryRate - secondaryRate);
    }
    
    return {
      commission_rate: commissionRate,
      primary_commission: primaryCommission,
      secondary_commission: secondaryCommission,
      total_commission: primaryCommission + secondaryCommission
    };
  } catch (error) {
    console.error('计算订单佣金失败:', error);
    return {
      commission_rate: 0,
      primary_commission: 0,
      secondary_commission: 0,
      total_commission: 0
    };
  }
}

/**
 * 批量计算多个订单的佣金
 * @param {Array} orders - 订单数组
 * @returns {Promise<Array>} 包含佣金信息的订单数组
 */
export async function calculateBatchOrderCommissions(orders) {
  const results = await Promise.all(
    orders.map(async (order) => {
      const commission = await calculateOrderCommissionWithHistory(order);
      return {
        ...order,
        ...commission
      };
    })
  );
  
  return results;
}

/**
 * 获取销售的佣金率历史记录
 * @param {string} salesCode - 销售代码
 * @returns {Promise<Array>} 佣金率历史记录
 */
export async function getCommissionRateHistory(salesCode) {
  try {
    const { data, error } = await SupabaseService.supabase
      .from('commission_rate_history')
      .select('*')
      .eq('sales_code', salesCode)
      .order('effective_date', { ascending: false });
    
    if (error) {
      console.error('获取佣金率历史失败:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('获取佣金率历史出错:', error);
    return [];
  }
}

/**
 * 记录佣金率变更
 * @param {Object} params - 变更参数
 * @returns {Promise<boolean>} 是否成功
 */
export async function recordCommissionRateChange({
  salesCode,
  salesType,
  oldRate,
  newRate,
  effectiveDate = new Date(),
  changedBy = 'Admin',
  changeReason = ''
}) {
  try {
    const { error } = await SupabaseService.supabase
      .from('commission_rate_history')
      .insert({
        sales_code: salesCode,
        sales_type: salesType,
        old_rate: oldRate,
        new_rate: newRate,
        effective_date: effectiveDate,
        changed_by: changedBy,
        change_reason: changeReason
      });
    
    if (error) {
      console.error('记录佣金率变更失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('记录佣金率变更出错:', error);
    return false;
  }
}

export default {
  getCommissionRateAtTime,
  calculateOrderCommissionWithHistory,
  calculateBatchOrderCommissions,
  getCommissionRateHistory,
  recordCommissionRateChange
};