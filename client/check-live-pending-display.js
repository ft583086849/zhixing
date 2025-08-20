#!/usr/bin/env node

/**
 * 检查实际页面显示的pending_commission值
 */

console.log('🔍 检查实际页面显示的pending_commission值\n');

console.log('请在管理后台页面的浏览器控制台执行以下代码:\n');

const liveCheckCode = `
// 检查实际页面显示的pending_commission值
async function checkLivePendingDisplay() {
  console.log('🔍 检查实际页面显示的pending_commission值...');
  
  // 1. 直接调用API获取实际返回值
  console.log('\\n1️⃣ 直接调用API:');
  try {
    const module = await import('/src/services/api.js');
    const AdminAPI = module.AdminAPI;
    
    const stats = await AdminAPI.getStats({ timeRange: 'all' });
    
    console.log('API返回的佣金字段:');
    console.log('• pending_commission:', stats.pending_commission, '⭐');
    console.log('• pending_commission_amount:', stats.pending_commission_amount, '⭐');
    console.log('• total_commission:', stats.total_commission);
    console.log('• paid_commission_amount:', stats.paid_commission_amount);
    
    // 检查是否返回了错误的值
    if (stats.pending_commission !== 0) {
      console.log('❌ API返回了非0值:', stats.pending_commission);
      
      // 检查数据源
      if (stats.data_source) {
        console.log('数据源:', stats.data_source);
      }
      
      // 检查调试信息
      if (stats.debug_info) {
        console.log('调试信息:', stats.debug_info);
      }
      
    } else {
      console.log('✅ API返回pending_commission=0，正确！');
    }
    
  } catch (error) {
    console.error('API调用失败:', error);
  }
  
  // 2. 检查页面DOM中显示的值
  console.log('\\n2️⃣ 检查页面DOM显示:');
  
  // 查找待返佣金的统计卡片
  const allElements = document.querySelectorAll('*');
  const pendingElements = [];
  
  allElements.forEach(el => {
    const text = el.textContent || '';
    if (text.includes('待返佣金') && el.children.length === 0) {
      const parent = el.closest('.ant-statistic, .ant-card');
      if (parent) {
        const valueEl = parent.querySelector('.ant-statistic-content-value');
        if (valueEl) {
          pendingElements.push({
            title: el.textContent,
            value: valueEl.textContent,
            element: parent
          });
        }
      }
    }
  });
  
  console.log('找到的待返佣金显示:');
  pendingElements.forEach((item, index) => {
    console.log(\`\${index + 1}. \${item.title}: \${item.value}\`);
    
    const numValue = parseFloat(item.value.replace(/[^\\d.-]/g, ''));
    if (numValue !== 0) {
      console.log('❌ 发现非0显示值:', numValue);
    }
  });
  
  // 3. 检查Redux状态
  console.log('\\n3️⃣ 检查Redux状态:');
  try {
    // 尝试获取Redux store
    const reactRoot = document.querySelector('#root')._reactInternals ||
                      document.querySelector('#root')._reactInternalInstance;
    
    if (reactRoot) {
      console.log('找到React实例，尝试获取状态...');
      // 这里可以深入检查React状态
    }
  } catch (e) {
    console.log('无法访问Redux状态');
  }
  
  // 4. 检查网络请求
  console.log('\\n4️⃣ 监听网络请求:');
  
  // 重写fetch来监听API请求
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('getStats')) {
      console.log('拦截到getStats请求:', args[0]);
      
      return originalFetch.apply(this, args).then(response => {
        return response.clone().json().then(data => {
          console.log('getStats响应数据:', data);
          return response;
        });
      });
    }
    return originalFetch.apply(this, args);
  };
  
  console.log('网络请求监听已开启');
}

// 执行检查
checkLivePendingDisplay();
`;

console.log(liveCheckCode);

console.log('\n📋 如果发现问题:');
console.log('• 如果API返回0但页面显示3276 → 前端显示逻辑有问题');
console.log('• 如果API返回3276 → API计算逻辑有问题'); 
console.log('• 如果网络请求显示其他数据源 → 可能使用了缓存或其他API');

console.log('\n🎯 下一步:');
console.log('根据检查结果确定修复方向');