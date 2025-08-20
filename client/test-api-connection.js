// 测试API连接
const https = require('https');

function testConnection() {
  console.log('测试Supabase连接...\n');
  
  const options = {
    hostname: 'itvmeamoqthfqtkpubdv.supabase.co',
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
    }
  };
  
  const req = https.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 406) {
      console.log('✅ Supabase API连接正常');
      console.log('状态码:', res.statusCode);
    } else {
      console.log('❌ Supabase API返回错误');
      console.log('状态码:', res.statusCode);
    }
  });
  
  req.on('error', (error) => {
    console.error('❌ 连接失败:', error.message);
  });
  
  req.end();
}

testConnection();
