// 🔍 验证动态佣金计算功能
// 请在浏览器控制台运行此脚本

console.log('🚀 开始验证动态佣金计算系统...\n');

// 1. 检查当前页面
const currentPath = window.location.pathname;
console.log('📍 当前页面:', currentPath);

// 2. 如果在一级销售对账页面
if (currentPath.includes('primary-sales-settlement')) {
    console.log('✅ 正在检查一级销售对账页面...\n');
    
    // 获取页面上的统计数据
    const statistics = document.querySelectorAll('.ant-statistic');
    
    statistics.forEach(stat => {
        const title = stat.querySelector('.ant-statistic-title')?.textContent;
        const value = stat.querySelector('.ant-statistic-content-value')?.textContent;
        
        if (title && value) {
            console.log(`📊 ${title}: ${value}`);
            
            // 特别标注佣金比率
            if (title.includes('佣金比率')) {
                console.log('   💡 注意：此佣金率应该是动态计算的结果');
                
                // 检查是否为40%（基础值）
                if (value.includes('40.0')) {
                    console.log('   ⚠️ 佣金率为40%，可能没有二级销售订单');
                } else {
                    console.log('   ✅ 佣金率已动态调整为:', value);
                }
            }
        }
    });
    
    // 检查二级销售数据
    console.log('\n📋 检查二级销售数据...');
    const secondaryTables = document.querySelectorAll('.ant-table');
    
    if (secondaryTables.length > 1) {
        const secondaryTable = secondaryTables[1]; // 通常第二个表格是二级销售
        const rows = secondaryTable.querySelectorAll('tbody tr');
        
        if (rows.length > 0) {
            console.log(`✅ 发现 ${rows.length} 个二级销售`);
            
            // 提取佣金率
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    const name = cells[0]?.textContent;
                    const rate = cells[3]?.textContent; // 假设佣金率在第4列
                    console.log(`   ${index + 1}. ${name} - 佣金率: ${rate}`);
                }
            });
            
            console.log('\n💡 动态佣金计算说明:');
            console.log('   公式: ((一级直接金额×40%) + (二级总金额 - 二级佣金)) ÷ 团队总金额');
        } else {
            console.log('⚠️ 没有二级销售数据，佣金率应为基础的40%');
        }
    }
}

// 3. 如果在订单管理页面
if (currentPath.includes('admin/orders')) {
    console.log('✅ 正在检查订单管理页面...\n');
    
    // 检查表格列
    const headers = document.querySelectorAll('.ant-table-thead th');
    let hasPrimarySalesColumn = false;
    
    headers.forEach(header => {
        const title = header.textContent;
        if (title.includes('一级销售微信')) {
            hasPrimarySalesColumn = true;
            console.log('✅ 发现"一级销售微信"列');
        }
    });
    
    if (!hasPrimarySalesColumn) {
        console.error('❌ 未找到"一级销售微信"列，请检查部署');
    }
    
    // 检查订单数据
    const rows = document.querySelectorAll('.ant-table-tbody tr');
    console.log(`\n📊 订单列表共 ${rows.length} 条记录`);
    
    // 分析前3条订单
    for (let i = 0; i < Math.min(3, rows.length); i++) {
        const cells = rows[i].querySelectorAll('td');
        console.log(`\n订单 ${i + 1}:`);
        
        // 查找销售微信号和一级销售微信
        cells.forEach(cell => {
            const tags = cell.querySelectorAll('.ant-tag');
            if (tags.length > 0) {
                tags.forEach(tag => {
                    const color = tag.getAttribute('color');
                    const text = tag.textContent;
                    
                    if (color === 'blue') console.log('   销售类型: 一级销售');
                    if (color === 'orange') console.log('   销售类型: 二级销售');
                    if (color === 'green') console.log('   销售类型: 独立销售');
                    if (color === 'red') console.log('   一级销售:', text);
                });
            }
        });
    }
}

// 4. 从Redux获取详细数据（如果可用）
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('\n📱 尝试从Redux获取详细数据...');
    
    const store = window.store || window.__store;
    if (store) {
        const state = store.getState();
        
        // 获取销售数据
        if (state.sales) {
            const { primarySalesStats } = state.sales;
            
            if (primarySalesStats) {
                console.log('\n🔍 一级销售统计数据:');
                console.log('   总订单数:', primarySalesStats.totalOrders);
                console.log('   总金额:', primarySalesStats.totalAmount);
                console.log('   总佣金:', primarySalesStats.totalCommission);
                console.log('   本月订单:', primarySalesStats.monthlyOrders);
                console.log('   本月佣金:', primarySalesStats.monthlyCommission);
                console.log('   当前佣金率:', primarySalesStats.currentCommissionRate);
                
                // 检查是否有动态计算
                if (primarySalesStats.currentCommissionRate && 
                    primarySalesStats.currentCommissionRate !== 0.4) {
                    console.log('\n✅ 佣金率已动态计算！');
                    console.log('   基础佣金率: 40%');
                    console.log('   动态佣金率:', (primarySalesStats.currentCommissionRate * 100).toFixed(2) + '%');
                }
            }
        }
    }
}

console.log('\n✨ 验证完成！');
console.log('💡 提示：');
console.log('   1. 创建二级销售订单后，一级销售佣金率会自动调整');
console.log('   2. 本月数据基于payment_time字段计算');
console.log('   3. 订单管理页面应显示完整的销售层级关系');
