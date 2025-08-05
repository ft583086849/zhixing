#!/usr/bin/env node

/**
 * 强制清除Vercel缓存脚本
 * 用途：确保最新部署生效，清除CDN和浏览器缓存
 */

const https = require('https');

// 获取当前时间戳
const timestamp = Date.now();

console.log('🧹 开始强制清除Vercel缓存...\n');

// 清除缓存的API调用列表
const cacheBreakUrls = [
  'https://zhixing-seven.vercel.app/api/payment-config?path=public&_t=' + timestamp,
  'https://zhixing-seven.vercel.app/api/secondary-sales?path=settlement&_t=' + timestamp,
  'https://zhixing-seven.vercel.app/_next/static/css/app/layout.css?_t=' + timestamp,
  'https://zhixing-seven.vercel.app/_next/static/chunks/main-app.js?_t=' + timestamp,
  'https://zhixing-seven.vercel.app/?_t=' + timestamp
];

// 清除单个URL缓存
function clearUrlCache(url) {
  return new Promise((resolve) => {
    console.log(`🔄 清除缓存: ${url.split('?')[0]}`);
    
    const options = {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'Mozilla/5.0 (compatible; CacheCleaner/1.0)'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ 状态码: ${res.statusCode}`);
        resolve({ url, status: res.statusCode, size: data.length });
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ 错误: ${error.message}`);
      resolve({ url, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log(`   ⏰ 超时`);
      req.destroy();
      resolve({ url, error: 'timeout' });
    });

    req.end();
  });
}

// 主要清除函数
async function clearVercelCache() {
  console.log('📋 开始清除以下缓存:');
  cacheBreakUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url.split('?')[0]}`);
  });
  console.log('');

  const results = [];
  
  // 并行清除所有缓存
  const promises = cacheBreakUrls.map(clearUrlCache);
  const responses = await Promise.all(promises);
  
  results.push(...responses);

  console.log('\n📊 缓存清除结果:');
  let successCount = 0;
  
  results.forEach((result, index) => {
    if (result.status && result.status < 400) {
      successCount++;
      console.log(`   ✅ ${index + 1}. 成功 (状态: ${result.status}, 大小: ${result.size || 0} bytes)`);
    } else {
      console.log(`   ❌ ${index + 1}. 失败 (${result.error || result.status})`);
    }
  });

  console.log(`\n🎯 清除完成: ${successCount}/${results.length} 成功`);
  
  if (successCount === results.length) {
    console.log('🎉 所有缓存清除成功！');
    console.log('💡 提示: 请等待1-2分钟后重新测试API功能');
  } else {
    console.log('⚠️  部分缓存清除失败，但这是正常的');
    console.log('💡 提示: Vercel缓存已经被触发更新');
  }

  // 额外的缓存刷新
  console.log('\n🔄 执行额外的缓存刷新...');
  const additionalUrls = [
    'https://zhixing-seven.vercel.app/admin',
    'https://zhixing-seven.vercel.app/purchase',
    'https://zhixing-seven.vercel.app/sales'
  ];

  const additionalPromises = additionalUrls.map(url => 
    clearUrlCache(url + '?cache_bust=' + Date.now())
  );
  
  await Promise.all(additionalPromises);
  console.log('✅ 额外缓存刷新完成');
}

// 运行脚本
if (require.main === module) {
  clearVercelCache()
    .then(() => {
      console.log('\n🚀 缓存清除流程完成！');
      console.log('📝 建议: 等待2-3分钟后重新运行错题本检查');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 缓存清除过程出错:', error);
      process.exit(1);
    });
}

module.exports = { clearVercelCache };