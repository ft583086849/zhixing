/**
 * 实时监控数据加载状态
 * 在浏览器控制台运行此脚本，实时监控数据加载情况
 */

// 启动实时监控
function startDataMonitoring() {
  console.clear();
  console.log('🚀 启动实时数据监控...\n');
  
  // 监控配置
  const config = {
    interval: 5000, // 每5秒检查一次
    autoFix: false, // 是否自动尝试修复问题
  };
  
  // 监控状态
  let monitoringActive = true;
  let checkCount = 0;
  
  // 停止监控函数
  window.stopMonitoring = () => {
    monitoringActive = false;
    console.log('⏹️ 监控已停止');
  };
  
  console.log('💡 提示: 输入 stopMonitoring() 停止监控\n');
  console.log('='.repeat(60));
  
  // 监控函数
  async function monitorData() {
    if (!monitoringActive) return;
    
    checkCount++;
    console.log(`\n📊 第 ${checkCount} 次检查 [${new Date().toLocaleTimeString()}]`);
    console.log('-'.repeat(40));
    
    // 1. 检查 Redux Store 状态
    if (window.store) {
      const state = window.store.getState();
      const adminState = state.admin;
      
      console.log('📦 Redux Store 状态:');
      console.log(`  - Loading: ${adminState.loading ? '⏳ 加载中' : '✅ 完成'}`);
      console.log(`  - Error: ${adminState.error ? `❌ ${adminState.error}` : '✅ 无错误'}`);
      console.log(`  - Customers: ${adminState.customers?.length || 0} 条`);
      console.log(`  - Sales: ${adminState.sales?.length || 0} 条`);
      console.log(`  - Orders: ${adminState.orders?.length || 0} 条`);
      
      // 检查是否有数据问题
      if (!adminState.loading && adminState.customers?.length === 0) {
        console.warn('⚠️ 检测到客户数据为空！');
        
        if (config.autoFix) {
          console.log('🔧 尝试自动修复...');
          await attemptAutoFix();
        }
      }
    }
    
    // 2. 检查网络请求
    checkNetworkRequests();
    
    // 3. 检查 Supabase 连接
    await checkSupabaseConnection();
    
    // 继续监控
    if (monitoringActive) {
      setTimeout(monitorData, config.interval);
    }
  }
  
  // 检查网络请求
  function checkNetworkRequests() {
    // 拦截 fetch 请求以监控 API 调用
    const originalFetch = window.fetch;
    let requestCount = 0;
    let failedRequests = 0;
    
    window.fetch = function(...args) {
      const url = args[0];
      if (url.includes('supabase')) {
        requestCount++;
        console.log(`🌐 Supabase 请求 #${requestCount}: ${url}`);
        
        return originalFetch.apply(this, args)
          .then(response => {
            if (!response.ok) {
              failedRequests++;
              console.error(`❌ 请求失败: ${response.status} ${response.statusText}`);
            }
            return response;
          })
          .catch(error => {
            failedRequests++;
            console.error(`❌ 网络错误: ${error.message}`);
            throw error;
          });
      }
      return originalFetch.apply(this, args);
    };
    
    // 5秒后恢复原始 fetch
    setTimeout(() => {
      window.fetch = originalFetch;
      if (requestCount > 0) {
        console.log(`📈 网络统计: ${requestCount} 个请求, ${failedRequests} 个失败`);
      }
    }, 5000);
  }
  
  // 检查 Supabase 连接
  async function checkSupabaseConnection() {
    const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=count`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'count=exact',
          'Range': '0-0'
        }
      });
      
      if (response.ok) {
        const contentRange = response.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        console.log(`✅ Supabase 连接正常 (orders表有 ${count} 条记录)`);
      } else {
        const error = await response.json();
        if (error.message?.includes('row-level security')) {
          console.error('❌ RLS 权限问题仍然存在！');
          console.log('💡 建议: 执行 🔧修复Supabase_RLS权限问题_完整版.sql');
        } else {
          console.error('❌ Supabase 连接异常:', error.message);
        }
      }
    } catch (error) {
      console.error('❌ 网络连接失败:', error.message);
    }
  }
  
  // 尝试自动修复
  async function attemptAutoFix() {
    console.log('🔄 尝试重新加载数据...');
    
    if (window.store && window.adminAPI) {
      try {
        // 手动触发数据加载
        const customers = await window.adminAPI.getCustomers();
        console.log(`✅ 重新加载成功: ${customers?.length || 0} 个客户`);
        
        // 更新 Redux Store
        window.store.dispatch({
          type: 'admin/getCustomers/fulfilled',
          payload: customers
        });
      } catch (error) {
        console.error('❌ 自动修复失败:', error);
      }
    }
  }
  
  // 开始监控
  monitorData();
}

// 诊断总结函数
async function generateDiagnosticReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 生成诊断报告');
  console.log('='.repeat(60));
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      online: navigator.onLine
    },
    redux: null,
    supabase: null,
    recommendations: []
  };
  
  // 检查 Redux
  if (window.store) {
    const state = window.store.getState();
    report.redux = {
      authenticated: !!state.auth.admin,
      dataStatus: {
        customers: state.admin.customers?.length || 0,
        sales: state.admin.sales?.length || 0,
        orders: state.admin.orders?.length || 0
      },
      loading: state.admin.loading,
      error: state.admin.error
    };
  }
  
  // 检查 Supabase
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  const tables = ['orders', 'primary_sales', 'secondary_sales'];
  report.supabase = {};
  
  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'count=exact',
          'Range': '0-0'
        }
      });
      
      if (response.ok) {
        const contentRange = response.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        report.supabase[table] = { accessible: true, count };
      } else {
        const error = await response.json();
        report.supabase[table] = { 
          accessible: false, 
          error: error.message,
          hasRLS: error.message?.includes('row-level security')
        };
      }
    } catch (error) {
      report.supabase[table] = { accessible: false, error: error.message };
    }
  }
  
  // 生成建议
  if (Object.values(report.supabase).some(t => t.hasRLS)) {
    report.recommendations.push('执行 RLS 修复脚本: 🔧修复Supabase_RLS权限问题_完整版.sql');
  }
  
  if (report.redux?.dataStatus?.customers === 0 && report.supabase?.orders?.count > 0) {
    report.recommendations.push('数据处理逻辑可能有问题，检查 API 层代码');
  }
  
  if (!navigator.onLine) {
    report.recommendations.push('网络连接断开，请检查网络');
  }
  
  // 输出报告
  console.log('\n📊 诊断报告:');
  console.log(JSON.stringify(report, null, 2));
  
  // 保存到全局变量
  window.diagnosticReport = report;
  console.log('\n💾 报告已保存到 window.diagnosticReport');
  
  return report;
}

// 提供使用说明
console.log('='.repeat(60));
console.log('📊 数据监控工具已加载');
console.log('='.repeat(60));
console.log('\n可用命令:');
console.log('1. startDataMonitoring() - 启动实时监控');
console.log('2. generateDiagnosticReport() - 生成诊断报告');
console.log('3. stopMonitoring() - 停止监控（在监控启动后可用）');
console.log('\n建议先运行 generateDiagnosticReport() 获取当前状态');
console.log('然后运行 startDataMonitoring() 进行实时监控');
