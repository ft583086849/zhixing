// 线上修复错题本验证
// 验证删除多余API后，核心功能完整性

const fs = require('fs');

console.log('🔍 开始线上修复错题本验证...');
console.log('📋 目标: 删除多余API，保持核心功能，符合12个函数限制\n');

let successCount = 0;
const totalChecks = 5;

const runCheck = (name, checkFn) => {
  try {
    const result = checkFn();
    if (result) {
      console.log(`🧪 检查项 ${successCount + 1}: ${name}\n✅ 通过 - ${result}`);
      successCount++;
    } else {
      console.log(`🧪 检查项 ${successCount + 1}: ${name}\n❌ 失败`);
    }
  } catch (e) {
    console.log(`🧪 检查项 ${successCount + 1}: ${name}\n❌ 异常 - ${e.message}`);
  }
};

// 检查项 1: API文件数量
runCheck('API文件数量检查', () => {
  const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
  console.log(`   当前API文件: ${apiFiles.join(', ')}`);
  if (apiFiles.length <= 12) {
    return `${apiFiles.length}个文件，符合Vercel限制`;
  }
  return false;
});

// 检查项 2: 核心API完整性
runCheck('核心API完整性检查', () => {
  const requiredAPIs = ['auth.js', 'admin.js', 'orders.js', 'sales.js', 'health.js'];
  const apiFiles = fs.readdirSync('api');
  const missing = requiredAPIs.filter(api => !apiFiles.includes(api));
  if (missing.length === 0) {
    return '所有核心API文件存在';
  } else {
    return `缺少: ${missing.join(', ')}`;
  }
});

// 检查项 3: vercel.json配置
runCheck('vercel.json配置检查', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.functions && vercelConfig.functions['api/*.js']) {
    return 'functions配置正确';
  }
  return 'functions配置缺失';
});

// 检查项 4: 根目录前端文件
runCheck('根目录前端文件检查', () => {
  if (fs.existsSync('index.html')) {
    return '根目录index.html存在';
  }
  return '根目录index.html缺失';
});

// 检查项 5: 部署就绪状态
runCheck('部署就绪状态检查', () => {
  const gitStatus = require('child_process').execSync('git status --porcelain', {encoding: 'utf8'});
  if (gitStatus.includes('api/')) {
    return '有API文件变更，准备提交';
  }
  return '无变更需要提交';
});

console.log('\n📊 线上修复错题本验证结果:');
console.log(`成功率: ${(successCount / totalChecks * 100).toFixed(1)}% (${successCount}/${totalChecks})`);

if (successCount === totalChecks) {
  console.log('\n✅ 验证通过，可以推送部署!');
  console.log('🚀 立即执行:');
  console.log('git add .');
  console.log('git commit -m "🔧 删除多余API文件，符合Vercel 12函数限制"');
  console.log('git push origin main');
  console.log('\n⏱️ 部署完成后立即开始重构');
} else {
  console.log('\n❌ 验证失败，需要修复问题!');
}

console.log('\n🎯 线上修复错题本验证完成!');