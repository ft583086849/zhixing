/**
 * 佣金率处理工具函数
 * 统一处理佣金率的显示和转换
 */

/**
 * 将小数格式的佣金率转换为百分比显示
 * @param {number} rate - 小数格式的佣金率（如 0.3）
 * @param {number} precision - 小数位数，默认1位
 * @returns {string} 百分比格式的字符串（如 "30.0%"）
 */
export const formatCommissionRate = (rate, precision = 1) => {
  if (rate === null || rate === undefined) return '-';
  if (typeof rate !== 'number') {
    rate = parseFloat(rate);
  }
  if (isNaN(rate)) return '-';
  
  return `${(rate * 100).toFixed(precision)}%`;
};

/**
 * 将百分比数字转换为小数格式
 * @param {number|string} percentValue - 百分比数字（如 30 或 "30"）
 * @returns {number} 小数格式（如 0.3）
 */
export const percentToDecimal = (percentValue) => {
  if (percentValue === null || percentValue === undefined) return 0;
  const num = typeof percentValue === 'string' ? parseFloat(percentValue) : percentValue;
  if (isNaN(num)) return 0;
  
  return num / 100;
};

/**
 * 将小数格式转换为百分比数字（用于表单编辑）
 * @param {number} rate - 小数格式的佣金率（如 0.3）
 * @returns {number} 百分比数字（如 30）
 */
export const decimalToPercent = (rate) => {
  if (rate === null || rate === undefined) return 0;
  if (typeof rate !== 'number') {
    rate = parseFloat(rate);
  }
  if (isNaN(rate)) return 0;
  
  return rate * 100;
};

/**
 * 验证佣金率是否在有效范围内
 * @param {number} rate - 小数格式的佣金率
 * @param {object} options - 验证选项
 * @returns {boolean} 是否有效
 */
export const validateCommissionRate = (rate, options = {}) => {
  const { min = 0, max = 1, allowZero = true } = options;
  
  if (rate === null || rate === undefined) return false;
  if (typeof rate !== 'number') return false;
  if (!allowZero && rate === 0) return false;
  
  return rate >= min && rate <= max;
};

/**
 * 计算一级销售的综合佣金率
 * 根据需求文档的标准公式计算
 * @param {object} data - 计算所需的数据
 * @returns {number} 综合佣金率（小数格式）
 */
export const calculatePrimaryCommissionRate = (data) => {
  const {
    primaryDirectAmount = 0,     // 一级销售直接订单金额
    secondaryTotalAmount = 0,    // 二级销售订单总金额
    secondaryRates = []           // 二级销售的佣金率数组（小数格式）
  } = data;
  
  // 计算总订单金额
  const totalOrderAmount = primaryDirectAmount + secondaryTotalAmount;
  
  // 如果没有订单，返回默认40%
  if (totalOrderAmount === 0) {
    return 0.4;
  }
  
  // 计算二级销售平均佣金率
  let averageSecondaryRate = 0;
  if (secondaryRates.length > 0) {
    const sum = secondaryRates.reduce((acc, rate) => acc + rate, 0);
    averageSecondaryRate = sum / secondaryRates.length;
  }
  
  // 计算一级销售总佣金
  // 一级销售直接订单佣金：金额 × 40%
  const primaryDirectCommission = primaryDirectAmount * 0.4;
  
  // 一级销售从二级销售获得的佣金：金额 × (40% - 二级销售佣金率)
  const primaryFromSecondaryCommission = secondaryTotalAmount * (0.4 - averageSecondaryRate);
  
  // 总佣金
  const totalPrimaryCommission = primaryDirectCommission + primaryFromSecondaryCommission;
  
  // 综合佣金率
  const primaryCommissionRate = totalPrimaryCommission / totalOrderAmount;
  
  return primaryCommissionRate;
};

/**
 * 格式化佣金金额显示
 * @param {number} amount - 佣金金额
 * @param {string} currency - 货币符号，默认 $
 * @returns {string} 格式化的金额字符串
 */
export const formatCommissionAmount = (amount, currency = '$') => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  if (typeof amount !== 'number') {
    amount = parseFloat(amount);
  }
  if (isNaN(amount)) return `${currency}0.00`;
  
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * 计算订单的佣金金额
 * @param {number} orderAmount - 订单金额
 * @param {number} commissionRate - 佣金率（小数格式）
 * @returns {number} 佣金金额
 */
export const calculateCommissionAmount = (orderAmount, commissionRate) => {
  if (!orderAmount || !commissionRate) return 0;
  return Math.round(orderAmount * commissionRate * 100) / 100; // 保留两位小数
};

/**
 * 兼容性处理：自动识别并转换佣金率格式
 * 用于处理可能存在的旧数据（虽然用户说不需要，但以防万一）
 * @param {number} value - 输入值
 * @returns {number} 小数格式的佣金率
 */
export const normalizeCommissionRate = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value !== 'number') {
    value = parseFloat(value);
  }
  if (isNaN(value)) return 0;
  
  // 如果值大于1，认为是百分比，需要转换
  if (value > 1) {
    return value / 100;
  }
  
  return value;
};

// 导出默认对象，方便使用
export default {
  formatCommissionRate,
  percentToDecimal,
  decimalToPercent,
  validateCommissionRate,
  calculatePrimaryCommissionRate,
  formatCommissionAmount,
  calculateCommissionAmount,
  normalizeCommissionRate
};
