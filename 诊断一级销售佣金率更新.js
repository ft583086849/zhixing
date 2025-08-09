/**
 * 🔍 诊断一级销售佣金率更新问题
 * 
 * 使用方法：
 * 1. 访问 https://zhixing-seven.vercel.app/admin/sales
 * 2. 打开浏览器控制台
 * 3. 复制并运行此脚本
 * 4. 尝试更新一级销售的佣金率
 * 5. 查看控制台输出的详细信息
 */

console.log('🔍 开始诊断一级销售佣金率更新问题...\n');

// 1. 拦截并记录所有console.log
const originalLog = console.log;
const logs = [];
console.log = function(...args) {
  // 记录与佣金相关的日志
  const logStr = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  if (logStr.includes('佣金') || logStr.includes('commission') || logStr.includes('更新')) {
    logs.push({
      time: new Date().toLocaleTimeString(),
      content: args
    });
  }
  
  originalLog.apply(console, args);
};

// 2. 拦截网络请求
const originalFetch = window.fetch;
let requestCount = 0;

window.fetch = function(...args) {
  const [url, options] = args;
  const requestId = ++requestCount;
  
  // 记录PATCH请求（更新操作）
  if (options?.method === 'PATCH') {
    console.log(`\n📡 [请求 #${requestId}] PATCH 请求发送:`);
    console.log('URL:', url);
    
    try {
      const body = JSON.parse(options.body || '{}');
      console.log('请求数据:', body);
      
      // 检查是否是更新销售表
      if (url.includes('primary_sales') || url.includes('secondary_sales')) {
        console.log('✅ 检测到销售更新请求');
        console.log('更新类型:', url.includes('primary_sales') ? '一级销售' : '二级销售');
        
        // 提取salesId
        const urlParts = url.split('?');
        if (urlParts[1]) {
          const params = new URLSearchParams(urlParts[1]);
          console.log('查询参数:', Object.fromEntries(params));
        }
      }
    } catch (e) {
      console.log('请求体解析失败:', e.message);
    }
  }
  
  return originalFetch.apply(this, args)
    .then(response => {
      const clonedResponse = response.clone();
      
      if (options?.method === 'PATCH') {
        clonedResponse.json().then(data => {
          console.log(`\n📥 [响应 #${requestId}] 收到响应:`);
          console.log('状态码:', response.status);
          console.log('响应数据:', data);
          
          if (!response.ok) {
            console.error('❌ 请求失败!');
            console.error('错误信息:', data);
          } else {
            console.log('✅ 请求成功!');
          }
        }).catch(err => {
          console.log('响应解析失败:', err.message);
        });
      }
      
      return response;
    })
    .catch(error => {
      if (options?.method === 'PATCH') {
        console.error(`\n❌ [请求 #${requestId}] 网络错误:`, error);
      }
      throw error;
    });
};

// 3. 监听错误事件
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('佣金') || event.reason?.message?.includes('销售')) {
    console.error('\n🔴 未处理的Promise拒绝:', event.reason);
    console.error('错误堆栈:', event.reason.stack);
  }
});

// 4. 检查Redux状态
function checkReduxState() {
  console.log('\n📊 检查Redux状态...');
  
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
    if (state?.admin?.sales) {
      const sales = state.admin.sales;
      console.log('销售数据总数:', sales.length);
      
      // 找出一级销售
      const primarySales = sales.filter(s => 
        s.sales_type === 'primary' || s.sales?.sales_type === 'primary'
      );
      console.log('一级销售数量:', primarySales.length);
      
      if (primarySales.length > 0) {
        console.log('第一个一级销售数据结构:');
        const firstPrimary = primarySales[0];
        console.log({
          顶层sales_type: firstPrimary.sales_type,
          sales对象存在: !!firstPrimary.sales,
          sales_id: firstPrimary.sales?.id,
          sales_sales_type: firstPrimary.sales?.sales_type,
          commission_rate: firstPrimary.commission_rate || firstPrimary.sales?.commission_rate
        });
      }
    }
  } else {
    console.log('⚠️ Redux DevTools未安装');
  }
}

// 5. 提供手动触发的诊断函数
window.diagnose = {
  // 检查Redux状态
  checkState: checkReduxState,
  
  // 查看所有佣金相关日志
  showLogs: () => {
    console.log('\n📝 佣金相关日志记录:');
    logs.forEach(log => {
      console.log(`[${log.time}]`, ...log.content);
    });
  },
  
  // 模拟更新一级销售佣金率
  testUpdate: (salesId = 'test', rate = 30) => {
    console.log('\n🧪 模拟更新请求...');
    console.log('销售ID:', salesId);
    console.log('新佣金率:', rate);
    console.log('⚠️ 请在页面上实际点击编辑按钮进行真实测试');
  },
  
  // 检查数据结构
  checkDataStructure: () => {
    console.log('\n🔍 检查页面数据结构...');
    
    // 尝试获取表格数据
    const tables = document.querySelectorAll('.ant-table-tbody tr');
    if (tables.length > 0) {
      console.log(`找到 ${tables.length} 条销售记录`);
      
      // 查找包含"一级销售"标签的行
      const primaryRows = Array.from(tables).filter(row => 
        row.textContent.includes('一级销售')
      );
      console.log(`其中一级销售: ${primaryRows.length} 条`);
      
      if (primaryRows.length > 0) {
        console.log('✅ 找到一级销售记录，请尝试编辑其佣金率');
      }
    }
  }
};

// 6. 初始检查
checkReduxState();

console.log('\n✅ 诊断脚本已加载!');
console.log('\n可用命令:');
console.log('• diagnose.checkState() - 检查Redux状态');
console.log('• diagnose.showLogs() - 显示佣金相关日志');
console.log('• diagnose.checkDataStructure() - 检查页面数据结构');
console.log('• diagnose.testUpdate(salesId, rate) - 查看测试参数');
console.log('\n🔧 请尝试更新一级销售的佣金率，观察控制台输出');
