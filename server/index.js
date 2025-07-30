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

// 健康检查接口（带数据库连接测试）
app.get('/api/health', async (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: '知行财库服务运行正常',
    timestamp: new Date().toISOString(),
    port: PORT,
    database: {
      connected: false,
      error: null
    }
  };
  
  // 测试数据库连接
  try {
    await sequelize.authenticate();
    healthStatus.database.connected = true;
    healthStatus.database.message = '数据库连接正常';
  } catch (error) {
    console.error('健康检查 - 数据库连接失败:', error.message);
    healthStatus.database.connected = false;
    healthStatus.database.error = error.message;
    healthStatus.status = 'WARNING';
    healthStatus.message = '服务运行但数据库连接异常';
  }
  
  res.json(healthStatus);
});

// 环境变量调试接口
app.get('/api/debug-env', (req, res) => {
  // 安全地显示环境变量状态（不显示真实值）
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    database_vars: {
      DB_HOST: process.env.DB_HOST ? `设置(${process.env.DB_HOST?.length}字符)` : '未设置',
      DB_USER: process.env.DB_USER ? `设置(${process.env.DB_USER?.length}字符)` : '未设置',
      DB_PASSWORD: process.env.DB_PASSWORD ? `设置(${process.env.DB_PASSWORD?.length}字符)` : '未设置', 
      DB_NAME: process.env.DB_NAME ? `设置(${process.env.DB_NAME?.length}字符)` : '未设置'
    },
    legacy_vars: {
      DATABASE_HOST: process.env.DATABASE_HOST ? `设置(${process.env.DATABASE_HOST?.length}字符)` : '未设置',
      DATABASE_USERNAME: process.env.DATABASE_USERNAME ? `设置(${process.env.DATABASE_USERNAME?.length}字符)` : '未设置', 
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? `设置(${process.env.DATABASE_PASSWORD?.length}字符)` : '未设置',
      DATABASE_NAME: process.env.DATABASE_NAME ? `设置(${process.env.DATABASE_NAME?.length}字符)` : '未设置'
    },
    computed: {
      hasDbConfig: !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME),
      isProduction: process.env.NODE_ENV === 'production',
      currentSystem: '统一使用 DB_* 变量（server端）'
    }
  };
  
  res.json(envStatus);
});

// 根路径健康检查（备用）
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '知行财库API服务',
    timestamp: new Date().toISOString(),
    health: '/api/health'
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
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📊 健康检查: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🌐 Railway环境: 监听所有网络接口`);
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