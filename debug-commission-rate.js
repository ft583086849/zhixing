// 🔍 佣金率调试脚本
// 请在 https://zhixing-seven.vercel.app/sales-reconciliation 页面的控制台执行

// 1. 检查当前页面的佣金率数据
console.log('=== 佣金率调试开始 ===');

// 2. 查找所有包含佣金率的元素
const allElements = document.querySelectorAll('*');
let commissionElements = [];

allElements.forEach(el => {
  const text = el.innerText || '';
  if (text.includes('2500%') || text.includes('佣金')) {
    commissionElements.push({
      element: el,
      text: text,
      className: el.className
    });
  }
});

console.log('找到的佣金相关元素:', commissionElements);

// 3. 检查React组件的props（如果可访问）
const reactRoot = document.getElementById('root');
if (reactRoot && reactRoot._reactRootContainer) {
  console.log('React根节点:', reactRoot._reactRootContainer);
}

// 4. 检查网络请求中的佣金率数据
console.log('=== 检查网络请求 ===');
console.log('请打开Network标签，搜索销售代码，查看API返回的commission_rate值');

// 5. 检查localStorage中的数据
const storageData = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('sales') || key.includes('commission')) {
    storageData[key] = localStorage.getItem(key);
  }
}
console.log('localStorage相关数据:', storageData);

// 6. 提取页面源代码中的关键信息
const scriptTags = document.querySelectorAll('script');
scriptTags.forEach((script, index) => {
  const content = script.innerHTML;
  if (content.includes('commission_rate') || content.includes('* 100')) {
    console.log(`Script标签 #${index} 包含佣金率逻辑:`, content.substring(0, 200));
  }
});

// 7. 检查当前页面的具体数值
const statisticElements = document.querySelectorAll('.ant-statistic-content-value');
statisticElements.forEach(el => {
  if (el.innerText.includes('%')) {
    console.log('统计组件值:', el.innerText, '父元素:', el.parentElement);
  }
});

console.log('=== 调试建议 ===');
console.log('1. 查看Network标签中API返回的commission_rate原始值');
console.log('2. 如果API返回25，页面显示2500%，说明前端有 *100 的bug');
console.log('3. 如果API返回2500，说明后端计算有问题');
console.log('4. 检查源代码是否包含 salesData.commission_rate * 100');

// 8. 尝试获取React组件状态（高级）
try {
  const fiberNode = reactRoot?._reactRootContainer?._internalRoot?.current;
  if (fiberNode) {
    let node = fiberNode;
    while (node) {
      if (node.memoizedState && node.memoizedState.salesData) {
        console.log('找到salesData:', node.memoizedState.salesData);
        break;
      }
      node = node.child;
    }
  }
} catch (e) {
  console.log('无法访问React内部状态');
}

console.log('=== 调试结束 ===');
