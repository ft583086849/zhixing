#!/usr/bin/env node

/**
 * 创建管理员账户并测试登录流程
 * 解决无痕模式下数据无法显示的问题
 */

const https = require('https');

console.log('🔧 创建管理员账户并测试登录...');
console.log('=' .repeat(50));

// 创建管理员账户
const createAdminAccount = async () => {
  console.log('\n👤 1. 创建管理员账户...');
  
  const adminData = JSON.stringify({
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    email: 'admin@zhixing.com'
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/auth?path=create-admin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(adminData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 创建账户响应 (${res.statusCode}): ${data}`);
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('   ✅ 管理员账户创建成功');
          } else {
            console.log(`   ⚠️ 创建结果: ${result.message}`);
          }
          resolve(result);
        } catch (error) {
          console.log(`   ⚠️ 响应解析失败，可能账户已存在`);
          resolve({ success: false, message: '账户可能已存在' });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 创建账户失败: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.write(adminData);
    req.end();
  });
};

// 测试管理员登录
const testAdminLogin = async () => {
  console.log('\n🔐 2. 测试管理员登录...');
  
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/auth?path=login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 登录响应 (${res.statusCode}): ${data}`);
        try {
          const result = JSON.parse(data);
          if (result.success && result.token) {
            console.log('   ✅ 登录成功，获取到token');
            console.log(`   🎟️ Token: ${result.token.substring(0, 20)}...`);
            resolve(result.token);
          } else {
            console.log(`   ❌ 登录失败: ${result.message}`);
            resolve(null);
          }
        } catch (error) {
          console.log(`   ❌ 登录响应解析失败: ${error.message}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 登录请求失败: ${error.message}`);
      resolve(null);
    });
    
    req.write(loginData);
    req.end();
  });
};

// 使用token获取管理员数据
const testDataWithToken = async (token) => {
  if (!token) {
    console.log('\n❌ 3. 跳过数据测试 - 无有效token');
    return;
  }
  
  console.log('\n📊 3. 使用token测试数据获取...');
  
  const testEndpoint = async (path, description) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: `/api/admin?path=${path}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`   📊 ${description} (${res.statusCode}):`);
          try {
            const result = JSON.parse(data);
            if (result.success) {
              if (Array.isArray(result.data)) {
                console.log(`      ✅ 数据数量: ${result.data.length}条`);
                return resolve(result.data.length);
              } else {
                console.log(`      ✅ 数据获取成功`);
                return resolve(1);
              }
            } else {
              console.log(`      ❌ API错误: ${result.message}`);
              return resolve(0);
            }
          } catch (error) {
            console.log(`      ❌ 响应解析失败: ${error.message}`);
            console.log(`      📄 原始响应: ${data.substring(0, 100)}...`);
            return resolve(0);
          }
        });
      });
      
      req.on('error', (error) => {
        console.log(`      ❌ ${description}请求失败: ${error.message}`);
        resolve(0);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        console.log(`      ⏰ ${description}请求超时`);
        resolve(0);
      });
      
      req.end();
    });
  };
  
  const ordersCount = await testEndpoint('orders', '订单数据');
  const salesCount = await testEndpoint('sales', '销售数据');
  const customersCount = await testEndpoint('customers', '客户数据');
  
  return { ordersCount, salesCount, customersCount };
};

// 创建临时无认证的数据查看接口
const createTempDataViewer = async () => {
  console.log('\n🔧 4. 创建临时数据查看方法...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/health',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const postData = JSON.stringify({
      action: 'temp_data_check'
    });
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 临时数据查看 (${res.statusCode}): ${data.substring(0, 200)}...`);
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 临时数据查看失败: ${error.message}`);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
};

// 输出解决方案
const printSolution = (hasData, dataCount) => {
  console.log('\n🎯 问题诊断和解决方案:');
  console.log('=' .repeat(50));
  
  if (hasData && dataCount.ordersCount > 0) {
    console.log('\n✅ 数据存在，认证流程正常！');
    console.log(`   📊 数据统计: 订单${dataCount.ordersCount}个，销售${dataCount.salesCount}个，客户${dataCount.customersCount}个`);
    console.log('\n🔧 解决方案:');
    console.log('   1. 访问: https://zhixing-seven.vercel.app/admin');
    console.log('   2. 使用账户登录:');
    console.log('      用户名: admin');
    console.log('      密码: admin123');
    console.log('   3. 登录成功后应该可以看到所有数据');
    console.log('   4. 佣金设置: 销售管理页面 → 佣金率列 → 编辑按钮');
  } else {
    console.log('\n⚠️ 数据或认证有问题！');
    console.log('\n🔧 紧急解决方案:');
    console.log('   1. 确保管理员账户存在并能正常登录');
    console.log('   2. 检查API认证流程');
    console.log('   3. 重新创建测试数据');
    console.log('   4. 检查前端代码的API调用');
  }
  
  console.log('\n💡 调试建议:');
  console.log('   1. 登录后按F12检查浏览器控制台');
  console.log('   2. 查看Network标签页的API请求');
  console.log('   3. 确认API请求返回的状态码和数据');
};

// 主执行函数
const runTest = async () => {
  try {
    await createAdminAccount();
    const token = await testAdminLogin();
    const dataCount = await testDataWithToken(token);
    await createTempDataViewer();
    
    const hasData = token && dataCount && (dataCount.ordersCount > 0 || dataCount.salesCount > 0);
    printSolution(hasData, dataCount || {});
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    printSolution(false, {});
  }
};

runTest();