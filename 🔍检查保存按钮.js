/**
 * 检查财务统计页面保存按钮问题
 * 
 * 使用方法：
 * 1. 访问 https://zhixing-seven.vercel.app/admin/finance
 * 2. 打开控制台(F12)
 * 3. 运行此脚本
 */

console.log('🔍 检查保存按钮问题\n');
console.log('='.repeat(50));

// 1. 检查页面结构
function checkPageStructure() {
  console.log('\n📋 1. 检查页面结构:');
  
  // 查找所有按钮
  const allButtons = document.querySelectorAll('button');
  console.log(`找到 ${allButtons.length} 个按钮`);
  
  // 列出所有按钮文本
  allButtons.forEach((btn, index) => {
    const text = btn.textContent || btn.innerText;
    if (text) {
      console.log(`  按钮${index + 1}: ${text}`);
    }
  });
  
  // 查找包含"保存"的按钮
  const saveButtons = Array.from(allButtons).filter(btn => {
    const text = btn.textContent || btn.innerText;
    return text && (text.includes('保存') || text.includes('已保存'));
  });
  
  if (saveButtons.length > 0) {
    console.log(`\n✅ 找到保存按钮: ${saveButtons.length} 个`);
    saveButtons.forEach(btn => {
      console.log('  文本:', btn.textContent);
      console.log('  可见:', btn.offsetParent !== null);
      console.log('  位置:', btn.getBoundingClientRect());
    });
  } else {
    console.log('\n❌ 未找到保存按钮');
  }
}

// 2. 检查收益分配表格
function checkProfitTable() {
  console.log('\n📊 2. 检查收益分配表格:');
  
  // 查找表格
  const tables = document.querySelectorAll('.ant-table');
  console.log(`找到 ${tables.length} 个表格`);
  
  // 查找包含"公户"的表格（收益分配表）
  const profitTable = Array.from(tables).find(table => {
    return table.textContent && table.textContent.includes('公户');
  });
  
  if (profitTable) {
    console.log('✅ 找到收益分配表格');
    
    // 查找表格的父容器
    let parent = profitTable.parentElement;
    while (parent && !parent.classList.contains('ant-card')) {
      parent = parent.parentElement;
    }
    
    if (parent) {
      console.log('  表格在Card组件中');
      
      // 查找Card下方的内容
      const cardBody = parent.querySelector('.ant-card-body');
      if (cardBody) {
        const rows = cardBody.querySelectorAll('.ant-row');
        console.log(`  Card内有 ${rows.length} 个Row组件`);
        
        // 查看最后一个Row的内容
        if (rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          console.log('  最后一个Row内容:', lastRow.textContent);
        }
      }
    }
  } else {
    console.log('⚠️ 未找到收益分配表格');
  }
}

// 3. 检查滑块
function checkSliders() {
  console.log('\n🎚️ 3. 检查滑块:');
  
  const sliders = document.querySelectorAll('.ant-slider');
  const inputs = document.querySelectorAll('.ant-input-number');
  
  console.log(`找到 ${sliders.length} 个滑块`);
  console.log(`找到 ${inputs.length} 个数字输入框`);
  
  if (inputs.length >= 3) {
    console.log('\n当前比例设置:');
    inputs.forEach((input, index) => {
      const inputEl = input.querySelector('input');
      if (inputEl && index < 3) {
        const labels = ['公户', '知行', '子俊'];
        console.log(`  ${labels[index]}: ${inputEl.value}%`);
      }
    });
  }
}

// 4. 检查React组件
function checkReactComponent() {
  console.log('\n⚛️ 4. 检查React组件:');
  
  // 查找React根节点
  const root = document.getElementById('root');
  if (!root) {
    console.log('❌ 未找到React根节点');
    return;
  }
  
  // 检查React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools可用');
  } else {
    console.log('⚠️ React DevTools不可用');
  }
  
  // 检查是否有错误信息
  const errorBoundary = document.querySelector('.ant-result-error');
  if (errorBoundary) {
    console.log('❌ 页面有错误:', errorBoundary.textContent);
  }
}

// 5. 检查控制台错误
function checkConsoleErrors() {
  console.log('\n⚠️ 5. 检查控制台错误:');
  
  // 捕获错误
  const originalError = console.error;
  let errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  if (errors.length > 0) {
    console.log('发现错误:');
    errors.forEach(err => console.log('  ', err));
  } else {
    console.log('暂无错误（可能需要刷新页面查看）');
  }
}

// 6. 尝试手动添加按钮（测试用）
function tryAddButton() {
  console.log('\n🔧 6. 尝试手动添加测试按钮:');
  
  // 找到收益分配表格的Card
  const cards = document.querySelectorAll('.ant-card');
  const targetCard = Array.from(cards).find(card => {
    return card.textContent && card.textContent.includes('收益分配方案');
  });
  
  if (targetCard) {
    const cardBody = targetCard.querySelector('.ant-card-body');
    if (cardBody && !document.getElementById('test-save-btn')) {
      const testBtn = document.createElement('button');
      testBtn.id = 'test-save-btn';
      testBtn.className = 'ant-btn ant-btn-primary ant-btn-lg';
      testBtn.textContent = '测试保存按钮';
      testBtn.style.marginTop = '20px';
      testBtn.onclick = () => alert('按钮点击成功！');
      
      cardBody.appendChild(testBtn);
      console.log('✅ 已添加测试按钮');
      console.log('  如果测试按钮显示但原按钮不显示，说明是组件渲染问题');
    }
  } else {
    console.log('❌ 未找到目标Card');
  }
}

// 主函数
function diagnose() {
  console.log('\n🚀 开始诊断...\n');
  
  checkPageStructure();
  checkProfitTable();
  checkSliders();
  checkReactComponent();
  checkConsoleErrors();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 诊断完成！\n');
  
  console.log('可能的问题：');
  console.log('1. 组件没有完全渲染');
  console.log('2. CSS样式隐藏了按钮');
  console.log('3. 条件渲染逻辑问题');
  console.log('4. 部署版本不是最新的');
  
  console.log('\n建议操作：');
  console.log('1. 强制刷新 (Ctrl+Shift+R)');
  console.log('2. 打开无痕模式重试');
  console.log('3. 检查浏览器控制台错误');
  console.log('4. 运行 tryAddButton() 测试');
}

// 导出函数
window.checkPageStructure = checkPageStructure;
window.checkProfitTable = checkProfitTable;
window.checkSliders = checkSliders;
window.checkReactComponent = checkReactComponent;
window.tryAddButton = tryAddButton;
window.diagnose = diagnose;

// 自动运行诊断
diagnose();
