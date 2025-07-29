const dayjs = require('dayjs');

/**
 * 计算到期时间
 * @param {string} duration - 购买时长 ('7days', '1month', '3months', '6months', '1year', 'lifetime')
 * @param {Date} effectiveTime - 生效时间
 * @returns {Date} 到期时间
 */
const calculateExpiryTime = (duration, effectiveTime) => {
  const baseTime = dayjs(effectiveTime);
  
  switch (duration) {
    case '7days':
      return baseTime.add(7, 'day').add(1, 'day').toDate();
    case '1month':
      return baseTime.add(1, 'month').add(1, 'day').toDate();
    case '3months':
      return baseTime.add(3, 'month').add(1, 'day').toDate();
    case '6months':
      return baseTime.add(6, 'month').add(1, 'day').toDate();
    case '1year':
      return baseTime.add(1, 'year').add(1, 'day').toDate();
    case 'lifetime':
      // 终身用户设置一个很远的到期时间（比如100年后）
      return baseTime.add(100, 'year').toDate();
    default:
      throw new Error('无效的购买时长');
  }
};

/**
 * 格式化日期为可读字符串
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 检查日期是否为未来时间
 * @param {Date} date - 日期对象
 * @returns {boolean} 是否为未来时间
 */
const isFutureDate = (date) => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * 获取当前时间
 * @returns {Date} 当前时间
 */
const getCurrentTime = () => {
  return dayjs().toDate();
};

module.exports = {
  calculateExpiryTime,
  formatDate,
  isFutureDate,
  getCurrentTime
}; 