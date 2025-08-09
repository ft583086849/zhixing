/**
 * 🔍 诊断佣金率更新失败问题
 * 
 * 使用方法：
 * 1. 访问 https://zhixing-seven.vercel.app/admin/sales
 * 2. 打开浏览器控制台
 * 3. 复制并运行此脚本
 * 4. 尝试更新任意销售的佣金率
 * 5. 查看控制台输出的详细信息
 */

console.log('🔍 开始诊断佣金率更新问题...\n');

// 1. 检查Redux Store中的销售数据
function checkSalesData() {
  console.log('\n📊 检查销售数据:');
  
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
    
    if (state?.admin?.sales) {
      const sales = state.admin.sales;
      console.log('销售总数:', sales.length);
      
      // 按类型分组
      const grouped = {
        primary: [],
        secondary: [],
        independent: [],
        unknown: []
      };
      
      sales.forEach(sale => {
        const type = sale.sales_type || sale.sales?.sales_type;
        if (type === 'primary') grouped.primary.push(sale);
        else if (type === 'secondary') grouped.secondary.push(sale);
        else if (type === 'independent') grouped.independent.push(sale);
        else grouped.unknown.push(sale);
      });
      
      console.log('\n销售类型分布:');
      console.log('  一级销售:', grouped.primary.length);
      console.log('  二级销售:', grouped.secondary.length);
      console.log('  独立销售:', grouped.independent.length);
      console.log('  未知类型:', grouped.unknown.length);
      
      // 显示每个类型的第一个销售详情
      if (grouped.primary.length > 0) {
        console.log('\n一级销售示例:');
        const example = grouped.primary[0];
        console.log('  sales.id:', example.sales?.id);
        console.log('  sales.sales_type:', example.sales?.sales_type);
        console.log('  顶层sales_type:', example.sales_type);
      }
      
      if (grouped.secondary.length > 0) {
        console.log('\n二级销售示例:');
        const example = grouped.secondary[0];
        console.log('  sales.id:', example.sales?.id);
        console.log('  sales.sales_type:', example.sales?.sales_type);
        console.log('  顶层sales_type:', example.sales_type);
      }
      
      if (grouped.independent.length > 0) {
        console.log('\n独立销售示例:');
        const example = grouped.independent[0];
        console.log('  sales.id:', example.sales?.id);
        console.log('  sales.sales_type:', example.sales?.sales_type);
        console.log('  顶层sales_type:', example.sales_type);
      }
      
      return sales;
    }
  }
  
  console.log('❌ 未找到销售数据');
  return null;
}

// 2. 监听Redux actions
function monitorReduxActions() {
  console.log('\n📡 开始监听Redux actions...');
  
  // 拦截原始的console.log来捕获更新日志
  const originalLog = console.log;
  console.log = function(...args) {
    const logStr = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    if (logStr.includes('更新佣金率') || logStr.includes('commission')) {
      originalLog.apply(console, ['🎯 捕获日志:', ...args]);
    }
    
    originalLog.apply(console, args);
  };
}

// 3. 监听网络请求
function monitorNetworkRequests() {
  console.log('\n🌐 开始监听网络请求...');
  
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    if (options?.method === 'PATCH' && url.includes('sales')) {
      console.log('\n📤 销售更新请求:');
      console.log('URL:', url);
      console.log('Method:', options.method);
      
      try {
        const body = JSON.parse(options.body || '{}');
        console.log('请求数据:', body);
        
        // 分析URL判断是更新哪个表
        if (url.includes('primary_sales')) {
          console.log('✅ 更新一级销售表');
        } else if (url.includes('secondary_sales')) {
          console.log('✅ 更新二级销售表');
          
          // 检查是否是独立销售
          const urlParts = url.split('?');
          if (urlParts[1]) {
            const params = new URLSearchParams(urlParts[1]);
            const id = params.get('id');
            console.log('销售ID:', id);
          }
        }
      } catch (e) {
        console.log('请求体解析失败:', e.message);
      }
    }
    
    return originalFetch.apply(this, args)
      .then(response => {
        if (options?.method === 'PATCH' && url.includes('sales')) {
          const clonedResponse = response.clone();
          
          clonedResponse.json().then(data => {
            console.log('\n📥 更新响应:');
            console.log('状态码:', response.status);
            console.log('响应数据:', data);
            
            if (!response.ok) {
              console.error('❌ 更新失败!');
              console.error('错误详情:', data);
            } else {
              console.log('✅ 更新成功!');
            }
          }).catch(err => {
            console.log('响应解析失败:', err.message);
          });
        }
        
        return response;
      })
      .catch(error => {
        if (options?.method === 'PATCH' && url.includes('sales')) {
          console.error('\n❌ 网络错误:', error);
        }
        throw error;
      });
  };
  
  console.log('✅ 网络请求监听已启动');
}

// 4. 提供手动测试函数
window.testCommissionUpdate = function(salesId, rate, type) {
  console.log('\n🧪 模拟测试佣金率更新:');
  console.log('销售ID:', salesId);
  console.log('新佣金率:', rate);
  console.log('销售类型:', type);
  
  // 分析类型转换
  if (type === 'independent') {
    console.log('💡 独立销售将使用secondary_sales表更新');
  }
};

// 5. 分析问题
function analyzeProblem() {
  console.log('\n💡 可能的问题原因:');
  console.log('1. 独立销售的sales_type是"independent"，但实际存储在secondary_sales表');
  console.log('2. 更新时需要将independent转换为secondary');
  console.log('3. 检查sales.id是否存在，可能为undefined');
  console.log('4. 检查数据库权限是否正确');
  
  console.log('\n🔧 修复建议:');
  console.log('• 确保sales.id字段存在且不为空');
  console.log('• 独立销售更新时使用secondary_sales表');
  console.log('• 检查Supabase的RLS策略是否允许更新');
}

// 执行诊断
console.log('='.repeat(50));
checkSalesData();
monitorReduxActions();
monitorNetworkRequests();
analyzeProblem();
console.log('='.repeat(50));

console.log('\n✅ 诊断脚本已加载！');
console.log('🔧 请尝试更新任意销售的佣金率，观察控制台输出');
console.log('💡 特别注意独立销售的更新是否正常');

// 导出函数供手动调用
window.diagnose = {
  checkData: checkSalesData,
  analyzeProblem: analyzeProblem,
  test: window.testCommissionUpdate
};
