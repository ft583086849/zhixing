
// 图片优化配置
const imageOptimization = {
  // 支持的图片格式
  formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  
  // 压缩质量设置
  quality: {
    jpg: 85,
    png: 90,
    webp: 80
  },
  
  // 尺寸优化
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 }
  },
  
  // 懒加载配置
  lazyLoading: {
    threshold: 0.1,
    rootMargin: '50px'
  }
};

export default imageOptimization;
