// 测试数据库表结构和字段存在情况
const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testDatabaseStructure() {
  console.log('🔍 检查数据库表结构...');
  console.log('');

  try {
    // 1. 测试创建一级销售（会暴露字段缺失问题）
    console.log('1️⃣ 测试创建一级销售（检测字段缺失）...');
    const testPrimaryData = {
      wechat_name: 'test_db_check_' + Date.now(),
      payment_method: 'alipay',
      payment_address: 'test@check.com',
      alipay_surname: '测试'
    };

    const createResult = await makeRequest(
      'https://zhixing-seven.vercel.app/api/primary-sales?path=create',
      testPrimaryData
    );
    
    console.log('创建结果状态:', createResult.status);
    console.log('创建结果:', JSON.stringify(createResult.data, null, 2));
    console.log('');

    // 2. 测试获取一级销售列表
    console.log('2️⃣ 测试获取一级销售列表...');
    // 注意：这个需要admin权限，可能会失败
    const listResult = await makeRequest(
      'https://zhixing-seven.vercel.app/api/primary-sales?path=list'
    );
    
    console.log('列表结果状态:', listResult.status);
    if (listResult.status === 401) {
      console.log('ℹ️  需要管理员权限，跳过列表查询');
    } else {
      console.log('列表结果:', JSON.stringify(listResult.data, null, 2));
    }
    console.log('');

    // 3. 测试创建二级销售注册（会暴露注册代码字段问题）
    console.log('3️⃣ 测试二级销售注册（检测注册代码字段）...');
    const testSecondaryData = {
      secondary_registration_code: 'test_code_123456',
      wechat_name: 'test_secondary_' + Date.now(),
      payment_method: 'alipay',
      payment_address: 'test2@check.com',
      alipay_surname: '测试2'
    };

    const registerResult = await makeRequest(
      'https://zhixing-seven.vercel.app/api/secondary-sales?path=register',
      testSecondaryData
    );
    
    console.log('注册结果状态:', registerResult.status);
    console.log('注册结果:', JSON.stringify(registerResult.data, null, 2));
    console.log('');

    // 4. 测试销售代码查找
    console.log('4️⃣ 测试销售代码查找...');
    const searchResult = await makeRequest(
      'https://zhixing-seven.vercel.app/api/sales?sales_code=test_not_exist_code'
    );
    
    console.log('查找结果状态:', searchResult.status);
    console.log('查找结果:', JSON.stringify(searchResult.data, null, 2));
    console.log('');

    console.log('📋 测试总结:');
    console.log('- 一级销售创建:', createResult.status === 200 ? '✅ 成功' : '❌ 失败');
    console.log('- 二级销售注册:', registerResult.status === 200 ? '✅ 成功' : '❌ 失败');
    console.log('- 销售代码查找:', searchResult.status === 404 ? '✅ 正常' : '❌ 异常');
    
    // 分析错误信息
    if (createResult.status !== 200) {
      console.log('');
      console.log('🔍 一级销售创建错误分析:');
      if (createResult.data.message && createResult.data.message.includes('sales_code')) {
        console.log('❌ 缺少sales_code字段');
      }
      if (createResult.data.message && createResult.data.message.includes('secondary_registration_code')) {
        console.log('❌ 缺少secondary_registration_code字段');
      }
    }

    if (registerResult.status !== 200) {
      console.log('');
      console.log('🔍 二级销售注册错误分析:');
      if (registerResult.data.message && registerResult.data.message.includes('secondary_registration_code')) {
        console.log('❌ 二级销售注册代码字段问题');
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testDatabaseStructure();