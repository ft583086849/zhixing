/**
 * 佣金率格式统一处理工具
 * 解决系统中commission_rate格式不一致的问题
 */

/**
 * 标准化佣金率为小数格式
 * @param {number|string} value - 佣金率值
 * @returns {number} 小数格式的佣金率 (例如: 0.25 表示 25%)
 */
export const normalizeCommissionRate = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return 0;
  }
  
  // 如果值大于1，认为是百分比数字，需要除以100
  // 例如: 25 -> 0.25
  if (numValue > 1) {
    return numValue / 100;
  }
  
  // 如果值小于等于1，认为已经是小数格式
  // 例如: 0.25 -> 0.25
  return numValue;
};

/**
 * 将佣金率转换为百分比数字格式
 * @param {number|string} value - 佣金率值
 * @returns {number} 百分比数字 (例如: 25 表示 25%)
 */
export const toPercentageNumber = (value) => {
  const normalized = normalizeCommissionRate(value);
  return Math.round(normalized * 100 * 100) / 100; // 保留两位小数
};

/**
 * 将佣金率转换为百分比字符串格式
 * @param {number|string} value - 佣金率值
 * @returns {string} 百分比字符串 (例如: "25%" 表示 25%)
 */
export const toPercentageString = (value) => {
  const percentage = toPercentageNumber(value);
  return `${percentage}%`;
};

/**
 * 计算佣金金额
 * @param {number} amount - 订单金额
 * @param {number|string} commissionRate - 佣金率
 * @returns {number} 佣金金额
 */
export const calculateCommission = (amount, commissionRate) => {
  if (!amount || amount <= 0) {
    return 0;
  }
  
  const rate = normalizeCommissionRate(commissionRate);
  return Math.round(amount * rate * 100) / 100; // 保留两位小数
};

/**
 * 批量处理数据中的佣金率字段
 * @param {Array|Object} data - 需要处理的数据
 * @param {string} fieldName - 佣金率字段名，默认为 'commission_rate'
 * @returns {Array|Object} 处理后的数据
 */
export const normalizeCommissionRateInData = (data, fieldName = 'commission_rate') => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      [fieldName]: normalizeCommissionRate(item[fieldName]),
      [`${fieldName}_display`]: toPercentageString(item[fieldName])
    }));
  }
  
  if (typeof data === 'object' && data !== null) {
    return {
      ...data,
      [fieldName]: normalizeCommissionRate(data[fieldName]),
      [`${fieldName}_display`]: toPercentageString(data[fieldName])
    };
  }
  
  return data;
};

/**
 * 验证佣金率是否在合理范围内
 * @param {number|string} value - 佣金率值
 * @returns {boolean} 是否合理
 */
export const isValidCommissionRate = (value) => {
  const normalized = normalizeCommissionRate(value);
  // 佣金率应该在 0% 到 100% 之间
  return normalized >= 0 && normalized <= 1;
};

// 导出默认配置
export const DEFAULT_COMMISSION_RATES = {
  PRIMARY_SALES: 0.4,      // 一级销售默认 40%
  SECONDARY_SALES: 0.25,    // 二级销售默认 25%
  INDEPENDENT_SALES: 0.25,  // 独立销售默认 25%
};