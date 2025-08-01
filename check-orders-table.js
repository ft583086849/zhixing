const axios = require('axios');

async function checkOrdersTable() {
  console.log('🔍 检查orders表结构...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  // 先获取token
  console.log('🔑 获取管理员token...');
  const loginResponse = await axios.post(`${baseURL}/auth?path=login`, {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  });
  
  const token = loginResponse.data.data.token;
  console.log('✅ 获取token成功');
  
  try {
    // 获取订单列表
    console.log('\n1️⃣ 获取订单列表...');
    const ordersResponse = await axios.get(`${baseURL}/admin?path=orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: 1,
        limit: 5
      }
    });
    
    console.log('✅ 订单API调用成功');
    const orders = ordersResponse.data.data.orders || ordersResponse.data.orders;
    
    if (orders && orders.length > 0) {
      console.log('📊 第一个订单记录完整数据:');
      console.log(JSON.stringify(orders[0], null, 2));
      
      // 检查关键字段
      console.log('\n🔍 检查关键字段:');
      const firstOrder = orders[0];
      console.log(`  id: ${firstOrder.id ? '✅' : '❌'}`);
      console.log(`  link_code: ${firstOrder.link_code ? '✅' : '❌'}`);
      console.log(`  sales_id: ${firstOrder.sales_id ? '✅' : '❌'}`);
      console.log(`  amount: ${firstOrder.amount ? '✅' : '❌'}`);
      console.log(`  status: ${firstOrder.status ? '✅' : '❌'}`);
      
      // 检查所有字段
      console.log('\n📊 所有字段列表:');
      Object.keys(firstOrder).forEach(key => {
        console.log(`  ${key}: ${firstOrder[key]}`);
      });
    }
    
    // 检查销售表结构
    console.log('\n2️⃣ 检查销售表结构...');
    const salesResponse = await axios.get(`${baseURL}/admin?path=sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 销售API调用成功');
    const sales = salesResponse.data.data || salesResponse.data;
    
    if (sales && sales.length > 0) {
      const firstSales = sales[0];
      console.log('📊 第一个销售记录关键字段:');
      console.log(`  id: ${firstSales.id}`);
      console.log(`  link_code: ${firstSales.link_code}`);
      console.log(`  sales_type: ${firstSales.sales_type}`);
    }
    
    // 分析关联关系
    console.log('\n3️⃣ 分析表关联关系...');
    if (orders && orders.length > 0 && sales && sales.length > 0) {
      const orderLinkCode = orders[0].link_code;
      const salesLinkCode = sales[0].link_code;
      
      console.log(`  订单link_code: ${orderLinkCode}`);
      console.log(`  销售link_code: ${salesLinkCode}`);
      console.log(`  关联匹配: ${orderLinkCode === salesLinkCode ? '✅' : '❌'}`);
    }
    
    console.log('\n🎯 表结构检查完成！');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
  }
}

// 运行检查
checkOrdersTable()
  .then(() => {
    console.log('\n✅ 表结构检查完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 表结构检查失败');
    process.exit(1);
  }); 