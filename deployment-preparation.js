const fs = require('fs');
const path = require('path');

console.log('🚀 知行财库部署准备检查\n');

// 检查结果
const checkResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logCheck(name, passed, details = '') {
  checkResults.total++;
  if (passed) {
    checkResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    checkResults.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
  checkResults.details.push({ name, passed, details });
}

// 检查文件是否存在
function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  logCheck(description, exists, exists ? `文件存在: ${filePath}` : `文件缺失: ${filePath}`);
  return exists;
}

// 检查环境变量配置
function checkEnvironmentConfig() {
  console.log('\n🔧 1. 环境配置检查');
  
  // 检查服务器环境配置
  const serverEnvExists = checkFileExists('./server/.env', '服务器环境配置文件');
  const serverEnvExampleExists = checkFileExists('./server/env.production.example', '服务器生产环境配置示例');
  
  // 检查客户端环境配置
  const clientEnvExists = checkFileExists('./client/.env', '客户端环境配置文件');
  const clientEnvExampleExists = checkFileExists('./client/.env.example', '客户端环境配置示例');
  
  return serverEnvExists && serverEnvExampleExists && clientEnvExists && clientEnvExampleExists;
}

// 检查数据库配置
function checkDatabaseConfig() {
  console.log('\n🗄️  2. 数据库配置检查');
  
  const dbConfigExists = checkFileExists('./server/config/database.js', '数据库配置文件');
  const modelsExist = checkFileExists('./server/models/index.js', '数据模型文件');
  
  // 检查数据库迁移文件
  const migrationsExist = checkFileExists('./server/scripts/migrate.js', '数据库迁移脚本');
  
  return dbConfigExists && modelsExist && migrationsExist;
}

// 检查安全配置
function checkSecurityConfig() {
  console.log('\n🔒 3. 安全配置检查');
  
  // 检查认证中间件
  const authMiddlewareExists = checkFileExists('./server/middleware/auth.js', '认证中间件');
  
  // 检查JWT配置
  const serverIndexExists = checkFileExists('./server/index.js', '服务器入口文件');
  
  // 检查文件上传安全配置
  const uploadsDirExists = checkFileExists('./server/uploads', '文件上传目录');
  
  return authMiddlewareExists && serverIndexExists && uploadsDirExists;
}

// 检查前端配置
function checkFrontendConfig() {
  console.log('\n🌐 4. 前端配置检查');
  
  // 检查主要配置文件
  const packageJsonExists = checkFileExists('./client/package.json', '前端package.json');
  const indexHtmlExists = checkFileExists('./client/public/index.html', '前端入口HTML');
  const appJsExists = checkFileExists('./client/src/App.js', '前端主应用文件');
  
  // 检查路由配置
  const routesExist = checkFileExists('./client/src/pages', '前端页面目录');
  
  // 检查状态管理
  const storeExists = checkFileExists('./client/src/store/index.js', 'Redux状态管理');
  
  return packageJsonExists && indexHtmlExists && appJsExists && routesExist && storeExists;
}

// 检查API配置
function checkAPIConfig() {
  console.log('\n🔌 5. API配置检查');
  
  // 检查API服务文件
  const apiServiceExists = checkFileExists('./client/src/services/api.js', 'API服务文件');
  
  // 检查后端路由
  const routesDirExists = checkFileExists('./server/routes', '后端路由目录');
  const authRouteExists = checkFileExists('./server/routes/auth.js', '认证路由');
  const adminRouteExists = checkFileExists('./server/routes/admin.js', '管理员路由');
  const ordersRouteExists = checkFileExists('./server/routes/orders.js', '订单路由');
  const salesRouteExists = checkFileExists('./server/routes/sales.js', '销售路由');
  
  return apiServiceExists && routesDirExists && authRouteExists && adminRouteExists && ordersRouteExists && salesRouteExists;
}

// 检查部署脚本
function checkDeploymentScripts() {
  console.log('\n📦 6. 部署脚本检查');
  
  const deployScriptExists = checkFileExists('./deploy.sh', '部署脚本');
  const deploySqliteScriptExists = checkFileExists('./deploy-sqlite.sh', 'SQLite部署脚本');
  const startScriptExists = checkFileExists('./start.sh', '启动脚本');
  
  return deployScriptExists && deploySqliteScriptExists && startScriptExists;
}

// 检查文档
function checkDocumentation() {
  console.log('\n📚 7. 文档检查');
  
  const readmeExists = checkFileExists('./README.md', '项目README');
  const requirementsExists = checkFileExists('./支付管理系统需求文档.md', '需求文档');
  const developmentExists = checkFileExists('./开发文档.md', '开发文档');
  
  return readmeExists && requirementsExists && developmentExists;
}

// 检查依赖配置
function checkDependencies() {
  console.log('\n📋 8. 依赖配置检查');
  
  const rootPackageExists = checkFileExists('./package.json', '根目录package.json');
  const serverPackageExists = checkFileExists('./server/package.json', '服务器package.json');
  const clientPackageExists = checkFileExists('./client/package.json', '客户端package.json');
  
  // 检查package-lock.json文件
  const rootLockExists = checkFileExists('./package-lock.json', '根目录package-lock.json');
  const serverLockExists = checkFileExists('./server/package-lock.json', '服务器package-lock.json');
  const clientLockExists = checkFileExists('./client/package-lock.json', '客户端package-lock.json');
  
  return rootPackageExists && serverPackageExists && clientPackageExists && 
         rootLockExists && serverLockExists && clientLockExists;
}

