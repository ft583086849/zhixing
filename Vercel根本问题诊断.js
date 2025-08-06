// Vercel根本问题诊断 - 逐个验证3大问题
const fs = require('fs');
const path = require('path');

console.log('🔍 开始Vercel根本问题诊断...');
console.log('📋 验证3大根本问题：');
console.log('1. 构建过程问题：API文件未正确复制到部署环境');
console.log('2. 运行时环境不支持ES6模块');
console.log('3. 项目结构不符合Vercel标准\n');

let diagnostics = {
  buildProcess: { issues: [], score: 0 },
  es6Runtime: { issues: [], score: 0 },
  projectStructure: { issues: [], score: 0 }
};

// ============= 问题1: 构建过程诊断 =============
console.log('🔧 **问题1: 构建过程诊断**');

// 1.1 检查vercel.json构建配置
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  console.log('📋 vercel.json构建配置:');
  console.log(`  buildCommand: "${vercelConfig.buildCommand}"`);
  console.log(`  outputDirectory: "${vercelConfig.outputDirectory}"`);
  console.log(`  installCommand: "${vercelConfig.installCommand}"`);
  
  // 检查是否会影响API文件
  if (vercelConfig.buildCommand && vercelConfig.buildCommand.includes('cd client')) {
    diagnostics.buildProcess.issues.push('构建命令只关注client目录，可能忽略api目录');
  }
  
  if (vercelConfig.outputDirectory === 'client/build') {
    diagnostics.buildProcess.issues.push('输出目录指向client/build，api目录可能被忽略');
  }
  
  // 检查functions配置
  if (vercelConfig.functions) {
    console.log(`  functions配置: ${JSON.stringify(vercelConfig.functions)}`);
    if (vercelConfig.functions['api/*.js']) {
      diagnostics.buildProcess.score += 25;
      console.log('  ✅ 有functions配置指向api/*.js');
    }
  } else {
    diagnostics.buildProcess.issues.push('缺少functions配置，Vercel可能不知道如何处理api目录');
  }
  
} catch (e) {
  diagnostics.buildProcess.issues.push(`vercel.json读取失败: ${e.message}`);
}

// 1.2 检查API目录结构
console.log('\n📁 API目录结构检查:');
try {
  const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
  console.log(`  发现API文件: ${apiFiles.join(', ')}`);
  
  if (apiFiles.length > 0) {
    diagnostics.buildProcess.score += 25;
    console.log('  ✅ API文件存在于正确位置');
  }
  
  // 检查是否有package.json在api目录
  const hasApiPackage = fs.existsSync('api/package.json');
  if (hasApiPackage) {
    console.log('  ⚠️  api/目录有独立package.json，可能导致构建混乱');
    diagnostics.buildProcess.issues.push('api目录有独立package.json');
  } else {
    diagnostics.buildProcess.score += 25;
    console.log('  ✅ api目录无独立package.json');
  }
  
} catch (e) {
  diagnostics.buildProcess.issues.push(`API目录检查失败: ${e.message}`);
}

// ============= 问题2: ES6运行时环境诊断 =============
console.log('\n🚀 **问题2: ES6运行时环境诊断**');

// 2.1 检查Node.js版本配置
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.functions && vercelConfig.functions['api/*.js'] && vercelConfig.functions['api/*.js'].runtime) {
    const runtime = vercelConfig.functions['api/*.js'].runtime;
    console.log(`📋 配置的运行时: ${runtime}`);
    
    if (runtime.includes('nodejs18') || runtime.includes('nodejs20')) {
      diagnostics.es6Runtime.score += 30;
      console.log('  ✅ 运行时支持ES6模块');
    } else {
      diagnostics.es6Runtime.issues.push(`运行时版本过低: ${runtime}`);
    }
  } else {
    diagnostics.es6Runtime.issues.push('未指定运行时版本');
  }
} catch (e) {
  diagnostics.es6Runtime.issues.push(`运行时配置检查失败: ${e.message}`);
}

