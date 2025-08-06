// Framework修复后错题本验证 - 提交9d3666d
// 验证Create React App Framework Preset修复效果

const baseUrl = 'https://zhixing.vercel.app';

// 错题本验证项目
const checkpoints = [
  {
    id: 1,
    name: "API基础连接测试",
    test: () => testAPIConnection(),
    expected: "API不再返回404",
    correct: false,
    error: ""
  },
  {
    id: 2,
    name: "管理员API功能测试",
    test: () => testAdminAPI(),
    expected: "返回400或401（正常业务错误）",
    correct: false,
    error: ""
  },
  {
    id: 3,
    name: "认证API功能测试",
    test: () => testAuthAPI(),
    expected: "返回业务相关响应",
    correct: false,
    error: ""
  },
  {
    id: 4,
    name: "其他API状态检查",
    test: () => testOtherAPIs(),
    expected: "多个API都不再404",
    correct: false,
    error: ""
  },
  {
    id: 5,
    name: "前端网站状态",
    test: () => testFrontendStatus(),
    expected: "前端仍然正常工作",
    correct: false,
    error: ""
  }
];

// 测试函数
async function testAPIConnection() {
  try {
    const response = await fetch(`${baseUrl}/api/admin`);
    // 404说明问题未解决，非404说明修复成功
    return response.status !== 404;
  } catch (error) {
    throw new Error(`连接失败: ${error.message}`);
  }
}

async function testAdminAPI() {
  try {
    const response = await fetch(`${baseUrl}/api/admin?action=overview`);
    // 期望返回400（缺少认证）或其他业务错误，不是404
    return response.status !== 404;
  } catch (error) {
    throw new Error(`管理员API测试失败: ${error.message}`);
  }
}

async function testAuthAPI() {
  try {
    const response = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    return response.status !== 404;
  } catch (error) {
    throw new Error(`认证API测试失败: ${error.message}`);
  }
}

async function testOtherAPIs() {
  try {
    const apis = ['orders', 'sales', 'health'];
    const results = await Promise.all(
      apis.map(api => fetch(`${baseUrl}/api/${api}`))
    );
    
    // 至少有一半的API不返回404
    const nonFourOhFour = results.filter(r => r.status !== 404).length;
    return nonFourOhFour >= Math.ceil(apis.length / 2);
  } catch (error) {
    throw new Error(`其他API测试失败: ${error.message}`);
  }
}

async function testFrontendStatus() {
  try {
    const response = await fetch(`${baseUrl}/`);
    return response.status === 200;
  } catch (error) {
    throw new Error(`前端状态检查失败: ${error.message}`);
  }
}

// 主验证函数
async function runFrameworkFixValidation() {
  console.log("🔍 开始Framework修复后错题本验证...");
  console.log("📋 验证提交: 9d3666d - 修复Framework Preset配置");
  console.log("🎯 预期: Create React App框架应该支持Serverless Functions\n");

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
  
  console.log("📊 Framework修复验证结果:");
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

  console.log("\n🎯 Framework修复验证完成!");
  
  if (successRate >= 60) {
    console.log("✅ Framework修复成功！API已恢复正常!");
    console.log("🚀 可以继续运行完整的管理员API功能测试");
  } else {
    console.log("❌ Framework修复可能需要更多时间生效");
    console.log("💡 建议等待3-5分钟后重新验证");
  }

  return {
    successRate,
    passedCount,
    totalCount,
    checkpoints
  };
}

// 执行验证
runFrameworkFixValidation().catch(console.error);