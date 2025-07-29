const express = require('express');
const advancedCache = require('./config/advancedCache');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection, sequelize } = require('./config/database');
const { syncDatabase, initDefaultAdmin } = require('./models');
const { authenticateAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// 安全中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 压缩中间件
app.use(compression());

// 速率限制配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 中间件配置

// CORS安全配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com', // 生产环境域名
      'https://www.yourdomain.com'
    ];
    
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24小时
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由配置
const isTestMode = process.env.NODE_ENV === 'test' || process.argv.includes('--test');

if (isTestMode) {
  // 测试模式：使用模拟路由
  app.use('/api', require('./routes/test'));
} else {
  // 正常模式：使用真实路由
  app.use('/api/sales', require('./routes/sales'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/admin', authenticateAdmin, require('./routes/admin'));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/lifetime-limit', require('./routes/lifetimeLimit'));
  app.use('/api', require('./routes/paymentConfig'));
}

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '知行财库服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '未知错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
const startServer = async () => {
  // 先启动服务器，确保健康检查可用
  const server = app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  });

  // 异步初始化数据库，不阻塞服务器启动
  try {
    // 检查是否为测试模式
    const isTestMode = process.env.NODE_ENV === 'test' || process.argv.includes('--test');
    
    if (!isTestMode) {
      console.log('🔄 正在初始化数据库...');
      
      // 测试数据库连接
      await testConnection();
      
      // 同步数据库表结构
      await syncDatabase();
      
      // 初始化默认管理员账户
      await initDefaultAdmin();
      
      console.log('✅ 数据库初始化完成');
    } else {
      console.log('⚠️  运行在测试模式，跳过数据库连接');
    }
  } catch (error) {
    console.error('⚠️  数据库初始化失败，但服务器继续运行:', error);
    console.log('💡 提示：某些功能可能不可用，但健康检查仍然正常');
  }
};

startServer(); 