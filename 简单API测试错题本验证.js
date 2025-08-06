// 简单API测试错题本验证
// 验证基础Serverless Function是否能工作

const fs = require('fs');

// 错题本验证项目
const checkpoints = [
  {
    id: 1,
    name: "test.js文件语法检查",
    test: () => checkTestAPISyntax(),
    expected: "简单API语法正确",
    correct: false,
    error: ""
  },
  {
    id: 2,
    name: "export default格式验证",
    test: () => checkExportFormat(),
    expected: "使用正确的export default",
    correct: false,
    error: ""
  },
  {
    id: 3,
    name: "handler函数签名检查",
    test: () => checkHandlerSignature(),
    expected: "handler(req, res)格式正确",
    correct: false,
    error: ""
  }
];

// 测试函数
function checkTestAPISyntax() {
  try {
    const content = fs.readFileSync('api/test.js', 'utf8');
    
    // 基本语法检查
    if (!content.includes('export default')) {
      throw new Error("缺少export default");
    }
    
    if (!content.includes('function handler')) {
      throw new Error("缺少handler函数");
    }
    
    if (!content.includes('res.status(200).json')) {
      throw new Error("缺少正确的响应格式");
    }
    
    return true;
  } catch (error) {
    throw new Error(`语法检查失败: ${error.message}`);
  }
}

function checkExportFormat() {
  const content = fs.readFileSync('api/test.js', 'utf8');
  return content.includes('export default function handler');
}

function checkHandlerSignature() {
  const content = fs.readFileSync('api/test.js', 'utf8');
  return content.includes('handler(req, res)');
}

// 主验证函数
async function runSimpleAPITest() {
  console.log("🔍 开始简单API测试错题本验证...");
  console.log("📋 验证目标: test.js基础语法正确");
  console.log("🎯 目的: 测试最简单的Serverless Function\n");

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
  
  console.log("📊 简单API测试错题本验证结果:");
  console.log(`成功率: ${successRate}% (${passedCount}/${totalCount})`);
  
  if (successRate >= 80) {
    console.log("✅ 验证通过，可以推送测试!");
    console.log("🚀 执行:");
    console.log("git add api/test.js && git commit -m '添加简单API测试' && git push origin main");
  } else {
    console.log("❌ 验证失败，需要修复!");
  }

  return { successRate, passedCount, totalCount, checkpoints };
}

// 执行验证
runSimpleAPITest().catch(console.error);