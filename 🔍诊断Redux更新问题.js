/**
 * 🔍 诊断Redux更新问题
 * API返回数据但Redux没更新的问题排查
 */

async function diagnoseReduxIssue() {
  console.log('='.repeat(60));
  console.log('🔍 诊断Redux更新问题');
  console.log('='.repeat(60));
  
  try {
    // 1. 检查当前Redux状态
    console.log('\n📋 步骤1：检查当前Redux状态');
    console.log('-'.repeat(50));
    
    if (window.store) {
      const state = window.store.getState();
      console.log('Redux state结构:', Object.keys(state));
      
      if (state.admin) {
        console.log('\nadmin state:');
        console.log('  sales:', state.admin.sales);
        console.log('  loading:', state.admin.loading);
        console.log('  error:', state.admin.error);
      }
    } else {
      console.log('❌ Redux store不存在');
      return;
    }
    
    // 2. 直接调用API
    console.log('\n📋 步骤2：直接调用API');
    console.log('-'.repeat(50));
    
    if (window.adminAPI && window.adminAPI.getSales) {
      console.log('调用 adminAPI.getSales()...');
      const salesData = await window.adminAPI.getSales();
      
      console.log(`✅ API返回: ${salesData?.length || 0} 条数据`);
      
      if (salesData && salesData.length > 0) {
        console.log('\n前3条数据:');
        salesData.slice(0, 3).forEach((sale, idx) => {
          console.log(`${idx + 1}. ${sale.sales_code} | ${sale.wechat_name || sale.name}`);
        });
        
        // 3. 手动dispatch到Redux
        console.log('\n📋 步骤3：手动更新Redux');
        console.log('-'.repeat(50));
        
        // 方法1：直接dispatch fulfilled action
        console.log('尝试方法1: dispatch fulfilled action...');
        window.store.dispatch({
          type: 'admin/getSales/fulfilled',
          payload: salesData
        });
        
        // 检查更新后的状态
        let newState = window.store.getState();
        console.log(`更新后销售数据: ${newState.admin?.sales?.length || 0} 条`);
        
        if (newState.admin?.sales?.length === 0) {
          // 方法2：尝试其他action类型
          console.log('\n尝试方法2: dispatch setSales action...');
          window.store.dispatch({
            type: 'admin/setSales',
            payload: salesData
          });
          
          newState = window.store.getState();
          console.log(`更新后销售数据: ${newState.admin?.sales?.length || 0} 条`);
        }
        
        if (newState.admin?.sales?.length === 0) {
          // 方法3：通过异步action
          console.log('\n尝试方法3: 通过异步action...');
          
          // 检查是否有getSales action
          if (window.getSales) {
            await window.store.dispatch(window.getSales());
            newState = window.store.getState();
            console.log(`更新后销售数据: ${newState.admin?.sales?.length || 0} 条`);
          } else {
            console.log('getSales action不存在');
          }
        }
        
        // 4. 检查Redux reducer
        console.log('\n📋 步骤4：检查Redux配置');
        console.log('-'.repeat(50));
        
        // 尝试获取reducer信息
        const reducerKeys = Object.keys(window.store.getState());
        console.log('Reducer keys:', reducerKeys);
        
        // 检查是否有admin reducer
        if (reducerKeys.includes('admin')) {
          console.log('✅ admin reducer存在');
          
          // 检查admin state结构
          const adminState = window.store.getState().admin;
          console.log('\nadmin state完整结构:');
          console.log(JSON.stringify(adminState, null, 2));
        } else {
          console.log('❌ admin reducer不存在');
        }
        
        // 5. 尝试通过页面组件更新
        console.log('\n📋 步骤5：尝试通过页面组件更新');
        console.log('-'.repeat(50));
        
        // 查找React组件
        const reactRoot = document.getElementById('root');
        if (reactRoot && reactRoot._reactRootContainer) {
          console.log('✅ 找到React根组件');
          
          // 触发强制更新
          if (window.location.pathname.includes('/admin/sales')) {
            console.log('当前在销售管理页面，尝试触发更新...');
            
            // 模拟路由变化强制刷新
            window.history.pushState({}, '', '/admin/sales?refresh=' + Date.now());
            window.dispatchEvent(new PopStateEvent('popstate'));
            
            console.log('已触发路由更新');
          }
        }
        
        // 6. 直接修改Redux state（临时方案）
        console.log('\n📋 步骤6：直接修改Redux state（临时方案）');
        console.log('-'.repeat(50));
        
        const currentState = window.store.getState();
        if (currentState.admin && salesData) {
          // 创建新的admin state
          const newAdminState = {
            ...currentState.admin,
            sales: salesData,
            loading: false,
            error: null
          };
          
          // 尝试直接设置（不推荐，但可以测试）
          console.log('尝试直接设置admin.sales...');
          
          // 触发一个自定义action
          window.store.dispatch({
            type: 'admin/forceSalesUpdate',
            payload: salesData
          });
          
          // 或者通过其他已知的action
          window.store.dispatch({
            type: 'admin/fetchData/fulfilled',
            payload: {
              sales: salesData
            }
          });
          
          const finalState = window.store.getState();
          console.log(`最终销售数据: ${finalState.admin?.sales?.length || 0} 条`);
        }
      }
    } else {
      console.log('❌ adminAPI.getSales不可用');
    }
    
    // 7. 提供解决方案
    console.log('\n' + '='.repeat(60));
    console.log('📝 诊断结果和解决方案');
    console.log('='.repeat(60));
    
    const finalState = window.store.getState();
    const hasSalesInRedux = (finalState.admin?.sales?.length || 0) > 0;
    
    if (hasSalesInRedux) {
      console.log('✅ Redux已成功更新！');
      console.log('请刷新页面查看效果');
    } else {
      console.log('❌ Redux更新失败');
      console.log('\n可能的原因:');
      console.log('1. Redux reducer没有正确处理action');
      console.log('2. 组件没有正确订阅Redux state');
      console.log('3. 有中间件阻止了更新');
      
      console.log('\n临时解决方案:');
      console.log('1. 刷新整个页面（F5）');
      console.log('2. 退出重新登录');
      console.log('3. 清除浏览器缓存');
      console.log('4. 使用无痕模式');
    }
    
  } catch (error) {
    console.error('❌ 诊断过程出错:', error);
  }
}

// 执行诊断
console.log('💡 开始诊断Redux更新问题...\n');
diagnoseReduxIssue();
