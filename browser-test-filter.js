// 在浏览器控制台运行此脚本测试筛选功能
// 访问 http://localhost:3000/admin/overview 后运行

console.log('=== 测试销售筛选功能 ===\n');

// 1. 获取当前页面的筛选下拉框
const selects = document.querySelectorAll('.ant-select');
console.log('找到 ' + selects.length + ' 个下拉框');

// 2. 测试销售类型筛选
console.log('\n测试1: 筛选一级销售');
console.log('步骤:');
console.log('1. 点击第一个下拉框（销售类型）');
console.log('2. 选择"一级销售"');
console.log('3. 点击确认按钮');
console.log('4. 观察数据是否变化');

// 3. 模拟点击事件
function simulateFilterTest() {
  // 查找销售类型下拉框
  const typeSelect = document.querySelector('[placeholder="选择销售类型"]');
  if (typeSelect) {
    console.log('✓ 找到销售类型下拉框');
    
    // 触发点击
    const clickEvent = new MouseEvent('click', { bubbles: true });
    typeSelect.dispatchEvent(clickEvent);
    
    setTimeout(() => {
      // 查找"一级销售"选项
      const options = document.querySelectorAll('.ant-select-item-option');
      const primaryOption = Array.from(options).find(opt => 
        opt.textContent === '一级销售'
      );
      
      if (primaryOption) {
        console.log('✓ 找到"一级销售"选项');
        primaryOption.click();
        
        // 查找确认按钮
        setTimeout(() => {
          const confirmBtn = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent === '确认'
          );
          
          if (confirmBtn) {
            console.log('✓ 找到确认按钮');
            console.log('→ 点击确认按钮...');
            confirmBtn.click();
            
            setTimeout(() => {
              console.log('\n检查结果:');
              console.log('1. 查看统计卡片是否更新');
              console.log('2. 查看Top5销售是否只显示一级销售');
              console.log('3. 查看销售层级统计数据');
              
              // 检查Redux状态
              if (window.store) {
                const state = window.store.getState();
                console.log('\nRedux状态:');
                console.log('stats:', state.admin?.stats);
                console.log('sales数量:', state.admin?.sales?.length);
              }
            }, 1000);
          } else {
            console.log('✗ 未找到确认按钮');
          }
        }, 500);
      } else {
        console.log('✗ 未找到"一级销售"选项');
      }
    }, 500);
  } else {
    console.log('✗ 未找到销售类型下拉框');
  }
}

// 4. 测试重置功能
function testReset() {
  console.log('\n测试2: 重置筛选');
  const resetBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent === '重置'
  );
  
  if (resetBtn) {
    console.log('✓ 找到重置按钮');
    resetBtn.click();
    console.log('→ 已点击重置');
    
    setTimeout(() => {
      console.log('检查: 数据应该恢复到显示全部');
    }, 1000);
  } else {
    console.log('✗ 未找到重置按钮');
  }
}

// 5. 检查当前筛选状态
function checkCurrentFilter() {
  console.log('\n当前筛选状态:');
  
  // 检查销售类型选择框
  const typeSelect = document.querySelector('[placeholder="选择销售类型"]');
  if (typeSelect) {
    const typeValue = typeSelect.closest('.ant-select')?.querySelector('.ant-select-selection-item')?.textContent;
    console.log('销售类型筛选:', typeValue || '未选择');
  }
  
  // 检查销售名称选择框
  const nameSelect = document.querySelector('[placeholder="选择销售微信"]');
  if (nameSelect) {
    const nameValue = nameSelect.closest('.ant-select')?.querySelector('.ant-select-selection-item')?.textContent;
    console.log('销售微信筛选:', nameValue || '未选择');
  }
}

// 6. 直接调用API测试
async function testAPIFiltering() {
  console.log('\n测试3: 直接调用API验证筛选');
  
  if (window.AdminAPI) {
    // 测试筛选一级销售
    console.log('\n调用API筛选一级销售:');
    const primaryStats = await window.AdminAPI.getStats({ 
      sales_type: 'primary',
      timeRange: 'all'
    });
    console.log('一级销售统计:', primaryStats);
    
    const primarySales = await window.AdminAPI.getSales({ 
      sales_type: 'primary',
      timeRange: 'all'
    });
    console.log('一级销售数量:', primarySales?.length);
    
    // 测试无筛选
    console.log('\n调用API获取全部数据:');
    const allStats = await window.AdminAPI.getStats({ 
      timeRange: 'all'
    });
    console.log('全部统计:', allStats);
    
    const allSales = await window.AdminAPI.getSales({ 
      timeRange: 'all'
    });
    console.log('全部销售数量:', allSales?.length);
  } else {
    console.log('AdminAPI 不可用');
  }
}

// 执行测试
console.log('\n可用的测试命令:');
console.log('simulateFilterTest() - 自动测试筛选功能');
console.log('testReset() - 测试重置功能');
console.log('checkCurrentFilter() - 检查当前筛选状态');
console.log('testAPIFiltering() - 测试API筛选');

// 自动执行状态检查
checkCurrentFilter();