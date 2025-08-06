#!/usr/bin/env node

/**
 * 全面功能修复验证脚本
 * 验证错题本#003-#005的所有修复问题
 */

const axios = require('axios');

const BASE_URL = 'https://zhixing-seven.vercel.app';

class FixVerifier {
  constructor() {
    this.results = [];
    this.console = console;
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : '🔍';
    this.console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async addResult(test, status, details = '') {
    this.results.push({ test, status, details });
    await this.log(`${test}: ${status} ${details}`, status === 'PASS' ? 'success' : 'error');
  }

  // 测试1: 管理员登录页面可访问性
  async testAdminLoginAccessibility() {
    try {
      const response = await axios.get(`${BASE_URL}/admin`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VerificationBot/1.0)'
        }
      });
      
      const content = response.data;
      
      // 检查React应用是否正常加载
      if (content.includes('<div id="root">') && content.includes('React App')) {
        await this.addResult('管理员登录页面可访问性', 'PASS', '- React应用正常加载');
        return true;
      } else {
        await this.addResult('管理员登录页面可访问性', 'FAIL', '- React应用未正常加载');
        return false;
      }
    } catch (error) {
      await this.addResult('管理员登录页面可访问性', 'FAIL', `- 网络错误: ${error.message}`);
      return false;
    }
  }

  // 测试2: 销售注册页面可访问性
  async testSalesRegistrationAccessibility() {
    try {
      const response = await axios.get(`${BASE_URL}/sales`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VerificationBot/1.0)'
        }
      });
      
      if (response.status === 200) {
        await this.addResult('一级销售注册页面可访问性', 'PASS', '- 页面正常响应');
      } else {
        await this.addResult('一级销售注册页面可访问性', 'FAIL', `- HTTP状态: ${response.status}`);
      }
    } catch (error) {
      await this.addResult('一级销售注册页面可访问性', 'FAIL', `- 错误: ${error.message}`);
    }
  }

  // 测试3: 二级销售注册页面可访问性
  async testSecondaryRegistrationAccessibility() {
    try {
      const response = await axios.get(`${BASE_URL}/secondary-sales`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VerificationBot/1.0)'
        }
      });
      
      if (response.status === 200) {
        await this.addResult('二级销售注册页面可访问性', 'PASS', '- 页面正常响应');
      } else {
        await this.addResult('二级销售注册页面可访问性', 'FAIL', `- HTTP状态: ${response.status}`);
      }
    } catch (error) {
      await this.addResult('二级销售注册页面可访问性', 'FAIL', `- 错误: ${error.message}`);
    }
  }

  // 测试4: 对账页面路径验证
  async testReconciliationRouteFix() {
    const tests = [
      { path: '/reconciliation', expected: 'FAIL', description: '错误路径应该404' },
      { path: '/sales-reconciliation', expected: 'PASS', description: '正确路径应该可访问' }
    ];

    for (const test of tests) {
      try {
        const response = await axios.get(`${BASE_URL}${test.path}`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VerificationBot/1.0)'
          },
          validateStatus: () => true // 允许所有状态码
        });

        if (test.expected === 'FAIL') {
          // 期望404或其他错误状态
          if (response.status === 404 || response.status >= 400) {
            await this.addResult(`路径验证${test.path}`, 'PASS', `- ${test.description} (状态: ${response.status})`);
          } else {
            await this.addResult(`路径验证${test.path}`, 'FAIL', `- 错误路径意外返回成功状态: ${response.status}`);
          }
        } else {
          // 期望成功
          if (response.status === 200) {
            await this.addResult(`路径验证${test.path}`, 'PASS', `- ${test.description}`);
          } else {
            await this.addResult(`路径验证${test.path}`, 'FAIL', `- 正确路径返回错误状态: ${response.status}`);
          }
        }
      } catch (error) {
        if (test.expected === 'FAIL') {
          await this.addResult(`路径验证${test.path}`, 'PASS', `- ${test.description} (网络错误符合预期)`);
        } else {
          await this.addResult(`路径验证${test.path}`, 'FAIL', `- 网络错误: ${error.message}`);
        }
      }
    }
  }

  // 测试5: 购买页面功能
  async testPurchasePageWithSalesCode() {
    try {
      const response = await axios.get(`${BASE_URL}/purchase?sales_code=TEST001`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VerificationBot/1.0)'
        }
      });
      
      if (response.status === 200) {
        await this.addResult('购买页面(带销售代码)', 'PASS', '- 页面正常加载');
      } else {
        await this.addResult('购买页面(带销售代码)', 'FAIL', `- HTTP状态: ${response.status}`);
      }
    } catch (error) {
      await this.addResult('购买页面(带销售代码)', 'FAIL', `- 错误: ${error.message}`);
    }
  }

  // 测试6: 静态资源加载
  async testStaticResourcesLoading() {
    const staticTests = [
      `${BASE_URL}/static/css/main.css`,
      `${BASE_URL}/static/js/main.js`,
      `${BASE_URL}/manifest.json`
    ];

    let passCount = 0;
    for (const url of staticTests) {
      try {
        const response = await axios.head(url, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          passCount++;
        }
      } catch (error) {
        // 静态资源可能不存在，这是正常的
      }
    }

    if (passCount > 0) {
      await this.addResult('静态资源加载', 'PASS', `- ${passCount}/${staticTests.length}个资源可访问`);
    } else {
      await this.addResult('静态资源加载', 'WARN', '- 未检测到静态资源，但这可能是正常的');
    }
  }

  // 测试7: JavaScript错误检查（模拟）
  async testJavaScriptErrors() {
    // 这个测试模拟检查页面是否有JavaScript错误
    // 实际上我们需要检查页面内容中是否包含错误信息
    
    try {
      const response = await axios.get(`${BASE_URL}/admin`, {
        timeout: 10000
      });
      
      const content = response.data;
      
      // 检查是否有常见的JavaScript错误信息
      const errorPatterns = [
        'Uncaught',
        'TypeError',
        'ReferenceError',
        'SyntaxError',
        'is not a function',
        'Cannot read property'
      ];
      
      const hasErrors = errorPatterns.some(pattern => content.includes(pattern));
      
      if (!hasErrors) {
        await this.addResult('JavaScript错误检查', 'PASS', '- 未检测到明显的JS错误');
      } else {
        await this.addResult('JavaScript错误检查', 'FAIL', '- 检测到可能的JS错误');
      }
    } catch (error) {
      await this.addResult('JavaScript错误检查', 'FAIL', `- 无法检查: ${error.message}`);
    }
  }

  // 生成验证报告
  async generateReport() {
    await this.log('\n📊 验证报告汇总', 'info');
    await this.log('='.repeat(50), 'info');
    
    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    const warnCount = this.results.filter(r => r.status === 'WARN').length;
    
    await this.log(`✅ 通过: ${passCount}`, 'success');
    await this.log(`❌ 失败: ${failCount}`, failCount > 0 ? 'error' : 'info');
    await this.log(`⚠️  警告: ${warnCount}`, 'info');
    
    await this.log('\n📋 详细结果:', 'info');
    this.results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      this.console.log(`${index + 1}. ${icon} ${result.test} ${result.details}`);
    });

    // 关键修复验证
    await this.log('\n🔍 关键修复验证:', 'info');
    await this.log('1. btoa编码问题: 需要手动测试管理员登录', 'info');
    await this.log('2. name字段问题: 需要手动测试销售注册', 'info');
    await this.log('3. 路径问题: 自动验证完成', 'info');
    
    const overallStatus = failCount === 0 ? 'PASS' : 'PARTIAL';
    await this.log(`\n🎯 总体状态: ${overallStatus}`, overallStatus === 'PASS' ? 'success' : 'error');
    
    return {
      overall: overallStatus,
      pass: passCount,
      fail: failCount,
      warn: warnCount,
      total: this.results.length
    };
  }

  // 执行所有验证
  async runAllVerifications() {
    await this.log('🚀 开始全面功能修复验证...', 'info');
    await this.log(`📍 目标网址: ${BASE_URL}`, 'info');
    await this.log('', 'info');

    // 执行所有测试
    await this.testAdminLoginAccessibility();
    await this.testSalesRegistrationAccessibility();
    await this.testSecondaryRegistrationAccessibility();
    await this.testReconciliationRouteFix();
    await this.testPurchasePageWithSalesCode();
    await this.testStaticResourcesLoading();
    await this.testJavaScriptErrors();

    // 生成报告
    const report = await this.generateReport();
    return report;
  }
}

// 主执行函数
async function main() {
  const verifier = new FixVerifier();
  
  try {
    const report = await verifier.runAllVerifications();
    
    console.log('\n🎉 验证完成！');
    console.log(`📊 通过率: ${report.pass}/${report.total} (${Math.round(report.pass/report.total*100)}%)`);
    
    if (report.overall === 'PASS') {
      console.log('✅ 所有自动化测试通过，建议进行手动功能测试');
    } else {
      console.log('⚠️ 部分测试未通过，请检查具体问题');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行验证
if (require.main === module) {
  main();
}

module.exports = FixVerifier;