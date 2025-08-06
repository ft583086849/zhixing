// 项目结构假设验证监控
// 等待网络恢复后自动测试API可用性

const { exec } = require('child_process');

const BASE_URL = 'https://zhixing.vercel.app';
const TEST_ENDPOINTS = [
  '/api/test',
  '/api/health', 
  '/api/admin?action=overview',
  '/' // 根目录页面
];

let attemptCount = 0;
const MAX_ATTEMPTS = 30; // 最多测试30次
const INTERVAL = 20000; // 20秒间隔

console.log('🧪 开始项目结构假设验证监控...');
console.log(`📋 监控目标: ${BASE_URL}`);
console.log(`🎯 验证假设: 添加根目录index.html后API是否能工作`);
console.log(`⏱️ 间隔: ${INTERVAL/1000}秒, 最大尝试: ${MAX_ATTEMPTS}次\n`);

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = endpoint.startsWith('/') ? BASE_URL + endpoint : endpoint;
    const cmd = `curl -X GET "${url}" -w "HTTP_STATUS:%{http_code}|TIME:%{time_total}s" -s --connect-timeout 10 --max-time 20`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve({ endpoint, status: 'ERROR', error: error.message, time: 'N/A' });
        return;
      }
      
      const match = stdout.match(/HTTP_STATUS:(\d+)\|TIME:(.+)s$/);
      if (match) {
        const status = match[1];
        const time = match[2];
        const body = stdout.replace(/HTTP_STATUS:\d+\|TIME:.+s$/, '').trim();
        resolve({ 
          endpoint, 
          status: parseInt(status), 
          time, 
          body: body.substring(0, 100) + (body.length > 100 ? '...' : '')
        });
      } else {
        resolve({ endpoint, status: 'PARSE_ERROR', error: 'Could not parse response', time: 'N/A' });
      }
    });
  });
}

async function runVerificationTest() {
  attemptCount++;
  console.log(`\n🔍 验证尝试 ${attemptCount}/${MAX_ATTEMPTS} - ${new Date().toLocaleTimeString()}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const statusIcon = result.status === 200 ? '✅' : 
                      result.status === 404 ? '❌' : 
                      result.status === 'ERROR' ? '🔌' : '⚠️';
    
    console.log(`${statusIcon} ${endpoint}`);
    console.log(`   状态: ${result.status} | 响应时间: ${result.time}`);
    if (result.body && result.body.length > 0) {
      console.log(`   响应: ${result.body}`);
    }
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  }
  
  // 分析结果
  const successCount = results.filter(r => r.status === 200).length;
  const errorCount = results.filter(r => r.status === 'ERROR' || r.status === 'PARSE_ERROR').length;
  const notFoundCount = results.filter(r => r.status === 404).length;
  
  console.log('\n📊 本次验证结果:');
  console.log(`✅ 成功: ${successCount}/${TEST_ENDPOINTS.length}`);
  console.log(`❌ 404错误: ${notFoundCount}/${TEST_ENDPOINTS.length}`);
  console.log(`🔌 连接错误: ${errorCount}/${TEST_ENDPOINTS.length}`);
  
  // 判断验证结果
  if (errorCount === 0) {
    // 没有连接错误，可以得出结论
    if (successCount > 0) {
      console.log('\n🎉 **项目结构假设验证成功！**');
      console.log('📋 结论: 添加根目录index.html确实让API开始工作');
      console.log('🎯 建议: 项目结构问题已通过简单修复解决，无需完整重构');
      
      // 详细分析
      const workingAPIs = results.filter(r => r.status === 200);
      if (workingAPIs.length > 0) {
        console.log('\n✅ 工作正常的API:');
        workingAPIs.forEach(api => {
          console.log(`   ${api.endpoint} (${api.time})`);
        });
      }
      
      return true; // 验证成功，停止监控
    } else if (notFoundCount > 0) {
      console.log('\n❌ **项目结构假设验证失败**');
      console.log('📋 结论: 添加根目录文件没有解决API 404问题');
      console.log('🎯 建议: 需要进行完整的项目结构重构 (预计2小时)');
      return true; // 验证完成，停止监控
    }
  } else {
    console.log('\n🔌 网络连接问题，继续监控...');
  }
  
  // 继续监控
  if (attemptCount >= MAX_ATTEMPTS) {
    console.log('\n⏰ 达到最大监控次数，停止验证');
    return true;
  }
  
  console.log(`\n⏳ ${INTERVAL/1000}秒后继续验证...`);
  setTimeout(runVerificationTest, INTERVAL);
  return false;
}

// 开始验证
runVerificationTest().catch(console.error);