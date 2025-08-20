/**
 * 测试AdminOverview页面的新统计功能
 * 自动登录管理员并验证统计数据加载
 */

const puppeteer = require('puppeteer');

async function testAdminOverview() {
  console.log('🚀 开始测试AdminOverview页面...\n');
  
  let browser;
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: false, // 设置为false以便查看浏览器操作
      defaultViewport: { width: 1440, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // 监听控制台消息
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('使用新的统计方式') || text.includes('使用传统查询方式')) {
        console.log(`📊 控制台: ${text}`);
      }
      if (text.includes('统计数据加载完成')) {
        console.log(`✅ ${text}`);
      }
    });
    
    // 1. 访问管理员登录页面
    console.log('1️⃣ 访问管理员登录页面...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
    
    // 2. 执行登录
    console.log('2️⃣ 正在登录...');
    await page.type('input[placeholder*="用户名"]', 'admin');
    await page.type('input[placeholder*="密码"]', '123456');
    await page.click('button[type="submit"]');
    
    // 等待跳转到dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ 登录成功！');
    
    // 3. 验证是否在数据概览页面
    const currentUrl = page.url();
    console.log(`\n3️⃣ 当前页面: ${currentUrl}`);
    
    if (currentUrl.includes('/admin/dashboard')) {
      console.log('✅ 已进入数据概览页面');
      
      // 4. 等待统计数据加载
      console.log('\n4️⃣ 等待统计数据加载...');
      await page.waitForTimeout(2000); // 等待2秒让数据加载
      
      // 5. 检查页面元素
      const statsCards = await page.$$('.ant-card');
      console.log(`✅ 找到 ${statsCards.length} 个统计卡片`);
      
      // 6. 获取加载时间
      const loadTime = await page.evaluate(() => {
        const performanceData = performance.getEntriesByType('navigation')[0];
        return performanceData.loadEventEnd - performanceData.fetchStart;
      });
      
      console.log(`\n📊 页面加载性能:`);
      console.log(`   总加载时间: ${loadTime.toFixed(0)}ms`);
      
      if (loadTime < 500) {
        console.log(`   ✅ 优秀! 加载时间小于500ms`);
      } else if (loadTime < 1000) {
        console.log(`   ⚡ 良好! 加载时间小于1秒`);
      } else {
        console.log(`   ⚠️ 需要优化! 加载时间超过1秒`);
      }
      
      // 7. 检查环境变量配置
      const useNewStats = await page.evaluate(() => {
        return localStorage.getItem('REACT_APP_ENABLE_NEW_STATS') || 
               process.env.REACT_APP_ENABLE_NEW_STATS;
      });
      
      console.log(`\n🔧 配置检查:`);
      console.log(`   REACT_APP_ENABLE_NEW_STATS: ${useNewStats || '未设置'}`);
      
      // 8. 截图保存
      await page.screenshot({ 
        path: 'admin-overview-test.png',
        fullPage: true 
      });
      console.log('\n📸 已保存页面截图: admin-overview-test.png');
      
      console.log('\n✨ 测试完成！AdminOverview页面运行正常。');
      
    } else {
      console.log('❌ 未能进入数据概览页面');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 保持浏览器打开10秒以便查看
    console.log('\n⏰ 10秒后关闭浏览器...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    if (browser) {
      await browser.close();
    }
  }
}

// 检查puppeteer是否安装
try {
  require.resolve('puppeteer');
  testAdminOverview();
} catch (e) {
  console.log('📦 需要先安装puppeteer:');
  console.log('   npm install puppeteer');
  console.log('\n或者手动测试:');
  console.log('1. 访问 http://localhost:3000/admin');
  console.log('2. 使用 admin / 123456 登录');
  console.log('3. 查看数据概览页面');
  console.log('4. 打开浏览器控制台查看是否有"使用新的统计方式"的日志');
}