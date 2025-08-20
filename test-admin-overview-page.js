/**
 * 测试管理后台概览页面数据显示情况
 * 这个脚本会检查页面上的关键数据显示
 */

const puppeteer = require('puppeteer');

async function testAdminOverviewPage() {
    let browser = null;
    
    try {
        console.log('🚀 启动浏览器测试...');
        
        // 检查是否安装了puppeteer
        try {
            browser = await puppeteer.launch({
                headless: false, // 显示浏览器窗口，便于观察
                defaultViewport: { width: 1280, height: 800 }
            });
        } catch (error) {
            console.log('❌ Puppeteer未安装，使用curl测试...');
            return await testWithCurl();
        }
        
        const page = await browser.newPage();
        
        // 监听控制台错误
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ 浏览器控制台错误:', msg.text());
            }
        });
        
        // 监听网络错误
        page.on('requestfailed', request => {
            console.log('❌ 网络请求失败:', request.url(), request.failure().errorText);
        });
        
        console.log('📱 访问管理后台概览页面...');
        await page.goto('http://localhost:3000/admin/overview', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });
        
        // 等待页面加载
        await page.waitForTimeout(2000);
        
        // 检查是否需要登录
        const isLoginPage = await page.$('.ant-form-item') !== null && 
                            await page.$('input[type="password"]') !== null;
        
        if (isLoginPage) {
            console.log('🔐 需要登录，尝试使用管理员账号...');
            
            // 填写登录信息（使用常见的默认管理员账号）
            await page.type('input[type="text"], input[type="email"]', 'admin');
            await page.type('input[type="password"]', 'admin123');
            
            // 点击登录按钮
            await page.click('.ant-btn-primary');
            await page.waitForTimeout(3000);
        }
        
        // 检查页面标题
        const pageTitle = await page.title();
        console.log('📄 页面标题:', pageTitle);
        
        // 检查是否成功进入概览页面
        const overviewTitle = await page.$eval('h2', el => el.textContent).catch(() => null);
        console.log('📊 概览页面标题:', overviewTitle);
        
        if (!overviewTitle || !overviewTitle.includes('数据概览')) {
            console.log('❌ 未能成功访问概览页面，可能还在登录页面或出现其他错误');
            
            // 截图保存当前页面状态
            await page.screenshot({ path: '/tmp/admin-overview-error.png' });
            console.log('📸 已截图保存到 /tmp/admin-overview-error.png');
            
            return;
        }
        
        console.log('✅ 成功访问管理后台概览页面');
        
        // 检查Top5销售排行榜数据
        console.log('\n📈 检查Top5销售排行榜...');
        
        const top5Table = await page.$('.ant-table-tbody');
        if (top5Table) {
            const tableRows = await page.$$('.ant-table-tbody tr');
            console.log(`   - 排行榜行数: ${tableRows.length}`);
            
            if (tableRows.length > 0) {
                // 检查前几行的数据
                for (let i = 0; i < Math.min(tableRows.length, 3); i++) {
                    const row = tableRows[i];
                    const cells = await row.$$('td');
                    if (cells.length >= 4) {
                        const rank = await cells[0].textContent();
                        const salesName = await cells[2].textContent();
                        const amount = await cells[4].textContent();
                        
                        console.log(`   - 第${i+1}行: 排名=${rank.trim()}, 销售=${salesName.trim()}, 金额=${amount.trim()}`);
                    }
                }
                
                console.log('✅ Top5销售排行榜有数据显示');
            } else {
                console.log('❌ Top5销售排行榜表格为空');
            }
        } else {
            console.log('❌ 未找到Top5销售排行榜表格');
        }
        
        // 检查订单分类统计
        console.log('\n📊 检查订单分类统计...');
        
        const progressCircles = await page.$$('.ant-progress-circle');
        console.log(`   - 找到 ${progressCircles.length} 个进度圆环`);
        
        if (progressCircles.length > 0) {
            for (let i = 0; i < Math.min(progressCircles.length, 5); i++) {
                const circle = progressCircles[i];
                const percentText = await circle.$eval('.ant-progress-text', el => el.textContent).catch(() => '未知');
                console.log(`   - 进度圆环 ${i+1}: ${percentText}`);
            }
            console.log('✅ 订单分类统计显示正常');
        } else {
            console.log('❌ 未找到订单分类统计的进度圆环');
        }
        
        // 检查转化率统计表格
        console.log('\n📋 检查转化率统计表格...');
        
        const conversionTable = await page.$$('.ant-table');
        const conversionTableIndex = conversionTable.length >= 2 ? 1 : 0; // 通常是第二个表格
        
        if (conversionTable[conversionTableIndex]) {
            const conversionRows = await conversionTable[conversionTableIndex].$$('.ant-table-tbody tr');
            console.log(`   - 转化率表格行数: ${conversionRows.length}`);
            
            if (conversionRows.length > 0) {
                for (let i = 0; i < conversionRows.length; i++) {
                    const row = conversionRows[i];
                    const cells = await row.$$('td');
                    if (cells.length >= 4) {
                        const type = await cells[0].textContent();
                        const total = await cells[1].textContent();
                        const converted = await cells[2].textContent();
                        const rate = await cells[3].textContent();
                        
                        console.log(`   - ${type.trim()}: 总数=${total.trim()}, 转化=${converted.trim()}, 转化率=${rate.trim()}`);
                    }
                }
                console.log('✅ 转化率统计表格有数据显示');
            } else {
                console.log('❌ 转化率统计表格为空');
            }
        } else {
            console.log('❌ 未找到转化率统计表格');
        }
        
        // 检查统计卡片
        console.log('\n📈 检查统计卡片...');
        
        const statisticCards = await page.$$('.ant-statistic');
        console.log(`   - 找到 ${statisticCards.length} 个统计卡片`);
        
        for (let i = 0; i < Math.min(statisticCards.length, 10); i++) {
            const card = statisticCards[i];
            const title = await card.$eval('.ant-statistic-title', el => el.textContent).catch(() => '');
            const value = await card.$eval('.ant-statistic-content-value', el => el.textContent).catch(() => '0');
            
            console.log(`   - 卡片 ${i+1}: ${title.trim()} = ${value.trim()}`);
        }
        
        // 截图保存当前页面
        await page.screenshot({ path: '/tmp/admin-overview-success.png' });
        console.log('\n📸 页面截图已保存到 /tmp/admin-overview-success.png');
        
        console.log('\n✅ 管理后台概览页面测试完成');
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
        
        if (browser) {
            // 截图保存错误状态
            const pages = await browser.pages();
            if (pages.length > 0) {
                await pages[0].screenshot({ path: '/tmp/admin-overview-error.png' });
                console.log('📸 错误截图已保存到 /tmp/admin-overview-error.png');
            }
        }
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 备用测试方法：使用curl
async function testWithCurl() {
    console.log('🔄 使用curl测试页面可访问性...');
    
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
        exec('curl -s -I http://localhost:3000/', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ 服务器不可访问:', error.message);
            } else {
                console.log('✅ 服务器响应正常:');
                console.log(stdout);
            }
            resolve();
        });
    });
}

// 运行测试
if (require.main === module) {
    testAdminOverviewPage();
}

module.exports = testAdminOverviewPage;