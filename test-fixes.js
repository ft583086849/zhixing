const axios = require('axios');

class FixVerificationTest {
  constructor() {
    this.baseURL = 'https://zhixing-seven.vercel.app/api';
    this.adminToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async start() {
    console.log('🔧 开始验证API修复效果');
    console.log('=' * 60);

    try {
      // 1. 测试认证功能
      await this.testAuth();
      
      // 2. 测试权限控制
      await this.testAuthControl();
      
      // 3. 测试管理员API
      await this.testAdminAPI();
      
      // 4. 测试一级销售结算
      await this.testPrimarySalesSettlement();
      
      // 5. 测试佣金统计
      await this.testCommissionStats();
      
      // 6. 测试销售层级关系
      await this.testSalesHierarchy();
      
      // 7. 测试数据导出
      await this.testDataExport();
      
      // 输出结果
      this.printResults();
      
    } catch (error) {
      console.error('❌ 验证测试失败:', error.message);
    }
  }

  async testAuth() {
    console.log('\n🔐 测试认证功能');
    
    try {
      const response = await axios.post(`${this.baseURL}/auth?path=login`, {
        username: '知行',
        password: 'Zhixing Universal Trading Signal'
      });
      
      if (response.data.success && response.data.data?.token) {
        this.adminToken = response.data.data.token;
        console.log('✅ 认证成功，获取到Token');
        this.testResults.passed++;
      } else {
        throw new Error('认证失败');
      }
    } catch (error) {
      console.log('❌ 认证失败:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`认证失败: ${error.message}`);
    }
  }

  async testAuthControl() {
    console.log('\n🚫 测试权限控制');
    
    try {
      // 测试未认证访问
      await axios.get(`${this.baseURL}/admin?path=stats`);
      throw new Error('未认证访问应该被拒绝');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 权限控制正常，未认证访问被拒绝');
        this.testResults.passed++;
      } else {
        console.log('❌ 权限控制异常:', error.message);
        this.testResults.failed++;
        this.testResults.errors.push(`权限控制异常: ${error.message}`);
      }
    }
  }

  async testAdminAPI() {
    console.log('\n👨‍💼 测试管理员API');
    
    if (!this.adminToken) {
      console.log('❌ 跳过管理员API测试，无Token');
      this.testResults.failed++;
      return;
    }

    const endpoints = [
      { path: 'stats', name: '统计数据' },
      { path: 'overview', name: '概览数据' },
      { path: 'orders', name: '订单管理' },
      { path: 'sales', name: '销售管理' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.baseURL}/admin?path=${endpoint.path}`, {
          headers: { 'Authorization': `Bearer ${this.adminToken}` }
        });
        
        if (response.data.success) {
          console.log(`✅ ${endpoint.name} API正常`);
          this.testResults.passed++;
        } else {
          throw new Error(`${endpoint.name} API返回失败`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} API失败:`, error.message);
        this.testResults.failed++;
        this.testResults.errors.push(`${endpoint.name} API失败: ${error.message}`);
      }
    }
  }

  async testPrimarySalesSettlement() {
    console.log('\n💰 测试一级销售结算');
    
    if (!this.adminToken) {
      console.log('❌ 跳过一级销售结算测试，无Token');
      this.testResults.failed++;
      return;
    }

    try {
      const response = await axios.get(`${this.baseURL}/primary-sales?path=settlement`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.data.success) {
        console.log('✅ 一级销售结算API正常');
        this.testResults.passed++;
      } else {
        throw new Error('一级销售结算API返回失败');
      }
    } catch (error) {
      console.log('❌ 一级销售结算API失败:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`一级销售结算API失败: ${error.message}`);
    }
  }

  async testCommissionStats() {
    console.log('\n📊 测试佣金统计');
    
    if (!this.adminToken) {
      console.log('❌ 跳过佣金统计测试，无Token');
      this.testResults.failed++;
      return;
    }

    try {
      const response = await axios.get(`${this.baseURL}/orders-commission?path=stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.data.success) {
        console.log('✅ 佣金统计API正常');
        this.testResults.passed++;
      } else {
        throw new Error('佣金统计API返回失败');
      }
    } catch (error) {
      console.log('❌ 佣金统计API失败:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`佣金统计API失败: ${error.message}`);
    }
  }

  async testSalesHierarchy() {
    console.log('\n🏗️ 测试销售层级关系');
    
    if (!this.adminToken) {
      console.log('❌ 跳过销售层级关系测试，无Token');
      this.testResults.failed++;
      return;
    }

    try {
      const response = await axios.get(`${this.baseURL}/sales-hierarchy?path=relationships`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.data.success) {
        console.log('✅ 销售层级关系API正常');
        this.testResults.passed++;
      } else {
        throw new Error('销售层级关系API返回失败');
      }
    } catch (error) {
      console.log('❌ 销售层级关系API失败:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`销售层级关系API失败: ${error.message}`);
    }
  }

  async testDataExport() {
    console.log('\n📤 测试数据导出');
    
    if (!this.adminToken) {
      console.log('❌ 跳过数据导出测试，无Token');
      this.testResults.failed++;
      return;
    }

    try {
      const response = await axios.get(`${this.baseURL}/admin?path=export`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      if (response.data.success) {
        console.log('✅ 数据导出API正常');
        this.testResults.passed++;
      } else {
        throw new Error('数据导出API返回失败');
      }
    } catch (error) {
      console.log('❌ 数据导出API失败:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`数据导出API失败: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n📊 修复验证结果');
    console.log('=' * 60);
    console.log(`✅ 通过测试: ${this.testResults.passed}`);
    console.log(`❌ 失败测试: ${this.testResults.failed}`);
    console.log(`📈 成功率: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n🚨 错误详情:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.testResults.passed > this.testResults.failed) {
      console.log('\n🎉 修复验证成功！大部分问题已解决');
    } else {
      console.log('\n⚠️ 修复验证失败，需要进一步调试');
    }
  }
}

async function main() {
  const test = new FixVerificationTest();
  await test.start();
}

main().catch(console.error); 