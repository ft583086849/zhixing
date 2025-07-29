#!/bin/bash

echo "🚀 支付管理系统生产环境部署脚本"
echo "=================================="

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node_version=$(node --version)
echo "当前Node.js版本: $node_version"

# 检查npm版本
npm_version=$(npm --version)
echo "当前npm版本: $npm_version"

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# 安装依赖
echo "📦 安装后端依赖..."
cd server
npm install --production

echo "📦 安装前端依赖..."
cd ../client
npm install --production

# 构建前端
echo "🔨 构建前端应用..."
npm run build

# 返回根目录
cd ..

# 复制环境配置文件
echo "⚙️  配置环境变量..."
if [ ! -f "server/.env" ]; then
    cp server/env.production server/.env
    echo "✅ 已创建生产环境配置文件"
    echo "⚠️  请编辑 server/.env 文件，配置正确的生产环境参数"
else
    echo "✅ 环境配置文件已存在"
fi

# 数据库迁移
echo "🗄️  数据库迁移..."
cd server
if [ -f "scripts/migrate.js" ]; then
    node scripts/migrate.js
    echo "✅ 数据库迁移完成"
else
    echo "⚠️  数据库迁移脚本不存在"
fi

cd ..

# 设置文件权限
echo "🔐 设置文件权限..."
chmod 755 deploy-production.sh
chmod 755 start.sh
chmod -R 755 server/uploads
chmod -R 755 logs

# 创建PM2配置文件
echo "📋 创建PM2配置文件..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'payment-management-server',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# 创建nginx配置文件示例
echo "🌐 创建Nginx配置示例..."
cat > nginx.conf.example << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 前端静态文件
    location / {
        root /path/to/your/project/client/build;
        try_files \$uri \$uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 文件上传
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 创建监控脚本
echo "📊 创建监控脚本..."
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "📊 支付管理系统监控脚本"
echo "========================"

# 检查服务状态
echo "🔍 检查服务状态..."
if pgrep -f "payment-management-server" > /dev/null; then
    echo "✅ 后端服务运行中"
else
    echo "❌ 后端服务未运行"
fi

# 检查端口
echo "🔌 检查端口状态..."
if netstat -tuln | grep ":5000 " > /dev/null; then
    echo "✅ 端口5000正在监听"
else
    echo "❌ 端口5000未监听"
fi

# 检查磁盘空间
echo "💾 检查磁盘空间..."
df -h | grep -E "(Filesystem|/dev/)"

# 检查内存使用
echo "🧠 检查内存使用..."
free -h

# 检查日志文件大小
echo "📝 检查日志文件..."
if [ -d "logs" ]; then
    ls -lh logs/
else
    echo "⚠️  logs目录不存在"
fi

# 检查数据库连接
echo "🗄️  检查数据库连接..."
curl -s http://localhost:5000/api/health | jq . 2>/dev/null || echo "❌ 无法连接到API"
EOF

chmod +x monitor.sh

# 创建备份脚本
echo "💾 创建备份脚本..."
cat > backup.sh << 'EOF'
#!/bin/bash

echo "💾 支付管理系统备份脚本"
echo "========================"

# 创建备份目录
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 创建备份目录: $BACKUP_DIR"

# 备份数据库
echo "🗄️  备份数据库..."
if [ -f "server/database.sqlite" ]; then
    cp server/database.sqlite "$BACKUP_DIR/"
    echo "✅ 数据库备份完成"
else
    echo "⚠️  数据库文件不存在"
fi

# 备份上传文件
echo "📁 备份上传文件..."
if [ -d "server/uploads" ]; then
    cp -r server/uploads "$BACKUP_DIR/"
    echo "✅ 上传文件备份完成"
else
    echo "⚠️  上传目录不存在"
fi

# 备份配置文件
echo "⚙️  备份配置文件..."
cp server/.env "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  环境配置文件不存在"
cp ecosystem.config.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  PM2配置文件不存在"

# 压缩备份
echo "🗜️  压缩备份文件..."
cd backups
tar -czf "$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"
rm -rf "$(basename $BACKUP_DIR)"
echo "✅ 备份压缩完成: $(basename $BACKUP_DIR).tar.gz"

cd ..

echo "🎉 备份完成！"
echo "备份文件位置: backups/$(basename $BACKUP_DIR).tar.gz"
EOF

chmod +x backup.sh

# 创建启动脚本
echo "▶️  创建启动脚本..."
cat > start-production.sh << 'EOF'
#!/bin/bash

echo "🚀 启动支付管理系统生产环境"
echo "============================"

# 检查环境配置
if [ ! -f "server/.env" ]; then
    echo "❌ 环境配置文件不存在，请先运行部署脚本"
    exit 1
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 启动服务
echo "▶️  启动服务..."
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

echo "✅ 服务启动完成！"
echo "📊 查看服务状态: pm2 status"
echo "📝 查看日志: pm2 logs"
echo "🛑 停止服务: pm2 stop payment-management-server"
echo "🔄 重启服务: pm2 restart payment-management-server"
EOF

chmod +x start-production.sh

echo "🎉 生产环境部署脚本创建完成！"
echo ""
echo "📋 下一步操作："
echo "1. 编辑 server/.env 文件，配置生产环境参数"
echo "2. 配置域名和SSL证书"
echo "3. 运行 ./start-production.sh 启动服务"
echo "4. 配置Nginx反向代理（参考 nginx.conf.example）"
echo "5. 设置定时备份（crontab -e 添加: 0 2 * * * /path/to/backup.sh）"
echo ""
echo "🔧 常用命令："
echo "- 查看服务状态: pm2 status"
echo "- 查看日志: pm2 logs"
echo "- 重启服务: pm2 restart payment-management-server"
echo "- 监控系统: ./monitor.sh"
echo "- 备份数据: ./backup.sh" 