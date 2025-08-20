#!/usr/bin/env node

/**
 * 自动并行运行任务列表
 * 直接运行: node auto-run-tasks.js
 */

// ========== 定义你的任务列表 ==========
const taskList = [
  { name: "审查 AdminOrders.js", type: "code-review" },
  { name: "审查 AdminSales.js", type: "code-review" },
  { name: "审查 AdminFinance.js", type: "code-review" },
  { name: "优化页面性能", type: "performance" },
  { name: "优化数据库查询", type: "database" },
  { name: "测试订单功能", type: "test" },
  { name: "测试支付流程", type: "test" },
  { name: "生成API文档", type: "docs" },
  { name: "安全漏洞扫描", type: "security" },
  { name: "检查代码规范", type: "lint" },
];

// ========== 并行执行器 ==========
class TaskExecutor {
  constructor() {
    this.running = 0;
    this.completed = 0;
    this.maxConcurrent = 10;  // 增加到10个并发！
  }

  async runAll() {
    console.log('\n🎯 任务自动执行系统启动\n');
    console.log(`📋 任务总数: ${taskList.length}`);
    console.log(`⚡ 最大并发: ${this.maxConcurrent}\n`);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    const promises = [];
    
    for (const task of taskList) {
      promises.push(this.runTask(task));
      
      // 控制并发数
      if (promises.length >= this.maxConcurrent) {
        await Promise.race(promises);
      }
    }
    
    // 等待所有任务完成
    await Promise.all(promises);
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('─'.repeat(50));
    console.log(`\n✅ 全部完成！`);
    console.log(`📊 完成任务: ${this.completed}/${taskList.length}`);
    console.log(`⏱️  总耗时: ${totalTime}秒`);
    console.log(`⚡ 平均速度: ${(totalTime / taskList.length).toFixed(2)}秒/任务\n`);
  }

  async runTask(task) {
    this.running++;
    const startTime = Date.now();
    
    console.log(`🔄 [${this.getTime()}] 开始: ${task.name}`);
    
    try {
      // 模拟任务执行（2-5秒随机）
      await this.simulateWork(task);
      
      this.completed++;
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ [${this.getTime()}] 完成: ${task.name} (${duration}秒)`);
      
    } catch (error) {
      console.log(`❌ [${this.getTime()}] 失败: ${task.name}`);
    }
    
    this.running--;
  }

  async simulateWork(task) {
    // 不同类型任务的执行时间
    const timeMap = {
      'code-review': 3000,
      'performance': 4000,
      'database': 3500,
      'test': 2500,
      'docs': 2000,
      'security': 4500,
      'lint': 1500
    };
    
    const baseTime = timeMap[task.type] || 3000;
    const randomTime = baseTime + (Math.random() * 2000 - 1000);
    
    await new Promise(resolve => setTimeout(resolve, randomTime));
  }

  getTime() {
    return new Date().toLocaleTimeString('zh-CN');
  }
}

// ========== 主函数 ==========
async function main() {
  const executor = new TaskExecutor();
  await executor.runAll();
}

// 立即执行
main().catch(error => {
  console.error('❌ 执行错误:', error);
  process.exit(1);
});