// 🧪 知行财库 - 线上全功能自动化测试脚本
// 测试时间：2025年1月
// 测试环境：https://zhixing-seven.vercel.app

console.log('🚀 开始知行财库线上全功能测试...\n');
console.log('测试时间:', new Date().toLocaleString('zh-CN'));
console.log('测试环境:', window.location.origin);
console.log('='*60);

// 测试结果收集
const testResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    details: [],
    startTime: new Date(),
    endTime: null
};

// 测试辅助函数
function logTest(category, testName, status, message = '', details = null) {
    testResults.totalTests++;
    const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    
    if (status === 'pass') testResults.passed++;
    else if (status === 'fail') testResults.failed++;
    else if (status === 'warning') testResults.warnings++;
    
    const result = {
        category,
        testName,
        status,
        message,
        details,
        timestamp: new Date().toISOString()
    };
    
    testResults.details.push(result);
    console.log(`${statusIcon} [${category}] ${testName}: ${message || status}`);
    if (details) console.log('   详情:', details);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 测试套件 ====================

// 1. 页面加载测试
async function testPageLoading() {
    console.log('\n📱 测试1: 页面加载性能');
    console.log('-'*40);
    
    const pages = [
        { path: '/', name: '首页' },
        { path: '/admin/dashboard', name: '数据概览' },
        { path: '/admin/sales', name: '销售管理' },
        { path: '/admin/orders', name: '订单管理' },
        { path: '/admin/customers', name: '客户管理' },
        { path: '/admin/finance', name: '财务统计' },
        { path: '/sales', name: '一级销售注册' },
        { path: '/secondary-sales', name: '二级销售注册' },
        { path: '/primary-sales-settlement', name: '一级销售对账' }
    ];
    
    for (const page of pages) {
        try {
            const startTime = Date.now();
            const response = await fetch(page.path);
            const loadTime = Date.now() - startTime;
            
            if (response.ok) {
                const status = loadTime < 2000 ? 'pass' : 'warning';
                logTest('页面加载', page.name, status, `加载时间: ${loadTime}ms`);
            } else {
                logTest('页面加载', page.name, 'fail', `HTTP ${response.status}`);
            }
        } catch (error) {
            logTest('页面加载', page.name, 'fail', error.message);
        }
        await delay(100);
    }
}

// 2. API接口测试
async function testAPIs() {
    console.log('\n🔌 测试2: API接口响应');
    console.log('-'*40);
    
    // 检查是否有AdminAPI
    if (typeof window.AdminAPI !== 'undefined') {
        const apis = [
            { name: '获取统计数据', func: () => window.AdminAPI.getStats() },
            { name: '获取销售列表', func: () => window.AdminAPI.getSales() },
            { name: '获取订单列表', func: () => window.AdminAPI.getOrders() },
            { name: '获取客户列表', func: () => window.AdminAPI.getCustomers() },
            { name: '获取支付配置', func: () => window.AdminAPI.getPaymentConfig() },
            { name: '获取收益分配', func: () => window.AdminAPI.getProfitDistribution() }
        ];
        
        for (const api of apis) {
            try {
                const startTime = Date.now();
                const result = await api.func();
                const responseTime = Date.now() - startTime;
                
                if (result && result.success !== false) {
                    const status = responseTime < 1000 ? 'pass' : 'warning';
                    logTest('API接口', api.name, status, `响应时间: ${responseTime}ms`);
                } else {
                    logTest('API接口', api.name, 'fail', result?.message || '请求失败');
                }
            } catch (error) {
                logTest('API接口', api.name, 'fail', error.message);
            }
            await delay(200);
        }
    } else {
        logTest('API接口', 'AdminAPI可用性', 'warning', '需要在管理后台页面运行');
    }
}

// 3. 数据概览功能测试
async function testDataOverview() {
    console.log('\n📊 测试3: 数据概览功能');
    console.log('-'*40);
    
    if (window.location.pathname === '/admin/dashboard') {
        // 检查关键元素
        const elements = [
            { selector: '.ant-statistic', name: '统计卡片' },
            { selector: '.ant-card', name: '数据卡片' },
            { selector: '.ant-select', name: '时间选择器' },
            { selector: '.ant-table', name: 'Top5销售排行榜' }
        ];
        
        elements.forEach(el => {
            const found = document.querySelector(el.selector);
            logTest('数据概览', el.name, found ? 'pass' : 'fail', 
                found ? '元素存在' : '元素未找到');
        });
        
        // 测试时间筛选
        const timeRanges = ['today', 'week', 'month', 'year', 'all'];
        const select = document.querySelector('.ant-select');
        if (select) {
            logTest('数据概览', '时间筛选器', 'pass', '可用');
        } else {
            logTest('数据概览', '时间筛选器', 'fail', '未找到');
        }
    } else {
        logTest('数据概览', '页面检测', 'warning', '请在数据概览页面运行');
    }
}

// 4. 销售管理功能测试
async function testSalesManagement() {
    console.log('\n👥 测试4: 销售管理功能');
    console.log('-'*40);
    
    if (window.location.pathname === '/admin/sales') {
        // 检查三层销售体系
        const salesTypes = document.querySelectorAll('.ant-tag');
        const hasTypes = Array.from(salesTypes).some(tag => 
            ['一级', '二级', '独立'].some(type => tag.textContent.includes(type))
        );
        
        logTest('销售管理', '三层销售体系标识', hasTypes ? 'pass' : 'warning', 
            hasTypes ? '销售类型标签存在' : '未找到销售类型标签');
        
        // 检查表格功能
        const table = document.querySelector('.ant-table');
        const hasFixedColumn = document.querySelector('.ant-table-fixed');
        
        logTest('销售管理', '表格显示', table ? 'pass' : 'fail', 
            table ? '表格正常显示' : '表格未找到');
        logTest('销售管理', '固定列功能', hasFixedColumn ? 'pass' : 'warning', 
            hasFixedColumn ? '固定列生效' : '无固定列');
    } else {
        logTest('销售管理', '页面检测', 'warning', '请在销售管理页面运行');
    }
}

// 5. 订单管理功能测试
async function testOrderManagement() {
    console.log('\n📦 测试5: 订单管理功能');
    console.log('-'*40);
    
    if (window.location.pathname === '/admin/orders') {
        // 检查关键功能
        const features = [
            { selector: '.ant-table', name: '订单表格' },
            { selector: '.ant-form', name: '搜索表单' },
            { selector: '.ant-table-fixed', name: '固定列' }
        ];
        
        features.forEach(feat => {
            const element = document.querySelector(feat.selector);
            logTest('订单管理', feat.name, element ? 'pass' : 'fail',
                element ? '功能正常' : '功能缺失');
        });
        
        // 检查是否有催单建议（应该没有，已移到客户管理）
        const hasReminder = Array.from(document.querySelectorAll('th'))
            .some(th => th.textContent.includes('催单建议'));
        
        logTest('订单管理', '催单建议已移除', !hasReminder ? 'pass' : 'fail',
            !hasReminder ? '正确（已移到客户管理）' : '错误（应该移除）');
    } else {
        logTest('订单管理', '页面检测', 'warning', '请在订单管理页面运行');
    }
}

// 6. 客户管理功能测试
async function testCustomerManagement() {
    console.log('\n👤 测试6: 客户管理功能');
    console.log('-'*40);
    
    if (window.location.pathname === '/admin/customers') {
        // 检查催单建议功能
        const hasReminder = Array.from(document.querySelectorAll('th'))
            .some(th => th.textContent.includes('催单建议'));
        
        logTest('客户管理', '催单建议功能', hasReminder ? 'pass' : 'fail',
            hasReminder ? '催单建议列存在' : '催单建议列缺失');
        
        // 检查销售层级显示
        const hasSalesType = document.querySelector('.ant-tag');
        logTest('客户管理', '销售层级显示', hasSalesType ? 'pass' : 'warning',
            hasSalesType ? '销售类型标签存在' : '未找到销售类型标签');
        
        // 检查搜索功能
        const searchForm = document.querySelector('.ant-form');
        logTest('客户管理', '搜索功能', searchForm ? 'pass' : 'fail',
            searchForm ? '搜索表单存在' : '搜索表单缺失');
    } else {
        logTest('客户管理', '页面检测', 'warning', '请在客户管理页面运行');
    }
}

// 7. 财务统计功能测试
async function testFinanceStatistics() {
    console.log('\n💰 测试7: 财务统计功能');
    console.log('-'*40);
    
    if (window.location.pathname === '/admin/finance') {
        // 检查保存按钮
        const saveButton = document.querySelector('button');
        const hasSaveText = Array.from(document.querySelectorAll('button'))
            .some(btn => btn.textContent.includes('保存'));
        
        logTest('财务统计', '保存分配方案按钮', hasSaveText ? 'pass' : 'fail',
            hasSaveText ? '保存按钮存在' : '保存按钮缺失');
        
        // 检查收益分配输入
        const ratioInputs = document.querySelectorAll('.ant-input-number');
        logTest('财务统计', '收益分配输入框', ratioInputs.length >= 3 ? 'pass' : 'fail',
            `找到 ${ratioInputs.length} 个输入框`);
        
        // 检查时间筛选
        const timeFilter = document.querySelector('.ant-select');
        logTest('财务统计', '时间筛选功能', timeFilter ? 'pass' : 'fail',
            timeFilter ? '时间筛选器存在' : '时间筛选器缺失');
    } else {
        logTest('财务统计', '页面检测', 'warning', '请在财务统计页面运行');
    }
}

// 8. 支付配置测试
async function testPaymentConfig() {
    console.log('\n💳 测试8: 支付配置');
    console.log('-'*40);
    
    if (typeof window.AdminAPI !== 'undefined') {
        try {
            const config = await window.AdminAPI.getPaymentConfig();
            
            if (config && config.data) {
                // 检查双链配置
                const hasCrypto1 = config.data.crypto_address && config.data.crypto_chain_name;
                const hasCrypto2 = config.data.crypto2_address && config.data.crypto2_chain_name;
                
                logTest('支付配置', '第一条链(TRC20)', hasCrypto1 ? 'pass' : 'fail',
                    hasCrypto1 ? `${config.data.crypto_chain_name} 已配置` : '未配置');
                
                logTest('支付配置', '第二条链(BSC)', hasCrypto2 ? 'pass' : 'warning',
                    hasCrypto2 ? `${config.data.crypto2_chain_name} 已配置` : '未配置');
                
                // 检查二维码
                const hasQR1 = config.data.crypto_qr_code;
                const hasQR2 = config.data.crypto2_qr_code;
                
                logTest('支付配置', 'TRC20二维码', hasQR1 ? 'pass' : 'warning',
                    hasQR1 ? '二维码已上传' : '二维码缺失');
                
                logTest('支付配置', 'BSC二维码', hasQR2 ? 'pass' : 'warning',
                    hasQR2 ? '二维码已上传' : '二维码缺失');
            } else {
                logTest('支付配置', '配置获取', 'fail', '无法获取支付配置');
            }
        } catch (error) {
            logTest('支付配置', '配置测试', 'fail', error.message);
        }
    } else {
        logTest('支付配置', 'API可用性', 'warning', '需要在管理后台运行');
    }
}

// 9. 销售关联测试
async function testSalesAssociation() {
    console.log('\n🔗 测试9: 销售关联关系');
    console.log('-'*40);
    
    if (typeof window.AdminAPI !== 'undefined') {
        try {
            const sales = await window.AdminAPI.getSales();
            
            if (sales && sales.data) {
                const primarySales = sales.data.filter(s => s.sales_type === 'primary');
                const secondarySales = sales.data.filter(s => s.sales_type === 'secondary');
                const independentSales = sales.data.filter(s => s.sales_type === 'independent');
                
                logTest('销售关联', '一级销售数量', 'pass', `${primarySales.length} 个`);
                logTest('销售关联', '二级销售数量', 'pass', `${secondarySales.length} 个`);
                logTest('销售关联', '独立销售数量', 'pass', `${independentSales.length} 个`);
                
                // 检查二级销售是否都有primary_sales_id
                const unlinkedSecondary = secondarySales.filter(s => !s.primary_sales_id);
                
                logTest('销售关联', '二级销售关联完整性', 
                    unlinkedSecondary.length === 0 ? 'pass' : 'warning',
                    unlinkedSecondary.length === 0 ? 
                        '所有二级销售都已关联一级' : 
                        `${unlinkedSecondary.length} 个二级销售未关联`,
                    unlinkedSecondary.map(s => s.sales_wechat_name)
                );
            }
        } catch (error) {
            logTest('销售关联', '关联测试', 'fail', error.message);
        }
    } else {
        logTest('销售关联', 'API可用性', 'warning', '需要在管理后台运行');
    }
}

// 10. 响应式布局测试
async function testResponsiveLayout() {
    console.log('\n📱 测试10: 响应式布局');
    console.log('-'*40);
    
    const viewportWidth = window.innerWidth;
    const device = viewportWidth < 768 ? '移动端' : 
                  viewportWidth < 1024 ? '平板' : '桌面端';
    
    logTest('响应式', '当前设备', 'pass', `${device} (${viewportWidth}px)`);
    
    // 检查是否有横向滚动
    const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
    logTest('响应式', '横向滚动', hasHorizontalScroll ? 'warning' : 'pass',
        hasHorizontalScroll ? '存在横向滚动条' : '无横向滚动，布局正常');
    
    // 检查表格响应式
    const tables = document.querySelectorAll('.ant-table-wrapper');
    tables.forEach((table, index) => {
        const hasScroll = table.querySelector('.ant-table-body').scrollWidth > 
                         table.querySelector('.ant-table-body').clientWidth;
        logTest('响应式', `表格${index + 1}滚动`, 'pass', 
            hasScroll ? '可横向滚动' : '内容适应屏幕');
    });
}

// ==================== 生成测试报告 ====================
function generateReport() {
    testResults.endTime = new Date();
    const duration = (testResults.endTime - testResults.startTime) / 1000;
    
    console.log('\n' + '='*60);
    console.log('📊 测试报告汇总');
    console.log('='*60);
    
    console.log(`
测试概况：
---------
📅 测试时间: ${testResults.startTime.toLocaleString('zh-CN')}
⏱️ 测试耗时: ${duration.toFixed(2)} 秒
🌐 测试环境: ${window.location.origin}
📱 当前页面: ${window.location.pathname}

测试结果：
---------
✅ 通过: ${testResults.passed} 项
❌ 失败: ${testResults.failed} 项
⚠️ 警告: ${testResults.warnings} 项
📊 总计: ${testResults.totalTests} 项
🎯 通过率: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%
`);
    
    // 分类汇总
    const categories = {};
    testResults.details.forEach(detail => {
        if (!categories[detail.category]) {
            categories[detail.category] = { pass: 0, fail: 0, warning: 0 };
        }
        if (detail.status === 'pass') categories[detail.category].pass++;
        else if (detail.status === 'fail') categories[detail.category].fail++;
        else if (detail.status === 'warning') categories[detail.category].warning++;
    });
    
    console.log('分类统计：');
    console.log('---------');
    Object.entries(categories).forEach(([cat, stats]) => {
        console.log(`${cat}: ✅ ${stats.pass} | ❌ ${stats.fail} | ⚠️ ${stats.warning}`);
    });
    
    // 失败项详情
    if (testResults.failed > 0) {
        console.log('\n❌ 失败项详情：');
        console.log('---------');
        testResults.details.filter(d => d.status === 'fail').forEach(detail => {
            console.log(`• [${detail.category}] ${detail.testName}: ${detail.message}`);
            if (detail.details) console.log(`  详情: ${JSON.stringify(detail.details)}`);
        });
    }
    
    // 警告项详情
    if (testResults.warnings > 0) {
        console.log('\n⚠️ 警告项详情：');
        console.log('---------');
        testResults.details.filter(d => d.status === 'warning').forEach(detail => {
            console.log(`• [${detail.category}] ${detail.testName}: ${detail.message}`);
            if (detail.details) console.log(`  详情: ${JSON.stringify(detail.details)}`);
        });
    }
    
    // 建议
    console.log('\n💡 优化建议：');
    console.log('---------');
    
    if (testResults.failed > 0) {
        console.log('• 🔴 存在失败项，建议立即修复关键功能');
    }
    if (testResults.warnings > 0) {
        console.log('• 🟡 存在警告项，建议优化用户体验');
    }
    if (testResults.passed === testResults.totalTests) {
        console.log('• 🟢 所有测试通过，系统运行良好！');
    }
    
    // 导出功能
    console.log('\n💾 导出测试结果：');
    console.log('---------');
    console.log('• 复制下方命令导出JSON格式报告：');
    console.log('  copy(testResults)');
    console.log('• 或使用: JSON.stringify(testResults, null, 2)');
    
    // 保存到全局变量
    window.testResults = testResults;
    
    return testResults;
}

// ==================== 执行测试 ====================
async function runAllTests() {
    console.log('🎯 开始执行全功能测试套件...\n');
    
    // 依次执行所有测试
    await testPageLoading();
    await delay(500);
    
    await testAPIs();
    await delay(500);
    
    await testDataOverview();
    await delay(500);
    
    await testSalesManagement();
    await delay(500);
    
    await testOrderManagement();
    await delay(500);
    
    await testCustomerManagement();
    await delay(500);
    
    await testFinanceStatistics();
    await delay(500);
    
    await testPaymentConfig();
    await delay(500);
    
    await testSalesAssociation();
    await delay(500);
    
    await testResponsiveLayout();
    
    // 生成报告
    const report = generateReport();
    
    console.log('\n✅ 测试完成！');
    console.log('提示：测试结果已保存到 window.testResults');
    
    return report;
}

// 立即执行测试
runAllTests().then(report => {
    console.log('\n🎉 测试执行完毕！');
    
    // 如果有失败项，高亮显示
    if (report.failed > 0) {
        console.log('%c⚠️ 警告：有 ' + report.failed + ' 项测试失败，请检查！', 
            'color: red; font-size: 14px; font-weight: bold;');
    } else if (report.warnings > 0) {
        console.log('%c💡 提示：有 ' + report.warnings + ' 项警告，建议优化', 
            'color: orange; font-size: 14px; font-weight: bold;');
    } else {
        console.log('%c🎊 恭喜：所有测试通过！', 
            'color: green; font-size: 14px; font-weight: bold;');
    }
});
