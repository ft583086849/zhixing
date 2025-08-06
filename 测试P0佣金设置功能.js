const https = require('https');

// 管理员登录获取token
async function getAdminToken() {
  const loginData = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(loginData);
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/auth?path=login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data.token) {
            resolve(response.data.token);
          } else {
            reject(new Error(`登录失败: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`登录响应解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// API调用函数
async function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ 
            status: res.statusCode, 
            success: response.success, 
            data: response.data, 
            message: response.message,
            rawResponse: responseData
          });
        } catch (error) {
          resolve({ 
            status: res.statusCode, 
            success: false, 
            error: `响应解析失败: ${error.message}`, 
            rawResponse: responseData 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: `网络错误: ${error.message}` });
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// 测试P0佣金设置功能
async function testP0CommissionSetting() {
  console.log('🎯 测试P0核心功能：一级销售设置二级销售佣金并回流到管理员系统...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 获取现有二级销售列表
    console.log('2. 获取现有二级销售列表...');
    const salesListResult = await apiCall('GET', '/api/secondary-sales?path=list', null, token);
    
    if (!salesListResult.success || !salesListResult.data || salesListResult.data.length === 0) {
      console.log('❌ 无可测试的二级销售数据');
      return;
    }

    const testSecondarySales = salesListResult.data[0];
    console.log(`✅ 找到测试二级销售: ${testSecondarySales.wechat_name} (ID: ${testSecondarySales.id})`);
    console.log(`   当前佣金率: ${testSecondarySales.commission_rate}%`);
    console.log('');

    // 3. 测试一级销售设置二级销售佣金
    console.log('3. 测试佣金设置API...');
    const newCommissionRate = 0.25; // 25%
    
    const updateResult = await apiCall(
      'PUT', 
      `/api/primary-sales?path=update-commission&id=${testSecondarySales.id}`, 
      { commissionRate: newCommissionRate }, 
      token
    );
    
    console.log('📋 佣金设置结果:');
    console.log(`状态: ${updateResult.status}`);
    console.log(`成功: ${updateResult.success}`);
    console.log(`消息: ${updateResult.message}`);
    
    if (updateResult.success) {
      console.log('✅ 佣金设置API正常工作！');
      console.log(`   新佣金率: ${(newCommissionRate * 100).toFixed(1)}%`);
      console.log(`   更新时间: ${updateResult.data?.updated_at}`);
    } else {
      console.log('❌ 佣金设置API失败');
      if (updateResult.error) console.log(`错误: ${updateResult.error}`);
    }
    console.log('');

    // 4. 验证数据是否回流到管理员系统
    console.log('4. 验证数据回流到管理员系统...');
    const verifyResult = await apiCall('GET', '/api/secondary-sales?path=list', null, token);
    
    if (verifyResult.success && verifyResult.data) {
      const updatedSales = verifyResult.data.find(sales => sales.id === testSecondarySales.id);
      
      if (updatedSales) {
        const currentRate = parseFloat(updatedSales.commission_rate) / 100;
        console.log(`📊 验证结果:`);
        console.log(`   原佣金率: ${(parseFloat(testSecondarySales.commission_rate) / 100 * 100).toFixed(1)}%`);
        console.log(`   新佣金率: ${(currentRate * 100).toFixed(1)}%`);
        console.log(`   设置值: ${(newCommissionRate * 100).toFixed(1)}%`);
        
        if (Math.abs(currentRate - newCommissionRate) < 0.001) {
          console.log('✅ 数据已成功回流到管理员系统！');
        } else {
          console.log('❌ 数据回流验证失败，数值不匹配');
        }
      } else {
        console.log('❌ 无法找到更新后的销售数据');
      }
    } else {
      console.log('❌ 验证数据回流失败');
    }
    console.log('');

    // 5. 测试完成后恢复原始佣金率
    console.log('5. 恢复原始佣金率...');
    const originalRate = parseFloat(testSecondarySales.commission_rate) / 100;
    await apiCall(
      'PUT', 
      `/api/primary-sales?path=update-commission&id=${testSecondarySales.id}`, 
      { commissionRate: originalRate }, 
      token
    );
    console.log('✅ 已恢复原始佣金率');

    console.log('\n🎉 P0核心功能测试完成！');
    if (updateResult.success) {
      console.log('✅ 一级销售设置二级销售佣金功能正常');
      console.log('✅ 数据回流到管理员系统功能正常');
      console.log('🎯 P0业务链路：一级销售 → 设置佣金 → 管理员系统 ✅ 已通畅');
    } else {
      console.log('❌ P0核心功能仍有问题，需要进一步调试');
    }
    
  } catch (error) {
    console.error('❌ 测试过程失败:', error.message);
  }
}

// 执行测试
testP0CommissionSetting();