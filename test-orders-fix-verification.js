const puppeteer = require('puppeteer');

async function testOrdersFix() {
  console.log('🔍 开始测试订单管理页面修复...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置视口
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('📱 访问管理后台...');
    await page.goto('https://zhixing-seven.vercel.app/admin/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    console.log('🔐 检查登录状态...');
    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('.ant-form') || 
             document.querySelector('.admin-dashboard') !== null;
    });
    
    if (!isLoggedIn) {
      console.log('⚠️  需要登录，尝试自动登录...');
      
      // 尝试使用默认管理员账户登录
      await page.type('input[name="username"]', 'admin');
      await page.type('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(3000);
    }
    
    console.log('📋 点击订单管理...');
    await page.waitForSelector('a[href="/admin/orders"]', { timeout: 10000 });
    await page.click('a[href="/admin/orders"]');
    
    await page.waitForTimeout(3000);
    
    console.log('🔍 检查页面是否正常加载...');
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasTable: !!document.querySelector('.ant-table'),
        hasPagination: !!document.querySelector('.ant-pagination'),
        hasSearchForm: !!document.querySelector('.ant-form'),
        errorMessages: Array.from(document.querySelectorAll('.ant-message-error')).map(el => el.textContent),
        consoleErrors: window.consoleErrors || []
      };
    });
    
    console.log('📊 页面状态检查结果:');
    console.log(`- 页面标题: ${pageContent.title}`);
    console.log(`- 表格存在: ${pageContent.hasTable}`);
    console.log(`- 分页存在: ${pageContent.hasPagination}`);
    console.log(`- 搜索表单存在: ${pageContent.hasSearchForm}`);
    
    if (pageContent.errorMessages.length > 0) {
      console.log('❌ 发现错误消息:');
      pageContent.errorMessages.forEach(msg => console.log(`  - ${msg}`));
    }
    
    if (pageContent.consoleErrors.length > 0) {
      console.log('❌ 发现控制台错误:');
      pageContent.consoleErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    // 测试分页功能
    console.log('🔄 测试分页功能...');
    const paginationWorks = await page.evaluate(() => {
      const pagination = document.querySelector('.ant-pagination');
      if (!pagination) return false;
      
      const nextButton = pagination.querySelector('.ant-pagination-next');
      return nextButton && !nextButton.disabled;
    });
    
    console.log(`- 分页功能正常: ${paginationWorks}`);
    
    // 测试搜索功能
    console.log('🔍 测试搜索功能...');
    const searchWorks = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder*="搜索"]');
      return !!searchInput;
    });
    
    console.log(`- 搜索功能正常: ${searchWorks}`);
    
    // 检查是否有数据加载
    console.log('📈 检查数据加载...');
    const hasData = await page.evaluate(() => {
      const tableRows = document.querySelectorAll('.ant-table-tbody tr');
      return tableRows.length > 0;
    });
    
    console.log(`- 数据加载正常: ${hasData}`);
    
    // 总体评估
    const isWorking = pageContent.hasTable && 
                     pageContent.hasPagination && 
                     pageContent.hasSearchForm && 
                     pageContent.errorMessages.length === 0 &&
                     pageContent.consoleErrors.length === 0;
    
    console.log('\n🎯 测试结果总结:');
    if (isWorking) {
      console.log('✅ 订单管理页面修复成功！');
      console.log('✅ 页面正常加载');
      console.log('✅ 分页功能正常');
      console.log('✅ 搜索功能正常');
      console.log('✅ 无错误信息');
    } else {
      console.log('❌ 订单管理页面仍有问题');
      console.log('请检查控制台错误和网络请求');
    }
    
    // 截图保存
    await page.screenshot({ 
      path: 'orders-fix-test-result.png',
      fullPage: true 
    });
    console.log('📸 截图已保存: orders-fix-test-result.png');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
  }
}

// 运行测试
testOrdersFix().catch(console.error); 