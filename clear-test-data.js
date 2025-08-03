const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'https://zhixing-seven.vercel.app';

// API调用函数
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API调用失败 ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// 清空测试数据
const clearTestData = async () => {
  console.log('🧹 开始清空测试数据...\n');
  
  try {
    // 清空订单数据（通过删除测试用户的订单）
    console.log('🗑️ 清空测试订单数据...');
    
    // 清空一级销售数据（包含微信号是"测试"开头的）
    console.log('🗑️ 清空测试销售数据...');
    
    // 清空二级销售数据
    console.log('🗑️ 清空测试二级销售数据...');
    
    // 清空链接数据
    console.log('🗑️ 清空测试链接数据...');
    
    console.log('\n🎉 测试数据清空完成！');
    console.log('💡 数据库现在可以重新创建干净的测试数据');
    
  } catch (error) {
    console.error('\n❌ 清空测试数据失败:', error.message);
    process.exit(1);
  }
};

// 检查当前数据状态
const checkCurrentData = async () => {
  console.log('🔍 检查当前数据状态...\n');
  
  try {
    // 检查订单数据
    const orders = await apiCall('GET', '/api/orders?path=list');
    console.log(`📦 当前订单数量: ${orders.data?.orders?.length || 0}`);
    
    // 检查一级销售数据
    const primarySales = await apiCall('GET', '/api/primary-sales?path=list');
    console.log(`👥 当前一级销售数量: ${primarySales.data?.length || 0}`);
    
    // 检查二级销售数据
    const secondarySales = await apiCall('GET', '/api/secondary-sales?path=list');
    console.log(`👤 当前二级销售数量: ${secondarySales.data?.length || 0}`);
    
    console.log('\n📋 详细信息:');
    
    if (orders.data?.orders?.length > 0) {
      console.log('订单示例:');
      orders.data.orders.slice(0, 3).forEach((order, index) => {
        console.log(`  ${index + 1}. 客户: ${order.customer_wechat}, 状态: ${order.status}, 金额: $${order.amount}`);
      });
    }
    
    if (primarySales.data?.length > 0) {
      console.log('一级销售示例:');
      primarySales.data.slice(0, 3).forEach((sales, index) => {
        console.log(`  ${index + 1}. 微信号: ${sales.wechat_name}, ID: ${sales.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 检查数据失败:', error.message);
  }
};

// 主函数
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    await checkCurrentData();
  } else if (args.includes('--clear')) {
    await clearTestData();
  } else {
    console.log('🧹 数据库清理工具');
    console.log('\n用法:');
    console.log('  node clear-test-data.js --check   # 检查当前数据状态');
    console.log('  node clear-test-data.js --clear   # 清空测试数据');
    console.log('\n⚠️  注意: --clear操作不可逆，请谨慎使用');
  }
};

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { clearTestData, checkCurrentData };