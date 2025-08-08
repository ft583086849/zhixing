// 在浏览器控制台运行此脚本进行快速验证
// 使用方法：打开 https://zhixing-seven.vercel.app 后，按F12打开控制台，粘贴运行

(async function() {
    console.log('🔍 开始验证线上功能...\n');
    
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };
    
    // 1. 检查当前页面
    console.log('📍 当前页面：', window.location.pathname);
    
    // 2. 检查菜单项
    console.log('\n📋 检查菜单项...');
    const menuItems = document.querySelectorAll('.ant-menu-item');
    const menuTexts = Array.from(menuItems).map(item => item.textContent);
    
    if (menuTexts.includes('资金统计')) {
        results.passed.push('✅ 资金统计菜单存在');
    } else {
        results.failed.push('❌ 资金统计菜单缺失');
    }
    
    // 3. 检查数据概览页面元素
    if (window.location.pathname.includes('dashboard')) {
        console.log('\n📊 检查数据概览页面...');
        
        // 检查Top5排行榜
        const hasTop5 = document.querySelector('h3')?.textContent?.includes('Top5销售排行榜');
        if (hasTop5) {
            results.passed.push('✅ Top5销售排行榜存在');
        } else {
            results.failed.push('❌ Top5销售排行榜缺失');
        }
        
        // 检查时间范围选择器
        const hasTimeRange = document.querySelector('.ant-radio-group');
        if (hasTimeRange) {
            results.passed.push('✅ 时间范围选择器存在');
        } else {
            results.failed.push('❌ 时间范围选择器缺失');
        }
        
        // 检查销售统计卡片
        const statCards = document.querySelectorAll('.ant-statistic-title');
        const statTitles = Array.from(statCards).map(card => card.textContent);
        
        if (statTitles.includes('一级销售')) {
            results.passed.push('✅ 一级销售统计存在');
        } else {
            results.failed.push('❌ 一级销售统计缺失');
        }
        
        if (statTitles.includes('二级销售')) {
            results.passed.push('✅ 二级销售统计存在');
        } else {
            results.failed.push('❌ 二级销售统计缺失');
        }
        
        if (statTitles.includes('独立销售')) {
            results.passed.push('✅ 独立销售统计存在');
        } else {
            results.failed.push('❌ 独立销售统计缺失');
        }
    }
    
    // 4. 检查localStorage中的配置
    console.log('\n💾 检查本地存储...');
    const paymentConfig = localStorage.getItem('payment-config');
    if (paymentConfig) {
        try {
            const config = JSON.parse(paymentConfig);
            if (config.crypto2_address) {
                results.passed.push('✅ 双链配置已保存');
                console.log('   第二个链地址：', config.crypto2_address);
            } else {
                results.warnings.push('⚠️ 未配置第二个链地址');
            }
        } catch (e) {
            results.warnings.push('⚠️ 配置解析失败');
        }
    }
    
    // 5. 检查API响应
    console.log('\n🌐 检查API连接...');
    try {
        const response = await fetch('/api/health', { method: 'HEAD' });
        if (response.ok || response.status === 404) {
            results.passed.push('✅ API服务正常');
        } else {
            results.warnings.push('⚠️ API响应异常');
        }
    } catch (e) {
        // API可能不存在health端点，这是正常的
        results.warnings.push('⚠️ 无法验证API状态');
    }
    
    // 6. 性能检查
    console.log('\n⚡ 检查性能优化...');
    const hasLazyLoad = document.querySelector('.ant-spin');
    if (hasLazyLoad) {
        results.passed.push('✅ 懒加载指示器存在');
    }
    
    // 检查React.lazy
    if (window.React && window.React.lazy) {
        results.passed.push('✅ React.lazy可用');
    }
    
    // 7. 输出验证结果
    console.log('\n' + '='.repeat(50));
    console.log('📊 验证结果汇总\n');
    
    console.log(`✅ 通过项目 (${results.passed.length})：`);
    results.passed.forEach(item => console.log('  ' + item));
    
    if (results.failed.length > 0) {
        console.log(`\n❌ 失败项目 (${results.failed.length})：`);
        results.failed.forEach(item => console.log('  ' + item));
    }
    
    if (results.warnings.length > 0) {
        console.log(`\n⚠️ 警告项目 (${results.warnings.length})：`);
        results.warnings.forEach(item => console.log('  ' + item));
    }
    
    // 8. 总体评分
    const score = (results.passed.length / (results.passed.length + results.failed.length)) * 100;
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 总体完成度：${score.toFixed(1)}%`);
    
    if (score >= 80) {
        console.log('✨ 部署状态：良好');
    } else if (score >= 60) {
        console.log('⚠️ 部署状态：部分功能可能未生效');
    } else {
        console.log('❌ 部署状态：需要检查部署');
    }
    
    // 9. 建议
    console.log('\n💡 建议：');
    console.log('1. 请手动访问各个页面进行详细验证');
    console.log('2. 使用验证清单逐项检查功能');
    console.log('3. 如有问题，检查浏览器控制台是否有错误');
    
    return results;
})();
