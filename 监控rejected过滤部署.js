// 🚀 监控rejected订单过滤部署状态
// 在浏览器控制台运行此脚本

console.log('🚀 开始监控rejected订单过滤部署...\n');

// 获取当前版本信息
async function checkDeploymentVersion() {
    try {
        // 检查版本标记
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const buildId = scripts
            .map(s => s.src.match(/static\/js\/main\.([a-f0-9]+)\.js/))
            .filter(Boolean)
            .map(m => m[1])[0];
        
        if (buildId) {
            console.log(`📦 当前构建ID: ${buildId}`);
            
            // 保存到localStorage以便比较
            const lastBuildId = localStorage.getItem('lastBuildId');
            if (lastBuildId && lastBuildId !== buildId) {
                console.log('✅ 检测到新版本已部署！');
                console.log(`  旧版本: ${lastBuildId}`);
                console.log(`  新版本: ${buildId}`);
            }
            localStorage.setItem('lastBuildId', buildId);
        }
        
        // 检查更新时间
        const deployTime = localStorage.getItem('deployCheckTime');
        const now = new Date().toLocaleString('zh-CN');
        console.log(`⏰ 检查时间: ${now}`);
        if (deployTime) {
            console.log(`  上次检查: ${deployTime}`);
        }
        localStorage.setItem('deployCheckTime', now);
        
    } catch (error) {
        console.error('检查版本失败:', error);
    }
}

// 测试API响应
async function testAPIResponse() {
    console.log('\n🔍 测试API响应...');
    
    // 根据页面判断要测试的API
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('primary-sales-settlement')) {
        console.log('测试一级销售对账API...');
        
        // 获取localStorage中的token
        const token = localStorage.getItem('token');
        const salesCode = localStorage.getItem('salesCode');
        
        if (token && salesCode) {
            try {
                const response = await fetch('/api/sales/primary-settlement', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify({ sales_code: salesCode })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ API响应正常');
                    
                    // 检查是否有rejected订单
                    if (data.orders) {
                        const rejectedCount = data.orders.filter(o => o.status === 'rejected').length;
                        if (rejectedCount > 0) {
                            console.error(`❌ API返回了${rejectedCount}个rejected订单`);
                        } else {
                            console.log('✅ API返回的订单中没有rejected状态');
                        }
                    }
                    
                    // 显示统计信息
                    if (data.stats) {
                        console.log('\n📊 API返回的统计:');
                        console.log('  总订单数:', data.stats.total_orders);
                        console.log('  总金额:', data.stats.total_amount);
                    }
                } else {
                    console.warn('⚠️ API响应状态:', response.status);
                }
            } catch (error) {
                console.error('API调用失败:', error);
            }
        } else {
            console.log('⚠️ 未找到认证信息，无法测试API');
        }
        
    } else if (currentPath.includes('sales-reconciliation')) {
        console.log('测试二级销售对账API...');
        // 类似的测试逻辑
    }
}

// 自动刷新检查
function setupAutoRefresh() {
    console.log('\n🔄 设置自动刷新检查...');
    
    let countdown = 30;
    const timer = setInterval(() => {
        console.log(`⏱️ ${countdown}秒后刷新页面检查更新...`);
        countdown--;
        
        if (countdown <= 0) {
            clearInterval(timer);
            console.log('🔄 刷新页面...');
            window.location.reload();
        }
    }, 1000);
    
    console.log('💡 提示: 输入 stopRefresh() 可以取消自动刷新');
    
    window.stopRefresh = () => {
        clearInterval(timer);
        console.log('✅ 已取消自动刷新');
    };
}

// 执行检查
async function runCheck() {
    await checkDeploymentVersion();
    await testAPIResponse();
    
    console.log('\n📋 rejected订单过滤优化内容:');
    console.log('  1. ✅ 一级销售对账页面过滤rejected订单');
    console.log('  2. ✅ 二级销售对账页面过滤rejected订单');
    console.log('  3. ✅ 统计数据排除rejected订单金额');
    console.log('  4. ✅ 佣金计算排除rejected订单');
    
    console.log('\n💡 验证步骤:');
    console.log('  1. 在管理员系统拒绝一个订单');
    console.log('  2. 访问销售对账页面');
    console.log('  3. 确认rejected订单不显示');
    console.log('  4. 确认统计数据正确');
}

// 运行检查
runCheck();

// 询问是否需要自动刷新
console.log('\n是否需要自动刷新检查部署状态？');
console.log('输入 setupAutoRefresh() 启动30秒自动刷新');
