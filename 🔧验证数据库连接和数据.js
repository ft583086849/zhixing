// Node.js 验证脚本
// 检查数据库连接和数据获取问题

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证数据库连接和数据获取...');

// 1. 检查环境配置
function checkEnvConfig() {
  console.log('\n📋 检查环境配置...');
  
  // 检查是否有环境配置文件
  const envFiles = ['.env', '.env.local', '.env.production'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ 找到环境文件: ${file}`);
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hasSupabase = content.includes('SUPABASE') || content.includes('DB_');
        console.log(`   包含数据库配置: ${hasSupabase ? '是' : '否'}`);
      } catch (e) {
        console.log(`   读取失败: ${e.message}`);
      }
    }
  });
}

// 2. 检查API端点是否存在
function checkAPIEndpoints() {
  console.log('\n🌐 检查API端点...');
  
  const apiDir = path.join(process.cwd(), 'api');
  if (fs.existsSync(apiDir)) {
    console.log('✅ API目录存在');
    const apiFiles = fs.readdirSync(apiDir);
    console.log('API文件:', apiFiles.filter(f => f.endsWith('.js')));
  } else {
    console.log('❌ API目录不存在');
  }
  
  // 检查具体的API文件
  const expectedAPIs = ['orders.js', 'primary-sales.js', 'secondary-sales.js', 'stats.js'];
  expectedAPIs.forEach(api => {
    const apiPath = path.join(apiDir, api);
    if (fs.existsSync(apiPath)) {
      console.log(`✅ ${api} 存在`);
    } else {
      console.log(`❌ ${api} 不存在`);
    }
  });
}

// 3. 检查前端服务配置
function checkServiceConfig() {
  console.log('\n⚙️ 检查服务配置...');
  
  const supabaseServicePath = path.join(process.cwd(), 'client/src/services/supabase.js');
  if (fs.existsSync(supabaseServicePath)) {
    console.log('✅ Supabase服务文件存在');
    try {
      const content = fs.readFileSync(supabaseServicePath, 'utf8');
      
      // 检查关键方法
      const methods = ['getOrders', 'getPrimarySales', 'getSecondarySales', 'getOrderStats'];
      methods.forEach(method => {
        if (content.includes(method)) {
          console.log(`   ✅ ${method} 方法存在`);
        } else {
          console.log(`   ❌ ${method} 方法缺失`);
        }
      });
      
      // 检查Supabase初始化
      if (content.includes('createClient')) {
        console.log('   ✅ Supabase客户端初始化存在');
      } else {
        console.log('   ❌ Supabase客户端初始化缺失');
      }
      
    } catch (e) {
      console.log(`   读取服务文件失败: ${e.message}`);
    }
  } else {
    console.log('❌ Supabase服务文件不存在');
  }
}

// 4. 分析可能的问题
function analyzePossibleIssues() {
  console.log('\n🎯 可能的问题分析:');
  console.log('');
  console.log('【数据概览显示0的可能原因】');
  console.log('1. Supabase连接配置错误 (API密钥、URL)');
  console.log('2. 数据库表权限设置问题 (RLS策略)');
  console.log('3. API调用失败但前端没有错误提示');
  console.log('4. Redux状态更新失败');
  console.log('5. 缓存导致的旧数据');
  console.log('');
  console.log('【销售管理数据为空的可能原因】');
  console.log('1. primary_sales 和 secondary_sales 表确实为空');
  console.log('2. API路由不存在或返回错误');
  console.log('3. 数据关联逻辑错误');
  console.log('4. 前端Redux处理逻辑错误');
  console.log('5. CORS或认证问题');
}

// 5. 生成修复建议
function generateFixSuggestions() {
  console.log('\n🔧 修复建议:');
  console.log('');
  console.log('【立即检查】');
  console.log('1. 在浏览器开发者工具中查看Network请求');
  console.log('2. 查看Console中的错误信息');
  console.log('3. 验证Supabase Dashboard中是否有数据');
  console.log('4. 检查API密钥权限设置');
  console.log('');
  console.log('【代码验证】');
  console.log('1. 在浏览器控制台执行: localStorage.clear() && location.reload()');
  console.log('2. 检查Redux DevTools中的action和state');
  console.log('3. 手动调用API测试: fetch("/api/orders").then(r=>r.json()).then(console.log)');
  console.log('4. 验证数据库字段是否与代码期望一致');
}

// 执行检查
checkEnvConfig();
checkAPIEndpoints();
checkServiceConfig();
analyzePossibleIssues();
generateFixSuggestions();

console.log('\n✨ 验证完成！请根据上述结果排查问题。');
console.log('💡 建议优先检查浏览器Network面板中的API请求状态。');
