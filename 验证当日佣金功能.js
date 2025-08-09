// 🔍 验证当日佣金功能
// 请在浏览器控制台运行此脚本

console.log('🚀 开始验证当日佣金功能...\n');

// 检查当前页面
const currentPath = window.location.pathname;
console.log('📍 当前页面:', currentPath);

if (currentPath.includes('primary-sales-settlement')) {
    console.log('✅ 正在检查一级销售对账页面...\n');
    
    // 获取页面上的统计数据
    const statistics = document.querySelectorAll('.ant-statistic');
    
    let foundTodayCommission = false;
    
    statistics.forEach(stat => {
        const title = stat.querySelector('.ant-statistic-title')?.textContent;
        const value = stat.querySelector('.ant-statistic-content-value')?.textContent;
        
        if (title && value) {
            console.log(`📊 ${title}: ${value}`);
            
            // 特别标注当日佣金
            if (title.includes('当日佣金')) {
                foundTodayCommission = true;
                console.log('   ✅ 发现当日佣金统计！');
                console.log('   💡 说明：当日佣金基于payment_time字段计算');
                
                // 检查是否为0
                if (value.includes('0.00') || value === '0') {
                    console.log('   ⚠️ 当日佣金为0，可能今天没有新订单');
                } else {
                    console.log('   ✅ 当日佣金有数据:', value);
                }
            }
        }
    });
    
    if (!foundTodayCommission) {
        console.error('❌ 未找到当日佣金统计，请检查部署');
    }
    
    // 从Redux获取详细数据
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        console.log('\n📱 尝试从Redux获取详细数据...');
        
        const store = window.store || window.__store;
        if (store) {
            const state = store.getState();
            
            if (state.sales && state.sales.primarySalesStats) {
                const stats = state.sales.primarySalesStats;
                
                console.log('\n📊 详细统计数据:');
                console.log('   总佣金:', stats.totalCommission || 0);
                console.log('   本月佣金:', stats.monthlyCommission || 0);
                console.log('   当日佣金:', stats.todayCommission || 0);
                console.log('   当日订单数:', stats.todayOrders || 0);
                
                if (stats.todayCommission !== undefined) {
                    console.log('\n✅ 当日佣金数据已成功加载到Redux！');
                } else {
                    console.warn('⚠️ Redux中未找到todayCommission字段');
                }
            }
        }
    }
    
    // 获取当前日期
    const now = new Date();
    const today = now.toLocaleDateString('zh-CN');
    console.log('\n📅 当前日期:', today);
    console.log('💡 提示：当日佣金只统计payment_time为今天的订单');
}

// 创建测试订单的提示
console.log('\n📝 测试步骤:');
console.log('1. 在管理员系统创建一个新订单');
console.log('2. 设置payment_time为今天');
console.log('3. 将订单状态设为confirmed');
console.log('4. 刷新一级销售对账页面');
console.log('5. 查看当日佣金是否更新');

console.log('\n✨ 验证完成！');
