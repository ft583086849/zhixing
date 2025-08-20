
# 部署检查清单

## 部署前检查
- [ ] 确认orders_optimized表已创建
- [ ] 确认数据已同步（orders → orders_optimized）
- [ ] 确认自动同步触发器已创建
- [ ] 确认测试环境验证通过

## 部署步骤
- [ ] 执行 git pull 获取最新代码
- [ ] 执行 npm install 安装依赖
- [ ] 执行 npm run build 构建前端
- [ ] 重启Node.js服务
- [ ] 清除CDN缓存（如果有）

## 部署后验证
- [ ] 访问订单管理页面，确认能正常显示
- [ ] 测试筛选功能是否正常
- [ ] 测试分页功能是否正常
- [ ] 检查页面加载速度是否提升
- [ ] 监控错误日志

## 回滚方案
如需回滚，执行: node rollback-orders.js

## 备份位置
- 本次备份目录: backups/deploy-2025-08-17T14-27-22-478Z
- 快速回滚备份: *.backup文件
