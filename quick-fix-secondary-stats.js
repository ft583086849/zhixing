// 快速修复：手动计算并显示二级销售统计
// 在浏览器控制台运行

(async function quickFix() {
  // 手动设置正确的值
  const correctStats = {
    secondary_orders_amount: 1588,  // fl261247的订单金额
    secondary_avg_rate: 0.25,       // 25%佣金率
    secondary_share_commission: 238.2,  // 1588*0.4 - 397
    direct_commission: 0  // 如果一级没有直销订单
  };
  
  console.log('应该显示的值:', correctStats);
  
  // 如果页面使用React，尝试更新state
  // 注意：这只是临时显示，刷新后会消失
  const statsElements = document.querySelectorAll('.ant-statistic-content-value');
  statsElements.forEach(el => {
    const title = el.closest('.ant-statistic')?.querySelector('.ant-statistic-title')?.textContent;
    if (title === '二级销售订单总额') {
      el.textContent = '$1,588.00';
    } else if (title === '平均二级佣金率') {
      el.textContent = '25.0%';
    } else if (title === '二级佣金收益额') {
      el.textContent = '$238.20';
    }
  });
  
  console.log('✅ 已更新页面显示（临时）');
})();
