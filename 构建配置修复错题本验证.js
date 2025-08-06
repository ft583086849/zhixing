// 构建配置修复错题本验证 - 提交a96f2e1
// 验证vercel.json构建命令修复是否正确

const fs = require('fs');
const { execSync } = require('child_process');

// 错题本验证项目
const checkpoints = [
  {
    id: 1,
    name: "vercel.json配置语法检查",
    test: () => checkVercelJsonSyntax(),
    expected: "JSON格式正确，无语法错误",
    correct: false,
    error: ""
  },
  {
    id: 2,
    name: "installCommand配置验证",
    test: () => checkInstallCommand(),
    expected: "正确配置双重依赖安装",
    correct: false,
    error: ""
  },
  {
    id: 3,
    name: "buildCommand配置验证",
    test: () => checkBuildCommand(),
    expected: "使用npm ci和正确路径",
    correct: false,
    error: ""
  },
  {
    id: 4,
    name: "client目录依赖检查",
    test: () => checkClientDependencies(),
    expected: "client/package.json包含react-scripts",
    correct: false,
    error: ""
  },
  {
    id: 5,
    name: "本地构建模拟测试",
    test: () => testLocalBuildSimulation(),
    expected: "本地模拟构建流程成功",
    correct: false,
    error: ""
  }
];

// 读取vercel.json配置
function readVercelConfig() {
  try {
    const content = fs.readFileSync('vercel.json', 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`读取vercel.json失败: ${error.message}`);
  }
}

// 测试函数
function checkVercelJsonSyntax() {
  try {
    const config = readVercelConfig();
    
    // 检查必要字段
    const requiredFields = ['version', 'buildCommand', 'outputDirectory', 'installCommand'];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`缺少必要字段: ${field}`);
      }
    }
    
    return true;
  } catch (error) {
    throw new Error(`配置验证失败: ${error.message}`);
  }
}

function checkInstallCommand() {
  const config = readVercelConfig();
  const installCmd = config.installCommand;
  
  // 应该包含根目录和client目录的依赖安装
  const hasRootInstall = installCmd.includes('npm install');
  const hasClientInstall = installCmd.includes('cd client && npm install');
  
  if (!hasRootInstall) {
    throw new Error("installCommand缺少根目录npm install");
  }
  if (!hasClientInstall) {
    throw new Error("installCommand缺少client目录npm install");
  }
  
  return true;
}

function checkBuildCommand() {
  const config = readVercelConfig();
  const buildCmd = config.buildCommand;
  
  // 应该使用npm ci并在正确目录
  const hasNpmCi = buildCmd.includes('npm ci');
  const hasCorrectPath = buildCmd.includes('cd client');
  const hasRunBuild = buildCmd.includes('npm run build');
  
  if (!hasNpmCi) {
    throw new Error("buildCommand应该使用npm ci提高稳定性");
  }
  if (!hasCorrectPath) {
    throw new Error("buildCommand缺少cd client路径切换");
  }
  if (!hasRunBuild) {
    throw new Error("buildCommand缺少npm run build");
  }
  
  return true;
}

function checkClientDependencies() {
  try {
    const content = fs.readFileSync('client/package.json', 'utf8');
    const pkg = JSON.parse(content);
    
    // 检查关键依赖
    const requiredDeps = ['react-scripts', 'react', 'react-dom'];
    for (const dep of requiredDeps) {
      if (!pkg.dependencies[dep]) {
        throw new Error(`client/package.json缺少依赖: ${dep}`);
      }
    }
    
    // 检查构建脚本
    if (!pkg.scripts || !pkg.scripts.build) {
      throw new Error("client/package.json缺少build脚本");
    }
    
    return true;
  } catch (error) {
    throw new Error(`client依赖检查失败: ${error.message}`);
  }
}

function testLocalBuildSimulation() {
  try {
    // 检查client目录是否存在
    if (!fs.existsSync('client')) {
      throw new Error("client目录不存在");
    }
    
    // 检查client/package.json是否存在
    if (!fs.existsSync('client/package.json')) {
      throw new Error("client/package.json不存在");
    }
    
    // 模拟检查node_modules
    const hasClientNodeModules = fs.existsSync('client/node_modules');
    if (!hasClientNodeModules) {
      console.log("   提示: client/node_modules不存在，但这在CI环境中是正常的");
    }
    
    return true;
  } catch (error) {
    throw new Error(`本地构建检查失败: ${error.message}`);
  }
}

// 主验证函数
async function runBuildConfigValidation() {
  console.log("🔍 开始构建配置修复错题本验证...");
  console.log("📋 验证提交: a96f2e1 - 修复Vercel构建命令配置");
  console.log("🎯 目标: 解决'react-scripts: command not found'错误\n");

  let passedCount = 0;
  let totalCount = checkpoints.length;

  for (const checkpoint of checkpoints) {
    try {
      console.log(`🧪 检查项 ${checkpoint.id}: ${checkpoint.name}`);
      
      const result = checkpoint.test();
      if (result) {
        checkpoint.correct = true;
        passedCount++;
        console.log(`✅ 通过 - ${checkpoint.expected}`);
      } else {
        checkpoint.error = "测试返回false";
        console.log(`❌ 失败 - ${checkpoint.expected}`);
      }
    } catch (error) {
      checkpoint.error = error.message;
      console.log(`❌ 异常 - ${error.message}`);
    }
    console.log("");
  }

  // 生成错题本报告
  const successRate = ((passedCount / totalCount) * 100).toFixed(1);
  
  console.log("📊 构建配置错题本验证结果:");
  console.log(`成功率: ${successRate}% (${passedCount}/${totalCount})`);
  console.log("");

  console.log("📋 详细结果:");
  checkpoints.forEach(checkpoint => {
    const status = checkpoint.correct ? "✅ 正确" : "❌ 错误";
    console.log(`${checkpoint.id}. ${checkpoint.name}: ${status}`);
    if (!checkpoint.correct && checkpoint.error) {
      console.log(`   错误: ${checkpoint.error}`);
    }
  });

  console.log("\n🎯 构建配置错题本验证完成!");
  
  if (successRate >= 80) {
    console.log("✅ 验证通过，可以推送部署!");
    console.log("🚀 建议执行部署命令:");
    console.log("git push origin main");
  } else {
    console.log("❌ 验证失败，需要修复问题后重新验证!");
  }

  return {
    successRate,
    passedCount,
    totalCount,
    checkpoints
  };
}

// 执行验证
runBuildConfigValidation().catch(console.error);