// 生成部署清单
function generateDeploymentChecklist() {
  console.log('\n📋 9. 生成部署清单');
  
  const checklist = `
# 知行财库部署清单

## 环境准备
- [ ] 服务器环境（Node.js 18+）
- [ ] 数据库（MySQL 8.0+ 或 SQLite）
- [ ] 域名和DNS配置
- [ ] SSL证书
- [ ] 防火墙配置

## 环境变量配置
- [ ] 服务器 .env 文件配置
- [ ] 客户端 .env 文件配置
- [ ] 数据库连接配置
- [ ] JWT密钥配置
- [ ] 文件上传路径配置

## 数据库准备
- [ ] 创建数据库
- [ ] 运行数据库迁移
- [ ] 初始化管理员账户
- [ ] 测试数据库连接

## 部署步骤
- [ ] 上传代码到服务器
- [ ] 安装依赖（npm install）
- [ ] 构建前端（npm run build）
- [ ] 配置PM2或类似进程管理器
- [ ] 配置Nginx反向代理
- [ ] 启动服务

## 测试验证
- [ ] 管理员登录测试
- [ ] 销售链接生成测试
- [ ] 用户购买流程测试
- [ ] 订单管理功能测试
- [ ] 数据导出功能测试
- [ ] 文件上传功能测试

## 监控和日志
- [ ] 配置日志记录
- [ ] 设置错误监控
- [ ] 配置性能监控
- [ ] 设置备份策略

## 安全配置
- [ ] 配置HTTPS
- [ ] 设置CORS策略
- [ ] 配置文件上传限制
- [ ] 设置API访问限制
- [ ] 配置数据库访问权限
`;

  fs.writeFileSync('./deployment-checklist.md', checklist);
  logCheck('生成部署清单', true, '已生成 deployment-checklist.md 文件');
  
  return true;
}

// 生成生产环境配置示例
function generateProductionConfig() {
  console.log('\n⚙️  10. 生成生产环境配置示例');
  
  const serverEnvExample = `
# 生产环境配置示例
NODE_ENV=production
PORT=5000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zhixing_treasury
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 跨域配置
CORS_ORIGIN=https://yourdomain.com

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
`;

  const clientEnvExample = `
# 客户端生产环境配置
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
`;

  try {
    fs.writeFileSync('./server/env.production.example', serverEnvExample);
    fs.writeFileSync('./client/.env.production.example', clientEnvExample);
    
    logCheck('生成生产环境配置示例', true, '已生成服务器和客户端生产环境配置示例');
    return true;
  } catch (error) {
    logCheck('生成生产环境配置示例', false, error.message);
    return false;
  }
}

async function runDeploymentPreparation() {
  console.log('🔍 开始部署准备检查...\n');
  
  // 运行各项检查
  checkEnvironmentConfig();
  checkDatabaseConfig();
  checkSecurityConfig();
  checkFrontendConfig();
  checkAPIConfig();
  checkDeploymentScripts();
  checkDocumentation();
  checkDependencies();
  generateDeploymentChecklist();
  generateProductionConfig();
  
  // 输出检查结果
  console.log('\n📊 部署准备检查结果');
  console.log('================================================================================');
  console.log(`总检查项: ${checkResults.total}`);
  console.log(`通过: ${checkResults.passed} ✅`);
  console.log(`失败: ${checkResults.failed} ❌`);
  console.log(`准备度: ${((checkResults.passed / checkResults.total) * 100).toFixed(1)}%`);
  
  if (checkResults.failed > 0) {
    console.log('\n❌ 需要修复的项目:');
    checkResults.details
      .filter(check => !check.passed)
      .forEach(check => {
        console.log(`   - ${check.name}: ${check.details}`);
      });
  }
  
  console.log('\n🎯 部署准备状态:');
  if (checkResults.passed / checkResults.total >= 0.9) {
    console.log('🟢 准备状态: 优秀 - 可以开始部署');
  } else if (checkResults.passed / checkResults.total >= 0.8) {
    console.log('🟡 准备状态: 良好 - 需要少量配置');
  } else if (checkResults.passed / checkResults.total >= 0.7) {
    console.log('🟠 准备状态: 一般 - 需要较多配置');
  } else {
    console.log('🔴 准备状态: 较差 - 需要大量配置');
  }
  
  console.log('\n💡 下一步建议:');
  if (checkResults.failed === 0) {
    console.log('   1. 配置生产环境变量');
    console.log('   2. 准备服务器环境');
    console.log('   3. 执行部署脚本');
  } else {
    console.log('   1. 修复缺失的配置文件');
    console.log('   2. 完善项目结构');
    console.log('   3. 重新运行部署准备检查');
  }
  
  console.log('\n📁 生成的文件:');
  console.log('   - deployment-checklist.md (部署清单)');
  console.log('   - server/env.production.example (服务器生产环境配置示例)');
  console.log('   - client/.env.production.example (客户端生产环境配置示例)');
}

// 运行部署准备检查
runDeploymentPreparation().catch(error => {
  console.error('部署准备检查失败:', error.message);
}); 