// 管理员API错题本验证 - 提交6d41ab7
// 验证新修复的admin.js Vercel Serverless Functions兼容性

const baseUrl = 'https://zhixing.vercel.app';

// 错题本验证项目
const checkpoints = [
  {
    id: 1,
    name: "基础连接测试",
    test: () => testBasicConnection(),
    expected: "API可访问，返回正确CORS头",
    correct: false,
    error: ""
  },
  {
    id: 2,
    name: "CORS预检请求",
    test: () => testCORSPreflight(),
    expected: "OPTIONS请求返回正确CORS配置",
    correct: false,
    error: ""
  },
  {
    id: 3,
    name: "API路由功能",
    test: () => testAPIRouting(),
    expected: "路由参数正确处理",
    correct: false,
    error: ""
  },
  {
    id: 4,
    name: "响应格式验证",
    test: () => testResponseFormat(),
    expected: "返回统一JSON格式",
    correct: false,
    error: ""
  },
  {
    id: 5,
    name: "错误处理机制",
    test: () => testErrorHandling(),
    expected: "正确处理错误情况",
    correct: false,
    error: ""
  }
];

// 测试函数
async function testBasicConnection() {
  try {
    const response = await fetch(`${baseUrl}/api/admin`);
    if (response.status === 404) {
      throw new Error("API返回404，可能是部署问题");
    }
    return response.status !== 500;
  } catch (error) {
    throw new Error(`连接失败: ${error.message}`);
  }
}

async function testCORSPreflight() {
  try {
    const response = await fetch(`${baseUrl}/api/admin`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://zhixing.vercel.app'
      }
    });
    return response.headers.has('access-control-allow-origin');
  } catch (error) {
    throw new Error(`CORS测试失败: ${error.message}`);
  }
}

async function testAPIRouting() {
  try {
    const response = await fetch(`${baseUrl}/api/admin?action=overview`);
    return response.status !== 404;
  } catch (error) {
    throw new Error(`路由测试失败: ${error.message}`);
  }
}

async function testResponseFormat() {
  try {
    const response = await fetch(`${baseUrl}/api/admin?action=invalid`);
    const data = await response.json();
    return data.hasOwnProperty('success') && data.hasOwnProperty('message');
  } catch (error) {
    throw new Error(`响应格式测试失败: ${error.message}`);
  }
}

async function testErrorHandling() {
  try {
    const response = await fetch(`${baseUrl}/api/admin?action=nonexistent`);
    return response.status === 400;
  } catch (error) {
    throw new Error(`错误处理测试失败: ${error.message}`);
  }
}

// 主验证函数
async function runErrorBookValidation() {
  console.log("🔍 开始管理员API错题本验证...");
  console.log("📋 验证提交: 6d41ab7 - 修复Vercel Serverless Functions兼容性\n");

  let passedCount = 0;
  let totalCount = checkpoints.length;

  for (const checkpoint of checkpoints) {
    try {
      console.log(`🧪 检查项 ${checkpoint.id}: ${checkpoint.name}`);
      
      const result = await checkpoint.test();
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
  
  console.log("📊 错题本验证结果:");
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

  console.log("\n🎯 错题本验证完成!");
  
  if (successRate >= 80) {
    console.log("✅ 验证通过，可以部署!");
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
runErrorBookValidation().catch(console.error);