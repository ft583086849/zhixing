const axios = require('axios');

class PerformanceOptimizer {
  constructor() {
    this.baseURL = 'https://zhixing-seven.vercel.app/api';
    this.results = {
      responseTimes: {},
      throughput: {},
      errors: {},
      recommendations: []
    };
  }

  async runOptimization() {
    console.log('🚀 开始性能优化分析...');
    console.log('=' * 60);
    
    try {
      // 1. 响应时间分析
      await this.analyzeResponseTimes();
      
      // 2. 吞吐量测试
      await this.analyzeThroughput();
      
      // 3. 错误率分析
      await this.analyzeErrorRates();
      
      // 4. 生成优化建议
      this.generateRecommendations();
      
      // 5. 输出结果
      this.printResults();
      
    } catch (error) {
      console.error('❌ 性能优化分析失败:', error.message);
    }
  }

  async analyzeResponseTimes() {
    console.log('\n⏱️ 分析响应时间...');
    
    const endpoints = [
      { name: '健康检查', path: '/health' },
      { name: '管理员统计', path: '/admin?path=stats' },
      { name: '销售列表', path: '/sales?path=list' },
      { name: '订单列表', path: '/orders?path=list' },
      { name: '一级销售列表', path: '/primary-sales?path=list' },
      { name: '二级销售列表', path: '/secondary-sales?path=list' }
    ];
    
    for (const endpoint of endpoints) {
      const times = [];
      
      // 测试5次取平均值
      for (let i = 0; i < 5; i++) {
        try {
          const startTime = Date.now();
          await axios.get(`${this.baseURL}${endpoint.path}`, { timeout: 10000 });
          const endTime = Date.now();
          times.push(endTime - startTime);
        } catch (error) {
          console.log(`   ⚠️ ${endpoint.name}测试失败: ${error.message}`);
        }
      }
      
      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        this.results.responseTimes[endpoint.name] = {
          average: avgTime,
          min: minTime,
          max: maxTime,
          samples: times.length
        };
        
        console.log(`   📊 ${endpoint.name}: 平均${avgTime.toFixed(0)}ms (${minTime}-${maxTime}ms)`);
      }
    }
  }

  async analyzeThroughput() {
    console.log('\n📈 分析吞吐量...');
    
    const concurrencyLevels = [1, 3, 5, 10];
    
    for (const concurrency of concurrencyLevels) {
      console.log(`   🔄 测试并发数: ${concurrency}`);
      
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < concurrency; i++) {
        promises.push(
          axios.get(`${this.baseURL}/health`, { timeout: 10000 })
            .then(() => ({ success: true, time: Date.now() - startTime }))
            .catch(() => ({ success: false, time: Date.now() - startTime }))
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      const successCount = results.filter(r => r.success).length;
      const throughput = (successCount / totalTime) * 1000; // 请求/秒
      
      this.results.throughput[concurrency] = {
        totalRequests: concurrency,
        successfulRequests: successCount,
        failedRequests: concurrency - successCount,
        totalTime: totalTime,
        throughput: throughput,
        successRate: (successCount / concurrency) * 100
      };
      
      console.log(`      ✅ 成功: ${successCount}/${concurrency} (${((successCount/concurrency)*100).toFixed(1)}%)`);
      console.log(`      ⏱️ 总时间: ${totalTime}ms`);
      console.log(`      📊 吞吐量: ${throughput.toFixed(2)} 请求/秒`);
    }
  }

  async analyzeErrorRates() {
    console.log('\n❌ 分析错误率...');
    
    const errorTests = [
      { name: '无效路径', path: '/invalid-path', expectedError: 404 },
      { name: '无效参数', path: '/auth?path=invalid', expectedError: 404 },
      { name: '空数据提交', path: '/sales?path=create', method: 'POST', data: {} },
      { name: '格式错误数据', path: '/orders?path=create', method: 'POST', data: { invalid: 'data' } }
    ];
    
    for (const test of errorTests) {
      try {
        if (test.method === 'POST') {
          await axios.post(`${this.baseURL}${test.path}`, test.data, { timeout: 5000 });
        } else {
          await axios.get(`${this.baseURL}${test.path}`, { timeout: 5000 });
        }
        
        this.results.errors[test.name] = {
          status: 'unexpected_success',
          message: '应该返回错误但没有'
        };
        console.log(`   ⚠️ ${test.name}: 应该返回错误但没有`);
        
      } catch (error) {
        const status = error.response?.status || 'network_error';
        this.results.errors[test.name] = {
          status: status,
          message: error.response?.data?.message || error.message
        };
        
        if (test.expectedError && status === test.expectedError) {
          console.log(`   ✅ ${test.name}: 正确返回${status}错误`);
        } else {
          console.log(`   ⚠️ ${test.name}: 返回${status}错误 (期望${test.expectedError})`);
        }
      }
    }
  }

  generateRecommendations() {
    console.log('\n💡 生成优化建议...');
    
    // 响应时间建议
    const slowEndpoints = Object.entries(this.results.responseTimes)
      .filter(([name, data]) => data.average > 1000)
      .map(([name, data]) => ({ name, time: data.average }));
    
    if (slowEndpoints.length > 0) {
      this.results.recommendations.push({
        category: '响应时间优化',
        priority: 'high',
        suggestions: slowEndpoints.map(ep => 
          `优化${ep.name}响应时间 (当前${ep.time.toFixed(0)}ms)`
        )
      });
    }
    
    // 吞吐量建议
    const throughputData = this.results.throughput[10]; // 10并发测试
    if (throughputData && throughputData.successRate < 90) {
      this.results.recommendations.push({
        category: '并发性能优化',
        priority: 'medium',
        suggestions: [
          `提高并发处理能力 (当前成功率${throughputData.successRate.toFixed(1)}%)`,
          `优化数据库连接池配置`,
          `考虑添加缓存机制`
        ]
      });
    }
    
    // 错误处理建议
    const errorCount = Object.keys(this.results.errors).length;
    if (errorCount > 0) {
      this.results.recommendations.push({
        category: '错误处理优化',
        priority: 'medium',
        suggestions: [
          '完善错误处理机制',
          '统一错误响应格式',
          '添加更详细的错误日志'
        ]
      });
    }
    
    // 通用建议
    this.results.recommendations.push({
      category: '通用优化',
      priority: 'low',
      suggestions: [
        '添加API响应缓存',
        '优化数据库查询',
        '实现请求限流',
        '添加性能监控'
      ]
    });
  }

  printResults() {
    console.log('\n' + '=' * 60);
    console.log('📊 性能优化分析结果');
    console.log('=' * 60);
    
    // 响应时间总结
    console.log('\n⏱️ 响应时间分析:');
    Object.entries(this.results.responseTimes).forEach(([name, data]) => {
      const status = data.average > 1000 ? '⚠️' : '✅';
      console.log(`   ${status} ${name}: ${data.average.toFixed(0)}ms`);
    });
    
    // 吞吐量总结
    console.log('\n📈 吞吐量分析:');
    Object.entries(this.results.throughput).forEach(([concurrency, data]) => {
      const status = data.successRate > 90 ? '✅' : '⚠️';
      console.log(`   ${status} ${concurrency}并发: ${data.throughput.toFixed(2)} 请求/秒 (成功率${data.successRate.toFixed(1)}%)`);
    });
    
    // 优化建议
    console.log('\n💡 优化建议:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`\n   ${index + 1}. ${rec.category} (优先级: ${rec.priority})`);
      rec.suggestions.forEach(suggestion => {
        console.log(`      • ${suggestion}`);
      });
    });
    
    // 性能评分
    const avgResponseTime = Object.values(this.results.responseTimes)
      .reduce((sum, data) => sum + data.average, 0) / Object.keys(this.results.responseTimes).length;
    
    const maxThroughput = Math.max(...Object.values(this.results.throughput).map(d => d.throughput));
    
    let performanceScore = 100;
    if (avgResponseTime > 1000) performanceScore -= 20;
    if (avgResponseTime > 2000) performanceScore -= 20;
    if (maxThroughput < 10) performanceScore -= 15;
    if (maxThroughput < 5) performanceScore -= 15;
    
    console.log(`\n🎯 性能评分: ${performanceScore}/100`);
    
    if (performanceScore >= 80) {
      console.log('✅ 性能表现良好，可以进入生产环境');
    } else if (performanceScore >= 60) {
      console.log('⚠️ 性能需要优化，建议实施上述建议');
    } else {
      console.log('❌ 性能需要大幅优化，不建议进入生产环境');
    }
    
    console.log('\n' + '=' * 60);
  }
}

// 运行性能优化
async function main() {
  const optimizer = new PerformanceOptimizer();
  await optimizer.runOptimization();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceOptimizer; 