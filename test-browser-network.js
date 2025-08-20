const puppeteer = require('puppeteer');

async function testBrowserNetwork() {
    console.log('🌐 测试浏览器网络请求...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // 监听所有网络请求
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
        if (request.url().includes('supabase') || request.url().includes('api')) {
            console.log('📤 请求:', {
                method: request.method(),
                url: request.url(),
                postData: request.postData()
            });
            requests.push({
                method: request.method(),
                url: request.url(),
                postData: request.postData()
            });
        }
    });
    
    page.on('response', async response => {
        if (response.url().includes('supabase') || response.url().includes('api')) {
            let responseData = null;
            try {
                responseData = await response.text();
            } catch (e) {
                responseData = 'Cannot read response';
            }
            
            console.log('📥 响应:', {
                status: response.status(),
                url: response.url(),
                data: responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '')
            });
            
            responses.push({
                status: response.status(),
                url: response.url(),
                data: responseData
            });
        }
    });
    
    // 监听控制台错误
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
            console.log(`🔴 控制台${type}:`, msg.text());
        }
    });
    
    try {
        console.log('📍 访问页面...');
        await page.goto('http://localhost:3001/primary-sales-settlement', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // 等待页面完全加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📝 填写表单数据...');
        
        // 清空输入框并输入微信号
        await page.focus('input[placeholder*="微信号"]');
        await page.keyboard.selectAll();
        await page.keyboard.type('WML792355703');
        
        console.log('🖱️ 点击查询按钮...');
        
        // 点击查询按钮
        await page.click('button[type="submit"]');
        
        // 等待API响应
        console.log('⏳ 等待API响应...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // 检查页面内容
        const pageText = await page.evaluate(() => document.body.innerText);
        
        console.log('\n📊 页面内容检查:');
        if (pageText.includes('请先查询一级销售信息')) {
            console.log('❌ 仍显示"请先查询一级销售信息"');
        } else {
            console.log('✅ 不再显示"请先查询一级销售信息"');
        }
        
        if (pageText.includes('WML792355703')) {
            console.log('✅ 微信号显示正确');
        } else {
            console.log('❌ 微信号未显示');
        }
        
        if (pageText.includes('$0.00')) {
            console.log('❌ 仍显示$0.00');
        } else {
            console.log('✅ 不显示$0.00');
        }
        
        // 分析网络请求
        console.log('\n🌐 网络请求分析:');
        console.log(`总请求数: ${requests.length}`);
        console.log(`总响应数: ${responses.length}`);
        
        // 查找API请求
        const apiRequests = requests.filter(r => r.url().includes('sales'));
        const apiResponses = responses.filter(r => r.url().includes('sales'));
        
        console.log(`API请求数: ${apiRequests.length}`);
        console.log(`API响应数: ${apiResponses.length}`);
        
        if (apiResponses.length > 0) {
            const lastResponse = apiResponses[apiResponses.length - 1];
            console.log('最后一个API响应状态:', lastResponse.status);
            
            if (lastResponse.status === 200) {
                console.log('✅ API响应成功');
                try {
                    const responseObj = JSON.parse(lastResponse.data);
                    console.log('API响应数据结构:', {
                        hasSales: !!responseObj.sales,
                        ordersCount: responseObj.orders?.length || 0,
                        statsExists: !!responseObj.stats
                    });
                } catch (e) {
                    console.log('⚠️ 响应数据不是JSON格式');
                }
            } else {
                console.log('❌ API响应失败，状态码:', lastResponse.status);
            }
        } else {
            console.log('❌ 没有找到API响应');
        }
        
        // 截图
        await page.screenshot({ 
            path: '/Users/zzj/Documents/w/network-test-result.png',
            fullPage: true 
        });
        console.log('📸 截图已保存');
        
        console.log('\n🔍 保持浏览器打开60秒进行手动检查...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        
    } catch (error) {
        console.error('❌ 测试过程出错:', error);
        await page.screenshot({ path: '/Users/zzj/Documents/w/network-test-error.png' });
    }
    
    await browser.close();
}

testBrowserNetwork();