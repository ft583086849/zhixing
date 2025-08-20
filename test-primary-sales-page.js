const puppeteer = require('puppeteer');

async function testPrimarySalesPage() {
    console.log('🚀 开始测试一级销售对账页面...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // 监听控制台消息和错误
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
            console.log(`❌ 控制台${type}: ${msg.text()}`);
        }
    });
    
    // 监听网络请求
    page.on('response', response => {
        if (!response.ok()) {
            console.log(`❌ 请求失败: ${response.url()} - ${response.status()} ${response.statusText()}`);
        }
    });
    
    page.on('requestfailed', request => {
        console.log(`❌ 请求失败: ${request.url()} - ${request.failure().errorText}`);
    });
    
    try {
        console.log('📍 访问页面: http://localhost:3001/primary-sales-settlement');
        await page.goto('http://localhost:3001/primary-sales-settlement', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // 等待页面加载完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📝 页面标题:', await page.title());
        
        // 查找销售代码输入框
        const salesCodeInput = await page.$('input[placeholder*="销售代码"], input[placeholder*="代码"], .ant-input');
        if (!salesCodeInput) {
            throw new Error('未找到销售代码输入框');
        }
        
        console.log('✅ 找到销售代码输入框');
        
        // 输入测试销售代码
        console.log('⌨️  输入销售代码: PRI17547241780648255');
        await salesCodeInput.click({ clickCount: 3 }); // 全选
        await salesCodeInput.type('PRI17547241780648255');
        
        // 查找并点击查询按钮
        const queryButton = await page.$('button:contains("查询"), .ant-btn, button[type="submit"]');
        if (!queryButton) {
            // 尝试其他选择器
            const buttons = await page.$$('button');
            if (buttons.length > 0) {
                console.log(`📍 找到 ${buttons.length} 个按钮，尝试点击第一个`);
                await buttons[0].click();
            } else {
                throw new Error('未找到查询按钮');
            }
        } else {
            console.log('🖱️  点击查询按钮');
            await queryButton.click();
        }
        
        // 等待API响应和数据加载
        console.log('⏳ 等待数据加载...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 检查页面内容
        const pageContent = await page.content();
        
        // 检查关键信息
        console.log('\n📊 测试结果分析:');
        
        // 1. 检查销售员微信
        if (pageContent.includes('WML792355703')) {
            console.log('✅ 销售员微信显示正确: WML792355703');
        } else {
            console.log('❌ 销售员微信未正确显示');
        }
        
        // 2. 检查是否还显示全0
        const hasZeroDollar = pageContent.includes('$0.00');
        if (hasZeroDollar) {
            console.log('❌ 仍显示 $0.00，数据可能未正确加载');
        } else {
            console.log('✅ 不再显示 $0.00');
        }
        
        // 3. 检查订单数量
        const orderCountMatch = pageContent.match(/订单.*?(\d+)/);
        if (orderCountMatch && orderCountMatch[1] !== '0') {
            console.log(`✅ 总订单数: ${orderCountMatch[1]}`);
        } else {
            console.log('❌ 总订单数显示为0或未找到');
        }
        
        // 4. 检查是否有数据表格
        const hasTable = await page.$('.ant-table-tbody tr') !== null;
        if (hasTable) {
            console.log('✅ 数据表格存在');
            
            // 获取表格行数
            const rows = await page.$$('.ant-table-tbody tr');
            console.log(`📊 表格行数: ${rows.length}`);
        } else {
            console.log('❌ 未找到数据表格');
        }
        
        // 5. 检查加载状态
        const isLoading = await page.$('.ant-spin-spinning') !== null;
        if (isLoading) {
            console.log('⏳ 页面仍在加载中...');
        } else {
            console.log('✅ 页面加载完成');
        }
        
        // 获取页面截图用于确认
        await page.screenshot({ 
            path: '/Users/zzj/Documents/w/primary-sales-test-result.png',
            fullPage: true
        });
        console.log('📸 页面截图已保存: primary-sales-test-result.png');
        
        // 获取网络请求信息
        const performanceTiming = JSON.parse(
            await page.evaluate(() => JSON.stringify(window.performance.timing))
        );
        
        console.log('\n📈 性能信息:');
        console.log(`页面加载时间: ${performanceTiming.loadEventEnd - performanceTiming.navigationStart}ms`);
        
        // 检查是否有API错误
        const logs = await page.evaluate(() => {
            return console.memory ? 'Console API available' : 'Console API not available';
        });
        
        console.log('\n🎯 测试完成！请检查上述结果和截图文件。');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        
        // 即使出错也截图
        try {
            await page.screenshot({ 
                path: '/Users/zzj/Documents/w/primary-sales-test-error.png',
                fullPage: true
            });
            console.log('📸 错误截图已保存: primary-sales-test-error.png');
        } catch (e) {
            console.log('截图保存失败:', e.message);
        }
    }
    
    console.log('\n🔍 保持浏览器打开30秒供手动检查...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await browser.close();
}

// 检查是否安装了puppeteer
const checkPuppeteer = () => {
    try {
        require('puppeteer');
        return true;
    } catch (e) {
        console.log('❌ 未安装puppeteer，请先安装: npm install puppeteer');
        return false;
    }
};

if (checkPuppeteer()) {
    testPrimarySalesPage();
}