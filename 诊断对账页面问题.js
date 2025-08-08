// 在一级销售对账页面控制台运行此脚本，诊断为什么看不到设置佣金的区域

(async function() {
    console.log('🔍 诊断一级销售对账页面...\n');
    
    // 1. 检查当前页面是否正确
    console.log('1️⃣ 检查页面状态...');
    const currentUrl = window.location.href;
    console.log('当前页面:', currentUrl);
    
    if (!currentUrl.includes('primary-sales-settlement')) {
        console.error('❌ 不是一级销售对账页面');
        console.log('请访问: /primary-sales-settlement');
        return;
    }
    
    // 2. 检查是否有查询表单
    console.log('\n2️⃣ 检查查询表单...');
    const searchInputs = document.querySelectorAll('input[placeholder*="微信"], input[placeholder*="销售代码"]');
    
    if (searchInputs.length > 0) {
        console.log('✅ 找到查询表单');
        console.log('   表单数量:', searchInputs.length);
        
        // 检查是否已输入查询条件
        let hasValue = false;
        searchInputs.forEach((input, index) => {
            if (input.value) {
                console.log(`   输入框${index + 1}的值:`, input.value);
                hasValue = true;
            }
        });
        
        if (!hasValue) {
            console.log('\n⚠️ 未输入查询条件');
            console.log('📝 操作步骤:');
            console.log('1. 在"微信号"输入框中输入一级销售的微信号');
            console.log('2. 或在"销售代码"输入框中输入销售代码');
            console.log('3. 点击"查询"按钮');
        }
    } else {
        console.log('❌ 未找到查询表单');
    }
    
    // 3. 检查是否有数据显示
    console.log('\n3️⃣ 检查数据显示...');
    
    // 检查统计卡片
    const statsCards = document.querySelectorAll('.ant-statistic-title');
    if (statsCards.length > 0) {
        console.log('✅ 找到统计卡片:', statsCards.length, '个');
        
        // 查找二级销售数量
        const secondarySalesCard = Array.from(statsCards).find(card => 
            card.textContent.includes('二级销售数量')
        );
        
        if (secondarySalesCard) {
            const valueElement = secondarySalesCard.nextElementSibling;
            const value = valueElement ? valueElement.textContent : '0';
            console.log('   二级销售数量:', value);
            
            if (value === '0' || value === '0人') {
                console.log('\n⚠️ 该一级销售下没有二级销售');
                console.log('📝 解决方案:');
                console.log('1. 确认该一级销售是否已经创建了二级销售');
                console.log('2. 二级销售需要通过一级销售的注册链接注册');
                console.log('3. 注册后立即可以看到，不需要有订单');
            }
        }
    } else {
        console.log('⚠️ 未找到统计卡片，可能还未查询数据');
    }
    
    // 4. 检查二级销售表格
    console.log('\n4️⃣ 检查二级销售表格...');
    
    // 查找包含"二级销售信息"的卡片
    const cards = document.querySelectorAll('.ant-card-head-title');
    const secondarySalesCard = Array.from(cards).find(card => 
        card.textContent.includes('二级销售信息')
    );
    
    if (secondarySalesCard) {
        console.log('✅ 找到二级销售信息卡片');
        
        // 查找表格
        const cardBody = secondarySalesCard.closest('.ant-card');
        const table = cardBody ? cardBody.querySelector('.ant-table') : null;
        
        if (table) {
            console.log('✅ 找到二级销售表格');
            
            // 检查表格行数
            const rows = table.querySelectorAll('.ant-table-tbody tr');
            const dataRows = Array.from(rows).filter(row => 
                !row.classList.contains('ant-table-empty')
            );
            
            console.log('   数据行数:', dataRows.length);
            
            if (dataRows.length === 0) {
                console.log('\n⚠️ 表格中没有数据');
                console.log('📝 可能的原因:');
                console.log('1. 该一级销售下没有二级销售');
                console.log('2. 查询条件不正确');
                console.log('3. 数据加载失败');
            } else {
                // 查找设置佣金按钮
                const commissionButtons = table.querySelectorAll('button');
                const setCommissionButtons = Array.from(commissionButtons).filter(btn => 
                    btn.textContent.includes('设置佣金')
                );
                
                if (setCommissionButtons.length > 0) {
                    console.log('✅ 找到设置佣金按钮:', setCommissionButtons.length, '个');
                    console.log('\n✨ 功能正常！点击"设置佣金"按钮即可配置');
                } else {
                    console.log('❌ 未找到设置佣金按钮');
                }
            }
        } else {
            console.log('⚠️ 未找到表格元素');
        }
    } else {
        console.log('⚠️ 未找到二级销售信息卡片');
        console.log('可能还未查询数据或页面未完全加载');
    }
    
    // 5. 提供测试数据
    console.log('\n5️⃣ 快速测试:');
    console.log('如果想测试功能，可以:');
    console.log('1. 输入一个已知的一级销售微信号');
    console.log('2. 例如: "89上线" 或 "88测试下午"');
    console.log('3. 点击查询按钮');
    console.log('4. 在"二级销售信息"部分查看表格');
    console.log('5. 点击表格中的"设置佣金"按钮');
    
    // 6. 检查 Redux Store
    const state = window.store?.getState();
    if (state?.sales) {
        console.log('\n6️⃣ Redux Store 状态:');
        console.log('   loading:', state.sales.loading);
        console.log('   error:', state.sales.error);
    }
    
    console.log('\n📋 总结:');
    console.log('如果看不到设置佣金的区域，请按以下步骤操作:');
    console.log('1. 确保在一级销售对账页面');
    console.log('2. 输入一级销售的微信号或销售代码');
    console.log('3. 点击"查询"按钮');
    console.log('4. 等待数据加载');
    console.log('5. 在"二级销售信息"表格中找到"设置佣金"按钮');
})();
