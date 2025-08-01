const axios = require('axios');

async function checkSalesTableStructure() {
  console.log('🔍 开始检查sales表结构...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 1. 首先检查数据库初始化API返回的表结构信息
    console.log('\n📊 1. 检查数据库初始化状态...');
    const initResponse = await axios.post(`${baseURL}/init-database?path=init`, {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 数据库初始化成功');
    console.log('📋 创建的表:', initResponse.data.data.tables_created);
    
    // 2. 尝试获取sales表的实际数据，看看表是否存在
    console.log('\n📋 2. 检查sales表数据...');
    const salesListResponse = await axios.get(`${baseURL}/sales`, {
      timeout: 30000
    });
    
    console.log('✅ sales表查询成功');
    console.log('📊 当前sales表记录数:', salesListResponse.data.data.length);
    
    if (salesListResponse.data.data.length > 0) {
      console.log('📋 第一条记录结构:');
      const firstRecord = salesListResponse.data.data[0];
      Object.keys(firstRecord).forEach(key => {
        console.log(`  - ${key}: ${typeof firstRecord[key]} (${firstRecord[key]})`);
      });
    }
    
    // 3. 分析销售API的INSERT语句需要的字段
    console.log('\n🔧 3. 分析销售API的INSERT语句...');
    const requiredFields = [
      'wechat_name',
      'payment_method', 
      'payment_address',
      'alipay_surname',
      'chain_name',
      'link_code'
    ];
    
    console.log('📋 销售API需要的字段:');
    requiredFields.forEach(field => {
      console.log(`  - ${field}`);
    });
    
    // 4. 尝试创建一个测试销售记录，看看具体错误
    console.log('\n🧪 4. 尝试创建测试销售记录...');
    const testData = {
      wechat_name: `structure_test_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'test@structure.com',
      alipay_surname: '测'
    };
    
    try {
      const createResponse = await axios.post(`${baseURL}/sales?path=create`, testData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ 测试销售创建成功');
      console.log('📊 响应:', JSON.stringify(createResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ 测试销售创建失败');
      console.log('📊 错误状态码:', error.response?.status);
      console.log('📊 错误响应:', error.response?.data);
      
      // 分析错误信息
      if (error.response?.data?.message) {
        console.log('🔍 错误分析:');
        console.log(`  - 错误消息: ${error.response.data.message}`);
        
        if (error.response.data.message.includes('服务器内部错误')) {
          console.log('  - 可能原因: 数据库表结构不匹配或SQL语句错误');
        } else if (error.response.data.message.includes('微信名')) {
          console.log('  - 可能原因: 微信名重复');
        }
      }
    }
    
    // 5. 对比一级销售API的成功案例
    console.log('\n📊 5. 对比一级销售API结构...');
    const primaryTestData = {
      wechat_name: `primary_structure_test_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'test@primary.com',
      alipay_surname: '测'
    };
    
    try {
      const primaryResponse = await axios.post(`${baseURL}/primary-sales?path=create`, primaryTestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ 一级销售创建成功');
      console.log('📊 响应状态码:', primaryResponse.status);
      
    } catch (error) {
      console.log('❌ 一级销售创建失败');
      console.log('📊 错误状态码:', error.response?.status);
      console.log('📊 错误响应:', error.response?.data);
    }
    
    console.log('\n📋 分析总结:');
    console.log('=' * 50);
    console.log('1. 数据库连接正常');
    console.log('2. sales表存在且可以查询');
    console.log('3. 需要进一步分析具体的数据库错误');
    
    return {
      success: true,
      message: 'sales表结构检查完成'
    };
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行检查
checkSalesTableStructure()
  .then(result => {
    console.log('\n✅ 检查完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 检查失败');
    process.exit(1);
  }); 