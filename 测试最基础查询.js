const https = require('https');

async function testBasicQuery() {
  return new Promise((resolve, reject) => {
    // 模拟primary_sales.js的最简单查询
    const data = JSON.stringify({
      action: 'raw_query',
      sql: 'SELECT COUNT(*) as total FROM primary_sales'
    });

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/admin?path=update-schema', 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('🔍 基础COUNT查询测试:');
        console.log(responseData);
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 让我检查api/primary-sales.js中到底是什么问题
// 我需要添加更详细的错误日志
async function main() {
  console.log('🔍 分析primary_sales.js的500错误...');
  
  // 可能的问题：
  console.log('\n可能的问题分析:');
  console.log('1. phone/email字段不存在 - 需要检查admin.js中的CREATE TABLE');
  console.log('2. GROUP BY语句有问题 - MySQL的ONLY_FULL_GROUP_BY模式');
  console.log('3. LEFT JOIN secondary_sales有问题 - secondary_sales表结构问题');
  console.log('4. 数据库连接问题');
  
  console.log('\n让我检查admin.js中primary_sales的确切定义...');
}

main();