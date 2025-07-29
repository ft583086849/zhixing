# 支付管理系统

一个基于React + Node.js + MySQL的支付管理系统，支持销售生成收款链接，用户通过链接进行购买，管理员后台查看和管理订单数据。

## 功能特性

### 销售功能
- 创建收款信息（支付宝/线上地址码）
- 生成唯一收款链接
- 管理收款方式设置

### 用户功能
- 通过链接访问购买页面
- 选择购买时长（7天免费/1个月/3个月/6个月/终身）
- 填写TradingView用户名
- 上传付款截图
- 支持支付宝和线上地址码付款

### 管理员功能
- 查看所有订单数据
- 按条件筛选订单
- 导出订单数据
- 更新订单状态
- 查看统计信息

## 技术栈

### 后端
- Node.js + Express
- MySQL + Sequelize ORM
- JWT认证
- Multer文件上传
- bcrypt密码加密

### 前端
- React 18
- Ant Design UI组件库
- Redux Toolkit状态管理
- React Router路由
- Axios HTTP客户端

## 项目结构

```
payment-management-system/
├── server/                 # 后端代码
│   ├── config/            # 配置文件
│   ├── models/            # 数据模型
│   ├── routes/            # 路由文件
│   ├── middleware/        # 中间件
│   ├── uploads/           # 上传文件目录
│   └── index.js           # 服务器入口
├── client/                # 前端代码
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API服务
│   │   ├── store/         # Redux状态
│   │   └── utils/         # 工具函数
│   └── public/
└── package.json           # 根目录配置
```

## 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 安装依赖

```bash
# 安装所有依赖
npm run install-all

# 或者分别安装
npm install
cd server && npm install
cd ../client && npm install
```

### 数据库配置

1. 创建MySQL数据库
```sql
CREATE DATABASE payment_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 配置环境变量
```bash
cd server
cp .env.example .env
# 编辑.env文件，配置数据库连接信息
```

### 启动服务

```bash
# 开发模式（同时启动前后端）
npm run dev

# 或者分别启动
npm run server  # 启动后端服务
npm run client  # 启动前端服务
```

### 访问地址

- 前端应用：http://localhost:3000
- 后端API：http://localhost:5000
- 健康检查：http://localhost:5000/api/health

## API接口

### 认证接口
- `POST /api/auth/login` - 管理员登录
- `GET /api/auth/verify` - 验证token

### 销售接口
- `POST /api/sales/create` - 创建销售收款信息
- `GET /api/sales/link/:linkCode` - 获取销售信息
- `GET /api/sales/all` - 获取所有销售信息

### 订单接口
- `POST /api/orders/create` - 创建订单
- `GET /api/orders/list` - 获取订单列表

### 管理员接口
- `GET /api/admin/stats` - 获取统计信息
- `GET /api/admin/orders` - 获取订单列表
- `GET /api/admin/export` - 导出订单数据
- `PUT /api/admin/orders/:orderId/status` - 更新订单状态

## 默认账户

- 管理员用户名：admin
- 管理员密码：admin123

## 开发说明

### 数据库表结构

- `sales` - 销售表
- `links` - 链接表
- `orders` - 订单表
- `admins` - 管理员表

### 文件上传

- 支持格式：JPG、PNG、GIF
- 最大大小：5MB
- 存储路径：server/uploads/

### 安全特性

- JWT token认证
- 密码bcrypt加密
- 文件上传安全检查
- CORS跨域配置

## 部署说明

### 生产环境配置

1. 设置环境变量
```bash
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret
```

2. 构建前端
```bash
npm run build
```

3. 配置反向代理（Nginx）
4. 配置SSL证书
5. 设置数据库备份

## 许可证

MIT License

## 联系方式

如有问题，请联系开发团队。 