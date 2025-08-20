#!/usr/bin/env node

/**
 * 最终验证：检查所有页面是否正确显示pending_commission=0
 */

console.log('🎯 最终验证：检查所有页面是否正确显示pending_commission=0\n');

console.log('请在管理后台的浏览器控制台执行以下代码进行最终验证:\n');

const finalValidationCode = `
// 最终验证脚本
async function finalValidation() {
  console.log('🎯 开始最终验证：检查pending_commission显示...');
  
  // 1. 直接测试API返回值
  console.log('\\n1️⃣ 测试API返回值:');
  try {
    const module = await import('/src/services/api.js');
    const AdminAPI = module.AdminAPI;
    
    const stats = await AdminAPI.getStats({ timeRange: 'all' });
    
    console.log('API返回结果:');
    console.log('• pending_commission:', stats.pending_commission);
    console.log('• pending_commission_amount:', stats.pending_commission_amount);
    console.log('• data_source:', stats.data_source || '实时计算');
    
    if (stats.pending_commission === 0 && stats.pending_commission_amount === 0) {
      console.log('✅ API返回正确：pending_commission = 0');
    } else {
      console.log('❌ API返回错误值！');
      console.log('需要进一步检查API逻辑');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
  
  // 2. 检查当前页面DOM显示
  console.log('\\n2️⃣ 检查当前页面DOM显示:');
  
  // 查找所有包含"待返佣金"的元素
  const allText = document.body.innerText;
  const pendingCommissionMatches = allText.match(/待返佣金[^\\n]*?([\\d,]+)/g);
  
  if (pendingCommissionMatches) {
    console.log('找到的待返佣金显示:');
    pendingCommissionMatches.forEach((match, index) => {
      console.log(\`\${index + 1}. \${match}\`);
      
      // 提取数字
      const numbers = match.match(/[\\d,]+/g);
      if (numbers) {
        const value = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
        if (value !== 0) {
          console.log('❌ 发现非0值:', value);
        } else {
          console.log('✅ 显示正确的0值');
        }
      }
    });
  } else {
    console.log('页面中未找到"待返佣金"显示');
  }
  
  // 3. 检查统计卡片
  console.log('\\n3️⃣ 检查统计卡片:');
  const statisticCards = document.querySelectorAll('.ant-statistic');
  
  statisticCards.forEach((card, index) => {
    const title = card.querySelector('.ant-statistic-title')?.textContent || '';
    const value = card.querySelector('.ant-statistic-content-value')?.textContent || '';
    
    if (title.includes('待返佣金') || title.includes('佣金')) {
      console.log(\`卡片 \${index + 1}: \${title} = \${value}\`);
      
      const numValue = parseFloat(value.replace(/[^\\d.-]/g, ''));
      if (title.includes('待返') && numValue !== 0) {
        console.log('❌ 待返佣金卡片显示非0值:', numValue);
      } else if (title.includes('待返') && numValue === 0) {
        console.log('✅ 待返佣金卡片显示正确的0值');
      }
    }
  });
  
  // 4. 检查表格数据
  console.log('\\n4️⃣ 检查表格数据:');
  const tables = document.querySelectorAll('.ant-table-tbody');
  let foundTableData = false;
  
  tables.forEach((table, tableIndex) => {
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, cellIndex) => {
        const text = cell.textContent;
        if (text.includes('待返') && !text.includes('0') && text.match(/[\\d]/)) {
          console.log(\`❌ 表格 \${tableIndex + 1} 第 \${rowIndex + 1} 行第 \${cellIndex + 1} 列显示非0待返佣金: \${text}\`);
          foundTableData = true;
        }
      });
    });
  });
  
  if (!foundTableData) {
    console.log('✅ 表格中未发现非0的待返佣金显示');
  }
  
  // 5. 测试不同页面
  console.log('\\n5️⃣ 测试导航到不同页面:');
  const pagesToTest = [
    { name: '数据概览', path: '/admin/dashboard' },
    { name: '财务管理', path: '/admin/finance' },
    { name: '销售管理', path: '/admin/sales' }
  ];
  
  console.log('请手动导航到以下页面进行测试:');
  pagesToTest.forEach(page => {
    console.log(\`• \${page.name}: \${window.location.origin}\${page.path}\`);
  });
  
  // 6. 总结
  console.log('\\n6️⃣ 验证总结:');
  console.log('如果以上所有检查都显示✅，说明问题已成功修复');
  console.log('如果还有❌，请记录具体位置以便进一步修复');
  
  // 7. 额外验证：清空缓存后重新测试
  console.log('\\n7️⃣ 建议额外测试:');
  console.log('1. 刷新页面 (F5)');
  console.log('2. 硬刷新 (Ctrl+F5 或 Cmd+Shift+R)');
  console.log('3. 清空浏览器缓存后重新访问');
  console.log('确保数据不是来自缓存');
}

// 执行验证
finalValidation();
`;

console.log(finalValidationCode);

console.log('\n📋 验证步骤:');
console.log('1. 复制上面的代码到浏览器控制台');
console.log('2. 按回车执行');
console.log('3. 查看所有检查结果');
console.log('4. 访问数据概览、财务管理、销售管理页面分别测试');
console.log('5. 确认所有页面都显示待返佣金=0');

console.log('\n🎯 预期结果:');
console.log('• API返回 pending_commission = 0');
console.log('• 所有页面统计卡片显示待返佣金 = 0');
console.log('• 表格中的待返佣金列显示 0 或空值');
console.log('• 不再出现 3276 这个错误值');

console.log('\n✅ 如果验证通过，说明待返佣金显示问题已完全修复！');