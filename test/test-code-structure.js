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

// 检查文件是否存在
const checkFileExists = (filePath, description) => {
  try {
    if (fs.existsSync(filePath)) {
      logTest(description, true);
      return true;
    } else {
      logTest(description, false, `文件不存在: ${filePath}`);
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查目录是否存在
const checkDirectoryExists = (dirPath, description) => {
  try {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      logTest(description, true);
      return true;
    } else {
      logTest(description, false, `目录不存在: ${dirPath}`);
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查package.json文件
const checkPackageJson = (filePath, description) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (content.name && content.version) {
        logTest(description, true);
        return true;
      } else {
        logTest(description, false, 'package.json格式不正确');
        return false;
      }
    } else {
      logTest(description, false, `文件不存在: ${filePath}`);
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 运行代码结构测试
const runCodeStructureTests = () => {
  console.log('🔍 开始代码结构测试...\n');

  // 检查根目录文件
  console.log('📋 检查根目录文件...');
  checkFileExists('package.json', '根目录package.json');
  checkFileExists('README.md', 'README.md');
  checkFileExists('支付管理系统需求文档.md', '需求文档');
  checkFileExists('开发文档.md', '开发文档');

  // 检查server目录结构
  console.log('\n📋 检查后端目录结构...');
  checkDirectoryExists('server', 'server目录');
  checkPackageJson('server/package.json', '后端package.json');
  checkFileExists('server/index.js', '后端入口文件');
  checkDirectoryExists('server/config', '后端config目录');
  checkDirectoryExists('server/models', '后端models目录');
  checkDirectoryExists('server/routes', '后端routes目录');
  checkDirectoryExists('server/middleware', '后端middleware目录');
  
  // 检查后端具体文件
  checkFileExists('server/config/database.js', '数据库配置');
  checkFileExists('server/models/index.js', '模型关联文件');
  checkFileExists('server/models/Sales.js', 'Sales模型');
  checkFileExists('server/models/Links.js', 'Links模型');
  checkFileExists('server/models/Orders.js', 'Orders模型');
  checkFileExists('server/models/Admins.js', 'Admins模型');
  checkFileExists('server/routes/auth.js', '认证路由');
  checkFileExists('server/routes/sales.js', '销售路由');
  checkFileExists('server/routes/orders.js', '订单路由');
  checkFileExists('server/routes/admin.js', '管理员路由');
  checkFileExists('server/middleware/auth.js', '认证中间件');

  // 检查client目录结构
  console.log('\n📋 检查前端目录结构...');
  checkDirectoryExists('client', 'client目录');
  checkPackageJson('client/package.json', '前端package.json');
  checkFileExists('client/public/index.html', '前端HTML模板');
  checkDirectoryExists('client/src', '前端src目录');
  checkFileExists('client/src/index.js', '前端入口文件');
  checkFileExists('client/src/App.js', '主应用组件');
  checkFileExists('client/src/index.css', '全局样式');
  
  // 检查前端具体文件
  checkDirectoryExists('client/src/store', 'Redux store目录');
  checkDirectoryExists('client/src/services', 'API服务目录');
  checkDirectoryExists('client/src/components', '组件目录');
  checkDirectoryExists('client/src/pages', '页面目录');
  
  checkFileExists('client/src/store/index.js', 'Redux store配置');
  checkFileExists('client/src/store/slices/authSlice.js', '认证状态管理');
  checkFileExists('client/src/store/slices/salesSlice.js', '销售状态管理');
  checkFileExists('client/src/store/slices/ordersSlice.js', '订单状态管理');
  checkFileExists('client/src/store/slices/adminSlice.js', '管理员状态管理');
  
  checkFileExists('client/src/services/api.js', 'API服务');
  
  checkFileExists('client/src/components/LoadingSpinner.js', '加载组件');
  checkFileExists('client/src/components/QRCodeDisplay.js', 'QR码组件');
  checkDirectoryExists('client/src/components/admin', '管理员组件目录');
  checkFileExists('client/src/components/admin/AdminOverview.js', '数据概览组件');
  checkFileExists('client/src/components/admin/AdminOrders.js', '订单管理组件');
  checkFileExists('client/src/components/admin/AdminSales.js', '销售管理组件');
  
  checkFileExists('client/src/pages/SalesPage.js', '销售页面');
  checkFileExists('client/src/pages/PurchasePage.js', '用户购买页面');
  checkFileExists('client/src/pages/AdminLoginPage.js', '管理员登录页面');
  checkFileExists('client/src/pages/AdminDashboardPage.js', '管理员后台页面');

  // 检查测试目录
  console.log('\n📋 检查测试目录...');
  checkDirectoryExists('test', '测试目录');
  checkFileExists('test/test-system.js', '系统测试脚本');
  checkFileExists('test/test-frontend.md', '前端测试清单');
  checkFileExists('test/run-tests.sh', '测试运行脚本');

  // 输出测试结果
  console.log('\n📊 代码结构测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   ${test}: ${error}`);
    });
  }

  console.log('\n🎉 代码结构测试完成！');
  
  if (testResults.failed === 0) {
    console.log('🎊 所有文件结构检查通过！');
  } else {
    console.log('⚠️  发现一些问题，请检查上述错误详情。');
  }
};

// 运行测试
runCodeStructureTests(); 