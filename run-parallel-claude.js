#!/usr/bin/env node

/**
 * 运行5个Claude并行处理任务的脚本
 * 点击运行即可体验并行处理效果
 */

const ClaudeParallelSystem = require('./claude-parallel-system').ClaudeParallelSystem;

// 颜色输出（让结果更清晰）
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function main() {
  console.log(colors.bright + colors.cyan + `
╔════════════════════════════════════════════╗
║     Claude 并行任务系统 - 5个实例演示      ║
╚════════════════════════════════════════════╝
` + colors.reset);

  // 创建系统实例
  const system = new ClaudeParallelSystem({
    maxConcurrent: 5,    // 同时运行5个
    timeout: 60000,      // 60秒超时
    retryCount: 2        // 失败重试2次
  });

  // 模拟实际任务场景
  console.log(colors.yellow + '\n📋 准备任务列表...\n' + colors.reset);

  const tasks = [
    // 第一批：代码审查任务（5个）
    {
      type: 'review',
      agent: 'code-reviewer',
      prompt: '审查 AdminOrders.js 的代码质量和安全性',
      priority: 10
    },
    {
      type: 'review',
      agent: 'code-reviewer',
      prompt: '审查 AdminSales.js 的代码质量和安全性',
      priority: 10
    },
    {
      type: 'review',
      agent: 'code-reviewer',
      prompt: '审查 AdminFinance.js 的代码质量和安全性',
      priority: 10
    },
    {
      type: 'review',
      agent: 'code-reviewer',
      prompt: '审查 api.js 的代码质量和安全性',
      priority: 10
    },
    {
      type: 'review',
      agent: 'code-reviewer',
      prompt: '审查 supabase.js 的代码质量和安全性',
      priority: 10
    },
    
    // 第二批：性能优化任务（5个）
    {
      type: 'optimize',
      agent: 'performance-engineer',
      prompt: '优化订单页面加载速度',
      priority: 8
    },
    {
      type: 'optimize',
      agent: 'performance-engineer',
      prompt: '优化销售管理页面性能',
      priority: 8
    },
    {
      type: 'optimize',
      agent: 'database-optimizer',
      prompt: '优化订单查询SQL性能',
      priority: 9
    },
    {
      type: 'optimize',
      agent: 'database-optimizer',
      prompt: '优化销售统计查询性能',
      priority: 9
    },
    {
      type: 'optimize',
      agent: 'frontend-developer',
      prompt: '优化React组件渲染性能',
      priority: 7
    },
    
    // 第三批：测试任务（5个）
    {
      type: 'test',
      agent: 'test-automator',
      prompt: '测试订单创建流程',
      priority: 6
    },
    {
      type: 'test',
      agent: 'test-automator',
      prompt: '测试销售注册流程',
      priority: 6
    },
    {
      type: 'test',
      agent: 'test-automator',
      prompt: '测试佣金计算逻辑',
      priority: 6
    },
    {
      type: 'test',
      agent: 'test-automator',
      prompt: '测试管理员登录权限',
      priority: 6
    },
    {
      type: 'test',
      agent: 'test-automator',
      prompt: '测试数据导出功能',
      priority: 5
    }
  ];

  // 添加任务到系统
  await system.addTasks(tasks);
  
  console.log(colors.green + `✅ 已添加 ${tasks.length} 个任务\n` + colors.reset);
  console.log(colors.bright + '🚀 开始并行处理（最多5个同时运行）...\n' + colors.reset);
  
  // 显示实时状态
  const statusInterval = setInterval(() => {
    const running = system.runningTasks.size;
    const pending = system.taskQueue.length;
    const completed = system.completedTasks.length;
    const failed = system.failedTasks.length;
    
    process.stdout.write(
      `\r${colors.cyan}[状态] ` +
      `${colors.yellow}运行中: ${running}/5 | ` +
      `${colors.blue}等待: ${pending} | ` +
      `${colors.green}完成: ${completed} | ` +
      `${colors.red}失败: ${failed}${colors.reset}    `
    );
  }, 500);

  // 开始执行
  await system.start();
  
  // 停止状态更新
  clearInterval(statusInterval);
  console.log('\n');

  // 获取结果
  const results = system.getResults();

  // 显示详细结果
  console.log(colors.bright + colors.green + '\n📊 执行结果汇总\n' + colors.reset);
  console.log('═'.repeat(50));
  
  // 成功的任务
  if (results.completed.length > 0) {
    console.log(colors.green + '\n✅ 成功完成的任务:' + colors.reset);
    results.completed.forEach((task, index) => {
      console.log(`  ${index + 1}. [${task.agent}] ${task.prompt}`);
      console.log(`     耗时: ${Math.round(task.duration)}ms`);
      console.log(`     结果: ${task.result}`);
    });
  }

  // 失败的任务
  if (results.failed.length > 0) {
    console.log(colors.red + '\n❌ 失败的任务:' + colors.reset);
    results.failed.forEach((task, index) => {
      console.log(`  ${index + 1}. [${task.agent}] ${task.prompt}`);
      console.log(`     错误: ${task.error}`);
      console.log(`     重试次数: ${task.retries}`);
    });
  }

  // 总体统计
  console.log('\n' + '═'.repeat(50));
  console.log(colors.bright + '📈 总体统计:' + colors.reset);
  console.log(`  • 总任务数: ${results.summary.total}`);
  console.log(`  • 成功: ${colors.green}${results.summary.completed}${colors.reset}`);
  console.log(`  • 失败: ${colors.red}${results.summary.failed}${colors.reset}`);
  console.log(`  • 成功率: ${colors.yellow}${results.summary.successRate}${colors.reset}`);
  console.log(`  • 总耗时: ${Math.round(results.summary.totalDuration / 1000)}秒`);
  console.log(`  • 平均每任务: ${Math.round(results.summary.averageDuration)}ms`);
  
  // 性能提升计算
  const sequentialTime = results.completed.reduce((acc, t) => acc + t.duration, 0);
  const parallelTime = results.summary.totalDuration;
  const speedup = (sequentialTime / parallelTime).toFixed(2);
  
  console.log('\n' + '═'.repeat(50));
  console.log(colors.bright + colors.magenta + '⚡ 性能提升:' + colors.reset);
  console.log(`  • 串行执行预计: ${Math.round(sequentialTime / 1000)}秒`);
  console.log(`  • 并行执行实际: ${Math.round(parallelTime / 1000)}秒`);
  console.log(`  • 速度提升: ${colors.bright}${colors.green}${speedup}x${colors.reset}`);
  console.log(`  • 节省时间: ${colors.bright}${Math.round((sequentialTime - parallelTime) / 1000)}秒${colors.reset}`);
  
  console.log('\n' + colors.bright + colors.cyan + '✨ 并行处理完成！' + colors.reset + '\n');
}

// 运行主函数
main().catch(error => {
  console.error(colors.red + '❌ 错误:', error.message + colors.reset);
  process.exit(1);
});