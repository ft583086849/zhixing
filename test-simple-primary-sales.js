const puppeteer = require('puppeteer');

async function testPage() {
    console.log('🚀 开始测试一级销售对账页面...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // 监听控制台错误
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`❌ 控制台错误: ${msg.text()}`);
        }
    });
    
    // 监听网络请求失败
    page.on('response', response => {
        if (response.status() === 403) {
            console.log(`❌ 403错误: ${response.url()}`);
        }
        if (response.status() >= 400) {
            console.log(`❌ 请求失败: ${response.url()} - ${response.status()}`);
        }
    });
    
    try {
        // 访问页面
        console.log('📍 访问: http://localhost:3001/primary-sales-settlement');
        await page.goto('http://localhost:3001/primary-sales-settlement');
        
        // 等待页面加载
        await page.waitForSelector('body', { timeout: 10000 });
        console.log('✅ 页面已加载');
        
        // 等待一会儿确保React组件完全渲染
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 查找输入框
        const input = await page.$('input');
        if (input) {
            console.log('✅ 找到输入框');
            
            // 输入销售代码
            await input.click({ clickCount: 3 });
            await page.keyboard.type('PRI17547241780648255');
            console.log('✅ 已输入销售代码: PRI17547241780648255');
            
            // 查找按钮
            const buttons = await page.$$('button');
            console.log(`📍 找到 ${buttons.length} 个按钮`);
            
            if (buttons.length > 0) {
                await buttons[0].click();
                console.log('✅ 点击了查询按钮');
                
                // 等待API响应
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } else {
            console.log('❌ 未找到输入框');
        }
        
        // 获取页面内容进行分析
        const content = await page.content();
        
        console.log('\n📊 页面内容分析:');
        
        // 检查关键信息
        if (content.includes('WML792355703')) {
            console.log('✅ 找到销售员微信: WML792355703');
        } else {
            console.log('❌ 未找到销售员微信');
        }
        
        if (content.includes('$0.00')) {
            console.log('⚠️ 仍显示 $0.00');
        } else {
            console.log('✅ 不再显示 $0.00');
        }
        
        // 检查是否有表格数据
        const rows = await page.$$('.ant-table-tbody tr');
        console.log(`📊 表格行数: ${rows.length}`);
        
        // 检查总佣金
        const commissionText = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            for (let el of elements) {
                if (el.textContent && el.textContent.includes('总佣金')) {
                    return el.textContent;
                }
            }
            return null;
        });
        
        if (commissionText) {
            console.log(`📈 总佣金信息: ${commissionText}`);
        } else {
            console.log('❌ 未找到总佣金信息');
        }
        
        // 检查订单数量
        const orderText = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            for (let el of elements) {
                if (el.textContent && el.textContent.includes('订单')) {
                    return el.textContent;
                }
            }
            return null;
        });
        
        if (orderText) {
            console.log(`📦 订单信息: ${orderText}`);
        } else {
            console.log('❌ 未找到订单信息');
        }
        
        // 截图
        await page.screenshot({ 
            path: '/Users/zzj/Documents/w/primary-sales-final-test.png',
            fullPage: true 
        });
        console.log('📸 截图已保存');
        
        console.log('\n✅ 测试完成！浏览器将保持30秒供手动检查...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        await page.screenshot({ path: '/Users/zzj/Documents/w/test-error.png' });
    } finally {
        await browser.close();
    }
}

testPage();