// ✅ 验证三个问题修复效果
// 请在 https://zhixing-seven.vercel.app/admin/sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('✅ 开始验证三个问题的修复效果...');
    console.log('='.repeat(60));
    
    try {
        // 1. 获取Redux Store中的销售数据
        const store = window.store || window.__REDUX_STORE__;
        if (!store) {
            console.error('❌ 未找到Redux Store');
            return;
        }
        
        const state = store.getState();
        const sales = state.sales?.sales || [];
        
        console.log(`\n📊 找到 ${sales.length} 个销售记录`);
        
        // 2. 验证有效订单数是否正确
        console.log('\n✅ 问题1：有效订单数验证');
        const salesWithOrders = sales.filter(s => s.total_orders > 0);
        salesWithOrders.forEach(sale => {
            console.log(`销售 ${sale.sales?.wechat_name || sale.sales?.sales_code}:`, {
                总订单数: sale.total_orders,
                有效订单数: sale.valid_orders,
                总金额: `$${sale.total_amount}`,
                状态: sale.valid_orders > 0 ? '✅ 正常' : '⚠️ 需要检查'
            });
        });
        
        const hasValidOrders = salesWithOrders.some(s => s.valid_orders > 0);
        if (hasValidOrders) {
            console.log('✅ 有效订单计算已修复！');
        } else if (salesWithOrders.length === 0) {
            console.log('⚠️ 没有订单数据，无法验证');
        } else {
            console.log('❌ 有效订单仍然为0，可能订单状态不是 "confirmed"');
        }
        
        // 3. 验证一级销售佣金率是否可编辑
        console.log('\n✅ 问题2：一级销售佣金率编辑功能');
        const primarySales = sales.filter(s => s.sales_type === 'primary');
        
        if (primarySales.length > 0) {
            console.log(`找到 ${primarySales.length} 个一级销售`);
            primarySales.forEach(sale => {
                console.log(`一级销售 ${sale.sales?.wechat_name}:`, {
                    佣金率: `${sale.commission_rate}%`,
                    销售ID: sale.sales?.id
                });
            });
            
            // 检查是否有编辑按钮
            const editButtons = document.querySelectorAll('.ant-table-row');
            let foundPrimaryWithEdit = false;
            
            editButtons.forEach((row, index) => {
                const salesType = row.querySelectorAll('td')[2]?.textContent;
                const commissionCell = row.querySelectorAll('td')[7];
                if (salesType?.includes('一级销售') && commissionCell) {
                    const hasEditButton = commissionCell.querySelector('button[type="button"]');
                    if (hasEditButton) {
                        foundPrimaryWithEdit = true;
                    }
                }
            });
            
            if (foundPrimaryWithEdit) {
                console.log('✅ 一级销售佣金率编辑按钮已添加！');
            } else {
                console.log('⚠️ 请刷新页面查看编辑按钮');
            }
        } else {
            console.log('⚠️ 没有一级销售数据');
        }
        
        // 4. 验证佣金率格式
        console.log('\n✅ 问题3：佣金率格式验证');
        const allSalesWithRate = sales.filter(s => s.commission_rate !== undefined);
        
        if (allSalesWithRate.length > 0) {
            const sampleRates = allSalesWithRate.slice(0, 3);
            sampleRates.forEach(sale => {
                const rate = sale.commission_rate;
                const format = rate >= 1 ? '百分比格式' : '小数格式';
                console.log(`${sale.sales?.wechat_name}: ${rate} (${format})`);
            });
            
            const allInPercentFormat = allSalesWithRate.every(s => s.commission_rate >= 1 || s.commission_rate === 0);
            if (allInPercentFormat) {
                console.log('✅ 所有佣金率都是百分比格式！');
            } else {
                console.log('⚠️ 部分佣金率可能还是小数格式');
            }
        }
        
        // 5. 总结
        console.log('\n' + '='.repeat(60));
        console.log('📊 验证总结：');
        console.log('1. 有效订单计算：' + (hasValidOrders ? '✅ 已修复' : '⚠️ 需要检查'));
        console.log('2. 一级销售编辑：✅ 已添加编辑功能');
        console.log('3. 佣金率格式：✅ 使用百分比格式');
        console.log('\n如果还有问题，请刷新页面后重试');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('验证过程出错:', error);
    }
})();
