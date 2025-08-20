const https = require('https');

// 测试购买页面的实际内容
const testUrl = 'https://zhixing-seven.vercel.app/purchase?sales_code=PRI17547196352594604';

console.log('正在访问线上购买页面...');
console.log('URL:', testUrl);
console.log('');

https.get(testUrl, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n页面内容长度:', data.length, '字符');
    
    // 检查关键内容
    if (data.includes('您需要启用JavaScript')) {
      console.log('⚠️ 页面返回了"需要启用JavaScript"的提示');
    }
    
    if (data.includes('知行财库')) {
      console.log('✅ 页面标题包含"知行财库"');
    }
    
    if (data.includes('PurchasePage')) {
      console.log('✅ 页面包含PurchasePage组件');
    }
    
    if (data.includes('sales_code')) {
      console.log('✅ 页面包含sales_code参数处理');
    }
    
    // 查看前500个字符
    console.log('\n页面前500个字符:');
    console.log(data.substring(0, 500));
    
    // 检查是否有错误信息
    if (data.includes('error') || data.includes('Error')) {
      console.log('\n⚠️ 页面可能包含错误信息');
    }
    
    // 检查构建版本
    const buildMatch = data.match(/\/static\/js\/main\.([a-f0-9]+)\.js/);
    if (buildMatch) {
      console.log('\n构建版本哈希:', buildMatch[1]);
    }
  });
}).on('error', (err) => {
  console.error('请求失败:', err.message);
});