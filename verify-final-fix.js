// 最终验证修复效果
(() => {
  console.log('========================================');
  console.log('✅ 验证最终修复效果');
  console.log('========================================');
  
  // 1. 刷新页面以加载新代码
  console.log('建议操作：');
  console.log('1. 执行 location.reload() 刷新页面');
  console.log('2. 等待页面完全加载');
  console.log('3. 再次执行此脚本验证');
  
  // 2. 检查当前页面显示
  console.log('\n📊 当前页面显示:');
  
  const checkStatValue = (title) => {
    const cards = document.querySelectorAll('.ant-statistic');
    for (let card of cards) {
      const titleEl = card.querySelector('.ant-statistic-title');
      if (titleEl && titleEl.textContent === title) {
        const valueEl = card.querySelector('.ant-statistic-content');
        return valueEl ? valueEl.textContent : '未找到';
      }
    }
    return '未找到';
  };
  
  console.log('销售返佣金额:', checkStatValue('销售返佣金额'));
  console.log('待返佣金金额:', checkStatValue('待返佣金金额'));
  
  // 3. 检查销售层级统计
  console.log('\n👥 销售层级统计:');
  const salesCards = document.querySelectorAll('.ant-card');
  salesCards.forEach(card => {
    const text = card.innerText;
    if (text.includes('一级销售') && text.includes('销售业绩')) {
      const lines = text.split('\n');
      const salesLine = lines.find(l => l.includes('一级销售'));
      const amountLine = lines.find(l => l.includes('销售业绩'));
      if (salesLine && amountLine) {
        console.log('一级销售:', salesLine, '|', amountLine);
      }
    }
    if (text.includes('二级销售') && text.includes('销售业绩')) {
      const lines = text.split('\n');
      const salesLine = lines.find(l => l.includes('二级销售'));
      const amountLine = lines.find(l => l.includes('销售业绩'));
      if (salesLine && amountLine) {
        console.log('二级销售:', salesLine, '|', amountLine);
      }
    }
  });
  
  // 4. 检查控制台日志
  console.log('\n📝 请查看控制台是否有以下日志:');
  console.log('- "📊 从数据库计算的佣金汇总"');
  console.log('- "获取销售层级统计"');
  console.log('如果有这些日志，说明新代码已生效');
  
  console.log('\n========================================');
  console.log('验证完成！');
  console.log('如果数据仍然显示为0，请：');
  console.log('1. 清除浏览器缓存');
  console.log('2. 执行 location.reload(true) 强制刷新');
  console.log('3. 重新登录管理员账号');
  console.log('========================================');
})();