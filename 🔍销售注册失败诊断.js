#!/usr/bin/env node

/**
 * 销售注册失败诊断脚本
 * 分析一级销售和二级销售注册失败的具体原因
 */

const axios = require('axios');

const BASE_URL = 'https://zhixing-seven.vercel.app';

class SalesRegistrationDiagnostic {
  constructor() {
    this.errors = [];
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : '🔍';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async addError(test, error) {
    this.errors.push({ test, error, timestamp: new Date().toISOString() });
    await this.log(`${test}: ${error}`, 'error');
  }

  // 测试1: 一级销售注册API调用
  async testPrimarySalesRegistration() {
    await this.log('🔍 测试一级销售注册流程...', 'info');
    
    const testData = {
      wechat_name: 'test_primary_' + Date.now(),
      name: '测试用户',
      payment_method: 'alipay',
      payment_address: 'test@example.com'
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/sales/create`, testData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.data.success) {
        await this.log('一级销售注册: 成功', 'success');
        return true;
      } else {
        await this.addError('一级销售注册', response.data.message || '未知错误');
        return false;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      await this.addError('一级销售注册', `网络/API错误: ${errorMsg}`);
      return false;
    }
  }

  // 测试2: 二级销售独立注册API调用
  async testSecondarySalesRegistration() {
    await this.log('🔍 测试二级销售独立注册流程...', 'info');
    
    const testData = {
      wechat_name: 'test_secondary_' + Date.now(),
      alipay_surname: '测试姓氏',
      payment_method: 'alipay',
      payment_address: 'test2@example.com'
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/secondary-sales?path=register-independent`, testData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.data.success) {
        await this.log('二级销售独立注册: 成功', 'success');
        return true;
      } else {
        await this.addError('二级销售独立注册', response.data.message || '未知错误');
        return false;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      await this.addError('二级销售独立注册', `网络/API错误: ${errorMsg}`);
      return false;
    }
  }

  // 测试3: 检查API端点是否存在
  async testApiEndpoints() {
    await this.log('🔍 检查API端点可用性...', 'info');
    
    const endpoints = [
      { name: '一级销售API', url: `${BASE_URL}/api/sales/create` },
      { name: '二级销售API', url: `${BASE_URL}/api/secondary-sales` }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.options(endpoint.url, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        if (response.status === 200 || response.status === 405) {
          await this.log(`${endpoint.name}: 端点存在`, 'success');
        } else {
          await this.addError(endpoint.name, `端点不可用 (状态: ${response.status})`);
        }
      } catch (error) {
        await this.addError(endpoint.name, `端点检查失败: ${error.message}`);
      }
    }
  }

  // 测试4: 数据库字段匹配性检查
  async testFieldMapping() {
    await this.log('🔍 检查数据库字段映射...', 'info');
    
    // 模拟不同字段名的请求
    const fieldTests = [
      { 
        name: '一级销售name字段', 
        data: { wechat_name: 'test', name: '测试', payment_method: 'alipay', payment_address: 'test@test.com' },
        url: `${BASE_URL}/api/sales/create`
      },
      { 
        name: '一级销售alipay_surname字段', 
        data: { wechat_name: 'test2', alipay_surname: '测试', payment_method: 'alipay', payment_address: 'test2@test.com' },
        url: `${BASE_URL}/api/sales/create`
      }
    ];

    for (const test of fieldTests) {
      try {
        const response = await axios.post(test.url, test.data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        });

        if (response.status === 200 && response.data.success) {
          await this.log(`${test.name}: 字段映射正确`, 'success');
        } else {
          const error = response.data?.message || `HTTP ${response.status}`;
          await this.addError(test.name, `字段映射问题: ${error}`);
        }
      } catch (error) {
        await this.addError(test.name, `字段测试失败: ${error.message}`);
      }
    }
  }

  // 生成诊断报告
  async generateReport() {
    await this.log('\n📊 销售注册失败诊断报告', 'info');
    await this.log('='.repeat(50), 'info');
    
    if (this.errors.length === 0) {
      await this.log('✅ 所有测试通过，未发现明显问题', 'success');
    } else {
      await this.log(`❌ 发现 ${this.errors.length} 个问题:`, 'error');
      
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    await this.log('\n🔍 可能的解决方案:', 'info');
    await this.log('1. 检查数据库表结构和字段约束', 'info');
    await this.log('2. 验证API路由和处理逻辑', 'info');
    await this.log('3. 检查前端表单字段名与后端期望的匹配性', 'info');
    await this.log('4. 查看Supabase/数据库错误日志', 'info');
    
    return this.errors;
  }

  // 执行所有诊断
  async runDiagnostics() {
    await this.log('🚀 开始销售注册失败诊断...', 'info');
    await this.log(`📍 目标网址: ${BASE_URL}`, 'info');
    await this.log('', 'info');

    // 执行所有测试
    await this.testApiEndpoints();
    await this.testFieldMapping();
    await this.testPrimarySalesRegistration();
    await this.testSecondarySalesRegistration();

    // 生成报告
    const errors = await this.generateReport();
    return errors;
  }
}

// 主执行函数
async function main() {
  const diagnostic = new SalesRegistrationDiagnostic();
  
  try {
    const errors = await diagnostic.runDiagnostics();
    
    console.log('\n🎯 诊断完成！');
    
    if (errors.length === 0) {
      console.log('✅ 未发现明显问题，可能是临时网络问题或用户操作问题');
    } else {
      console.log(`⚠️ 发现 ${errors.length} 个问题需要修复`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行诊断
if (require.main === module) {
  main();
}

module.exports = SalesRegistrationDiagnostic;