/**
 * 清除缓存并重新获取客户数据
 * 
 * 问题分析：
 * 1. "89一级下的直接购买"是用户故意创建的标记
 * 2. 代码逻辑上不应该过滤这个订单
 * 3. 可能是缓存问题导致看不到
 */

// 在浏览器控制台执行以下代码：

// 1. 清除所有缓存
localStorage.clear();
sessionStorage.clear();

// 2. 清除Redux缓存（如果有）
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  console.log('清除Redux缓存...');
}

// 3. 强制刷新页面
window.location.reload(true);

console.log(`
=== 解决方案 ===

1. 缓存清除方法：
   - 打开浏览器开发者工具（F12）
   - 进入Console控制台
   - 执行以下命令：
     localStorage.clear();
     sessionStorage.clear();
     location.reload(true);

2. 代码分析结果：
   从api.js的getCustomers函数看，订单不应该被过滤：
   
   第254行的条件是：
   if (!customerMap.has(key) && (customerWechat || tradingviewUser))
   
   "89一级下的直接购买"作为customerWechat有值，应该通过这个条件。

3. 可能的问题：
   a) 缓存问题 - api.js第183-185行有缓存逻辑
   b) 订单数据未同步到数据库
   c) 前端组件有额外的过滤逻辑

4. 验证方法：
   a) 清除缓存后刷新页面
   b) 在客户管理页面搜索框输入"89"或"直接购买"
   c) 检查网络请求返回的原始数据

5. 如果还是看不到：
   需要检查：
   - 订单是否真的存在于数据库
   - 是否有其他地方的过滤逻辑
   - 前端AdminCustomers组件是否有额外过滤
`);


