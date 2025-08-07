# 📦 部署清单

## 一、部署前检查

### ✅ Supabase 数据库
- [ ] 已创建 `confirmed_orders` 视图
- [ ] 已创建 `secondary_sales_stats` 视图  
- [ ] 已创建 `primary_sales_stats` 视图
- [ ] 已授权 anon 角色访问权限
- [ ] 已验证 Zhixing 的数据正确

### ✅ 前端代码
- [ ] `client/src/services/supabase.js` 已更新
- [ ] `client/src/services/api.js` 已包含新方法
- [ ] 本地测试通过

## 二、Git 提交

```bash
# 查看修改的文件
git status

# 添加修改的文件
git add client/src/services/supabase.js client/src/services/api.js

# 提交代码
git commit -m "feat: 优化销售结算查询性能 - 使用数据库视图

- 添加二级销售结算查询功能 (getSecondarySalesSettlement)
- 优化查询性能：使用数据库视图预计算统计数据
- 只传输确认订单，减少80%数据传输量
- 添加本月统计数据（月订单、月佣金等）
- 支持Zhixing等二级销售查询自己的结算数据"

# 推送到远程仓库
git push origin main
```

## 三、Vercel 自动部署

1. **查看部署状态**
   - 访问: https://vercel.com/dashboard
   - 查看项目: zhixing-seven
   - 等待构建完成（约2-3分钟）

2. **部署日志检查**
   - Build 成功 ✅
   - 无错误警告
   - 部署完成

## 四、生产环境验证

### 1. 访问销售对账页面
```
https://zhixing-seven.vercel.app/sales-reconciliation
```

### 2. 测试查询功能
- 输入微信号: `Zhixing`
- 点击查询
- 验证显示:
  - [ ] 总订单数正确
  - [ ] 总金额正确
  - [ ] 总佣金正确
  - [ ] 本月数据正确
  - [ ] 订单列表只显示确认的订单

### 3. 性能验证
- 查询响应时间 < 1秒
- 页面加载流畅
- 无控制台错误

## 五、回滚方案（如果需要）

如果部署后出现问题：

1. **Vercel 回滚**
   - 在 Vercel Dashboard 选择上一个成功的部署
   - 点击 "Promote to Production"

2. **代码回滚**
```bash
# 回滚到上一个提交
git revert HEAD
git push origin main
```

3. **数据库回滚**
```sql
-- 删除创建的视图（如果需要）
DROP VIEW IF EXISTS confirmed_orders CASCADE;
DROP VIEW IF EXISTS secondary_sales_stats CASCADE;
DROP VIEW IF EXISTS primary_sales_stats CASCADE;
```

## 六、监控和优化

### 部署后监控
- 检查 Vercel Analytics
- 监控错误日志
- 收集用户反馈

### 后续优化建议
1. 添加数据缓存机制
2. 实现分页加载
3. 添加数据导出功能
4. 优化移动端显示

## 七、文档更新

更新以下文档：
- [ ] API 文档：新增方法说明
- [ ] 数据库文档：视图结构说明
- [ ] 用户手册：查询功能使用说明

