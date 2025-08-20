#!/usr/bin/env node

/**
 * 查找页面中显示非0待返佣金的具体位置
 * 
 * 既然数据库显示待返佣金=0，我们需要找出哪些页面显示的不是0
 */

console.log('🔍 查找页面中显示非0待返佣金的具体位置\n');
console.log('数据库确认：所有销售的佣金都已支付完毕（待返=0）');
console.log('任务：找出哪里显示的不是0，分析原因并修复\n');

console.log('📋 需要检查的页面和组件:');
console.log('1. 数据概览页面 (/admin/dashboard)');
console.log('2. 财务管理页面 (/admin/finance)');  
console.log('3. 销售管理页面 (/admin/sales)');
console.log('4. 销售对账页面 (SalesReconciliation)');
console.log('5. 主要原因销售结算页面 (/admin/primary-sales-settlement)');

console.log('\n🎯 检查步骤:');
console.log('1. 启动开发服务器');
console.log('2. 逐个访问每个页面'); 
console.log('3. 记录显示非0待返佣金的位置');
console.log('4. 分析数据来源');
console.log('5. 修复错误的计算或显示逻辑');

console.log('\n🚀 开始检查...');

// 创建检查脚本，在浏览器中执行
const browserCheckScript = `
// 在管理后台页面执行的检查脚本
async function checkPendingCommissionDisplay() {
  console.log('🔍 检查页面中的待返佣金显示...');
  
  // 1. 检查当前页面的统计卡片
  const statsCards = document.querySelectorAll('[data-testid], .ant-statistic');
  console.log('找到', statsCards.length, '个统计卡片');
  
  statsCards.forEach((card, index) => {
    const title = card.querySelector('.ant-statistic-title')?.textContent;
    const value = card.querySelector('.ant-statistic-content-value')?.textContent;
    
    if (title && (title.includes('待返') || title.includes('佣金'))) {
      console.log(\`统计卡片 \${index + 1}: \${title} = \${value}\`);
      
      if (value && parseFloat(value.replace(/[^\\d.-]/g, '')) !== 0) {
        console.log('❌ 发现非0值:', title, '=', value);
      }
    }
  });
  
  // 2. 检查表格中的待返佣金列
  const tables = document.querySelectorAll('.ant-table-tbody');
  tables.forEach((table, tableIndex) => {
    const rows = table.querySelectorAll('tr');
    console.log(\`表格 \${tableIndex + 1}: 找到 \${rows.length} 行数据\`);
    
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, cellIndex) => {
        if (cell.textContent.includes('待返') && !cell.textContent.includes('0')) {
          console.log(\`❌ 表格 \${tableIndex + 1} 第 \${rowIndex + 1} 行第 \${cellIndex + 1} 列有非0待返佣金:`, cell.textContent);
        }
      });
    });
  });
  
  // 3. 检查页面URL
  console.log('当前页面:', window.location.pathname);
  
  // 4. 检查Redux状态
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('检查Redux状态中的统计数据...');
    // 这里可以添加Redux状态检查
  }
  
  // 5. 调用API检查返回值
  if (window.AdminAPI || (await import('/src/services/api.js'))) {
    try {
      const module = await import('/src/services/api.js');
      const AdminAPI = module.AdminAPI;
      
      console.log('\\n🔍 直接调用API检查...');
      const stats = await AdminAPI.getStats({ timeRange: 'all' });
      
      console.log('API返回的pending_commission:', stats.pending_commission);
      console.log('API返回的pending_commission_amount:', stats.pending_commission_amount);
      
      if (stats.pending_commission !== 0 || stats.pending_commission_amount !== 0) {
        console.log('❌ API返回了非0值！');
        console.log('需要检查API计算逻辑');
      } else {
        console.log('✅ API返回值正确为0');
        console.log('问题可能在前端显示逻辑');
      }
      
    } catch (error) {
      console.error('API调用失败:', error);
    }
  }
}

// 页面加载完成后执行检查
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkPendingCommissionDisplay);
} else {
  checkPendingCommissionDisplay();
}
`;

console.log('\n📋 在浏览器控制台执行以下脚本来检查页面:');
console.log('─'.repeat(60));
console.log(browserCheckScript);
console.log('─'.repeat(60));

console.log('\n🔧 自动启动服务器进行检查...');