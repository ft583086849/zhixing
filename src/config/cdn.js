
// CDN配置
const cdnConfig = {
  // 静态资源CDN
  staticAssets: {
    baseUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.yourdomain.com',
    version: process.env.REACT_APP_ASSET_VERSION || '1.0.0',
    cacheControl: 'public, max-age=31536000' // 1年缓存
  },
  
  // 图片CDN
  images: {
    baseUrl: process.env.REACT_APP_IMAGE_CDN_URL || 'https://img.yourdomain.com',
    formats: ['webp', 'jpg', 'png'],
    quality: 85,
    resize: true
  },
  
  // API CDN
  api: {
    baseUrl: process.env.REACT_APP_API_CDN_URL || 'https://api.yourdomain.com',
    timeout: 10000,
    retry: 3
  }
};

// CDN工具函数
export const getCDNUrl = (path, type = 'static') => {
  const config = cdnConfig[type] || cdnConfig.staticAssets;
  return `${config.baseUrl}/${path}?v=${config.version}`;
};

export const getImageUrl = (path, width, height, format = 'webp') => {
  const config = cdnConfig.images;
  return `${config.baseUrl}/${path}?w=${width}&h=${height}&f=${format}&q=${config.quality}`;
};

export default cdnConfig;
