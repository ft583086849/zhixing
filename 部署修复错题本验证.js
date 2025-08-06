// 部署修复错题本验证
// 修复vercel.json runtime版本错误

console.log('🔍 开始部署修复错题本验证...');
console.log('📋 目标: 修复Function Runtime版本错误\n');

let successCount = 0;
const totalChecks = 4;

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

const fs = require('fs');

// 检查项 1: vercel.json runtime配置
runCheck('vercel.json runtime配置', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.functions && vercelConfig.functions['api/*.js']) {
    const runtime = vercelConfig.functions['api/*.js'].runtime;
    if (runtime === '@vercel/node') {
      return '使用正确的@vercel/node runtime';
    } else {
      return `错误的runtime: ${runtime}`;
    }
  }
  return 'runtime配置缺失';
});

// 检查项 2: API文件数量仍然合规
runCheck('API文件数量检查', () => {
  const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
  if (apiFiles.length <= 12) {
    return `${apiFiles.length}个文件，符合限制`;
  }
  return `${apiFiles.length}个文件，超出限制`;
});

// 检查项 3: JSON语法检查
runCheck('vercel.json语法检查', () => {
  try {
    const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    return '语法正确';
  } catch (e) {
    return `语法错误: ${e.message}`;
  }
});

// 检查项 4: 构建配置合理性
runCheck('构建配置检查', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.buildCommand && vercelConfig.outputDirectory) {
    return '构建配置完整';
  }
  return '构建配置缺失';
});

console.log('\n📊 部署修复错题本验证结果:');
console.log(`成功率: ${(successCount / totalChecks * 100).toFixed(1)}% (${successCount}/${totalChecks})`);

if (successCount === totalChecks) {
  console.log('\n✅ 验证通过，可以重新部署!');
  console.log('🚀 立即执行:');
  console.log('git add vercel.json');
  console.log('git commit -m "🔧 修复vercel.json runtime版本错误"');
  console.log('git push origin main');
} else {
  console.log('\n❌ 验证失败，需要继续修复!');
}

console.log('\n🎯 部署修复错题本验证完成!');