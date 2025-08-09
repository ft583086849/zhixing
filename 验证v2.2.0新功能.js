// 🔍 验证v2.2.0版本新功能
// 请在浏览器控制台运行此脚本

console.log('🚀 开始验证v2.2.0新功能...\n');

const currentPath = window.location.pathname;
console.log('📍 当前页面:', currentPath);

// 1. 验证一级销售对账页面的购买链接功能
if (currentPath.includes('primary-sales-settlement')) {
    console.log('\n✅ 检查一级销售对账页面新功能...');
    
    // 检查二级销售管理表格
    const tables = document.querySelectorAll('.ant-table');
    
    if (tables.length > 1) {
        console.log('📋 检查二级销售管理表格...');
        
        // 查找购买链接列
        const headers = tables[1].querySelectorAll('.ant-table-thead th');
        let hasPurchaseLinkColumn = false;
        
        headers.forEach(header => {
            if (header.textContent.includes('购买链接')) {
                hasPurchaseLinkColumn = true;
                console.log('✅ 发现"购买链接"列！');
            }
        });
        
        if (!hasPurchaseLinkColumn) {
            console.error('❌ 未找到"购买链接"列，请检查部署');
        }
        
        // 检查复制链接按钮
        const copyButtons = tables[1].querySelectorAll('button');
        let hasCopyButton = false;
        
        copyButtons.forEach(button => {
            if (button.textContent.includes('复制链接')) {
                hasCopyButton = true;
                console.log('✅ 发现"复制链接"按钮');
            }
        });
        
        if (!hasCopyButton) {
            console.warn('⚠️ 未找到复制链接按钮，可能还没有二级销售数据');
        }
    }
    
    // 检查当日佣金显示
    const statistics = document.querySelectorAll('.ant-statistic');
    let foundTodayCommission = false;
    
    statistics.forEach(stat => {
        const title = stat.querySelector('.ant-statistic-title')?.textContent;
        if (title && title.includes('当日佣金')) {
            foundTodayCommission = true;
            const value = stat.querySelector('.ant-statistic-content-value')?.textContent;
            console.log(`✅ 当日佣金: ${value}`);
        }
    });
    
    if (!foundTodayCommission) {
        console.error('❌ 未找到当日佣金统计');
    }
}

// 2. 验证二级销售对账页面的当日返佣功能
if (currentPath.includes('sales-reconciliation')) {
    console.log('\n✅ 检查二级销售对账页面新功能...');
    
    const statistics = document.querySelectorAll('.ant-statistic');
    let foundTodayCommission = false;
    let foundMonthCommission = false;
    
    statistics.forEach(stat => {
        const title = stat.querySelector('.ant-statistic-title')?.textContent;
        const value = stat.querySelector('.ant-statistic-content-value')?.textContent;
        
        if (title) {
            if (title.includes('当日返佣')) {
                foundTodayCommission = true;
                console.log(`✅ 当日返佣: ${value}`);
            }
            if (title.includes('本月返佣')) {
                foundMonthCommission = true;
                console.log(`✅ 本月返佣: ${value}`);
            }
        }
    });
    
    if (!foundTodayCommission) {
        console.error('❌ 未找到当日返佣统计');
    }
    if (!foundMonthCommission) {
        console.error('❌ 未找到本月返佣统计');
    }
    
    // 检查统计卡片数量
    const statsCount = statistics.length;
    console.log(`📊 统计卡片总数: ${statsCount}`);
    if (statsCount >= 6) {
        console.log('✅ 统计卡片布局正确（6个卡片）');
    }
}

// 3. 从Redux获取详细数据
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('\n📱 尝试从Redux获取数据...');
    
    const store = window.store || window.__store;
    if (store) {
        const state = store.getState();
        
        if (state.sales && currentPath.includes('primary-sales-settlement')) {
            const { primarySalesStats } = state.sales;
            if (primarySalesStats) {
                console.log('\n一级销售统计:');
                console.log('  当日佣金:', primarySalesStats.todayCommission || 0);
                console.log('  本月佣金:', primarySalesStats.monthlyCommission || 0);
                console.log('  总佣金:', primarySalesStats.totalCommission || 0);
                
                if (primarySalesStats.secondarySales) {
                    console.log('  二级销售数量:', primarySalesStats.secondarySales.length);
                }
            }
        }
    }
}

// 4. 版本信息
console.log('\n📦 v2.2.0 版本新功能:');
console.log('1. ✅ 二级销售对账页面 - 当日返佣统计');
console.log('2. ✅ 二级销售对账页面 - 本月返佣统计');
console.log('3. ✅ 一级销售对账页面 - 二级销售购买链接');
console.log('4. ✅ 购买链接复制功能');
console.log('5. ✅ 统计卡片布局优化');

console.log('\n✨ 验证完成！');
console.log('💡 提示：部署可能需要2-3分钟生效，如果功能未显示请稍后刷新页面');
