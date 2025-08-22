// 直接检查页面显示的数据
(() => {
  console.log('========================================');
  console.log('📊 检查页面显示的数据');
  console.log('========================================');
  
  // 1. 查找所有统计数字
  console.log('\n1️⃣ 所有统计数据:');
  const allStatistics = document.querySelectorAll('.ant-statistic');
  allStatistics.forEach(stat => {
    const title = stat.querySelector('.ant-statistic-title')?.textContent || '';
    const value = stat.querySelector('.ant-statistic-content-value')?.textContent || 
                  stat.querySelector('.ant-statistic-content')?.textContent || '';
    if (title) {
      console.log(`  ${title}: ${value}`);
    }
  });
  
  // 2. 专门查找佣金相关
  console.log('\n2️⃣ 佣金相关数据:');
  allStatistics.forEach(stat => {
    const title = stat.querySelector('.ant-statistic-title')?.textContent || '';
    if (title.includes('佣金') || title.includes('返')) {
      const value = stat.querySelector('.ant-statistic-content-value')?.textContent || 
                    stat.querySelector('.ant-statistic-content')?.textContent || '';
      console.log(`  ${title}: ${value}`);
    }
  });
  
  // 3. 查找销售层级统计
  console.log('\n3️⃣ 销售层级统计:');
  const salesCards = document.querySelectorAll('.ant-card');
  salesCards.forEach(card => {
    const text = card.innerText;
    if (text.includes('一级销售') || text.includes('二级销售') || text.includes('独立销售')) {
      // 提取数字
      const lines = text.split('\n');
      const relevantLines = lines.filter(line => 
        line.includes('销售') || line.includes('业绩') || /\d+/.test(line)
      );
      if (relevantLines.length > 0) {
        console.log('  卡片内容:', relevantLines.join(' | '));
      }
    }
  });
  
  // 4. 查找表格中的数据（如果有）
  console.log('\n4️⃣ 表格数据（前3行）:');
  const tables = document.querySelectorAll('.ant-table');
  tables.forEach((table, index) => {
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length > 0) {
      console.log(`  表格${index + 1}:`);
      Array.from(rows).slice(0, 3).forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => cell.textContent?.trim()).filter(Boolean);
        if (rowData.length > 0) {
          console.log(`    行${rowIndex + 1}:`, rowData.join(' | '));
        }
      });
    }
  });
  
  // 5. 查找收益分配方案
  console.log('\n5️⃣ 收益分配方案:');
  const profitElements = document.querySelectorAll('[class*="profit"], [class*="distribution"]');
  profitElements.forEach(el => {
    const text = el.textContent;
    if (text && text.length < 200) {
      console.log('  ', text.substring(0, 100));
    }
  });
  
  // 查找包含百分比的元素
  const percentElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && el.textContent.match(/\d+%/) && el.textContent.length < 50
  );
  console.log('\n  百分比相关:');
  percentElements.slice(0, 10).forEach(el => {
    console.log('    ', el.textContent);
  });
  
  console.log('\n========================================');
  console.log('✅ 检查完成');
  console.log('========================================');
})();