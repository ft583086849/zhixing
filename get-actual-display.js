// 获取页面实际显示的数据
(() => {
  console.log('========================================');
  console.log('📊 获取页面实际显示数据');
  console.log('========================================');
  
  // 1. 获取所有带美元符号的金额
  console.log('\n💵 所有金额显示:');
  const dollarElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const text = el.textContent || '';
    return text.match(/\$[\d,]+\.?\d*/) && !el.querySelector('*') && text.length < 50;
  });
  
  dollarElements.forEach(el => {
    // 找到最近的标题
    let parent = el.parentElement;
    let title = '';
    for (let i = 0; i < 5 && parent; i++) {
      const titleEl = parent.querySelector('.ant-statistic-title');
      if (titleEl) {
        title = titleEl.textContent;
        break;
      }
      parent = parent.parentElement;
    }
    if (title || el.textContent.includes('$')) {
      console.log(`  ${title || '未知'}: ${el.textContent}`);
    }
  });
  
  // 2. 获取统计卡片的具体数值
  console.log('\n📈 统计卡片数值:');
  document.querySelectorAll('.ant-statistic').forEach(stat => {
    const title = stat.querySelector('.ant-statistic-title')?.textContent || '';
    const valueEl = stat.querySelector('.ant-statistic-content-value');
    const prefixEl = stat.querySelector('.ant-statistic-content-prefix');
    const suffixEl = stat.querySelector('.ant-statistic-content-suffix');
    
    let value = valueEl?.textContent || '';
    const prefix = prefixEl?.textContent || '';
    const suffix = suffixEl?.textContent || '';
    
    if (title) {
      console.log(`  ${title}: ${prefix}${value}${suffix}`);
    }
  });
  
  // 3. 特别查找佣金相关元素
  console.log('\n💰 佣金相关元素:');
  const commissionElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const text = el.textContent || '';
    return (text.includes('佣金') || text.includes('返佣')) && 
           !el.querySelector('*') && 
           text.length < 100;
  });
  
  commissionElements.forEach(el => {
    if (el.classList.contains('ant-statistic-title')) {
      const parent = el.closest('.ant-statistic');
      if (parent) {
        const value = parent.querySelector('.ant-statistic-content')?.textContent || '';
        console.log(`  ${el.textContent}: ${value}`);
      }
    }
  });
  
  // 4. 销售层级统计卡片
  console.log('\n👥 销售层级统计:');
  const salesLayerCards = document.querySelectorAll('[style*="background"]');
  salesLayerCards.forEach(card => {
    if (card.textContent.includes('一级销售') || 
        card.textContent.includes('二级销售') || 
        card.textContent.includes('独立销售')) {
      
      const stats = card.querySelectorAll('.ant-statistic');
      if (stats.length > 0) {
        const type = card.textContent.includes('一级') ? '一级销售' : 
                     card.textContent.includes('二级') ? '二级销售' : '独立销售';
        console.log(`  ${type}:`);
        stats.forEach(stat => {
          const title = stat.querySelector('.ant-statistic-title')?.textContent;
          const value = stat.querySelector('.ant-statistic-content')?.textContent;
          if (title && value) {
            console.log(`    - ${title}: ${value}`);
          }
        });
      }
    }
  });
  
  // 5. 查找收益分配相关
  console.log('\n📊 收益分配方案:');
  const distributionRows = document.querySelectorAll('.ant-row');
  distributionRows.forEach(row => {
    if (row.textContent.includes('公户') || 
        row.textContent.includes('知行') || 
        row.textContent.includes('子俊')) {
      const text = row.textContent;
      if (text.length < 200) {
        // 提取关键信息
        const matches = text.match(/(公户|知行|子俊).*?(\d+%|\$[\d,]+\.?\d*)/g);
        if (matches) {
          matches.forEach(match => {
            console.log(`  ${match}`);
          });
        }
      }
    }
  });
  
  console.log('\n========================================');
  console.log('✅ 数据获取完成');
  console.log('========================================');
})();