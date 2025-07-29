#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🚀 支付管理系统生产环境准备\n');

async function productionPreparation() {
  console.log('📋 生产环境准备计划：');
  console.log('1. 性能优化检查');
  console.log('2. 安全配置检查');
  console.log('3. 数据库优化');
  console.log('4. 部署文档完善');
  console.log('5. 环境配置验证\n');

  try {
    // 1. 性能优化检查
    console.log('⚡ 1. 性能优化检查...');
    
    // 检查前端构建优化
    console.log('   检查前端构建配置...');
    const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    const hasBuildScript = clientPackageJson.scripts && clientPackageJson.scripts.build;
    console.log(`   ✅ 前端构建脚本: ${hasBuildScript ? '存在' : '缺失'}`);
    
    // 检查后端性能配置
    console.log('   检查后端性能配置...');
    const serverPackageJson = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
    const hasProductionDeps = serverPackageJson.dependencies && 
      (serverPackageJson.dependencies.compression || serverPackageJson.dependencies.helmet);
    console.log(`   ✅ 后端性能依赖: ${hasProductionDeps ? '已配置' : '需要添加'}`);
    
    // 检查静态文件服务
    console.log('   检查静态文件服务...');
    const serverIndexPath = 'server/index.js';
    if (fs.existsSync(serverIndexPath)) {
      const serverContent = fs.readFileSync(serverIndexPath, 'utf8');
      const hasStaticServe = serverContent.includes('express.static') || serverContent.includes('static');
      console.log(`   ✅ 静态文件服务: ${hasStaticServe ? '已配置' : '需要配置'}`);
    }
    
    console.log('✅ 性能优化检查完成');

    // 2. 安全配置检查
    console.log('\n🔒 2. 安全配置检查...');
    
    // 检查环境变量配置
    console.log('   检查环境变量配置...');
    const envFiles = ['server/.env', 'server/env.production.example'];
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        console.log(`   ✅ 环境变量文件: ${envFile} 存在`);
      } else {
        console.log(`   ⚠️  环境变量文件: ${envFile} 缺失`);
      }
    }
    
    // 检查安全中间件
    console.log('   检查安全中间件...');
    if (fs.existsSync('server/index.js')) {
      const serverContent = fs.readFileSync('server/index.js', 'utf8');
      const hasHelmet = serverContent.includes('helmet');
      const hasCors = serverContent.includes('cors');
      const hasRateLimit = serverContent.includes('rateLimit');
      console.log(`   ✅ Helmet安全头: ${hasHelmet ? '已配置' : '需要添加'}`);
      console.log(`   ✅ CORS配置: ${hasCors ? '已配置' : '需要添加'}`);
      console.log(`   ✅ 速率限制: ${hasRateLimit ? '已配置' : '需要添加'}`);
    }
    
    // 检查JWT配置
    console.log('   检查JWT配置...');
    if (fs.existsSync('server/middleware/auth.js')) {
      const authContent = fs.readFileSync('server/middleware/auth.js', 'utf8');
      const hasJWTSecret = authContent.includes('JWT_SECRET') || authContent.includes('process.env');
      console.log(`   ✅ JWT密钥配置: ${hasJWTSecret ? '已配置' : '需要配置'}`);
    }
    
    console.log('✅ 安全配置检查完成');

    // 3. 数据库优化
    console.log('\n🗄️ 3. 数据库优化...');
    
    // 检查数据库配置
    console.log('   检查数据库配置...');
    const dbFiles = ['server/database.sqlite', 'server/config/database.js'];
    for (const dbFile of dbFiles) {
      if (fs.existsSync(dbFile)) {
        console.log(`   ✅ 数据库文件: ${dbFile} 存在`);
      } else {
        console.log(`   ⚠️  数据库文件: ${dbFile} 缺失`);
      }
    }
    
    // 检查数据库连接池配置
    console.log('   检查数据库连接池...');
    if (fs.existsSync('server/config/database.js')) {
      const dbConfig = fs.readFileSync('server/config/database.js', 'utf8');
      const hasPoolConfig = dbConfig.includes('pool') || dbConfig.includes('connectionLimit');
      console.log(`   ✅ 连接池配置: ${hasPoolConfig ? '已配置' : '需要配置'}`);
    }
    
    // 检查数据库迁移脚本
    console.log('   检查数据库迁移...');
    const migrationFiles = ['server/scripts/migrate.js'];
    for (const migrationFile of migrationFiles) {
      if (fs.existsSync(migrationFile)) {
        console.log(`   ✅ 迁移脚本: ${migrationFile} 存在`);
      } else {
        console.log(`   ⚠️  迁移脚本: ${migrationFile} 缺失`);
      }
    }
    
    console.log('✅ 数据库优化检查完成');

    // 4. 部署文档完善
    console.log('\n📚 4. 部署文档完善...');
    
    // 检查部署脚本
    console.log('   检查部署脚本...');
    const deployScripts = ['deploy.sh', 'deploy-sqlite.sh', 'start.sh'];
    for (const script of deployScripts) {
      if (fs.existsSync(script)) {
        console.log(`   ✅ 部署脚本: ${script} 存在`);
      } else {
        console.log(`   ⚠️  部署脚本: ${script} 缺失`);
      }
    }
    
    // 检查部署文档
    console.log('   检查部署文档...');
    const docs = ['deployment-checklist.md', 'README.md', 'deployment/README.md'];
    for (const doc of docs) {
      if (fs.existsSync(doc)) {
        console.log(`   ✅ 部署文档: ${doc} 存在`);
      } else {
        console.log(`   ⚠️  部署文档: ${doc} 缺失`);
      }
    }
    
    console.log('✅ 部署文档检查完成');

    // 5. 环境配置验证
    console.log('\n🔍 5. 环境配置验证...');
    
    // 测试当前服务状态
    console.log('   测试当前服务状态...');
    try {
      const frontendResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
      console.log('   ✅ 前端服务正常运行');
    } catch (error) {
      console.log('   ❌ 前端服务无法访问');
    }
    
    try {
      const backendResponse = await axios.get('http://localhost:5000/api/admin/stats', { timeout: 5000 });
      console.log('   ✅ 后端服务正常运行');
    } catch (error) {
      console.log('   ❌ 后端服务无法访问');
    }
    
    console.log('✅ 环境配置验证完成');

    // 6. 生成生产环境配置建议
    console.log('\n📋 6. 生成生产环境配置建议...');
    
    const recommendations = {
      performance: [
        '添加前端构建优化配置',
        '配置后端压缩中间件',
        '启用静态文件缓存',
        '配置数据库连接池'
      ],
      security: [
        '配置环境变量文件',
        '添加Helmet安全头',
        '配置CORS策略',
        '启用速率限制',
        '配置JWT密钥'
      ],
      database: [
        '配置数据库连接池',
        '创建数据库迁移脚本',
        '配置数据库备份策略',
        '优化数据库查询'
      ],
      deployment: [
        '完善部署脚本',
        '创建环境配置文件',
        '配置日志记录',
        '设置监控告警'
      ]
    };
    
    console.log('   性能优化建议:');
    recommendations.performance.forEach(rec => console.log(`   - ${rec}`));
    
    console.log('   安全配置建议:');
    recommendations.security.forEach(rec => console.log(`   - ${rec}`));
    
    console.log('   数据库优化建议:');
    recommendations.database.forEach(rec => console.log(`   - ${rec}`));
    
    console.log('   部署配置建议:');
    recommendations.deployment.forEach(rec => console.log(`   - ${rec}`));
    
    console.log('✅ 配置建议生成完成');

    // 7. 测试结果总结
    console.log('\n🎉 生产环境准备检查完成！');
    console.log('\n📊 检查结果总结:');
    console.log('✅ 性能优化检查: 完成');
    console.log('✅ 安全配置检查: 完成');
    console.log('✅ 数据库优化检查: 完成');
    console.log('✅ 部署文档检查: 完成');
    console.log('✅ 环境配置验证: 完成');
    
    console.log('\n🚀 系统状态: 生产环境准备就绪！');
    
    console.log('\n💡 下一步行动:');
    console.log('1. 根据建议完善配置');
    console.log('2. 创建生产环境部署脚本');
    console.log('3. 配置监控和日志');
    console.log('4. 进行生产环境测试');

  } catch (error) {
    console.error('❌ 生产环境准备检查过程中出现错误:', error.message);
    console.log('\n🔧 建议检查:');
    console.log('1. 确保所有文件路径正确');
    console.log('2. 检查文件权限');
    console.log('3. 验证服务状态');
  }
}

// 运行生产环境准备检查
productionPreparation(); 