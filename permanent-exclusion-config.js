/**
 * 永久排除配置 - 测试账号配置
 * 这些账号永远不参与任何统计，但显示可由排除名单控制
 */

// 永久排除的测试账号列表
const PERMANENT_EXCLUDED_SALES = [
  {
    sales_code: 'PRI17554350234757516',
    wechat_name: 'wangming', 
    reason: '测试账号',
    exclude_from: ['stats', 'conversion', 'ranking', 'finance']
  }
  // 可以添加其他永久排除账号
];

// 获取永久排除的销售代码
function getPermanentExcludedSalesCodes() {
  return PERMANENT_EXCLUDED_SALES.map(item => item.sales_code);
}

// 获取永久排除的微信名
function getPermanentExcludedWechatNames() {
  return PERMANENT_EXCLUDED_SALES.map(item => item.wechat_name);
}

// 检查是否为永久排除账号
function isPermanentlyExcluded(sales_code) {
  return PERMANENT_EXCLUDED_SALES.some(item => item.sales_code === sales_code);
}

// 检查是否应该从特定功能排除
function shouldExcludeFrom(sales_code, feature) {
  const account = PERMANENT_EXCLUDED_SALES.find(item => item.sales_code === sales_code);
  return account && account.exclude_from.includes(feature);
}

module.exports = {
  PERMANENT_EXCLUDED_SALES,
  getPermanentExcludedSalesCodes,
  getPermanentExcludedWechatNames,
  isPermanentlyExcluded,
  shouldExcludeFrom
};