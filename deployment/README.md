# 支付管理系统部署指南

## 📋 前置要求

### 1. 安装必要的软件

#### Node.js (版本 18+)
```bash
# macOS (使用Homebrew)
brew install node

# Windows
# 下载并安装：https://nodejs.org/

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### MySQL (版本 8.0+)
```bash
# macOS (使用Homebrew)
brew install mysql

# Windows
# 下载并安装：https://dev.mysql.com/downloads/mysql/

# Linux (Ubuntu/Debian)
sudo apt-get install mysql-server
```

#### Git
```bash
# macOS
brew install git

# Windows
# 下载并安装：https://git-scm.com/

# Linux
sudo apt-get install git
```

### 2. 启动MySQL服务
```bash
# macOS
brew services start mysql

# Windows
# MySQL服务应该已经自动启动

# Linux
sudo systemctl start mysql
```

## 🚀 快速部署

### 方法一：使用自动化脚本（推荐）

1. **克隆项目**
```bash
git clone <项目地址>
cd payment-management-system
```

2. **运行部署脚本**
```bash
npm run deploy
```

3. **配置数据库**
编辑 `server/.env` 文件，修改数据库连接信息：
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=payment_system_prod
DB_USER=root
DB_PASSWORD=your_mysql_password
```

4. **启动服务**
```bash
npm run start
```

### 方法二：手动部署

1. **安装依赖**
```bash
npm run install-all
```

2. **创建数据库**
```sql
CREATE DATABASE payment_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **配置环境**
```bash
cp server/env.production.example server/.env
# 编辑 server/.env 文件
```

4. **运行数据库迁移**
```bash
npm run migrate
```

5. **启动服务**
```bash
npm run dev
```

## 🌐 访问系统

- **前端地址**：http://localhost:3000
- **后端地址**：http://localhost:5000
- **健康检查**：http://localhost:5000/api/health

## 🔑 默认账户

- **管理员用户名**：知行
- **管理员密码**：Zhixing Universal Trading Signal

## 📁 项目结构

```
payment-management-system/
├── client/                 # 前端代码
├── server/                 # 后端代码
├── test/                   # 测试文件
├── deployment/             # 部署相关文件
├── deploy.sh              # 部署脚本
├── start.sh               # 启动脚本
└── package.json           # 项目配置
```

## 🔧 常用命令

```bash
# 安装所有依赖
npm run install-all

# 开发模式启动
npm run dev

# 部署系统
npm run deploy

# 启动服务
npm run start

# 运行测试
npm run test

# 数据库迁移
npm run migrate

# 构建前端
npm run build
```

## 🐛 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000
lsof -i :5000

# 杀死进程
kill -9 <进程ID>
```

### 2. 数据库连接失败
- 检查MySQL服务是否启动
- 检查数据库连接信息是否正确
- 检查数据库用户权限

### 3. 权限问题
```bash
# 给脚本执行权限
chmod +x deploy.sh
chmod +x start.sh
```

### 4. 依赖安装失败
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules
rm -rf server/node_modules
rm -rf client/node_modules
npm run install-all
```

## 📞 技术支持

如果遇到问题，请检查：
1. Node.js版本是否为18+
2. MySQL版本是否为8.0+
3. 数据库连接信息是否正确
4. 端口3000和5000是否被占用

## 🔒 安全建议

1. **修改默认密码**
   - 部署后立即修改管理员密码
   - 使用强密码策略

2. **配置防火墙**
   - 只开放必要的端口
   - 限制数据库访问

3. **定期备份**
   - 备份数据库
   - 备份上传文件

4. **更新依赖**
   - 定期更新npm包
   - 修复安全漏洞 