const axios = require('axios');

class UserExperienceOptimizer {
  constructor() {
    this.baseURL = 'https://zhixing-seven.vercel.app/api';
    this.results = {
      accessibility: {},
      errorHandling: {},
      responseFormat: {},
      loadingStates: {},
      recommendations: []
    };
  }

  async runOptimization() {
    console.log('🎨 开始用户体验优化分析...');
    console.log('=' * 60);
    
    try {
      // 1. 可访问性分析
      await this.analyzeAccessibility();
      
      // 2. 错误处理分析
      await this.analyzeErrorHandling();
      
      // 3. 响应格式分析
      await this.analyzeResponseFormat();
      
      // 4. 加载状态分析
      await this.analyzeLoadingStates();
      
      // 5. 生成优化建议
      this.generateRecommendations();
      
      // 6. 输出结果
      this.printResults();
      
    } catch (error) {
      console.error('❌ 用户体验优化分析失败:', error.message);
    }
  }

  async analyzeAccessibility() {
    console.log('\n♿ 分析可访问性...');
    
    const accessibilityTests = [
      {
        name: '健康检查API',
        path: '/health',
        expected: {
          hasCORS: true,
          hasContentType: true,
          hasStatus: true
        }
      },
      {
        name: '管理员统计API',
        path: '/admin?path=stats',
        expected: {
          hasCORS: true,
          hasContentType: true,
          hasStatus: true
        }
      },
      {
        name: '销售列表API',
        path: '/sales?path=list',
        expected: {
          hasCORS: true,
          hasContentType: true,
          hasStatus: true
        }
      }
    ];
    
    for (const test of accessibilityTests) {
      try {
        const response = await axios.get(`${this.baseURL}${test.path}`, { timeout: 10000 });
        
        const hasCORS = response.headers['access-control-allow-origin'] !== undefined;
        const hasContentType = response.headers['content-type'] !== undefined;
        const hasStatus = response.status !== undefined;
        
        this.results.accessibility[test.name] = {
          cors: hasCORS,
          contentType: hasContentType,
          status: hasStatus,
          score: [hasCORS, hasContentType, hasStatus].filter(Boolean).length / 3 * 100
        };
        
        const score = this.results.accessibility[test.name].score;
        const status = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';
        console.log(`   ${status} ${test.name}: ${score.toFixed(0)}%`);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: 测试失败 - ${error.message}`);
      }
    }
  }

  async analyzeErrorHandling() {
    console.log('\n⚠️ 分析错误处理...');
    
    const errorTests = [
      {
        name: '无效路径',
        path: '/invalid-path',
        expectedStatus: 404,
        expectedFormat: 'json'
      },
      {
        name: '无效参数',
        path: '/auth?path=invalid',
        expectedStatus: 404,
        expectedFormat: 'json'
      },
      {
        name: '空数据提交',
        path: '/sales?path=create',
        method: 'POST',
        data: {},
        expectedStatus: 400,
        expectedFormat: 'json'
      },
      {
        name: '格式错误数据',
        path: '/orders?path=create',
        method: 'POST',
        data: { invalid: 'data' },
        expectedStatus: 400,
        expectedFormat: 'json'
      }
    ];
    
    for (const test of errorTests) {
      try {
        let response;
        if (test.method === 'POST') {
          response = await axios.post(`${this.baseURL}${test.path}`, test.data, { 
            timeout: 5000,
            validateStatus: () => true // 不抛出错误
          });
        } else {
          response = await axios.get(`${this.baseURL}${test.path}`, { 
            timeout: 5000,
            validateStatus: () => true
          });
        }
        
        const statusMatch = response.status === test.expectedStatus;
        const formatMatch = response.headers['content-type']?.includes('application/json');
        const hasMessage = response.data?.message !== undefined;
        const hasSuccess = response.data?.success !== undefined;
        
        this.results.errorHandling[test.name] = {
          statusMatch,
          formatMatch,
          hasMessage,
          hasSuccess,
          score: [statusMatch, formatMatch, hasMessage, hasSuccess].filter(Boolean).length / 4 * 100
        };
        
        const score = this.results.errorHandling[test.name].score;
        const status = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';
        console.log(`   ${status} ${test.name}: ${score.toFixed(0)}% (状态:${response.status})`);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: 测试失败 - ${error.message}`);
      }
    }
  }

  async analyzeResponseFormat() {
    console.log('\n📋 分析响应格式...');
    
    const formatTests = [
      {
        name: '健康检查',
        path: '/health',
        expectedFields: ['success', 'message', 'data']
      },
      {
        name: '管理员统计',
        path: '/admin?path=stats',
        expectedFields: ['success', 'data']
      },
      {
        name: '销售列表',
        path: '/sales?path=list',
        expectedFields: ['success', 'data']
      }
    ];
    
    for (const test of formatTests) {
      try {
        const response = await axios.get(`${this.baseURL}${test.path}`, { timeout: 10000 });
        
        const hasExpectedFields = test.expectedFields.every(field => 
          response.data && response.data.hasOwnProperty(field)
        );
        
        const hasConsistentFormat = response.data && 
          typeof response.data.success === 'boolean' &&
          (response.data.data !== undefined || response.data.message !== undefined);
        
        const hasProperContentType = response.headers['content-type']?.includes('application/json');
        
        this.results.responseFormat[test.name] = {
          hasExpectedFields,
          hasConsistentFormat,
          hasProperContentType,
          score: [hasExpectedFields, hasConsistentFormat, hasProperContentType].filter(Boolean).length / 3 * 100
        };
        
        const score = this.results.responseFormat[test.name].score;
        const status = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';
        console.log(`   ${status} ${test.name}: ${score.toFixed(0)}%`);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: 测试失败 - ${error.message}`);
      }
    }
  }

  async analyzeLoadingStates() {
    console.log('\n⏳ 分析加载状态...');
    
    const loadingTests = [
      { name: '健康检查', path: '/health' },
      { name: '管理员统计', path: '/admin?path=stats' },
      { name: '销售列表', path: '/sales?path=list' },
      { name: '订单列表', path: '/orders?path=list' }
    ];
    
    for (const test of loadingTests) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.baseURL}${test.path}`, { timeout: 15000 });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // 评估响应时间
        let timeScore;
        if (responseTime < 500) timeScore = 100;
        else if (responseTime < 1000) timeScore = 80;
        else if (responseTime < 2000) timeScore = 60;
        else timeScore = 40;
        
        this.results.loadingStates[test.name] = {
          responseTime,
          timeScore,
          hasData: response.data && response.data.data !== undefined,
          score: timeScore
        };
        
        const status = timeScore >= 80 ? '✅' : timeScore >= 60 ? '⚠️' : '❌';
        console.log(`   ${status} ${test.name}: ${timeScore.toFixed(0)}% (${responseTime}ms)`);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: 测试失败 - ${error.message}`);
      }
    }
  }

  generateRecommendations() {
    console.log('\n💡 生成用户体验优化建议...');
    
    // 可访问性建议
    const accessibilityScores = Object.values(this.results.accessibility).map(a => a.score);
    const avgAccessibility = accessibilityScores.reduce((a, b) => a + b, 0) / accessibilityScores.length;
    
    if (avgAccessibility < 80) {
      this.results.recommendations.push({
        category: '可访问性优化',
        priority: 'high',
        suggestions: [
          '确保所有API都有正确的CORS头部',
          '统一响应内容类型为application/json',
          '添加适当的HTTP状态码'
        ]
      });
    }
    
    // 错误处理建议
    const errorScores = Object.values(this.results.errorHandling).map(e => e.score);
    const avgErrorHandling = errorScores.reduce((a, b) => a + b, 0) / errorScores.length;
    
    if (avgErrorHandling < 80) {
      this.results.recommendations.push({
        category: '错误处理优化',
        priority: 'high',
        suggestions: [
          '统一错误响应格式',
          '确保所有错误都有明确的message字段',
          '添加success字段标识请求状态'
        ]
      });
    }
    
    // 响应格式建议
    const formatScores = Object.values(this.results.responseFormat).map(f => f.score);
    const avgFormat = formatScores.reduce((a, b) => a + b, 0) / formatScores.length;
    
    if (avgFormat < 80) {
      this.results.recommendations.push({
        category: '响应格式优化',
        priority: 'medium',
        suggestions: [
          '统一API响应结构',
          '确保所有响应都有success字段',
          '添加适当的data或message字段'
        ]
      });
    }
    
    // 加载性能建议
    const loadingScores = Object.values(this.results.loadingStates).map(l => l.score);
    const avgLoading = loadingScores.reduce((a, b) => a + b, 0) / loadingScores.length;
    
    if (avgLoading < 80) {
      this.results.recommendations.push({
        category: '加载性能优化',
        priority: 'medium',
        suggestions: [
          '优化数据库查询性能',
          '添加API响应缓存',
          '实现请求限流机制'
        ]
      });
    }
    
    // 通用用户体验建议
    this.results.recommendations.push({
      category: '通用用户体验优化',
      priority: 'low',
      suggestions: [
        '添加API版本控制',
        '实现请求/响应日志记录',
        '添加API文档和示例',
        '实现优雅的错误页面'
      ]
    });
  }

  printResults() {
    console.log('\n' + '=' * 60);
    console.log('🎨 用户体验优化分析结果');
    console.log('=' * 60);
    
    // 可访问性总结
    console.log('\n♿ 可访问性分析:');
    Object.entries(this.results.accessibility).forEach(([name, data]) => {
      const status = data.score >= 80 ? '✅' : data.score >= 60 ? '⚠️' : '❌';
      console.log(`   ${status} ${name}: ${data.score.toFixed(0)}%`);
    });
    
    // 错误处理总结
    console.log('\n⚠️ 错误处理分析:');
    Object.entries(this.results.errorHandling).forEach(([name, data]) => {
      const status = data.score >= 80 ? '✅' : data.score >= 60 ? '⚠️' : '❌';
      console.log(`   ${status} ${name}: ${data.score.toFixed(0)}%`);
    });
    
    // 响应格式总结
    console.log('\n📋 响应格式分析:');
    Object.entries(this.results.responseFormat).forEach(([name, data]) => {
      const status = data.score >= 80 ? '✅' : data.score >= 60 ? '⚠️' : '❌';
      console.log(`   ${status} ${name}: ${data.score.toFixed(0)}%`);
    });
    
    // 加载状态总结
    console.log('\n⏳ 加载状态分析:');
    Object.entries(this.results.loadingStates).forEach(([name, data]) => {
      const status = data.score >= 80 ? '✅' : data.score >= 60 ? '⚠️' : '❌';
      console.log(`   ${status} ${name}: ${data.score.toFixed(0)}% (${data.responseTime}ms)`);
    });
    
    // 优化建议
    console.log('\n💡 用户体验优化建议:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`\n   ${index + 1}. ${rec.category} (优先级: ${rec.priority})`);
      rec.suggestions.forEach(suggestion => {
        console.log(`      • ${suggestion}`);
      });
    });
    
    // 用户体验评分
    const allScores = [
      ...Object.values(this.results.accessibility).map(a => a.score),
      ...Object.values(this.results.errorHandling).map(e => e.score),
      ...Object.values(this.results.responseFormat).map(f => f.score),
      ...Object.values(this.results.loadingStates).map(l => l.score)
    ];
    
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    
    console.log(`\n🎯 用户体验评分: ${avgScore.toFixed(0)}/100`);
    
    if (avgScore >= 80) {
      console.log('✅ 用户体验良好，可以进入生产环境');
    } else if (avgScore >= 60) {
      console.log('⚠️ 用户体验需要优化，建议实施上述建议');
    } else {
      console.log('❌ 用户体验需要大幅改进，不建议进入生产环境');
    }
    
    console.log('\n' + '=' * 60);
  }
}

// 运行用户体验优化
async function main() {
  const optimizer = new UserExperienceOptimizer();
  await optimizer.runOptimization();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = UserExperienceOptimizer; 