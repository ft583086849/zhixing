// 🔍 验证动态佣金计算修复
// 请在一级销售对账页面控制台运行此脚本

console.log('🔍 开始验证动态佣金计算修复...\n');

// 测试案例：WML792355703
// 二级销售订单金额：1588元
// 二级销售佣金率：25%
// 二级销售佣金：397元
// 预期一级销售净佣金：1588 × 40% - 397 = 238.2元
// 预期动态佣金率：238.2 ÷ 1588 = 15%

// 获取页面显示的数据
const statistics = document.querySelectorAll('.ant-statistic');
let displayData = {};

statistics.forEach(stat => {
    const title = stat.querySelector('.ant-statistic-title')?.textContent;
    const value = stat.querySelector('.ant-statistic-content-value')?.textContent;
    
    if (title && value) {
        displayData[title] = value;
    }
});

console.log('📊 页面显示数据:');
console.log('总佣金收入:', displayData['总佣金收入'] || '未找到');
console.log('本月佣金:', displayData['本月佣金'] || '未找到');
console.log('当日佣金:', displayData['当日佣金'] || '未找到');
console.log('佣金比率:', displayData['佣金比率'] || '未找到');

// 如果可以访问Redux Store
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('\n📱 尝试从Redux获取详细数据...');
    
    const store = window.store || window.__store;
    if (store) {
        const state = store.getState();
        
        if (state.sales && state.sales.primarySalesStats) {
            const stats = state.sales.primarySalesStats;
            
            console.log('\n📈 一级销售统计数据:');
            console.log('团队总订单:', stats.totalOrders || 0);
            console.log('团队总金额:', stats.totalAmount || 0, '元');
            console.log('总佣金收入:', stats.totalCommission || 0, '元');
            console.log('动态佣金率:', ((stats.currentCommissionRate || 0) * 100).toFixed(2) + '%');
            
            // 验证计算
            if (stats.totalAmount === 1588) {
                console.log('\n✅ 验证计算（基于1588元订单）:');
                const expectedNetCommission = 1588 * 0.4 - 397;
                const expectedRate = expectedNetCommission / 1588;
                
                console.log('预期净佣金:', expectedNetCommission.toFixed(2), '元');
                console.log('预期佣金率:', (expectedRate * 100).toFixed(2) + '%');
                console.log('实际净佣金:', (stats.totalCommission || 0).toFixed(2), '元');
                console.log('实际佣金率:', ((stats.currentCommissionRate || 0) * 100).toFixed(2) + '%');
                
                const isCorrect = Math.abs((stats.totalCommission || 0) - expectedNetCommission) < 1;
                if (isCorrect) {
                    console.log('✅ 计算正确！');
                } else {
                    console.error('❌ 计算仍有误差，请检查');
                }
            }
            
            // 显示二级销售数据
            if (stats.secondarySales && stats.secondarySales.length > 0) {
                console.log('\n📊 二级销售详情:');
                stats.secondarySales.forEach(ss => {
                    console.log(`- ${ss.wechat_name}:`, {
                        订单数: ss.total_orders,
                        订单金额: ss.total_amount,
                        佣金率: (ss.commission_rate * 100).toFixed(0) + '%',
                        佣金: ss.total_commission
                    });
                });
            }
        }
    }
}

console.log('\n📝 修复说明:');
console.log('原问题：动态佣金率显示75%，佣金金额为1191元');
console.log('修复后：');
console.log('- 佣金率应显示15%左右（净佣金÷团队总额）');
console.log('- 佣金金额应显示238.2元（1588×40%-397）');
console.log('\n💡 如果数据仍不正确，请等待1-2分钟后刷新页面再试');
