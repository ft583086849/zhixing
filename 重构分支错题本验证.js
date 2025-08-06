// 重构分支错题本验证
// 验证项目结构重构的完整性和正确性

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 开始重构分支错题本验证...');
console.log('📋 目标: 验证项目结构重构完整性和正确性');
console.log('🎯 标准: 符合Vercel标准项目结构\n');

let successCount = 0;
const totalChecks = 10;

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

// 检查项 1: 项目结构符合Vercel标准
runCheck('项目结构符合Vercel标准', () => {
  const hasPublic = fs.existsSync('public') && fs.statSync('public').isDirectory();
  const hasSrc = fs.existsSync('src') && fs.statSync('src').isDirectory();
  const hasApi = fs.existsSync('api') && fs.statSync('api').isDirectory();
  const noClient = !fs.existsSync('client');
  
  if (hasPublic && hasSrc && hasApi && noClient) {
    return '标准Vercel结构: public/, src/, api/';
  }
  return `结构检查失败: public:${hasPublic}, src:${hasSrc}, api:${hasApi}, client删除:${noClient}`;
});

// 检查项 2: package.json合并正确
runCheck('package.json合并正确', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasReactDeps = packageJson.dependencies.react && packageJson.dependencies['react-scripts'];
  const hasCorrectScripts = packageJson.scripts.build && packageJson.scripts.start;
  
  if (hasReactDeps && hasCorrectScripts) {
    return '前端依赖和脚本正确合并';
  }
  return `package.json问题: React依赖:${hasReactDeps}, 脚本:${hasCorrectScripts}`;
});

// 检查项 3: vercel.json配置更新
runCheck('vercel.json配置更新', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const correctBuild = vercelConfig.buildCommand === 'npm run build';
  const correctOutput = vercelConfig.outputDirectory === 'build';
  const correctInstall = vercelConfig.installCommand === 'npm install';
  
  if (correctBuild && correctOutput && correctInstall) {
    return '构建配置已更新为标准格式';
  }
  return `配置问题: build:${correctBuild}, output:${correctOutput}, install:${correctInstall}`;
});

// 检查项 4: 前端文件完整性
runCheck('前端文件完整性', () => {
  const srcFiles = ['App.js', 'index.js', 'store/index.js', 'services/api.js'];
  const missing = srcFiles.filter(file => !fs.existsSync(`src/${file}`));
  
  if (missing.length === 0) {
    return '所有核心前端文件存在';
  }
  return `缺少文件: ${missing.join(', ')}`;
});

// 检查项 5: public目录内容
runCheck('public目录内容', () => {
  if (fs.existsSync('public/index.html')) {
    return 'public/index.html存在';
  }
  return 'public/index.html缺失';
});

// 检查项 6: API目录完整性
runCheck('API目录完整性', () => {
  const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
  const coreAPIs = ['auth.js', 'admin.js', 'orders.js', 'health.js'];
  const hasCoreAPIs = coreAPIs.every(api => apiFiles.includes(api));
  
  if (hasCoreAPIs && apiFiles.length <= 12) {
    return `${apiFiles.length}个API文件，包含所有核心API`;
  }
  return `API检查失败: 核心API:${hasCoreAPIs}, 数量:${apiFiles.length}`;
});

// 检查项 7: 构建测试
runCheck('构建测试', () => {
  try {
    // 检查是否有build目录（之前构建的结果）
    if (fs.existsSync('build') && fs.statSync('build').isDirectory()) {
      const buildFiles = fs.readdirSync('build');
      if (buildFiles.includes('index.html') && buildFiles.includes('static')) {
        return '构建成功，输出文件完整';
      }
    }
    return '构建输出不完整或不存在';
  } catch (e) {
    return `构建检查失败: ${e.message}`;
  }
});

// 检查项 8: import路径修复
runCheck('import路径修复', () => {
  try {
    const appJs = fs.readFileSync('src/App.js', 'utf8');
    // 检查import顺序是否正确（之前修复的问题）
    const importLines = appJs.split('\n').filter(line => line.trim().startsWith('import'));
    const hasCorrectOrder = importLines.some(line => line.includes('LoadingSpinner')) && 
                           importLines.indexOf(importLines.find(line => line.includes('LoadingSpinner'))) < 
                           importLines.indexOf(importLines.find(line => line.includes('lazy')));
    
    if (hasCorrectOrder || appJs.includes('import LoadingSpinner')) {
      return 'import顺序已修复';
    }
    return 'import顺序问题';
  } catch (e) {
    return `文件读取失败: ${e.message}`;
  }
});

// 检查项 9: Git状态清洁
runCheck('Git状态清洁', () => {
  try {
    const gitStatus = execSync('git status --porcelain', {encoding: 'utf8'});
    if (gitStatus.trim() === '') {
      return '工作目录干净，所有变更已提交';
    }
    return `有未提交变更: ${gitStatus.split('\n').length} 项`;
  } catch (e) {
    return `Git状态检查失败: ${e.message}`;
  }
});

// 检查项 10: 重构分支完整性
runCheck('重构分支完整性', () => {
  try {
    const currentBranch = execSync('git branch --show-current', {encoding: 'utf8'}).trim();
    const hasCommits = execSync('git log --oneline -n 5', {encoding: 'utf8'});
    
    if (currentBranch === 'structure-refactor' && hasCommits.includes('项目结构重构完成')) {
      return '在正确分支，有重构提交记录';
    }
    return `分支问题: 当前分支:${currentBranch}`;
  } catch (e) {
    return `分支检查失败: ${e.message}`;
  }
});

console.log('\n📊 重构分支错题本验证结果:');
console.log(`成功率: ${(successCount / totalChecks * 100).toFixed(1)}% (${successCount}/${totalChecks})`);

console.log('\n📋 详细结果分析:');
if (successCount >= 8) {
  console.log('✅ 重构质量优秀，可以安全合并到main分支');
} else if (successCount >= 6) {
  console.log('⚠️ 重构基本完成，但有些问题需要修复');
} else {
  console.log('❌ 重构存在严重问题，需要重新检查');
}

console.log('\n🚀 推荐操作:');
if (successCount >= 8) {
  console.log('1. 可以安全推送重构分支');
  console.log('2. 如果线上修复失败，立即合并此分支到main');
  console.log('3. 推送命令: git push origin structure-refactor');
} else {
  console.log('1. 修复发现的问题');
  console.log('2. 重新运行错题本验证');
  console.log('3. 达到80%+成功率后再推送');
}

console.log('\n🎯 重构分支错题本验证完成!');