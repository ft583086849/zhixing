/**
 * 测试环境配置文件
 * 用于切换优化版本和原版本
 */

const fs = require('fs');
const path = require('path');

// 配置选项
const config = {
  // 是否使用优化版本
  useOptimized: process.env.USE_OPTIMIZED_TABLES === 'true',
  
  // 表名映射
  tables: {
    sales: process.env.USE_OPTIMIZED_TABLES === 'true' 
      ? 'sales_optimized' 
      : ['primary_sales', 'secondary_sales'],
    orders: 'orders_optimized'  // 订单表已经优化
  },
  
  // 组件映射
  components: {
    AdminSales: process.env.USE_OPTIMIZED_TABLES === 'true'
      ? 'AdminSalesOptimized'
      : 'AdminSales'
  },
  
  // API映射
  apis: {
    getSales: process.env.USE_OPTIMIZED_TABLES === 'true'
      ? 'getSalesOptimized'
      : 'getSales'
  }
};

// 创建环境变量文件
function createEnvFile(useOptimized) {
  const envContent = `
# 销售管理优化配置
# 设置为 true 使用优化版本，false 使用原版本
REACT_APP_USE_OPTIMIZED_TABLES=${useOptimized}

# 数据库表配置
REACT_APP_SALES_TABLE=${useOptimized ? 'sales_optimized' : 'primary_sales,secondary_sales'}
REACT_APP_ORDERS_TABLE=orders_optimized

# 功能开关
REACT_APP_ENABLE_SALES_CACHE=${useOptimized}
REACT_APP_ENABLE_BATCH_UPDATES=${useOptimized}
`;

  const envPath = path.join(__dirname, 'client', '.env.test');
  fs.writeFileSync(envPath, envContent.trim());
  console.log(`✅ 环境配置文件已创建: ${envPath}`);
}

// 切换到测试环境
function switchToTest() {
  createEnvFile(true);
  console.log('🧪 已切换到测试环境（使用优化版本）');
  console.log('   - 销售表: sales_optimized');
  console.log('   - 组件: AdminSalesOptimized');
  console.log('   - 启用缓存和批量更新');
  console.log('\n请重启开发服务器使配置生效');
}

// 切换回生产环境
function switchToProduction() {
  createEnvFile(false);
  console.log('🚀 已切换到生产环境（使用原版本）');
  console.log('   - 销售表: primary_sales + secondary_sales');
  console.log('   - 组件: AdminSales');
  console.log('   - 使用原有逻辑');
  console.log('\n请重启开发服务器使配置生效');
}

// 显示当前状态
function showStatus() {
  const useOptimized = process.env.USE_OPTIMIZED_TABLES === 'true';
  console.log('📊 当前环境状态：');
  console.log(`   环境: ${useOptimized ? '测试环境（优化版）' : '生产环境（原版）'}`);
  console.log(`   销售表: ${config.tables.sales}`);
  console.log(`   订单表: ${config.tables.orders}`);
  console.log(`   组件: ${config.components.AdminSales}`);
  console.log(`   缓存: ${useOptimized ? '启用' : '禁用'}`);
}

// 导出配置和函数
module.exports = {
  config,
  switchToTest,
  switchToProduction,
  showStatus,
  createEnvFile
};

// 如果直接运行此文件
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch(command) {
    case 'test':
      switchToTest();
      break;
    case 'prod':
      switchToProduction();
      break;
    case 'status':
      showStatus();
      break;
    default:
      console.log('销售管理优化 - 环境切换工具');
      console.log('');
      console.log('使用方法:');
      console.log('  node test-env-config.js test    - 切换到测试环境');
      console.log('  node test-env-config.js prod    - 切换到生产环境');
      console.log('  node test-env-config.js status  - 查看当前状态');
  }
}