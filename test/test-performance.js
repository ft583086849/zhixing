const fs = require('fs');
const path = require('path');

// 测试结果记录
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 测试工具函数
const logTest = (testName, success, error = null) => {
  if (success) {
    console.log(`✅ ${testName} - 通过`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName} - 失败`);
    testResults.failed++;
    if (error) {
      testResults.errors.push({ test: testName, error });
      console.log(`   错误: ${error}`);
    }
  }
};

// 检查文件大小
const checkFileSize = (filePath, maxSizeKB, description) => {
  try {
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    
    if (sizeKB <= maxSizeKB) {
      logTest(description, true);
      console.log(`   文件大小: ${sizeKB.toFixed(2)}KB (限制: ${maxSizeKB}KB)`);
      return true;
    } else {
      logTest(description, false, `文件过大: ${sizeKB.toFixed(2)}KB > ${maxSizeKB}KB`);
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查代码行数
const checkCodeLines = (filePath, maxLines, description) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    
    if (lines <= maxLines) {
      logTest(description, true);
      console.log(`   代码行数: ${lines} (限制: ${maxLines}行)`);
      return true;
    } else {
      logTest(description, false, `代码行数过多: ${lines} > ${maxLines}行`);
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查依赖数量
const checkDependencies = (packageJsonPath, maxDeps, description) => {
  try {
    const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = Object.keys(content.dependencies || {}).length;
    const devDeps = Object.keys(content.devDependencies || {}).length;
    const totalDeps = deps + devDeps;
    
    if (totalDeps <= maxDeps) {
      logTest(description, true);
      console.log(`   依赖数量: ${totalDeps} (生产: ${deps}, 开发: ${devDeps})`);
      return true;
    } else {
      logTest(description, false, `依赖过多: ${totalDeps} > ${maxDeps}`);
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查图片资源
const checkImageAssets = (description) => {
  try {
    const publicDir = 'client/public';
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|svg|ico)$/i.test(file)
      );
      
      if (imageFiles.length <= 10) {
        logTest(description, true);
        console.log(`   图片文件数量: ${imageFiles.length}`);
        return true;
      } else {
        logTest(description, false, `图片文件过多: ${imageFiles.length} > 10`);
        return false;
      }
    } else {
      logTest(description, true);
      console.log(`   无图片文件`);
      return true;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查构建配置
const checkBuildConfig = (description) => {
  try {
    const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    const hasBuildScript = clientPackageJson.scripts && clientPackageJson.scripts.build;
    
    if (hasBuildScript) {
      logTest(description, true);
      return true;
    } else {
      logTest(description, false, '缺少build脚本');
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查环境配置
const checkEnvironmentConfig = (description) => {
  try {
    const envExample = 'server/.env.example';
    if (fs.existsSync(envExample)) {
      const content = fs.readFileSync(envExample, 'utf8');
      const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
      const missingVars = requiredVars.filter(varName => !content.includes(varName));
      
      if (missingVars.length === 0) {
        logTest(description, true);
        return true;
      } else {
        logTest(description, false, `缺少环境变量: ${missingVars.join(', ')}`);
        return false;
      }
    } else {
      logTest(description, false, '缺少.env.example文件');
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 运行性能测试
const runPerformanceTests = () => {
  console.log('🚀 开始性能测试...\n');

  // 检查文件大小
  console.log('📋 检查文件大小...');
  checkFileSize('client/src/index.js', 5, '前端入口文件大小');
  checkFileSize('client/src/App.js', 10, '主应用组件大小');
  checkFileSize('client/src/index.css', 10, '全局样式文件大小');
  checkFileSize('server/index.js', 10, '后端入口文件大小');

  // 检查代码行数
  console.log('\n📋 检查代码行数...');
  checkCodeLines('client/src/pages/SalesPage.js', 300, '销售页面代码行数');
  checkCodeLines('client/src/pages/PurchasePage.js', 400, '用户购买页面代码行数');
  checkCodeLines('client/src/pages/AdminDashboardPage.js', 200, '管理员后台页面代码行数');
  checkCodeLines('server/routes/admin.js', 200, '管理员路由代码行数');

  // 检查依赖数量
  console.log('\n📋 检查依赖数量...');
  checkDependencies('package.json', 5, '根目录依赖数量');
  checkDependencies('server/package.json', 15, '后端依赖数量');
  checkDependencies('client/package.json', 20, '前端依赖数量');

  // 检查图片资源
  console.log('\n📋 检查图片资源...');
  checkImageAssets('图片资源数量');

  // 检查构建配置
  console.log('\n📋 检查构建配置...');
  checkBuildConfig('前端构建配置');

  // 检查环境配置
  console.log('\n📋 检查环境配置...');
  checkEnvironmentConfig('环境变量配置');

  // 输出测试结果
  console.log('\n📊 性能测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   ${test}: ${error}`);
    });
  }

  console.log('\n🎉 性能测试完成！');
  
  if (testResults.failed === 0) {
    console.log('🎊 所有性能指标检查通过！');
  } else {
    console.log('⚠️  发现一些性能问题，请检查上述错误详情。');
  }

  // 性能建议
  console.log('\n💡 性能优化建议:');
  console.log('1. 使用代码分割减少初始包大小');
  console.log('2. 启用Gzip压缩');
  console.log('3. 使用CDN加速静态资源');
  console.log('4. 优化数据库查询');
  console.log('5. 启用缓存机制');
  console.log('6. 监控API响应时间');
};

// 运行测试
runPerformanceTests(); 