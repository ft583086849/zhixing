const axios = require('axios');

class VercelDeploymentMonitor {
  constructor() {
    this.baseURL = 'https://zhixing-seven.vercel.app';
    this.results = {
      health: false,
      frontend: false,
      api: false,
      auth: false,
      sales: false,
      orders: false,
      admin: false
    };
  }

  async monitorDeployment() {
    console.log('🔍 开始监控Vercel部署状态...');
    console.log('=' * 60);
    
    try {
      // 1. 检查健康状态
      await this.checkHealth();
      
      // 2. 检查前端页面
      await this.checkFrontend();
      
      // 3. 检查API功能
      await this.checkAPIs();
      
      // 4. 检查核心业务功能
      await this.checkCoreFunctions();
      
      // 5. 输出结果
      this.printResults();
      
    } catch (error) {
      console.error('❌ 监控过程中发生错误:', error.message);
    }
  }

  async checkHealth() {
    console.log('\n🏥 检查健康状态...');
    try {
      const response = await axios.get(`${this.baseURL}/api/health`);
      if (response.data.success) {
        this.results.health = true;
        console.log('   ✅ 健康检查通过');
        console.log(`   📊 服务状态: ${response.data.data.status}`);
        console.log(`   🕐 时间戳: ${response.data.data.timestamp}`);
        console.log(`   🗄️ 数据库: ${response.data.data.database.message}`);
      } else {
        console.log('   ❌ 健康检查失败');
      }
    } catch (error) {
      console.log('   ❌ 健康检查失败:', error.message);
    }
  }

  async checkFrontend() {
    console.log('\n🌐 检查前端页面...');
    try {
      const response = await axios.get(this.baseURL);
      if (response.status === 200) {
        this.results.frontend = true;
        console.log('   ✅ 前端页面加载成功');
        console.log(`   📄 内容类型: ${response.headers['content-type']}`);
        console.log(`   📏 内容长度: ${response.headers['content-length']} bytes`);
      } else {
        console.log('   ❌ 前端页面加载失败');
      }
    } catch (error) {
      console.log('   ❌ 前端页面加载失败:', error.message);
    }
  }

  async checkAPIs() {
    console.log('\n🔌 检查API功能...');
    
    // 检查认证API
    try {
      const response = await axios.post(`${this.baseURL}/api/auth?path=login`, {
        username: '知行',
        password: 'Zhixing Universal Trading Signal'
      });
      if (response.data.success) {
        this.results.auth = true;
        console.log('   ✅ 认证API正常');
      } else {
        console.log('   ⚠️ 认证API响应异常:', response.data.message);
      }
    } catch (error) {
      console.log('   ❌ 认证API失败:', error.message);
    }

    // 检查销售API
    try {
      const response = await axios.get(`${this.baseURL}/api/sales?path=list`);
      if (response.status === 200) {
        this.results.sales = true;
        console.log('   ✅ 销售API正常');
      } else {
        console.log('   ⚠️ 销售API响应异常');
      }
    } catch (error) {
      console.log('   ❌ 销售API失败:', error.message);
    }

    // 检查订单API
    try {
      const response = await axios.get(`${this.baseURL}/api/orders?path=list`);
      if (response.status === 200) {
        this.results.orders = true;
        console.log('   ✅ 订单API正常');
      } else {
        console.log('   ⚠️ 订单API响应异常');
      }
    } catch (error) {
      console.log('   ❌ 订单API失败:', error.message);
    }

    // 检查管理员API
    try {
      const response = await axios.get(`${this.baseURL}/api/admin?path=stats`);
      if (response.status === 200) {
        this.results.admin = true;
        console.log('   ✅ 管理员API正常');
      } else {
        console.log('   ⚠️ 管理员API响应异常');
      }
    } catch (error) {
      console.log('   ❌ 管理员API失败:', error.message);
    }
  }

  async checkCoreFunctions() {
    console.log('\n🎯 检查核心业务功能...');
    
    // 检查一级销售API
    try {
      const response = await axios.get(`${this.baseURL}/api/primary-sales?path=list`);
      if (response.status === 200) {
        console.log('   ✅ 一级销售功能正常');
      } else {
        console.log('   ⚠️ 一级销售功能异常');
      }
    } catch (error) {
      console.log('   ❌ 一级销售功能失败:', error.message);
    }

    // 检查二级销售API
    try {
      const response = await axios.get(`${this.baseURL}/api/secondary-sales?path=list`);
      if (response.status === 200) {
        console.log('   ✅ 二级销售功能正常');
      } else {
        console.log('   ⚠️ 二级销售功能异常');
      }
    } catch (error) {
      console.log('   ❌ 二级销售功能失败:', error.message);
    }

    // 检查销售层级API
    try {
      const response = await axios.get(`${this.baseURL}/api/sales-hierarchy?path=list`);
      if (response.status === 200) {
        console.log('   ✅ 销售层级功能正常');
      } else {
        console.log('   ⚠️ 销售层级功能异常');
      }
    } catch (error) {
      console.log('   ❌ 销售层级功能失败:', error.message);
    }

    // 检查订单佣金API
    try {
      const response = await axios.get(`${this.baseURL}/api/orders-commission?path=list`);
      if (response.status === 200) {
        console.log('   ✅ 订单佣金功能正常');
      } else {
        console.log('   ⚠️ 订单佣金功能异常');
      }
    } catch (error) {
      console.log('   ❌ 订单佣金功能失败:', error.message);
    }
  }

  printResults() {
    console.log('\n' + '=' * 60);
    console.log('📊 Vercel部署监控结果汇总');
    console.log('=' * 60);
    
    const totalChecks = Object.keys(this.results).length;
    const passedChecks = Object.values(this.results).filter(Boolean).length;
    const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
    
    console.log(`\n📈 检查统计:`);
    console.log(`   总检查项: ${totalChecks}`);
    console.log(`   通过: ${passedChecks} ✅`);
    console.log(`   失败: ${totalChecks - passedChecks} ❌`);
    console.log(`   成功率: ${successRate}%`);
    
    console.log(`\n🔍 详细结果:`);
    Object.entries(this.results).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const name = this.getCheckName(key);
      console.log(`   ${status} ${name}`);
    });
    
    if (successRate >= 80) {
      console.log(`\n🎉 部署成功！成功率${successRate}%，可以进入第5阶段测试和优化`);
      console.log('\n📝 下一步建议:');
      console.log('   1. 运行端到端测试验证完整业务流程');
      console.log('   2. 进行性能测试和用户体验优化');
      console.log('   3. 准备生产环境部署');
    } else {
      console.log(`\n⚠️ 部署存在问题，成功率${successRate}%，需要进一步排查`);
      console.log('\n🔧 建议操作:');
      console.log('   1. 检查Vercel构建日志');
      console.log('   2. 验证环境变量配置');
      console.log('   3. 检查API路径和参数');
    }
    
    console.log('\n' + '=' * 60);
  }

  getCheckName(key) {
    const names = {
      health: '健康检查',
      frontend: '前端页面',
      api: 'API基础功能',
      auth: '认证功能',
      sales: '销售功能',
      orders: '订单功能',
      admin: '管理功能'
    };
    return names[key] || key;
  }
}

// 运行监控
async function main() {
  const monitor = new VercelDeploymentMonitor();
  await monitor.monitorDeployment();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = VercelDeploymentMonitor; 