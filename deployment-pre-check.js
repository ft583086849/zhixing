#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DeploymentPreCheck {
  constructor() {
    this.issues = [];
    this.solutions = [];
    this.checkResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runAllChecks() {
    console.log('🔍 开始部署前错题本检查...');
    console.log('=' * 60);
    
    // 1. 架构问题检查
    await this.checkArchitectureIssues();
    
    // 2. API路径问题检查
    await this.checkAPIPathIssues();
    
    // 3. Vercel配置问题检查
    await this.checkVercelConfigIssues();
    
    // 4. 数据库连接问题检查
    await this.checkDatabaseIssues();
    
    // 5. 前端集成问题检查
    await this.checkFrontendIssues();
    
    // 6. Serverless函数数量检查
    await this.checkServerlessFunctionCount();
    
    // 7. 环境变量检查
    await this.checkEnvironmentVariables();
    
    // 8. 代码质量检查
    await this.checkCodeQuality();
    
    // 输出检查结果
    this.printResults();
    
    return this.checkResults.failed === 0;
  }

  async checkArchitectureIssues() {
    console.log('\n🏗️ 检查架构问题...');
    
    // 检查是否还有Express架构残留
    const serverDir = path.join(__dirname, 'server');
    const apiDir = path.join(__dirname, 'api');
    
    if (fs.existsSync(serverDir)) {
      const serverFiles = fs.readdirSync(serverDir);
      if (serverFiles.length > 0) {
        this.addIssue('架构问题', 'server目录仍然存在，可能包含Express架构残留', '删除server目录或确保不使用Express架构');
      } else {
        this.addPass('架构问题', 'server目录为空或不存在，符合Serverless架构');
      }
    } else {
      this.addPass('架构问题', 'server目录不存在，符合Serverless架构');
    }
    
    // 检查API目录是否存在
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));
      if (apiFiles.length > 0) {
        this.addPass('架构问题', `API目录存在，包含${apiFiles.length}个Serverless函数`);
      } else {
        this.addIssue('架构问题', 'API目录为空，缺少Serverless函数', '创建必要的API文件');
      }
    } else {
      this.addIssue('架构问题', 'API目录不存在', '创建api目录和必要的Serverless函数');
    }
  }

  async checkAPIPathIssues() {
    console.log('\n🔗 检查API路径问题...');
    
    // 检查前端API调用格式
    const apiServicePath = path.join(__dirname, 'client', 'src', 'services', 'api.js');
    if (fs.existsSync(apiServicePath)) {
      const apiContent = fs.readFileSync(apiServicePath, 'utf8');
      
      // 检查是否使用查询参数格式
      if (apiContent.includes('?path=')) {
        this.addPass('API路径问题', '前端API调用使用正确的查询参数格式');
      } else {
        this.addIssue('API路径问题', '前端API调用可能未使用查询参数格式', '修改API调用为?path=xxx格式');
      }
      
      // 检查API路径是否匹配
      const expectedAPIs = ['/auth', '/sales', '/orders', '/admin', '/payment-config'];
      const missingAPIs = expectedAPIs.filter(api => !apiContent.includes(api));
      
      if (missingAPIs.length === 0) {
        this.addPass('API路径问题', '所有必需的API路径都已在前端配置');
      } else {
        this.addIssue('API路径问题', `缺少API路径: ${missingAPIs.join(', ')}`, '添加缺失的API路径配置');
      }
    } else {
      this.addIssue('API路径问题', '前端API服务文件不存在', '创建client/src/services/api.js文件');
    }
  }

  async checkVercelConfigIssues() {
    console.log('\n⚙️ 检查Vercel配置问题...');
    
    const vercelConfigPath = path.join(__dirname, 'vercel.json');
    if (fs.existsSync(vercelConfigPath)) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        
        // 检查构建配置
        if (vercelConfig.buildCommand && vercelConfig.outputDirectory) {
          this.addPass('Vercel配置问题', '构建配置正确');
        } else {
          this.addIssue('Vercel配置问题', '缺少构建配置', '添加buildCommand和outputDirectory配置');
        }
        
        // 检查是否有多余的配置
        if (vercelConfig.routes || vercelConfig.functions) {
          this.addIssue('Vercel配置问题', '包含可能冲突的routes或functions配置', '移除routes和functions配置，使用默认Serverless处理');
        } else {
          this.addPass('Vercel配置问题', 'Vercel配置简洁，无冲突配置');
        }
        
      } catch (error) {
        this.addIssue('Vercel配置问题', 'vercel.json格式错误', '修复JSON格式错误');
      }
    } else {
      this.addIssue('Vercel配置问题', 'vercel.json文件不存在', '创建vercel.json配置文件');
    }
  }

  async checkDatabaseIssues() {
    console.log('\n🗄️ 检查数据库连接问题...');
    
    // 检查API文件中的数据库连接
    const apiDir = path.join(__dirname, 'api');
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));
      
      for (const file of apiFiles) {
        const filePath = path.join(apiDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否使用mysql2连接
        if (content.includes('mysql2')) {
          this.addPass('数据库连接问题', `${file}使用正确的mysql2连接`);
        } else if (content.includes('sequelize')) {
          this.addIssue('数据库连接问题', `${file}仍在使用Sequelize`, '将Sequelize替换为mysql2连接');
        }
        
        // 检查环境变量使用
        if (content.includes('process.env.DB_')) {
          this.addPass('数据库连接问题', `${file}正确使用环境变量`);
        } else {
          this.addIssue('数据库连接问题', `${file}可能未使用环境变量`, '确保使用process.env.DB_*环境变量');
        }
      }
    }
  }

  async checkFrontendIssues() {
    console.log('\n🎨 检查前端集成问题...');
    
    // 检查页面标题配置
    const salesPagePath = path.join(__dirname, 'client', 'src', 'pages', 'SalesPage.js');
    const adminPagePath = path.join(__dirname, 'client', 'src', 'pages', 'AdminDashboardPage.js');
    
    let titleConfigCorrect = true;
    
    if (fs.existsSync(salesPagePath)) {
      const salesContent = fs.readFileSync(salesPagePath, 'utf8');
      if (!salesContent.includes('document.title = \'销售页面\'')) {
        titleConfigCorrect = false;
      }
    } else {
      titleConfigCorrect = false;
    }
    
    if (fs.existsSync(adminPagePath)) {
      const adminContent = fs.readFileSync(adminPagePath, 'utf8');
      if (!adminContent.includes('document.title = \'知行财库\'')) {
        titleConfigCorrect = false;
      }
    } else {
      titleConfigCorrect = false;
    }
    
    if (titleConfigCorrect) {
      this.addPass('前端集成问题', '页面标题配置正确');
    } else {
      this.addIssue('前端集成问题', '页面标题可能未正确配置', '确保销售页面="销售页面", 管理页面="知行财库"');
    }
    
    // 检查客户端构建配置
    const clientPackagePath = path.join(__dirname, 'client', 'package.json');
    if (fs.existsSync(clientPackagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts.build) {
        this.addPass('前端集成问题', '客户端构建脚本配置正确');
      } else {
        this.addIssue('前端集成问题', '缺少客户端构建脚本', '在client/package.json中添加build脚本');
      }
    }
  }

  async checkServerlessFunctionCount() {
    console.log('\n📊 检查Serverless函数数量...');
    
    const apiDir = path.join(__dirname, 'api');
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));
      
      if (apiFiles.length <= 12) {
        this.addPass('Serverless函数数量', `API文件数量: ${apiFiles.length}，符合Vercel Hobby计划限制`);
      } else {
        this.addIssue('Serverless函数数量', `API文件数量: ${apiFiles.length}，超过Vercel Hobby计划12个限制`, '删除不必要的API文件，保留核心业务API');
      }
      
      // 列出所有API文件
      console.log(`   API文件列表: ${apiFiles.join(', ')}`);
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n🔐 检查环境变量配置...');
    
    // 检查必需的环境变量
    const requiredEnvVars = [
      'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
      'NODE_ENV', 'JWT_EXPIRES_IN', 'CORS_ORIGIN'
    ];
    
    // 检查API文件中的环境变量使用
    const apiDir = path.join(__dirname, 'api');
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));
      let envVarsUsed = new Set();
      
      for (const file of apiFiles) {
        const filePath = path.join(apiDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        requiredEnvVars.forEach(envVar => {
          if (content.includes(`process.env.${envVar}`)) {
            envVarsUsed.add(envVar);
          }
        });
      }
      
      const missingEnvVars = requiredEnvVars.filter(envVar => !envVarsUsed.has(envVar));
      
      if (missingEnvVars.length === 0) {
        this.addPass('环境变量配置', '所有必需的环境变量都在代码中使用');
      } else {
        this.addIssue('环境变量配置', `缺少环境变量使用: ${missingEnvVars.join(', ')}`, '在API代码中添加缺失的环境变量使用');
      }
    }
  }

  async checkCodeQuality() {
    console.log('\n✨ 检查代码质量...');
    
    // 检查语法错误
    const apiDir = path.join(__dirname, 'api');
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));
      
      for (const file of apiFiles) {
        const filePath = path.join(apiDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          // 简单的语法检查
          if (content.includes('module.exports') || content.includes('export default')) {
            this.addPass('代码质量', `${file}语法结构正确`);
          } else {
            this.addIssue('代码质量', `${file}可能缺少导出语句`, '确保文件有正确的module.exports或export default');
          }
        } catch (error) {
          this.addIssue('代码质量', `${file}读取失败: ${error.message}`, '检查文件是否存在语法错误');
        }
      }
    }
    
    // 检查是否有临时测试文件
    const tempFiles = ['test.js', 'simple-test.js', 'debug.js'];
    const apiDir2 = path.join(__dirname, 'api');
    if (fs.existsSync(apiDir2)) {
      const apiFiles = fs.readdirSync(apiDir2);
      const foundTempFiles = tempFiles.filter(file => apiFiles.includes(file));
      
      if (foundTempFiles.length === 0) {
        this.addPass('代码质量', '没有发现临时测试文件');
      } else {
        this.addIssue('代码质量', `发现临时文件: ${foundTempFiles.join(', ')}`, '删除临时测试文件，保持代码整洁');
      }
    }
  }

  addPass(category, message) {
    this.checkResults.passed++;
    this.checkResults.total++;
    console.log(`   ✅ ${category}: ${message}`);
  }

  addIssue(category, message, solution) {
    this.checkResults.failed++;
    this.checkResults.total++;
    this.issues.push({ category, message, solution });
    console.log(`   ❌ ${category}: ${message}`);
    console.log(`      💡 解决方案: ${solution}`);
  }

  printResults() {
    console.log('\n' + '=' * 60);
    console.log('📋 部署前检查结果汇总');
    console.log('=' * 60);
    
    console.log(`\n📊 检查统计:`);
    console.log(`   总检查项: ${this.checkResults.total}`);
    console.log(`   通过: ${this.checkResults.passed} ✅`);
    console.log(`   失败: ${this.checkResults.failed} ❌`);
    console.log(`   通过率: ${((this.checkResults.passed / this.checkResults.total) * 100).toFixed(1)}%`);
    
    if (this.issues.length > 0) {
      console.log(`\n🚨 发现的问题:`);
      this.issues.forEach((issue, index) => {
        console.log(`\n   ${index + 1}. ${issue.category}`);
        console.log(`      问题: ${issue.message}`);
        console.log(`      解决: ${issue.solution}`);
      });
      
      console.log(`\n⚠️  部署建议: 请先解决上述问题，然后再进行部署`);
    } else {
      console.log(`\n🎉 所有检查通过！可以安全部署`);
    }
    
    console.log('\n' + '=' * 60);
  }
}

// 运行检查
async function main() {
  const checker = new DeploymentPreCheck();
  const canDeploy = await checker.runAllChecks();
  
  if (canDeploy) {
    console.log('\n🚀 错题本检查完成，所有问题已解决，可以进入第5阶段！');
    console.log('\n📝 下一步建议:');
    console.log('   1. 提交当前代码修改');
    console.log('   2. 推送到GitHub触发Vercel部署');
    console.log('   3. 运行端到端测试验证功能');
    console.log('   4. 开始第5阶段：测试和优化');
  } else {
    console.log('\n⚠️  错题本检查发现问题，请先解决后再部署');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeploymentPreCheck; 