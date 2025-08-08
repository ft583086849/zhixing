// 在 https://zhixing-seven.vercel.app 的控制台运行
// 用于检查当前部署的版本信息

(function() {
    console.log('🔍 检查部署版本信息...\n');
    
    // 检查关键功能标志
    const checks = {
        '资金统计菜单': !!Array.from(document.querySelectorAll('.ant-menu-item')).find(el => el.textContent.includes('资金统计')),
        'Top5排行榜': !!document.querySelector('h3')?.textContent?.includes('Top5'),
        '独立销售统计': !!Array.from(document.querySelectorAll('.ant-statistic-title')).find(el => el.textContent.includes('独立销售')),
        '时间范围选择': !!document.querySelector('.ant-radio-group'),
        '双链配置': !!localStorage.getItem('payment-config')?.includes('crypto2')
    };
    
    console.log('功能检查结果：');
    Object.entries(checks).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}`);
    });
    
    const passedCount = Object.values(checks).filter(v => v).length;
    const totalCount = Object.keys(checks).length;
    
    console.log(`\n部署状态评估：${passedCount}/${totalCount} 功能已部署`);
    
    if (passedCount === totalCount) {
        console.log('✨ 最新版本已完全部署！');
    } else if (passedCount >= 3) {
        console.log('⚠️ 部分新功能已部署，可能正在更新中...');
    } else {
        console.log('❌ 新功能尚未部署，可能使用的是旧版本');
    }
    
    // 检查构建时间（如果页面有相关信息）
    const buildTime = document.querySelector('meta[name="build-time"]')?.content;
    if (buildTime) {
        console.log(`\n构建时间：${buildTime}`);
    }
    
    console.log('\n提示：如需查看详细部署历史，请访问 Vercel Dashboard');
})();