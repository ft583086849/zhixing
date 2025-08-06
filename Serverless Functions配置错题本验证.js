// Serverless Functions配置错题本验证
// 验证手动添加functions配置是否正确

const fs = require('fs');

// 错题本验证项目
const checkpoints = [
  {
    id: 1,
    name: "functions配置语法检查",
    test: () => checkFunctionsConfig(),
    expected: "functions配置格式正确",
    correct: false,
    error: ""
  },
  {
    id: 2,
    name: "runtime版本验证",
    test: () => checkRuntimeVersion(),
    expected: "使用nodejs18.x运行时",
    correct: false,
    error: ""
  },
  {
    id: 3,
    name: "API路径匹配检查",
    test: () => checkAPIPathMatch(),
    expected: "api/*.js能匹配实际API文件",
    correct: false,
    error: ""
  },
  {
    id: 4,
    name: "API文件导出格式验证",
    test: () => checkAPIExportFormat(),
    expected: "API文件使用正确的export default",
    correct: false,
    error: ""
  },
  {
    id: 5,
    name: "配置兼容性检查",
    test: () => checkConfigCompatibility(),
    expected: "vercel.json配置无冲突",
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
function checkFunctionsConfig() {
  try {
    const config = readVercelConfig();
    
    if (!config.functions) {
      throw new Error("缺少functions配置");
    }
    
    if (!config.functions['api/*.js']) {
      throw new Error("缺少api/*.js配置");
    }
    
    return true;
  } catch (error) {
    throw new Error(`functions配置检查失败: ${error.message}`);
  }
}

function checkRuntimeVersion() {
  const config = readVercelConfig();
  const runtime = config.functions['api/*.js'].runtime;
  
  if (runtime !== 'nodejs18.x') {
    throw new Error(`runtime应该是nodejs18.x，当前是: ${runtime}`);
  }
  
  return true;
}

function checkAPIPathMatch() {
  try {
    // 检查api目录下的.js文件
    const apiFiles = fs.readdirSync('api').filter(file => file.endsWith('.js'));
    
    if (apiFiles.length === 0) {
      throw new Error("api目录下没有找到.js文件");
    }
    
    console.log(`   找到 ${apiFiles.length} 个API文件: ${apiFiles.slice(0, 3).join(', ')}...`);
    return true;
  } catch (error) {
    throw new Error(`API路径匹配检查失败: ${error.message}`);
  }
}

function checkAPIExportFormat() {
  try {
    // 检查admin.js的导出格式
    const adminContent = fs.readFileSync('api/admin.js', 'utf8');
    
    if (!adminContent.includes('export default')) {
      throw new Error("admin.js缺少export default");
    }
    
    if (!adminContent.includes('async function handler')) {
      throw new Error("admin.js缺少handler函数");
    }
    
    // 检查auth.js的导出格式
    const authContent = fs.readFileSync('api/auth.js', 'utf8');
    
    if (!authContent.includes('export default')) {
      throw new Error("auth.js缺少export default");
    }
    
    return true;
  } catch (error) {
    throw new Error(`API导出格式检查失败: ${error.message}`);
  }
}

function checkConfigCompatibility() {
  try {
    const config = readVercelConfig();
    
    // 检查是否有冲突的配置
    const hasValidRewrites = config.rewrites && config.rewrites.length > 0;
    const hasValidFunctions = config.functions && Object.keys(config.functions).length > 0;
    const hasValidBuild = config.buildCommand && config.outputDirectory;
    
    if (!hasValidRewrites) {
      throw new Error("缺少有效的rewrites配置");
    }
    
    if (!hasValidFunctions) {
      throw new Error("缺少有效的functions配置");
    }
    
    if (!hasValidBuild) {
      throw new Error("缺少有效的构建配置");
    }
    
    return true;
  } catch (error) {
    throw new Error(`配置兼容性检查失败: ${error.message}`);
  }
}

// 主验证函数
async function runServerlessFunctionsValidation() {
  console.log("🔍 开始Serverless Functions配置错题本验证...");
  console.log("📋 验证目标: 手动添加functions配置解决API 404问题");
  console.log("🎯 预期: 明确指定Serverless Functions运行时\n");

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
  
  console.log("📊 Serverless Functions配置错题本验证结果:");
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

  console.log("\n🎯 Serverless Functions配置错题本验证完成!");
  
  if (successRate >= 80) {
    console.log("✅ 验证通过，可以推送部署!");
    console.log("🚀 建议执行部署命令:");
    console.log("git add vercel.json && git commit -m '🔧 添加Serverless Functions配置' && git push origin main");
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
runServerlessFunctionsValidation().catch(console.error);