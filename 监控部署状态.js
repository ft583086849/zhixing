#!/usr/bin/env node

/**
 * 监控Vercel部署状态
 * 检查管理员页面修复是否部署成功
 */

const https = require('https');

console.log('🔍 开始监控Vercel部署状态...');
console.log('=' .repeat(50));

const checkDeploymentStatus = async () => {
  const url = 'https://zhixing-seven.vercel.app/admin';
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
};

const checkAPI = async () => {
  const apiUrl = 'https://zhixing-seven.vercel.app/api/admin?path=stats';
  
  return new Promise((resolve, reject) => {
    const req = https.get(apiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('API请求超时'));
    });
  });
};

const monitorDeployment = async () => {
  const maxAttempts = 10;
  const interval = 30000; // 30秒
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n🔄 第${attempt}次检查 (${new Date().toLocaleTimeString()})`);
    
    try {
      // 检查前端页面
      console.log('   📱 检查前端页面...');
      const frontendResult = await checkDeploymentStatus();
      
      if (frontendResult.status === 200) {
        console.log('   ✅ 前端页面: 正常访问 (200)');
        
        // 检查API
        console.log('   🔌 检查管理员API...');
        try {
          const apiResult = await checkAPI();
          
          if (apiResult.status === 401 || (apiResult.data && apiResult.data.message && apiResult.data.message.includes('未提供有效的认证Token'))) {
            console.log('   ✅ 管理员API: 正常响应 (需要认证)');
            console.log('\n🎉 部署成功确认!');
            console.log('   📍 管理员页面: https://zhixing-seven.vercel.app/admin');
            console.log('   📊 页面状态: 可正常访问');
            console.log('   🔌 API状态: 正常响应');
            console.log('   🛡️  认证: 需要管理员登录');
            return true;
          } else if (apiResult.status === 200 && apiResult.data && apiResult.data.success) {
            console.log('   ✅ 管理员API: 正常响应 (200)');
            console.log('   📊 数据返回: 正常');
            console.log('\n🎉 部署成功确认!');
            console.log('   📍 管理员页面: https://zhixing-seven.vercel.app/admin');
            console.log('   📊 页面状态: 可正常访问');
            console.log('   🔌 API状态: 正常响应');
            return true;
          } else {
            console.log(`   ⚠️  管理员API: 状态码 ${apiResult.status}`);
            if (apiResult.parseError) {
              console.log(`   📝 解析错误: ${apiResult.parseError}`);
            }
          }
        } catch (apiError) {
          console.log(`   ❌ API检查失败: ${apiError.message}`);
        }
        
      } else {
        console.log(`   ⚠️  前端页面: 状态码 ${frontendResult.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ 检查失败: ${error.message}`);
    }
    
    if (attempt < maxAttempts) {
      console.log(`   ⏳ ${interval/1000}秒后进行下一次检查...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  console.log('\n⚠️  监控超时，但这不意味着部署失败');
  console.log('💡 请手动访问管理员页面验证: https://zhixing-seven.vercel.app/admin');
  return false;
};

// 开始监控
monitorDeployment().then(success => {
  if (success) {
    console.log('\n🎊 监控完成 - 部署成功!');
  } else {
    console.log('\n⏰ 监控超时，请手动验证部署状态');
  }
}).catch(error => {
  console.error('\n❌ 监控过程中发生错误:', error.message);
});