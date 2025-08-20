/**
 * 时区配置 - 项目统一使用中国标准时间
 * 用户在中国，所有时间按北京时间处理
 */

const TIMEZONE_CONFIG = {
  // 时区设置
  timezone: 'Asia/Shanghai',
  timezoneOffset: 8, // UTC+8
  timezoneName: '中国标准时间',
  
  // 日期格式化选项
  dateOptions: {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  },
  
  // 时间格式化选项
  timeOptions: {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  },
  
  // 完整日期时间格式化
  dateTimeOptions: {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }
};

/**
 * 转换UTC时间为中国时间
 */
export function toChinaTime(utcDate) {
  if (!utcDate) return null;
  const date = new Date(utcDate);
  return date.toLocaleString('zh-CN', TIMEZONE_CONFIG.dateTimeOptions);
}

/**
 * 获取中国时间的今天开始时间
 */
export function getChinaTodayStart() {
  const now = new Date();
  const chinaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  chinaDate.setHours(0, 0, 0, 0);
  return chinaDate;
}

/**
 * 获取中国时间的今天结束时间
 */
export function getChinaTodayEnd() {
  const now = new Date();
  const chinaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  chinaDate.setHours(23, 59, 59, 999);
  return chinaDate;
}

/**
 * 判断日期是否是今天（中国时间）
 */
export function isToday(date) {
  if (!date) return false;
  const targetDate = new Date(date);
  const todayStart = getChinaTodayStart();
  const todayEnd = getChinaTodayEnd();
  return targetDate >= todayStart && targetDate <= todayEnd;
}

/**
 * 格式化为中国日期
 */
export function formatChinaDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', TIMEZONE_CONFIG.dateOptions);
}

/**
 * 格式化为中国时间
 */
export function formatChinaTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('zh-CN', TIMEZONE_CONFIG.timeOptions);
}

/**
 * 格式化为中国日期时间
 */
export function formatChinaDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', TIMEZONE_CONFIG.dateTimeOptions);
}

export default TIMEZONE_CONFIG;