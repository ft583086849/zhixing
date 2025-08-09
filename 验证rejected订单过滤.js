// 🔍 验证rejected订单过滤功能
// 请在浏览器控制台运行此脚本

console.log('🔍 开始验证rejected订单过滤功能...\n');

// 检查当前页面
const currentPath = window.location.pathname;
console.log('📍 当前页面:', currentPath);

if (currentPath.includes('primary-sales-settlement')) {
    console.log('✅ 正在检查一级销售对账页面...');
    
    // 检查表格数据
    const tableRows = document.querySelectorAll('tbody tr');
    console.log(`📊 当前显示订单数: ${tableRows.length}`);
    
    // 检查是否有rejected状态的订单
    let hasRejected = false;
    tableRows.forEach((row, index) => {
        const statusCell = row.querySelector('[class*="status"]');
        if (statusCell && statusCell.textContent.includes('拒绝')) {
            hasRejected = true;
            console.error(`❌ 发现rejected订单在第${index + 1}行`);
        }
    });
    
    if (!hasRejected) {
        console.log('✅ 订单列表中没有rejected订单');
    }
    
    // 检查统计数据
    const stats = document.querySelectorAll('[class*="statistic"]');
    if (stats.length > 0) {
        console.log('\n📊 统计数据:');
        stats.forEach(stat => {
            const title = stat.querySelector('[class*="title"]')?.textContent;
            const value = stat.querySelector('[class*="value"]')?.textContent;
            if (title && value) {
                console.log(`  ${title}: ${value}`);
            }
        });
    }
    
} else if (currentPath.includes('sales-reconciliation')) {
    console.log('✅ 正在检查二级销售对账页面...');
    
    // 检查表格数据
    const tableRows = document.querySelectorAll('tbody tr');
    console.log(`📊 当前显示订单数: ${tableRows.length}`);
    
    // 检查是否有rejected状态的订单
    let hasRejected = false;
    tableRows.forEach((row, index) => {
        const statusCell = row.querySelector('[class*="status"]');
        if (statusCell && statusCell.textContent.includes('拒绝')) {
            hasRejected = true;
            console.error(`❌ 发现rejected订单在第${index + 1}行`);
        }
    });
    
    if (!hasRejected) {
        console.log('✅ 订单列表中没有rejected订单');
    }
    
    // 检查统计数据
    const summaryCards = document.querySelectorAll('[class*="card"]');
    if (summaryCards.length > 0) {
        console.log('\n📊 统计数据:');
        summaryCards.forEach(card => {
            const title = card.querySelector('[class*="title"]')?.textContent;
            const content = card.querySelector('[class*="content"]')?.textContent;
            if (title && content) {
                console.log(`  ${title}: ${content}`);
            }
        });
    }
    
} else {
    console.warn('⚠️ 请在一级销售对账或二级销售对账页面运行此脚本');
}

// 从Redux获取数据（如果可用）
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('\n📱 正在从Redux获取数据...');
    const store = window.store || window.__store;
    if (store) {
        const state = store.getState();
        
        // 检查销售数据
        if (state.sales) {
            const { primarySalesStats, secondarySalesStats } = state.sales;
            
            if (primarySalesStats) {
                console.log('\n一级销售统计:');
                console.log('  总订单数:', primarySalesStats.total_orders);
                console.log('  总金额:', primarySalesStats.total_amount);
                console.log('  总佣金:', primarySalesStats.total_commission);
                
                // 检查订单列表
                if (primarySalesStats.orders) {
                    const rejectedOrders = primarySalesStats.orders.filter(o => 
                        o.status === 'rejected'
                    );
                    if (rejectedOrders.length > 0) {
                        console.error(`❌ Redux中发现${rejectedOrders.length}个rejected订单`);
                    } else {
                        console.log('✅ Redux订单数据中没有rejected订单');
                    }
                }
            }
            
            if (secondarySalesStats) {
                console.log('\n二级销售统计:');
                console.log('  总订单数:', secondarySalesStats.total_orders);
                console.log('  总金额:', secondarySalesStats.total_amount);
                console.log('  总佣金:', secondarySalesStats.total_commission);
                
                // 检查订单列表
                if (secondarySalesStats.orders) {
                    const rejectedOrders = secondarySalesStats.orders.filter(o => 
                        o.status === 'rejected'
                    );
                    if (rejectedOrders.length > 0) {
                        console.error(`❌ Redux中发现${rejectedOrders.length}个rejected订单`);
                    } else {
                        console.log('✅ Redux订单数据中没有rejected订单');
                    }
                }
            }
        }
    }
}

console.log('\n✨ 验证完成！');
console.log('如果发现问题，请截图并反馈。');
