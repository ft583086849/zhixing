/**
 * 诊断销售注册页面加载慢的问题
 * 
 * 使用方法：
 * 1. 在注册页面打开控制台(F12)
 * 2. 复制粘贴此脚本运行
 */

console.log('🔍 开始诊断页面加载问题...\n');

// 1. 检查URL参数
function checkURLParams() {
  console.log('📋 1. 检查URL参数:');
  const urlParams = new URLSearchParams(window.location.search);
  const registrationCode = urlParams.get('registration_code');
  const salesCode = urlParams.get('sales_code');
  
  console.log('  - registration_code:', registrationCode || '无');
  console.log('  - sales_code:', salesCode || '无');
  console.log('  - 实际使用的代码:', registrationCode || salesCode || '无（独立模式）');
  
  return registrationCode || salesCode;
}

// 2. 检查Supabase连接
async function checkSupabaseConnection() {
  console.log('\n📡 2. 检查Supabase连接:');
  
  try {
    // 检查是否存在supabase客户端
    if (typeof window.supabaseClient === 'undefined' && typeof window.supabase === 'undefined') {
      console.error('  ❌ Supabase客户端未初始化');
      console.log('  💡 建议：刷新页面或检查网络连接');
      return false;
    }
    
    const client = window.supabaseClient || window.supabase;
    console.log('  ✅ Supabase客户端存在');
    
    // 测试简单查询
    console.log('  🔄 测试数据库连接...');
    const startTime = Date.now();
    
    const { data, error } = await client
      .from('primary_sales')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.error('  ❌ 数据库连接失败:', error.message);
      if (error.message.includes('JWT')) {
        console.log('  💡 可能原因：无痕模式缺少认证信息');
      }
      return false;
    }
    
    console.log(`  ✅ 数据库连接正常 (响应时间: ${responseTime}ms)`);
    
    if (responseTime > 3000) {
      console.warn('  ⚠️ 响应时间过长，可能是网络问题');
    }
    
    return true;
  } catch (error) {
    console.error('  ❌ 连接测试异常:', error);
    return false;
  }
}

// 3. 直接测试验证注册码
async function testValidateCode(code) {
  if (!code) {
    console.log('\n📝 3. 跳过注册码验证（独立模式）');
    return;
  }
  
  console.log('\n🔑 3. 测试注册码验证:');
  console.log('  注册码:', code);
  
  try {
    const client = window.supabaseClient || window.supabase;
    if (!client) {
      console.error('  ❌ 无法测试：Supabase客户端不存在');
      return;
    }
    
    console.log('  🔄 查询注册码...');
    const startTime = Date.now();
    
    const { data, error } = await client
      .from('primary_sales')
      .select('id, wechat_name, secondary_registration_code')
      .eq('secondary_registration_code', code)
      .single();
    
    const responseTime = Date.now() - startTime;
    console.log(`  响应时间: ${responseTime}ms`);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.error('  ❌ 注册码不存在或无效');
      } else {
        console.error('  ❌ 查询错误:', error.message);
      }
      return;
    }
    
    if (data) {
      console.log('  ✅ 注册码有效');
      console.log('  关联的一级销售 ID:', data.id);
      console.log('  一级销售微信:', data.wechat_name);
    }
    
  } catch (error) {
    console.error('  ❌ 验证异常:', error);
  }
}

// 4. 检查网络状态
function checkNetworkStatus() {
  console.log('\n🌐 4. 检查网络状态:');
  console.log('  - 在线状态:', navigator.onLine ? '✅ 在线' : '❌ 离线');
  console.log('  - 连接类型:', navigator.connection?.effectiveType || '未知');
  console.log('  - 下行速度:', navigator.connection?.downlink ? `${navigator.connection.downlink} Mbps` : '未知');
  
  if (navigator.connection?.saveData) {
    console.warn('  ⚠️ 流量节省模式开启，可能影响加载速度');
  }
}

// 5. 检查控制台错误
function checkConsoleErrors() {
  console.log('\n🚨 5. 检查控制台错误:');
  
  // 临时捕获错误
  const originalError = console.error;
  let errorCount = 0;
  
  console.error = function(...args) {
    errorCount++;
    console.log('  捕获到错误:', ...args);
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    if (errorCount === 0) {
      console.log('  ✅ 未发现控制台错误');
    } else {
      console.log(`  ⚠️ 发现 ${errorCount} 个错误`);
    }
  }, 1000);
}

// 6. 性能分析
function analyzePerformance() {
  console.log('\n⚡ 6. 性能分析:');
  
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
    const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
    const tcpTime = timing.connectEnd - timing.connectStart;
    
    console.log(`  - 页面总加载时间: ${loadTime}ms`);
    console.log(`  - DOM Ready时间: ${domReadyTime}ms`);
    console.log(`  - DNS查询时间: ${dnsTime}ms`);
    console.log(`  - TCP连接时间: ${tcpTime}ms`);
    
    if (loadTime > 5000) {
      console.warn('  ⚠️ 页面加载时间过长');
    }
  }
}

// 主诊断函数
async function runDiagnosis() {
  console.log('=' * 50);
  
  // 1. URL参数
  const code = checkURLParams();
  
  // 2. Supabase连接
  const connected = await checkSupabaseConnection();
  
  // 3. 注册码验证（如果有）
  if (connected && code) {
    await testValidateCode(code);
  }
  
  // 4. 网络状态
  checkNetworkStatus();
  
  // 5. 控制台错误
  checkConsoleErrors();
  
  // 6. 性能分析
  analyzePerformance();
  
  // 总结
  console.log('\n' + '=' * 50);
  console.log('📊 诊断总结:\n');
  
  const issues = [];
  
  if (!connected) {
    issues.push('❌ 数据库连接问题（无痕模式可能缺少认证）');
  }
  
  if (!navigator.onLine) {
    issues.push('❌ 网络离线');
  }
  
  if (window.performance?.timing?.loadEventEnd - window.performance?.timing?.navigationStart > 5000) {
    issues.push('⚠️ 页面加载缓慢');
  }
  
  if (issues.length > 0) {
    console.log('发现的问题:');
    issues.forEach(issue => console.log('  ' + issue));
    
    console.log('\n💡 建议解决方案:');
    console.log('  1. 尝试在正常模式（非无痕）打开页面');
    console.log('  2. 检查网络连接是否稳定');
    console.log('  3. 清除浏览器缓存后重试');
    console.log('  4. 如果有注册码，确认码是否有效');
  } else {
    console.log('✅ 未发现明显问题');
    console.log('💡 可能是临时网络延迟，建议刷新页面重试');
  }
}

// 自动运行诊断
runDiagnosis();

// 导出函数供手动调用
window.runDiagnosis = runDiagnosis;
window.testValidateCode = testValidateCode;
window.checkSupabaseConnection = checkSupabaseConnection;
