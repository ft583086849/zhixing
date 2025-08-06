// 本地admin.js语法错题本验证 - 提交前检查
// 验证ES6模块语法修复是否正确

const fs = require('fs');
const path = require('path');

// 错题本验证项目
const checkpoints = [
  {
    id: 1,
    name: "ES6模块语法检查",
    test: () => checkES6ModuleSyntax(),
    expected: "使用import/export语法",
    correct: false,
    error: ""
  },
  {
    id: 2,
    name: "函数导出格式",
    test: () => checkExportDefault(),
    expected: "使用export default",
    correct: false,
    error: ""
  },
  {
    id: 3,
    name: "依赖导入检查",
    test: () => checkImportStatements(),
    expected: "使用import语句导入依赖",
    correct: false,
    error: ""
  },
  {
    id: 4,
    name: "函数签名验证",
    test: () => checkHandlerSignature(),
    expected: "handler(req, res)格式",
    correct: false,
    error: ""
  },
  {
    id: 5,
    name: "与其他API一致性",
    test: () => checkConsistencyWithOtherAPIs(),
    expected: "与auth.js等格式一致",
    correct: false,
    error: ""
  }
];

// 读取文件内容
function readAdminFile() {
  try {
    return fs.readFileSync('api/admin.js', 'utf8');
  } catch (error) {
    throw new Error(`无法读取admin.js: ${error.message}`);
  }
}

function readAuthFile() {
  try {
    return fs.readFileSync('api/auth.js', 'utf8');
  } catch (error) {
    throw new Error(`无法读取auth.js: ${error.message}`);
  }
}

// 测试函数
function checkES6ModuleSyntax() {
  const content = readAdminFile();
  
  // 检查是否使用ES6 import语法
  const hasImport = content.includes('import mysql from');
  const hasExport = content.includes('export default');
  const noRequire = !content.includes('require(');
  const noModuleExports = !content.includes('module.exports');
  
  if (!hasImport) throw new Error("缺少ES6 import语句");
  if (!hasExport) throw new Error("缺少export default语句");
  if (!noRequire) throw new Error("仍使用require语句");
  if (!noModuleExports) throw new Error("仍使用module.exports");
  
  return true;
}

function checkExportDefault() {
  const content = readAdminFile();
  return content.includes('export default async function handler');
}

function checkImportStatements() {
  const content = readAdminFile();
  return content.includes("import mysql from 'mysql2/promise'");
}

function checkHandlerSignature() {
  const content = readAdminFile();
  return content.includes('export default async function handler(req, res)');
}

function checkConsistencyWithOtherAPIs() {
  const adminContent = readAdminFile();
  const authContent = readAuthFile();
  
  // 检查导出格式是否一致
  const adminHasExportDefault = adminContent.includes('export default async function handler');
  const authHasExportDefault = authContent.includes('export default async function handler');
  
  return adminHasExportDefault && authHasExportDefault;
}

// 主验证函数
async function runErrorBookValidation() {
  console.log("🔍 开始admin.js本地错题本验证...");
  console.log("📋 验证ES6模块语法修复\n");

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
  
  console.log("📊 本地错题本验证结果:");
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

  console.log("\n🎯 本地错题本验证完成!");
  
  if (successRate >= 80) {
    console.log("✅ 验证通过，可以推送部署!");
    return true;
  } else {
    console.log("❌ 验证失败，需要修复问题!");
    return false;
  }
}

// 执行验证
runErrorBookValidation()
  .then(success => {
    if (success) {
      console.log("\n🚀 建议执行部署命令:");
      console.log("git add api/admin.js");
      console.log("git commit -m '🔧 统一admin.js的ES6模块语法'");
      console.log("git push origin main");
    }
  })
  .catch(console.error);