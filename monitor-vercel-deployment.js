const axios = require('axios');

// 监控配置
const config = {
  baseURL: 'https://zhixing-seven.vercel.app/api',
  checkInterval: 10000, // 10秒检查一次
  maxChecks: 30, // 最多检查30次（5分钟）
  endpoints: [
    { name: '健康检查', path: '/health?path=check', method: 'GET' },
    { name: '管理员统计', path: '/admin?path=stats', method: 'GET' },
    { name: '销售创建', path: '/sales?path=create', method: 'POST', data: {
      wechat_name: `monitor_sales_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      payment_method: 'alipay',
      payment_address: 'monitor@test.com',
      alipay_surname: '监'
    }},
    { name: '一级销售创建', path: '/primary-sales?path=create', method: 'POST', data: {
      wechat_name: `monitor_primary_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      payment_method: 'alipay',
      payment_address: 'monitor@test.com',
      alipay_surname: '监'
    }},
    { name: '数据库初始化', path: '/init-database?path=init', method: 'POST' }
  ]
};

class VercelMonitor {
  constructor() {
    this.checkCount = 0;
    this.startTime = Date.now();
    this.results = [];
  }

  async start() {
    console.log('🚀 开始监控Vercel部署状态...');
    console.log(`📡 监控地址: ${config.baseURL}`);
    console.log(`⏱️  检查间隔: ${config.checkInterval / 1000}秒`);
    console.log(`🔄 最大检查次数: ${config.maxChecks}次`);
    console.log('=' * 60);

    this.monitorInterval = setInterval(() => {
      this.checkEndpoints();
    }, config.checkInterval);
  }

  async checkEndpoints() {
    this.checkCount++;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    
    console.log(`\n🔍 第${this.checkCount}次检查 (${elapsed}秒)`);
    console.log('-' * 40);

    const results = [];
    
    for (const endpoint of config.endpoints) {
      try {
        const startTime = Date.now();
        const response = await this.callEndpoint(endpoint);
        const responseTime = Date.now() - startTime;
        
        const result = {
          name: endpoint.name,
          status: '✅ 成功',
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          success: response.data?.success || false,
          message: response.data?.message || '无消息'
        };
        
        results.push(result);
        console.log(`${result.status} ${endpoint.name} (${result.responseTime}) - ${response.status}`);
        
      } catch (error) {
        const result = {
          name: endpoint.name,
          status: '❌ 失败',
          responseTime: 'N/A',
          statusCode: error.response?.status || 'N/A',
          success: false,
          message: error.message
        };
        
        results.push(result);
        console.log(`${result.status} ${endpoint.name} - ${error.message}`);
      }
    }

    this.results.push({
      checkNumber: this.checkCount,
      timestamp: new Date().toISOString(),
      elapsed: elapsed,
      results: results
    });

    // 检查是否所有端点都成功
    const allSuccess = results.every(r => r.status === '✅ 成功');
    
    if (allSuccess) {
      console.log('\n🎉 所有API端点都正常工作！');
      this.stop();
      return;
    }

    // 检查是否达到最大检查次数
    if (this.checkCount >= config.maxChecks) {
      console.log('\n⏰ 达到最大检查次数，停止监控');
      this.stop();
      return;
    }

    console.log(`\n⏳ ${config.checkInterval / 1000}秒后再次检查...`);
  }

  async callEndpoint(endpoint) {
    const options = {
      method: endpoint.method,
      url: `${config.baseURL}${endpoint.path}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    if (endpoint.data) {
      options.data = endpoint.data;
    }

    return await axios(options);
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    console.log('\n📊 监控结果汇总:');
    console.log('=' * 60);
    
    this.results.forEach(check => {
      console.log(`\n🔍 第${check.checkNumber}次检查 (${check.elapsed}秒):`);
      check.results.forEach(result => {
        console.log(`  ${result.status} ${result.name} - ${result.message}`);
      });
    });

    const lastCheck = this.results[this.results.length - 1];
    if (lastCheck) {
      const successCount = lastCheck.results.filter(r => r.status === '✅ 成功').length;
      const totalCount = lastCheck.results.length;
      console.log(`\n📈 最终状态: ${successCount}/${totalCount} 个端点正常工作`);
    }

    console.log('\n✅ 监控完成');
    process.exit(0);
  }
}

// 启动监控
const monitor = new VercelMonitor();
monitor.start();

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 用户中断监控');
  monitor.stop();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 进程被终止');
  monitor.stop();
}); 