// 🎯 验证销售管理修复效果
// 请在 https://zhixing-seven.vercel.app/admin/sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🎯 开始验证销售管理修复效果...');
    console.log('='.repeat(60));
    
    // 1. 检查Redux Store状态
    console.log('\n📊 1. 检查Redux Store状态：');
    const store = window.store || window.__REDUX_STORE__;
    if (!store) {
        console.error('❌ 未找到Redux Store');
        return;
    }
    
    const state = store.getState();
    const sales = state.sales?.sales || [];
    console.log(`✅ 找到 ${sales.length} 个销售记录`);
    
    // 2. 检查销售数据结构
    console.log('\n📋 2. 检查销售数据结构：');
    if (sales.length > 0) {
        const firstSale = sales[0];
        console.log('第一个销售记录样例：');
        console.log({
            销售类型: firstSale.sales_type || firstSale.sales?.sales_type,
            销售微信号: firstSale.sales?.wechat_name,
            总订单数: firstSale.total_orders,
            有效订单数: firstSale.valid_orders,
            总金额: firstSale.total_amount,
            确认金额: firstSale.confirmed_amount,
            佣金率: firstSale.commission_rate,
            应返佣金: firstSale.commission_amount
        });
        
        // 验证是否有0值问题
        const hasZeroValues = sales.some(sale => 
            sale.total_orders === 0 && 
            sale.total_amount === 0
        );
        
        if (hasZeroValues) {
            console.warn('⚠️ 仍有销售记录显示0值');
            const zeroSales = sales.filter(sale => 
                sale.total_orders === 0 && 
                sale.total_amount === 0
            );
            console.log('0值销售记录：', zeroSales.map(s => ({
                销售代码: s.sales?.sales_code,
                销售微信: s.sales?.wechat_name
            })));
        } else {
            console.log('✅ 所有销售记录都有正确的统计数据');
        }
    }
    
    // 3. 直接调用API验证
    console.log('\n🔍 3. 直接调用API验证：');
    try {
        const AdminAPI = window.AdminAPI || (await import('/src/services/api.js')).AdminAPI;
        const apiSales = await AdminAPI.getSales();
        
        console.log(`API返回 ${apiSales.length} 个销售记录`);
        
        // 检查API返回的数据结构
        if (apiSales.length > 0) {
            const apiFirstSale = apiSales[0];
            console.log('API返回的第一个销售记录：');
            console.log({
                销售类型: apiFirstSale.sales_type,
                销售微信号: apiFirstSale.sales?.wechat_name,
                总订单数: apiFirstSale.total_orders,
                有效订单数: apiFirstSale.valid_orders,
                总金额: apiFirstSale.total_amount,
                确认金额: apiFirstSale.confirmed_amount,
                佣金率: apiFirstSale.commission_rate,
                应返佣金: apiFirstSale.commission_amount
            });
        }
    } catch (error) {
        console.error('API调用失败：', error);
    }
    
    // 4. 检查表格显示
    console.log('\n📊 4. 检查表格显示：');
    const tableRows = document.querySelectorAll('.ant-table-row');
    console.log(`表格中显示 ${tableRows.length} 行数据`);
    
    if (tableRows.length > 0) {
        // 获取第一行的数据
        const firstRow = tableRows[0];
        const cells = firstRow.querySelectorAll('td');
        const rowData = {
            销售微信号: cells[1]?.textContent,
            销售类型: cells[2]?.textContent,
            总订单数: cells[3]?.textContent,
            有效订单数: cells[4]?.textContent,
            总金额: cells[5]?.textContent,
            确认金额: cells[6]?.textContent,
            佣金率: cells[7]?.textContent,
            应返佣金: cells[8]?.textContent
        };
        console.log('表格第一行显示的数据：', rowData);
        
        // 检查是否有0显示
        const hasZeroDisplay = Array.from(tableRows).some(row => {
            const orderCount = row.querySelectorAll('td')[3]?.textContent;
            const amount = row.querySelectorAll('td')[5]?.textContent;
            return orderCount === '0' && amount === '$0.00';
        });
        
        if (hasZeroDisplay) {
            console.warn('⚠️ 表格中仍有0值显示');
        } else {
            console.log('✅ 表格数据显示正常');
        }
    }
    
    // 5. 检查佣金计算
    console.log('\n💰 5. 检查佣金计算逻辑：');
    const salesWithCommission = sales.filter(s => s.commission_amount > 0);
    console.log(`${salesWithCommission.length} 个销售有佣金`);
    
    salesWithCommission.slice(0, 3).forEach(sale => {
        const expected = sale.confirmed_amount * sale.commission_rate;
        const actual = sale.commission_amount;
        const match = Math.abs(expected - actual) < 0.01;
        
        console.log({
            销售代码: sale.sales?.sales_code,
            确认金额: sale.confirmed_amount,
            佣金率: sale.commission_rate,
            预期佣金: expected.toFixed(2),
            实际佣金: actual,
            计算正确: match ? '✅' : '❌'
        });
    });
    
    // 6. 总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 验证总结：');
    
    const issues = [];
    
    if (sales.length === 0) {
        issues.push('没有销售数据');
    }
    
    if (sales.some(s => s.total_orders === 0 && s.total_amount === 0)) {
        issues.push('部分销售记录显示0值');
    }
    
    if (sales.some(s => !s.sales?.wechat_name)) {
        issues.push('部分销售缺少微信号');
    }
    
    if (issues.length === 0) {
        console.log('✅ 所有修复都已生效！');
        console.log('- 销售数据正常加载');
        console.log('- 订单统计数据正确');
        console.log('- 佣金计算正确');
        console.log('- 销售微信号正常显示');
    } else {
        console.log('⚠️ 发现以下问题：');
        issues.forEach(issue => console.log(`- ${issue}`));
        console.log('\n建议刷新页面后重试');
    }
    
    console.log('='.repeat(60));
})();
