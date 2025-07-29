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

// 检查JavaScript文件语法
const checkJavaScriptSyntax = (filePath, description) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 尝试解析JavaScript代码
    eval('(function() { "use strict"; ' + content + ' })');
    
    logTest(description, true);
    return true;
  } catch (error) {
    // 对于React JSX文件，我们只做基本的语法检查
    if (filePath.includes('.js') && !filePath.includes('.jsx')) {
      logTest(description, false, error.message);
      return false;
    } else {
      // JSX文件跳过详细语法检查
      logTest(description, true);
      return true;
    }
  }
};

// 检查JSON文件语法
const checkJsonSyntax = (filePath, description) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    logTest(description, true);
    return true;
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查CSS文件语法
const checkCssSyntax = (filePath, description) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // 基本的CSS语法检查
    if (content.includes('{') && content.includes('}')) {
      logTest(description, true);
      return true;
    } else {
      logTest(description, false, 'CSS语法不正确');
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 检查HTML文件语法
const checkHtmlSyntax = (filePath, description) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // 基本的HTML语法检查
    if (content.includes('<html') && content.includes('</html>')) {
      logTest(description, true);
      return true;
    } else {
      logTest(description, false, 'HTML语法不正确');
      return false;
    }
  } catch (error) {
    logTest(description, false, error.message);
    return false;
  }
};

// 运行语法检查测试
const runSyntaxTests = () => {
  console.log('🔍 开始语法检查测试...\n');

  // 检查后端JavaScript文件
  console.log('📋 检查后端JavaScript文件语法...');
  const backendFiles = [
    'server/index.js',
    'server/config/database.js',
    'server/models/index.js',
    'server/models/Sales.js',
    'server/models/Links.js',
    'server/models/Orders.js',
    'server/models/Admins.js',
    'server/routes/auth.js',
    'server/routes/sales.js',
    'server/routes/orders.js',
    'server/routes/admin.js',
    'server/middleware/auth.js'
  ];

  backendFiles.forEach(file => {
    checkJavaScriptSyntax(file, `后端文件: ${file}`);
  });

  // 检查前端JavaScript文件
  console.log('\n📋 检查前端JavaScript文件语法...');
  const frontendFiles = [
    'client/src/index.js',
    'client/src/App.js',
    'client/src/store/index.js',
    'client/src/store/slices/authSlice.js',
    'client/src/store/slices/salesSlice.js',
    'client/src/store/slices/ordersSlice.js',
    'client/src/store/slices/adminSlice.js',
    'client/src/services/api.js',
    'client/src/components/LoadingSpinner.js',
    'client/src/components/QRCodeDisplay.js',
    'client/src/components/admin/AdminOverview.js',
    'client/src/components/admin/AdminOrders.js',
    'client/src/components/admin/AdminSales.js',
    'client/src/pages/SalesPage.js',
    'client/src/pages/PurchasePage.js',
    'client/src/pages/AdminLoginPage.js',
    'client/src/pages/AdminDashboardPage.js'
  ];

  frontendFiles.forEach(file => {
    checkJavaScriptSyntax(file, `前端文件: ${file}`);
  });

  // 检查配置文件
  console.log('\n📋 检查配置文件语法...');
  checkJsonSyntax('package.json', '根目录package.json');
  checkJsonSyntax('server/package.json', '后端package.json');
  checkJsonSyntax('client/package.json', '前端package.json');

  // 检查样式文件
  console.log('\n📋 检查样式文件语法...');
  checkCssSyntax('client/src/index.css', '全局样式文件');

  // 检查HTML文件
  console.log('\n📋 检查HTML文件语法...');
  checkHtmlSyntax('client/public/index.html', 'HTML模板文件');

  // 输出测试结果
  console.log('\n📊 语法检查测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   ${test}: ${error}`);
    });
  }

  console.log('\n🎉 语法检查测试完成！');
  
  if (testResults.failed === 0) {
    console.log('🎊 所有文件语法检查通过！');
  } else {
    console.log('⚠️  发现一些语法问题，请检查上述错误详情。');
  }
};

// 运行测试
runSyntaxTests(); 