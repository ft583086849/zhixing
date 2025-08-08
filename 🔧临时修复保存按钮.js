/**
 * 临时修复保存按钮显示问题
 * 
 * 使用方法：
 * 1. 访问 https://zhixing-seven.vercel.app/admin/finance
 * 2. 打开控制台(F12)
 * 3. 运行此脚本
 */

console.log('🔧 尝试修复保存按钮显示问题\n');
console.log('='.repeat(50));

// 方法1：调整Col布局
function fixColLayout() {
  console.log('\n📐 方法1: 调整Col布局');
  
  // 找到包含说明文字的Col
  const cols = document.querySelectorAll('.ant-col');
  
  cols.forEach(col => {
    if (col.textContent && col.textContent.includes('营利金额 = 总实付金额')) {
      console.log('找到说明文字Col');
      
      // 找到其父Row
      const row = col.closest('.ant-row');
      if (row) {
        // 找到所有子Col
        const childCols = row.querySelectorAll('.ant-col');
        if (childCols.length >= 2) {
          // 调整第一个Col的宽度
          childCols[0].className = 'ant-col ant-col-16';
          // 调整第二个Col的宽度
          childCols[1].className = 'ant-col ant-col-8';
          console.log('✅ 已调整Col宽度');
        }
      }
    }
  });
}

// 方法2：强制显示隐藏的按钮
function forceShowButton() {
  console.log('\n👁️ 方法2: 强制显示按钮');
  
  // 查找所有包含"保存"的按钮
  const buttons = document.querySelectorAll('button');
  let found = false;
  
  buttons.forEach(btn => {
    const text = btn.textContent || btn.innerText;
    if (text && (text.includes('保存') || text.includes('已保存'))) {
      console.log('找到保存按钮:', text);
      
      // 强制显示
      btn.style.display = 'inline-block';
      btn.style.visibility = 'visible';
      btn.style.opacity = '1';
      
      // 确保父元素也可见
      let parent = btn.parentElement;
      while (parent && parent !== document.body) {
        parent.style.display = '';
        parent.style.visibility = 'visible';
        parent.style.opacity = '1';
        parent = parent.parentElement;
      }
      
      found = true;
      console.log('✅ 已强制显示按钮');
    }
  });
  
  if (!found) {
    console.log('❌ 未找到保存按钮');
  }
}

// 方法3：手动创建保存按钮
function createSaveButton() {
  console.log('\n➕ 方法3: 手动创建保存按钮');
  
  // 找到收益分配表格的Card
  const cards = document.querySelectorAll('.ant-card');
  let targetCard = null;
  
  cards.forEach(card => {
    if (card.textContent && card.textContent.includes('收益分配方案')) {
      targetCard = card;
    }
  });
  
  if (targetCard) {
    const cardBody = targetCard.querySelector('.ant-card-body');
    
    if (cardBody && !document.getElementById('manual-save-btn')) {
      // 创建容器
      const container = document.createElement('div');
      container.style.marginTop = '20px';
      container.style.textAlign = 'right';
      
      // 创建按钮
      const btn = document.createElement('button');
      btn.id = 'manual-save-btn';
      btn.className = 'ant-btn ant-btn-primary ant-btn-lg';
      btn.innerHTML = '<span role="img" aria-label="save" class="anticon anticon-save"><svg viewBox="64 64 896 896" focusable="false" data-icon="save" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"></path></svg></span><span>保存分配方案</span>';
      btn.style.marginLeft = '10px';
      
      // 添加点击事件
      btn.onclick = async function() {
        console.log('点击保存按钮');
        
        // 获取当前比例值
        const inputs = document.querySelectorAll('.ant-input-number input');
        if (inputs.length >= 3) {
          const ratios = {
            public: parseFloat(inputs[0].value) || 40,
            zhixing: parseFloat(inputs[1].value) || 35,
            zijun: parseFloat(inputs[2].value) || 25
          };
          
          console.log('准备保存:', ratios);
          
          // 调用API保存
          try {
            const { AdminAPI } = await import('./services/api.js');
            const result = await AdminAPI.saveProfitDistribution(ratios);
            
            if (result.success) {
              alert('✅ 收益分配比例已保存到数据库！');
              btn.textContent = '已保存';
              btn.style.background = '#1890ff';
            } else {
              alert('❌ 保存失败：' + result.message);
            }
          } catch (error) {
            console.error('保存失败:', error);
            alert('❌ 保存失败：' + error.message);
          }
        }
      };
      
      container.appendChild(btn);
      cardBody.appendChild(container);
      
      console.log('✅ 已创建手动保存按钮');
    } else if (document.getElementById('manual-save-btn')) {
      console.log('⚠️ 手动保存按钮已存在');
    } else {
      console.log('❌ 未找到目标Card');
    }
  }
}

// 方法4：检查并修复CSS
function fixCSS() {
  console.log('\n🎨 方法4: 检查CSS问题');
  
  // 添加自定义CSS确保按钮可见
  const style = document.createElement('style');
  style.innerHTML = `
    /* 确保保存按钮可见 */
    button[type="primary"]:has(span:contains("保存")),
    button[type="primary"]:has(span:contains("已保存")) {
      display: inline-block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* 确保Col布局正确 */
    .ant-col-6 {
      flex: 0 0 25% !important;
      max-width: 25% !important;
    }
    
    .ant-col-18 {
      flex: 0 0 75% !important;
      max-width: 75% !important;
    }
    
    /* 确保Row显示 */
    .ant-row {
      display: flex !important;
    }
  `;
  document.head.appendChild(style);
  console.log('✅ 已添加修复CSS');
}

// 执行所有修复
function applyAllFixes() {
  console.log('\n🚀 开始应用所有修复...\n');
  
  fixColLayout();
  forceShowButton();
  fixCSS();
  
  // 如果还是没有按钮，创建一个
  setTimeout(() => {
    const buttons = document.querySelectorAll('button');
    let hasButton = false;
    
    buttons.forEach(btn => {
      const text = btn.textContent || btn.innerText;
      if (text && (text.includes('保存') || text.includes('已保存'))) {
        hasButton = true;
      }
    });
    
    if (!hasButton) {
      console.log('\n⚠️ 按钮仍未显示，创建手动按钮');
      createSaveButton();
    } else {
      console.log('\n✅ 保存按钮已显示');
    }
  }, 1000);
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 修复完成！\n');
  console.log('如果按钮仍未显示，请尝试：');
  console.log('1. 刷新页面');
  console.log('2. 运行 createSaveButton() 创建临时按钮');
}

// 导出函数
window.fixColLayout = fixColLayout;
window.forceShowButton = forceShowButton;
window.createSaveButton = createSaveButton;
window.fixCSS = fixCSS;
window.applyAllFixes = applyAllFixes;

// 自动执行修复
applyAllFixes();
