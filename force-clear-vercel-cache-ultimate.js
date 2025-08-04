/**
 * 强制清理Vercel缓存 - 佣金比率计算逻辑部署后
 */

const https = require('https');

// 需要清理缓存的关键URL
const urlsToInvalidate = [
  'https://zhixing-seven.vercel.app/',
  'https://zhixing-seven.vercel.app/sales/commission',
  'https://zhixing-seven.vercel.app/admin/sales',
  'https://zhixing-seven.vercel.app/api/primary-sales',
  'https://zhixing-seven.vercel.app/api/admin',
  'https://zhixing-seven.vercel.app/api/sales'
];

console.log('🔄 开始强制清理Vercel缓存...');
console.log('📋 清理原因: 佣金比率计算逻辑重大升级');

async function clearCacheForUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`🧹 清理缓存: ${url}`);
    
    const options = {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ 缓存清理完成: ${url} (状态: ${res.statusCode})`);
        resolve({ url, status: res.statusCode, success: true });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 缓存清理失败: ${url} - ${error.message}`);
      resolve({ url, error: error.message, success: false });
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ 缓存清理超时: ${url}`);
      req.destroy();
      resolve({ url, error: 'timeout', success: false });
    });
    
    req.end();
  });
}

async function clearAllCaches() {
  console.log(`\n🎯 开始清理 ${urlsToInvalidate.length} 个URL的缓存...\n`);
  
  const results = [];
  
  for (const url of urlsToInvalidate) {
    const result = await clearCacheForUrl(url);
    results.push(result);
    
    // 每个请求之间间隔500ms，避免过于频繁
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 缓存清理总结:');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`总计URL: ${results.length}`);
  console.log(`清理成功: ${successful}`);
  console.log(`清理失败: ${failed}`);
  console.log(`成功率: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ 失败的URL:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.url}: ${r.error}`);
    });
  }
  
  console.log('\n🎉 Vercel缓存清理完成！');
  console.log('💡 佣金比率计算逻辑修改已生效，请验证功能！');
  
  return results;
}

// 执行缓存清理
clearAllCaches().catch(console.error);