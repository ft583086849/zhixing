// 简单API健康检查
const https = require('https');

function testAPI(path, description) {
  return new Promise((resolve) => {
    console.log(`🧪 测试: ${description}`);
    console.log(`📤 请求: https://zhixing-seven.vercel.app${path}`);
    
    const req = https.request({
      hostname: 'zhixing-seven.vercel.app',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Test Client'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log(`📦 响应: ${JSON.stringify(response, null, 2)}`);
        } catch (error) {
          console.log(`📦 响应: ${data.substring(0, 200)}`);
        }
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 错误: ${error.message}`);
      console.log('');
      resolve();
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ 超时`);
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

async function runHealthChecks() {
  console.log('🔍 API健康检查开始...\n');
  
  await testAPI('/api/health', 'API健康检查');
  await testAPI('/api/primary-sales', '一级销售API基本连接');
  await testAPI('/api/secondary-sales', '二级销售API基本连接');
  await testAPI('/api/orders', '订单API基本连接');
  
  console.log('🔍 健康检查完成');
}

runHealthChecks().catch(console.error);