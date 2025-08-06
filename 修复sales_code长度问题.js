// 修复 sales_code 长度超限问题
const https = require('https');

async function analyzeSalesCodeIssue() {
  console.log('🔍 分析 sales_code 长度问题...\n');
  
  // 1. 当前格式分析
  console.log('1️⃣ 当前销售代码格式分析:');
  
  const tempId = Date.now();
  const currentFormat = `PS${String(tempId).padStart(6, '0')}${Date.now().toString(36).slice(-8).toUpperCase()}`;
  console.log(`   当前格式: ${currentFormat}`);
  console.log(`   当前长度: ${currentFormat.length} 字符`);
  console.log(`   数据库限制: VARCHAR(16) = 16字符`);
  console.log(`   ❌ 超出限制: ${currentFormat.length - 16} 字符`);
  
  // 2. 建议的新格式
  console.log('\n2️⃣ 建议的新格式:');
  
  const shortFormat1 = `PS${tempId.toString(36).slice(-8).toUpperCase()}`;
  const shortFormat2 = `P${tempId.toString(36).slice(-10).toUpperCase()}`;
  const shortFormat3 = `${tempId.toString(36).slice(-12).toUpperCase()}`;
  
  console.log(`   格式1: ${shortFormat1} (长度: ${shortFormat1.length})`);
  console.log(`   格式2: ${shortFormat2} (长度: ${shortFormat2.length})`);
  console.log(`   格式3: ${shortFormat3} (长度: ${shortFormat3.length})`);
  
  // 3. 测试线上当前问题
  console.log('\n3️⃣ 测试线上当前问题:');
  
  const testData = {
    wechat_name: 'test_length_' + Date.now(),
    payment_method: 'alipay',
    payment_address: 'test123'
  };
  
  const result = await makeRequest(
    'https://zhixing-seven.vercel.app/api/primary-sales?path=create',
    'POST',
    JSON.stringify(testData)
  );
  
  console.log(`   测试结果: ${result.success ? '✅成功' : '❌失败'}`);
  if (!result.success) {
    console.log(`   错误信息: ${result.message}`);
    if (result.debug?.message?.includes('Data too long')) {
      console.log('   ✅ 确认是字段长度问题');
    }
  }
  
  // 4. 推荐解决方案
  console.log('\n4️⃣ 推荐解决方案:');
  console.log('   方案A: 改短销售代码格式 (快速修复)');
  console.log('     - 从 23字符 改为 <= 16字符');
  console.log('     - 立即生效，不需要修改数据库');
  console.log('');
  console.log('   方案B: 扩大数据库字段长度 (彻底解决)');
  console.log('     - VARCHAR(16) 改为 VARCHAR(32)');
  console.log('     - 需要数据库迁移，但更安全');
  console.log('');
  console.log('   推荐: 先执行方案A快速修复，再执行方案B确保长期稳定');
}

// HTTP请求函数
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AnalysisScript/1.0'
      }
    };

    if (data && method !== 'GET') {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          resolve({ 
            success: false, 
            message: '解析响应失败',
            raw: responseData.substring(0, 200)
          });
        }
      });
    });

    req.on('error', () => {
      resolve({ success: false, message: '网络请求失败' });
    });

    if (data && method !== 'GET') {
      req.write(data);
    }
    req.end();
  });
}

// 执行分析
analyzeSalesCodeIssue();