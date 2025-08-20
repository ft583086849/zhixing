const { adminAPI } = require('./client/src/services/api.js');

async function testAPIResponse() {
  console.log('测试API响应数据...\n');
  
  try {
    // 1. 测试getStats方法
    console.log('1. 调用 adminAPI.getStats():');
    const stats = await adminAPI.getStats({ timeRange: 'all' });
    console.log('返回的stats数据:', JSON.stringify(stats, null, 2));
    
    // 2. 测试getSales方法
    console.log('\n2. 调用 adminAPI.getSales():');
    const sales = await adminAPI.getSales({});
    console.log('返回的销售数量:', sales?.length || 0);
    
    if (sales && sales.length > 0) {
      console.log('第一个销售记录:', JSON.stringify(sales[0], null, 2));
    }
    
    // 3. 测试getOrders方法
    console.log('\n3. 调用 adminAPI.getOrders():');
    const orders = await adminAPI.getOrders({});
    console.log('返回的订单数量:', orders?.length || 0);
    
    // 4. 测试getCustomers方法
    console.log('\n4. 调用 adminAPI.getCustomers():');
    const customers = await adminAPI.getCustomers({});
    console.log('返回的客户数量:', customers?.length || 0);
    
  } catch (error) {
    console.error('\n错误:', error.message);
    console.error('错误详情:', error);
  }
  
  process.exit(0);
}

testAPIResponse();