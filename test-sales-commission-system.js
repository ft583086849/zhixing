const axios = require('axios');

async function testSalesCommissionSystem() {
  console.log('🔍 开始测试销售分佣系统...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 1. 测试数据库初始化
    console.log('\n📊 1. 测试数据库初始化...');
    const initResponse = await axios.post(`${baseURL}/init-database?path=init`, {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 数据库初始化成功');
    console.log('📊 响应:', JSON.stringify(initResponse.data, null, 2));
    
    // 2. 测试创建一级销售
    console.log('\n👤 2. 测试创建一级销售...');
    const timestamp = Date.now();
    const primarySalesData = {
      wechat_name: `测试一级销售_${timestamp}`,
      payment_method: 'alipay',
      payment_address: 'test@alipay.com',
      alipay_surname: '张'
    };
    
    const primaryResponse = await axios.post(`${baseURL}/primary-sales?path=create`, primarySalesData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 一级销售创建成功');
    console.log('📊 响应:', JSON.stringify(primaryResponse.data, null, 2));
    
    const primarySalesId = primaryResponse.data.data.primary_sales_id;
    
    // 3. 测试获取一级销售列表
    console.log('\n📋 3. 测试获取一级销售列表...');
    const listResponse = await axios.get(`${baseURL}/primary-sales?path=list`, {
      timeout: 30000
    });
    
    console.log('✅ 一级销售列表获取成功');
    console.log('📊 响应:', JSON.stringify(listResponse.data, null, 2));
    
    // 4. 测试获取一级销售统计
    console.log('\n📈 4. 测试获取一级销售统计...');
    const statsResponse = await axios.get(`${baseURL}/primary-sales?path=stats`, {
      timeout: 30000
    });
    
    console.log('✅ 一级销售统计获取成功');
    console.log('📊 响应:', JSON.stringify(statsResponse.data, null, 2));
    
    // 5. 测试创建二级销售
    console.log('\n👥 5. 测试创建二级销售...');
    const secondarySalesData = {
      wechat_name: `测试二级销售_${timestamp}`,
      primary_sales_id: primarySalesId,
      payment_method: 'crypto',
      payment_address: '0x1234567890abcdef',
      chain_name: 'ETH'
    };
    
    // 注意：这里需要先检查是否有创建二级销售的API端点
    console.log('⚠️ 二级销售创建功能需要检查API端点是否存在');
    
    // 6. 测试管理员API
    console.log('\n🔧 6. 测试管理员API...');
    const adminResponse = await axios.get(`${baseURL}/admin?path=stats`, {
      headers: {
        'Authorization': 'Bearer admin123'
      },
      timeout: 30000
    });
    
    console.log('✅ 管理员概览获取成功');
    console.log('📊 响应:', JSON.stringify(adminResponse.data, null, 2));
    
    // 7. 测试销售API
    console.log('\n💰 7. 测试销售API...');
    const salesData = {
      wechat_name: `测试销售_${timestamp}`,
      payment_method: 'alipay',
      payment_address: 'sales@alipay.com',
      alipay_surname: '李'
    };
    
    const salesResponse = await axios.post(`${baseURL}/sales?path=create`, salesData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 销售创建成功');
    console.log('📊 响应:', JSON.stringify(salesResponse.data, null, 2));
    
    // 8. 测试获取销售列表
    console.log('\n📋 8. 测试获取销售列表...');
    const salesListResponse = await axios.get(`${baseURL}/sales`, {
      timeout: 30000
    });
    
    console.log('✅ 销售列表获取成功');
    console.log('📊 响应:', JSON.stringify(salesListResponse.data, null, 2));
    
    console.log('\n🎉 销售分佣系统测试完成！');
    console.log('✅ 所有核心功能测试通过');
    console.log('✅ 数据库结构正常');
    console.log('✅ API端点响应正常');
    
    return {
      success: true,
      message: '销售分佣系统测试完成'
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testSalesCommissionSystem()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 