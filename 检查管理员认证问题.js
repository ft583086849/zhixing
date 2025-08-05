#!/usr/bin/env node

/**
 * 检查管理员认证和数据获取问题
 * 诊断无痕模式下仍然没有数据的原因
 */

const https = require('https');

console.log('🔍 检查管理员认证和数据获取问题...');
console.log('=' .repeat(50));

// 检查数据是否真的存在
const checkRawData = async () => {
  console.log('\n📊 1. 检查原始数据是否存在...');
  
  const postData = JSON.stringify({
    query: 'SELECT COUNT(*) as count FROM primary_sales',
    query2: 'SELECT COUNT(*) as count FROM secondary_sales', 
    query3: 'SELECT COUNT(*) as count FROM orders'
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/health',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 健康检查响应 (${res.statusCode}):`, data.substring(0, 300));
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 健康检查失败: ${error.message}`);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
};

// 检查管理员登录API
const checkAdminLogin = async () => {
  console.log('\n🔐 2. 检查管理员登录API...');
  
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/auth',
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
        try {
          const result = JSON.parse(data);
          console.log(`   📊 登录响应 (${res.statusCode}):`, result);
          
          if (result.success && result.token) {
            console.log('   ✅ 登录成功，获取到token');
            resolve(result.token);
          } else {
            console.log('   ❌ 登录失败或无token');
            resolve(null);
          }
        } catch (error) {
          console.log(`   ❌ 登录响应解析失败: ${error.message}`);
          console.log(`   📄 原始响应: ${data}`);
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

// 使用token检查管理员数据
const checkAdminDataWithToken = async (token) => {
  if (!token) {
    console.log('\n❌ 3. 跳过管理员数据检查 - 无有效token');
    return;
  }
  
  console.log('\n📋 3. 使用token检查管理员数据...');
  
  const checkEndpoint = async (path, description) => {
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
          try {
            const result = JSON.parse(data);
            console.log(`   📊 ${description} (${res.statusCode}):`);
            
            if (result.success && result.data) {
              if (Array.isArray(result.data)) {
                console.log(`      ✅ 数据数量: ${result.data.length}条`);
                if (result.data.length > 0) {
                  console.log(`      📝 示例数据:`, JSON.stringify(result.data[0], null, 2).substring(0, 200) + '...');
                }
              } else {
                console.log(`      ✅ 数据内容:`, JSON.stringify(result.data, null, 2));
              }
            } else {
              console.log(`      ❌ API错误: ${result.message || '未知错误'}`);
            }
            resolve(result);
          } catch (error) {
            console.log(`      ❌ 响应解析失败: ${error.message}`);
            console.log(`      📄 原始响应: ${data.substring(0, 200)}...`);
            resolve(null);
          }
        });
      });
      
      req.on('error', (error) => {
        console.log(`      ❌ ${description}请求失败: ${error.message}`);
        resolve(null);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        console.log(`      ⏰ ${description}请求超时`);
        resolve(null);
      });
      
      req.end();
    });
  };
  
  await checkEndpoint('orders', '订单数据');
  await checkEndpoint('sales', '销售数据');
  await checkEndpoint('customers', '客户数据');
  await checkEndpoint('stats', '统计数据');
};

// 检查前端是否能正确获取管理员页面
const checkAdminPage = async () => {
  console.log('\n🖥️ 4. 检查管理员页面内容...');
  
  return new Promise((resolve, reject) => {
    const req = https.get('https://zhixing-seven.vercel.app/admin', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 页面状态码: ${res.statusCode}`);
        console.log(`   📦 页面大小: ${(data.length / 1024).toFixed(1)}KB`);
        
        // 检查是否是正确的React应用
        const hasReactRoot = data.includes('root') && data.includes('div');
        const hasJSBundle = data.includes('.js') || data.includes('script');
        const isLoginRedirect = data.includes('login') || data.includes('Login');
        
        console.log(`   ⚛️ React根元素: ${hasReactRoot ? '✅' : '❌'}`);
        console.log(`   📦 JS Bundle: ${hasJSBundle ? '✅' : '❌'}`);
        console.log(`   🔐 登录重定向: ${isLoginRedirect ? '✅' : '❌'}`);
        
        // 输出页面的前200个字符用于调试
        console.log(`   📄 页面内容预览: ${data.substring(0, 200)}...`);
        
        resolve({
          status: res.statusCode,
          size: data.length,
          content: data.substring(0, 500)
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 页面检查失败: ${error.message}`);
      resolve(null);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ⏰ 页面检查请求超时');
      resolve(null);
    });
  });
};

// 输出解决方案
const printDiagnosticResults = () => {
  console.log('\n🎯 诊断结果和解决方案:');
  console.log('=' .repeat(50));
  
  console.log('\n📋 可能的问题原因:');
  console.log('   1. 管理员需要先登录才能看到数据');
  console.log('   2. 前端API调用有认证问题');
  console.log('   3. 数据创建过程中有遗漏');
  console.log('   4. 前端组件加载或渲染问题');
  
  console.log('\n🔧 立即解决步骤:');
  console.log('   1. 访问管理员页面: https://zhixing-seven.vercel.app/admin');
  console.log('   2. 确保正确登录 (用户名: admin, 密码: admin123)');
  console.log('   3. 登录成功后检查各个页面标签');
  console.log('   4. 如果登录后仍无数据，检查浏览器控制台错误');
  
  console.log('\n🛠️ 调试建议:');
  console.log('   1. 按F12打开开发者工具');
  console.log('   2. 查看Console标签页的错误信息');
  console.log('   3. 查看Network标签页的API请求状态');
  console.log('   4. 确认API请求是否返回了认证错误');
};

// 主执行函数
const runDiagnosis = async () => {
  try {
    await checkRawData();
    const token = await checkAdminLogin();
    await checkAdminDataWithToken(token);
    await checkAdminPage();
    
    printDiagnosticResults();
    
  } catch (error) {
    console.error('\n❌ 诊断过程中发生错误:', error.message);
    printDiagnosticResults();
  }
};

runDiagnosis();