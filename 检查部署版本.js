const https = require('https');

async function checkDeploymentVersion() {
  return new Promise((resolve, reject) => {
    // 尝试访问一个可能包含版本信息的endpoint
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/primary-sales?debug=true',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('🔍 检查primary_sales API部署版本:');
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应头时间: ${res.headers.date}`);
        
        try {
          const result = JSON.parse(responseData);
          console.log('\n📊 API响应结构分析:');
          if (result.success && result.data && result.data.length > 0) {
            const sample = result.data[0];
            const fields = Object.keys(sample);
            console.log(`字段数量: ${fields.length}`);
            console.log(`字段列表: ${fields.join(', ')}`);
            
            // 检查是否包含我们新添加的字段
            const newFields = ['sales_code', 'phone', 'email'];
            const hasNewFields = newFields.filter(field => fields.includes(field));
            const missingFields = newFields.filter(field => !fields.includes(field));
            
            console.log(`\n✅ 包含新字段: ${hasNewFields.join(', ') || '无'}`);
            console.log(`❌ 缺失新字段: ${missingFields.join(', ') || '无'}`);
            
            if (missingFields.length === 0) {
              console.log('\n🎉 部署成功！新字段已生效');
            } else {
              console.log('\n⚠️  部署可能未完成或缓存问题');
            }
          }
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    await checkDeploymentVersion();
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

main();