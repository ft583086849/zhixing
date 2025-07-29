# 🚨 安全事件响应：PlanetScale密码泄露

## 📋 **事件概述**
- **时间**: 2025-07-30
- **问题**: PlanetScale数据库密码被意外提交到git历史
- **影响**: 数据库访问凭据可能被泄露
- **状态**: 🔄 处理中

## 🎯 **立即响应行动**

### 1. **轮换PlanetScale密码** (最高优先级)
```bash
# 在PlanetScale控制台执行:
1. 登录 app.planetscale.com
2. 选择数据库 "zhixing-treasury"
3. 点击 "Settings" → "Passwords"  
4. 删除旧密码: pscale_pw_7T2YMNgLXv... (已泄露)
5. 创建新密码
6. 记录新的连接信息
```

### 2. **Git历史清理方案**

#### 方案A: 重写Git历史 (推荐)
```bash
# 安装git-filter-repo (如果未安装)
pip install git-filter-repo

# 删除包含敏感信息的文件
git filter-repo --path DEPLOYMENT_COMPLETE_GUIDE.md --invert-paths
git filter-repo --path planetscale-config/deployment-status.md --invert-paths

# 强制推送清理后的历史
git push origin main --force
```

#### 方案B: 重置到安全提交点
```bash
# 重置到origin/main (457473c)
git reset --hard 457473c
git push origin main --force

# 重新应用安全的修改
```

## ⚙️ **重新配置步骤**

### 1. PlanetScale新密码配置
- 获取新的连接信息
- 在Vercel环境变量中更新
- 测试数据库连接

### 2. 代码安全检查
- 确认代码中无硬编码密码
- 验证环境变量配置
- 运行安全扫描

## 📊 **预防措施**

1. **代码审查**: 提交前检查敏感信息
2. **环境分离**: 敏感信息只存储在环境变量
3. **密码轮换**: 定期更换数据库密码
4. **监控告警**: 配置异常访问监控

## ✅ **验证清单**

- [ ] PlanetScale旧密码已失效
- [ ] 新密码已生成并记录
- [ ] Git历史已清理
- [ ] Vercel环境变量已更新
- [ ] 数据库连接测试通过
- [ ] 应用功能正常

---
**状态**: 等待执行密码轮换和git历史清理 