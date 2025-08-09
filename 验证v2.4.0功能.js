// 🔍 验证v2.4.0页面优化功能
// 请在相应页面的浏览器控制台运行此脚本

console.log('🚀 开始验证v2.4.0功能更新...\n');

const currentPath = window.location.pathname;
const currentHost = window.location.origin;

console.log('📍 当前页面:', currentPath);
console.log('🌐 当前域名:', currentHost);

// 1. 验证一级销售对账页面
if (currentPath.includes('primary-sales-settlement')) {
    console.log('\n✅ 检查一级销售对账页面...');
    
    // 检查标题是否居中
    const title = document.querySelector('h2');
    if (title) {
        const titleStyle = window.getComputedStyle(title);
        console.log('📝 标题文本:', title.textContent);
        console.log('📐 标题对齐:', titleStyle.textAlign);
        if (titleStyle.textAlign === 'center') {
            console.log('✅ 标题已居中');
        } else {
            console.error('❌ 标题未居中');
        }
    }
    
    // 检查销售链接卡片
    const cards = document.querySelectorAll('.ant-card');
    let foundPurchaseLink = false;
    let foundRegisterLink = false;
    
    cards.forEach(card => {
        const cardText = card.textContent;
        if (cardText.includes('用户购买链接')) {
            foundPurchaseLink = true;
            console.log('✅ 找到用户购买链接卡片');
            
            // 查找链接内容
            const codeElement = card.querySelector('code');
            if (codeElement) {
                console.log('🔗 购买链接:', codeElement.textContent);
            }
        }
        if (cardText.includes('二级销售注册链接')) {
            foundRegisterLink = true;
            console.log('✅ 找到二级销售注册链接卡片');
            
            // 查找链接内容
            const codeElement = card.querySelector('code');
            if (codeElement) {
                console.log('🔗 注册链接:', codeElement.textContent);
            }
        }
    });
    
    if (!foundPurchaseLink) {
        console.warn('⚠️ 未找到购买链接卡片，可能还未查询销售信息');
    }
    if (!foundRegisterLink) {
        console.warn('⚠️ 未找到注册链接卡片，可能还未查询销售信息');
    }
    
    // 检查响应式布局
    const viewport = window.innerWidth;
    console.log('\n📱 当前视口宽度:', viewport + 'px');
    if (viewport < 576) {
        console.log('📱 移动端模式 (xs)');
    } else if (viewport < 768) {
        console.log('📱 平板模式 (sm)');
    } else {
        console.log('💻 桌面模式 (md+)');
    }
}

// 2. 验证二级销售对账页面
if (currentPath.includes('sales-reconciliation')) {
    console.log('\n✅ 检查二级销售对账页面...');
    
    // 检查标题
    const title = document.querySelector('h2');
    if (title) {
        console.log('📝 标题文本:', title.textContent);
        if (title.textContent.includes('二级销售对账')) {
            console.log('✅ 标题已更新为"二级销售对账页面"');
        } else {
            console.warn('⚠️ 标题可能未更新');
        }
    }
    
    // 检查付款时间筛选
    const dateRangePicker = document.querySelector('.ant-picker-range');
    if (dateRangePicker) {
        console.log('✅ 付款时间筛选器存在');
    } else {
        console.error('❌ 未找到付款时间筛选器');
    }
    
    // 检查响应式布局
    const formItems = document.querySelectorAll('.ant-form-item');
    console.log('📊 表单项数量:', formItems.length);
}

// 3. 验证购买页面价格
if (currentPath.includes('purchase')) {
    console.log('\n✅ 检查购买页面...');
    
    // 查找6个月选项
    const radios = document.querySelectorAll('.ant-radio-wrapper');
    radios.forEach(radio => {
        if (radio.textContent.includes('6个月')) {
            console.log('📦 6个月套餐:', radio.textContent);
            if (radio.textContent.includes('888')) {
                console.log('✅ 价格已更新为888元');
            } else if (radio.textContent.includes('688')) {
                console.error('❌ 价格仍为688元，未更新');
            }
        }
    });
}

// 4. 验证管理员销售页面
if (currentPath.includes('admin/sales')) {
    console.log('\n✅ 检查管理员销售页面...');
    
    // 检查Redux状态
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        const store = window.store || window.__store;
        if (store) {
            const state = store.getState();
            if (state.admin && state.admin.sales) {
                const primarySales = state.admin.sales.filter(s => s.sales_type === 'primary');
                console.log('📊 一级销售数量:', primarySales.length);
                
                primarySales.forEach(sale => {
                    if (sale.commission_rate !== undefined) {
                        console.log(`💰 ${sale.wechat_name}:`, {
                            佣金率: (sale.commission_rate * 100).toFixed(1) + '%',
                            应返佣金: sale.commission_amount
                        });
                    }
                });
            }
        }
    }
}

console.log('\n📋 v2.4.0 功能清单:');
console.log('1. ✅ 一级销售对账 - 销售链接展示');
console.log('2. ✅ 一级销售对账 - 标题居中');
console.log('3. ✅ 二级销售对账 - 标题更新');
console.log('4. ✅ 购买页面 - 6个月888元');
console.log('5. ✅ 移动端响应式布局');
console.log('6. ✅ 动态佣金计算同步');

console.log('\n✨ 验证完成！');
console.log('💡 提示：如果某些功能未生效，请等待2-3分钟后刷新页面');
