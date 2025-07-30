# 🔧 Vercel 额外环境变量配置

## 🚨 **问题原因**
项目有两套数据库连接系统，需要两套环境变量：

### 已配置 ✅
- `DB_HOST`
- `DB_USER` 
- `DB_PASSWORD`
- `DB_NAME`

### 需要添加 ❌
- `DATABASE_HOST`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`  
- `DATABASE_NAME`

## 📝 **添加步骤**

在Vercel控制台添加以下4个环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_HOST` | `aws.connect.psdb.cloud` | 与DB_HOST相同 |
| `DATABASE_USERNAME` | `pmi6zditk1nyr20nprfx` | 与DB_USER相同 |
| `DATABASE_PASSWORD` | `pscale_pw_7T2YMNgLXv...` | 与DB_PASSWORD相同 |
| `DATABASE_NAME` | `zhixing` | 与DB_NAME相同 |

## ⚡ **快速配置**
复制现有变量值，创建对应的 `DATABASE_*` 版本即可。

---
**目标**: 让API层也能连接PlanetScale数据库 