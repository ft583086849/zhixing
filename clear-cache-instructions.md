# 清除缓存方法

## 1. 浏览器端（立即生效）
- **强制刷新**：Ctrl + F5（Windows）或 Cmd + Shift + R（Mac）
- **清除站点数据**：
  1. 打开开发者工具（F12）
  2. Application/存储 标签
  3. Clear site data

## 2. 在控制台执行（清除前端缓存）
```javascript
// 清除localStorage缓存
localStorage.clear();

// 清除sessionStorage缓存
sessionStorage.clear();

// 如果有CacheManager
if (window.CacheManager) {
  window.CacheManager.clear();
}

// 刷新页面
location.reload(true);
```

## 3. 重新登录
- 退出登录
- 重新登录管理后台

## 4. 验证数据是否显示正确
访问：https://zhixing-seven.vercel.app/admin/orders
搜索：qq4073969
应该看到销售信息已经显示
