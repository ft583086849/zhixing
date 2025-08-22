// 修复认证并重新加载数据
(() => {
  console.log('========================================');
  console.log('🔧 修复认证问题');
  console.log('========================================');
  
  // 1. 检查当前token状态
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  const adminInfo = localStorage.getItem('adminInfo');
  
  console.log('当前token:', token ? `存在(长度:${token.length})` : '不存在');
  console.log('管理员信息:', adminInfo);
  
  if (!token) {
    console.log('\n❌ Token不存在，需要重新登录');
    console.log('建议操作：');
    console.log('1. 刷新页面');
    console.log('2. 重新登录管理员账号');
    return;
  }
  
  // 2. 尝试强制刷新Redux store
  console.log('\n尝试重新加载数据...');
  
  // 找到Redux store并dispatch actions
  try {
    // 方法1：通过React DevTools查找store
    const reactRoot = document.getElementById('root');
    if (reactRoot?._reactRootContainer) {
      const fiber = reactRoot._reactRootContainer._internalRoot.current;
      let node = fiber;
      
      while (node) {
        if (node.memoizedProps?.store) {
          const store = node.memoizedProps.store;
          console.log('✅ 找到Redux store');
          
          // 获取当前state
          const state = store.getState();
          console.log('当前admin state:', {
            isAuthenticated: state.auth?.isAuthenticated,
            admin: state.auth?.admin,
            loading: state.admin?.loading,
            hasStats: !!state.admin?.stats
          });
          
          // 如果需要，可以手动设置token到请求头
          if (window.axios) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('✅ 已设置axios默认请求头');
          }
          
          break;
        }
        node = node.child || node.sibling || node.return;
      }
    }
  } catch (e) {
    console.log('无法访问React内部结构');
  }
  
  // 3. 建议的修复步骤
  console.log('\n📝 建议的修复步骤：');
  console.log('1. 执行: location.reload() 刷新页面');
  console.log('2. 重新登录管理员账号');
  console.log('3. 登录成功后再次查看数据');
  
  // 4. 提供快速刷新选项
  console.log('\n要立即刷新页面吗？');
  console.log('执行: location.reload()');
  
  console.log('\n========================================');
  console.log('✅ 诊断完成');
  console.log('========================================');
})();