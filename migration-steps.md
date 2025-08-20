# 🚀 安全迁移步骤

## ✅ 当前状态
- Vercel环境变量已配置：
  - REACT_APP_SUPABASE_URL ✅
  - REACT_APP_SUPABASE_ANON_KEY ✅
- 值与硬编码完全一致，可以无缝切换

## 📋 迁移步骤

### 第1步：部署测试页面（已完成）
```bash
git add .
git commit -m "添加配置兼容性测试"
git push
```

### 第2步：验证兼容性
访问：`https://zhixing-seven.vercel.app/test-config`
- 应该看到两个绿色勾号
- 建议显示"可以安全替换"

### 第3步：小范围测试（先改1个文件）

选择一个低风险的文件开始，比如 `AuthTestPage.js`：

```javascript
// 原来的：
import supabase from '../config/supabase';

// 改为：
import supabase from '../config/supabase-safe';
```

### 第4步：测试功能
- 访问 `/auth-test` 页面
- 测试登录功能
- 确认一切正常

### 第5步：批量替换（确认无误后）

使用VS Code的全局查找替换：
1. 查找：`from '../config/supabase'`
2. 替换为：`from '../config/supabase-safe'`
3. 查找：`from './config/supabase'`
4. 替换为：`from './config/supabase-safe'`

### 第6步：处理primary_sales表问题

在需要的文件中导入兼容层：
```javascript
import PrimarySalesCompat from '../services/primary-sales-compat';

// 替换原来的调用
// 原来：supabase.from('primary_sales')
// 改为：PrimarySalesCompat.getPrimarySales()
```

## 🎯 需要修改的文件列表

### 优先级1：配置文件（2个）
- [ ] client/src/services/supabase.js
- [ ] client/src/services/api.js

### 优先级2：页面文件（可以逐个测试）
- [ ] client/src/pages/AuthTestPage.js（建议先测试这个）
- [ ] client/src/pages/PurchasePage.js
- [ ] client/src/pages/AdminLoginPage.js
- [ ] client/src/pages/AdminDashboardPage.js
- [ ] client/src/pages/SalesPage.js
- [ ] client/src/pages/SalesReconciliationPage.js
- [ ] client/src/pages/PrimarySalesPage.js
- [ ] client/src/pages/PrimarySalesSettlementPage.js

### 优先级3：组件文件
- [ ] client/src/components/admin/AdminOrders.js
- [ ] client/src/components/admin/AdminSales.js
- [ ] client/src/components/admin/AdminOverview.js
- [ ] 其他admin组件...

## ⚠️ 注意事项

1. **每次只改1-2个文件**，测试后再继续
2. **保持Git提交清晰**，方便回滚
3. **监控错误日志**，发现问题立即停止
4. **高峰期避免操作**，选择用户少的时段

## 🔄 回滚方案

如果出现问题：
```bash
# 方法1：Git回滚
git revert HEAD
git push

# 方法2：手动改回
# 将 supabase-safe 改回 supabase

# 方法3：Vercel控制台
# 选择上一个稳定版本部署
```

## ✅ 成功标志

- [ ] 所有页面正常访问
- [ ] 数据库查询正常
- [ ] 无新增错误日志
- [ ] 用户无感知

---

**记住：稳定第一，速度第二！**