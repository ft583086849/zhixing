// 🛡️ 安全的表切换方案 - 通过环境变量控制
// 可以在测试环境使用新表，生产环境仍用旧表

const fs = require('fs');

// 创建表名配置函数
const tableConfig = `
// 📊 动态表名配置 - 根据环境变量选择表
export const getOrdersTableName = () => {
  // 如果环境变量启用了优化表，使用新表
  if (process.env.REACT_APP_USE_OPTIMIZED_ORDERS === 'true') {
    return 'orders_optimized';
  }
  // 默认使用原表，确保生产环境安全
  return 'orders';
};

// 兼容性函数 - 获取订单表查询
export const getOrdersQuery = (supabaseClient) => {
  return supabaseClient.from(getOrdersTableName());
};
`;

// 写入配置文件
fs.writeFileSync('/Users/zzj/Documents/w/client/src/config/tableConfig.js', tableConfig);

console.log('✅ 已创建安全的表切换配置');
console.log('');
console.log('📋 使用方法：');
console.log('1. 测试环境：设置 REACT_APP_USE_OPTIMIZED_ORDERS=true');
console.log('2. 生产环境：不设置或设置为false，保持使用原表');
console.log('3. 代码中使用 getOrdersQuery(supabase) 替代 supabase.from("orders")');