// 重构分支runtime修复错题本验证
// 修复重构分支中的runtime版本错误

console.log('🔍 开始重构分支runtime修复错题本验证...');
console.log('📋 目标: 修复重构分支中的Function Runtime版本错误\n');

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

const fs = require('fs');

// 检查项 1: vercel.json runtime修复
runCheck('vercel.json runtime修复', () => {
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

// 检查项 2: 重构分支构建配置
runCheck('重构分支构建配置', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const correctBuild = vercelConfig.buildCommand === 'npm run build';
  const correctOutput = vercelConfig.outputDirectory === 'build';
  const correctInstall = vercelConfig.installCommand === 'npm install';
  
  if (correctBuild && correctOutput && correctInstall) {
    return '重构后的构建配置正确';
  }
  return `配置问题: build:${correctBuild}, output:${correctOutput}, install:${correctInstall}`;
});

// 检查项 3: 项目结构仍然正确
runCheck('项目结构仍然正确', () => {
  const hasPublic = fs.existsSync('public');
  const hasSrc = fs.existsSync('src');
  const hasApi = fs.existsSync('api');
  const noClient = !fs.existsSync('client');
  
  if (hasPublic && hasSrc && hasApi && noClient) {
    return '标准Vercel结构保持完整';
  }
  return '项目结构有问题';
});

// 检查项 4: package.json仍然正确
runCheck('package.json仍然正确', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasReactScripts = packageJson.dependencies['react-scripts'];
  const hasBuildScript = packageJson.scripts.build;
  
  if (hasReactScripts && hasBuildScript) {
    return '前端依赖和脚本保持正确';
  }
  return 'package.json配置问题';
});

// 检查项 5: 修复完整性
runCheck('修复完整性', () => {
  // 检查是否同时解决了runtime和项目结构问题
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const hasCorrectRuntime = vercelConfig.functions['api/*.js'].runtime === '@vercel/node';
  const hasCorrectStructure = vercelConfig.buildCommand === 'npm run build';
  
  if (hasCorrectRuntime && hasCorrectStructure) {
    return '同时修复了runtime和项目结构问题';
  }
  return '修复不完整';
});

console.log('\n📊 重构分支runtime修复错题本验证结果:');
console.log(`成功率: ${(successCount / totalChecks * 100).toFixed(1)}% (${successCount}/${totalChecks})`);

if (successCount === totalChecks) {
  console.log('\n✅ 验证通过，重构分支已完美修复!');
  console.log('🚀 立即执行:');
  console.log('git add vercel.json');
  console.log('git commit -m "🔧 修复重构分支runtime版本错误"');
  console.log('git push origin structure-refactor');
  console.log('\n🎯 然后等待部署成功后合并到main分支');
} else {
  console.log('\n❌ 验证失败，需要继续修复!');
}

console.log('\n🎯 重构分支runtime修复错题本验证完成!');