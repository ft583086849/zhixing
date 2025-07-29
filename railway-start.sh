#!/bin/bash

echo "🚀 Railway部署启动脚本"
echo "当前目录: $(pwd)"
echo "Node版本: $(node --version)"
echo "NPM版本: $(npm --version)"

# 安装根目录依赖
echo "📦 安装根目录依赖..."
npm install

# 安装服务器依赖
echo "📦 安装服务器依赖..."
cd server
npm install
cd ..

# 启动服务器
echo "🚀 启动服务器..."
cd server
npm start 