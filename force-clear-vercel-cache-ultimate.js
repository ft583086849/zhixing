/**
 * 强制清除Vercel缓存 - 终极版本
 * 使用多种方式强制清除缓存，确保获取最新部署
 */

const axios = require('axios');
const https = require('https');

console.log('🧹 强制清除Vercel缓存 - 终极版本');
console.log('=' .repeat(50));

const baseURL = 'https://zhixing-seven.vercel.app';
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// 强制清除缓存的URL列表
const cacheUrls = [
  `${baseURL}/`,
  `${baseURL}/sales/commission`,
  `${baseURL}/admin/sales`,
  `${baseURL}/static/js/`,
  `${baseURL}/static/css/`,
  `${baseURL}/manifest.json`
];

async function forceClearAllCache() {
  console.log('🔄 步骤1: 发送强制刷新请求');
  console.log('-' .repeat(30));
  
  for (const url of cacheUrls) {
    try {
      console.log(`📡 清除: ${url}`);
      
      const response = await axios.get(url, {
        httpsAgent,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-None-Match': '*',
          'If-Modified-Since': 'Mon, 01 Jan 1990 00:00:00 GMT',
          'User-Agent': `Mozilla/5.0 Cache-Buster ${Date.now()}`
        },
        timeout: 10000
      });
      
      console.log(`   ✅ 状态: ${response.status}`);
      
      // 等待一下，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`   ⚠️  错误: ${error.message}`);
    }
  }
  
  console.log('\n🔄 步骤2: 验证主页面HTML');
  console.log('-' .repeat(30));
  
  try {
    const response = await axios.get(baseURL, {
      httpsAgent,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'User-Agent': `ForceClearCache-${Date.now()}`
      }
    });
    
    const html = response.data;
    
    // 提取JavaScript文件名
    const jsMatch = html.match(/static\/js\/main\.([a-f0-9]+)\.js/);
    if (jsMatch) {
      const currentHash = jsMatch[1];
      console.log(`📄 当前JS文件哈希: ${currentHash}`);
      
      if (currentHash === '6922a46e') {
        console.log('⚠️  哈希未更新，仍是旧版本');
        
        console.log('\n🔄 步骤3: 直接访问新文件');
        console.log('-' .repeat(30));
        
        // 尝试访问可能的新文件
        const possibleHashes = [
          '498e67a1', '498e67ab', '7c8d9e2f', '8f1a2b3c', 
          'a9b8c7d6', 'f5e4d3c2', '1f2e3d4c', '9e8d7c6b'
        ];
        
        for (const hash of possibleHashes) {
          try {
            const testUrl = `${baseURL}/static/js/main.${hash}.js`;
            await axios.head(testUrl, { httpsAgent, timeout: 3000 });
            console.log(`✅ 找到新文件: main.${hash}.js`);
            return { success: true, newHash: hash };
          } catch (error) {
            // 文件不存在，继续尝试
          }
        }
        
        console.log('❌ 未找到新的JS文件');
        
      } else {
        console.log(`✅ 哈希已更新: ${currentHash}`);
        return { success: true, newHash: currentHash };
      }
    } else {
      console.log('❌ 未找到JS文件引用');
    }
    
  } catch (error) {
    console.log(`❌ 获取主页面失败: ${error.message}`);
  }
  
  console.log('\n🔄 步骤4: 强制触发重新部署');
  console.log('-' .repeat(30));
  
  console.log('💡 建议手动操作:');
  console.log('1. 访问 Vercel Dashboard');
  console.log('2. 找到 zhixing 项目');
  console.log('3. 查看最新的 Deployment 状态');
  console.log('4. 如果状态是 Ready，手动触发 Redeploy');
  
  return { success: false };
}

async function checkCurrentDeploymentStatus() {
  console.log('\n🔍 步骤5: 检查当前部署状态');
  console.log('-' .repeat(30));
  
  try {
    const response = await axios.get(baseURL, {
      httpsAgent,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const html = response.data;
    
    // 检查是否包含React应用
    if (html.includes('react') || html.includes('root')) {
      console.log('✅ React应用正常加载');
    }
    
    // 检查HTML大小
    console.log(`📊 HTML大小: ${(html.length / 1024).toFixed(1)} KB`);
    
    // 检查最后修改时间
    const lastModified = response.headers['last-modified'];
    if (lastModified) {
      console.log(`🕒 最后修改: ${lastModified}`);
    }
    
    // 检查缓存状态
    const cacheControl = response.headers['cache-control'];
    if (cacheControl) {
      console.log(`🗂️  缓存控制: ${cacheControl}`);
    }
    
  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
  }
}

// 主函数
async function runUltimateCacheClear() {
  console.log('🚀 开始终极缓存清除...\n');
  
  const result = await forceClearAllCache();
  await checkCurrentDeploymentStatus();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 缓存清除总结');
  console.log('=' .repeat(50));
  
  if (result.success) {
    console.log(`✅ 缓存清除成功，新哈希: ${result.newHash}`);
    console.log('🎉 可以进行功能验证了！');
  } else {
    console.log('⚠️  缓存清除未完全成功');
    console.log('📝 建议：');
    console.log('1. 等待2-3分钟后重试');
    console.log('2. 检查Vercel部署状态');
    console.log('3. 手动触发重新部署');
  }
  
  console.log('\n💡 用户手动清除缓存:');
  console.log('- Chrome/Edge: Ctrl+Shift+Delete 清除数据');
  console.log('- 或者: Ctrl+Shift+R 强制刷新');
  console.log('- 或者: 开发者工具 > Application > Clear Storage');
}

// 执行清除
runUltimateCacheClear().catch(console.error);