// 2.2 检查API文件的模块格式
console.log('\n📄 API文件模块格式检查:');
try {
  const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
  
  for (const file of apiFiles.slice(0, 3)) { // 只检查前3个
    const content = fs.readFileSync(`api/${file}`, 'utf8');
    const hasImport = content.includes('import ');
    const hasRequire = content.includes('require(');
    const hasExportDefault = content.includes('export default');
    const hasModuleExports = content.includes('module.exports');
    
    console.log(`  ${file}:`);
    console.log(`    import语句: ${hasImport ? '✅' : '❌'}`);
    console.log(`    export default: ${hasExportDefault ? '✅' : '❌'}`);
    console.log(`    require语句: ${hasRequire ? '⚠️' : '❌'}`);
    console.log(`    module.exports: ${hasModuleExports ? '⚠️' : '❌'}`);
    
    if (hasImport && hasExportDefault && !hasRequire && !hasModuleExports) {
      diagnostics.es6Runtime.score += 20;
      console.log(`    ✅ ${file} 使用纯ES6格式`);
    } else if (hasImport && hasRequire) {
      diagnostics.es6Runtime.issues.push(`${file} 混用ES6和CommonJS`);
    }
  }
} catch (e) {
  diagnostics.es6Runtime.issues.push(`API文件检查失败: ${e.message}`);
}

// 2.3 检查package.json的type字段
console.log('\n📦 package.json模块类型检查:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.type === 'module') {
    diagnostics.es6Runtime.score += 20;
    console.log('  ✅ package.json设置type: "module"');
  } else {
    console.log('  ⚠️  package.json未设置type: "module"');
    diagnostics.es6Runtime.issues.push('package.json未明确声明ES6模块');
  }
} catch (e) {
  diagnostics.es6Runtime.issues.push(`package.json检查失败: ${e.message}`);
}

// ============= 问题3: 项目结构诊断 =============
console.log('\n🏗️  **问题3: 项目结构诊断**');

// 3.1 分析当前项目结构
console.log('📋 当前项目结构分析:');
console.log('根目录文件:');
try {
  const rootFiles = fs.readdirSync('.').filter(f => !f.startsWith('.')).sort();
  rootFiles.forEach(f => {
    const isDir = fs.statSync(f).isDirectory();
    console.log(`  ${isDir ? '📁' : '📄'} ${f}`);
  });
  
  // 检查关键目录
  const hasClient = fs.existsSync('client') && fs.statSync('client').isDirectory();
  const hasApi = fs.existsSync('api') && fs.statSync('api').isDirectory();
  const hasPublic = fs.existsSync('public') && fs.statSync('public').isDirectory();
  const hasSrc = fs.existsSync('src') && fs.statSync('src').isDirectory();
  
  console.log('\n🔍 结构分析:');
  console.log(`  client/ 目录: ${hasClient ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`  api/ 目录: ${hasApi ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`  public/ 目录: ${hasPublic ? '⚠️  存在（可能与client/public冲突）' : '✅ 不存在'}`);
  console.log(`  src/ 目录: ${hasSrc ? '⚠️  存在（可能与client/src冲突）' : '✅ 不存在'}`);
  
  // 标准Vercel结构检查
  console.log('\n📏 标准Vercel结构对比:');
  console.log('  标准结构: 前端文件在根目录, API在api/');
  console.log('  当前结构: 前端在client/, API在api/');
  
  if (hasClient && hasApi) {
    diagnostics.projectStructure.issues.push('前端代码在client/子目录，不符合Vercel标准');
    diagnostics.projectStructure.issues.push('Vercel可能无法正确识别项目类型');
    console.log('  ❌ 结构不符合Vercel标准');
  }
  
  // 检查根目录是否有前端相关文件
  const frontendFiles = ['index.html', 'package.json', 'public', 'src', 'build'];
  const rootHasFrontend = frontendFiles.some(f => fs.existsSync(f));
  
  if (!rootHasFrontend && hasClient) {
    diagnostics.projectStructure.score += 0; // 不加分，因为这确实是问题
    console.log('  🔍 根目录缺少前端文件，完全依赖client/目录');
  }
  
} catch (e) {
  diagnostics.projectStructure.issues.push(`项目结构检查失败: ${e.message}`);
}

// 3.2 重构复杂度评估
console.log('\n⏱️ **重构复杂度评估**:');

try {
  // 检查client目录内容
  if (fs.existsSync('client')) {
    const clientFiles = fs.readdirSync('client');
    console.log(`📁 client/目录包含: ${clientFiles.join(', ')}`);
    
    const fileCount = countFilesRecursively('client');
    console.log(`📊 client/目录总文件数: ${fileCount}`);
    
    // 估算重构时间
    let estimatedHours = 0;
    if (fileCount < 50) {
      estimatedHours = 1;
    } else if (fileCount < 200) {
      estimatedHours = 2;
    } else {
      estimatedHours = 4;
    }
    
    console.log(`⏱️ 重构估算时间: ${estimatedHours}小时`);
    console.log('📋 重构步骤:');
    console.log('  1. 将client/内容移到根目录 (30分钟)');
    console.log('  2. 更新package.json和配置文件 (30分钟)');
    console.log('  3. 修复import路径 (1-3小时，取决于文件数量)');
    console.log('  4. 测试和调试 (30分钟)');
  }
} catch (e) {
  console.log(`重构评估失败: ${e.message}`);
}

// ============= 最终诊断报告 =============
console.log('\n📊 **最终诊断报告**:');

const totalIssues = diagnostics.buildProcess.issues.length + 
                   diagnostics.es6Runtime.issues.length + 
                   diagnostics.projectStructure.issues.length;

console.log(`🔍 发现问题总数: ${totalIssues}`);

console.log('\n🔧 问题1 - 构建过程:');
console.log(`  评分: ${diagnostics.buildProcess.score}/100`);
if (diagnostics.buildProcess.issues.length === 0) {
  console.log('  ✅ 无明显问题');
} else {
  diagnostics.buildProcess.issues.forEach(issue => console.log(`  ❌ ${issue}`));
}

console.log('\n🚀 问题2 - ES6运行时:');
console.log(`  评分: ${diagnostics.es6Runtime.score}/100`);
if (diagnostics.es6Runtime.issues.length === 0) {
  console.log('  ✅ 无明显问题');
} else {
  diagnostics.es6Runtime.issues.forEach(issue => console.log(`  ❌ ${issue}`));
}

console.log('\n🏗️ 问题3 - 项目结构:');
console.log(`  评分: ${diagnostics.projectStructure.score}/100`);
if (diagnostics.projectStructure.issues.length === 0) {
  console.log('  ✅ 无明显问题');
} else {
  diagnostics.projectStructure.issues.forEach(issue => console.log(`  ❌ ${issue}`));
}

// 推荐解决方案
console.log('\n🎯 **推荐解决方案优先级**:');

if (diagnostics.projectStructure.issues.length > 0) {
  console.log('🥇 优先级1: 项目结构重构');
  console.log('   这是最根本的问题，可能解决所有API 404问题');
  console.log('   预计时间: 1-4小时');
}

if (diagnostics.buildProcess.issues.length > 0) {
  console.log('🥈 优先级2: 构建过程修复');
  console.log('   相对简单的配置修复');
  console.log('   预计时间: 30分钟');
}

if (diagnostics.es6Runtime.issues.length > 0) {
  console.log('🥉 优先级3: ES6运行时修复');
  console.log('   通过配置调整解决');
  console.log('   预计时间: 15分钟');
}

// 辅助函数
function countFilesRecursively(dir) {
  let count = 0;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        if (item !== 'node_modules' && item !== '.git') {
          count += countFilesRecursively(fullPath);
        }
      } else {
        count++;
      }
    }
  } catch (e) {
    // 忽略权限错误等
  }
  return count;
}

console.log('\n🎯 诊断完成!');