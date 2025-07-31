// 测试multer配置
const multer = require('multer');

// 简单的multer配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
}).single('screenshot');

module.exports = async (req, res) => {
  console.log('=== Multer测试开始 ===');
  console.log('请求方法:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    upload(req, res, (err) => {
      if (err) {
        console.error('Multer错误:', err);
        return res.status(400).json({
          success: false,
          message: '文件上传错误',
          error: err.message
        });
      }

      console.log('请求体:', req.body);
      console.log('文件:', req.file);
      
      res.json({
        success: true,
        message: 'Multer测试成功',
        body: req.body,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      });
    });
  } else {
    res.json({
      success: true,
      message: 'Multer测试API运行正常',
      method: req.method
    });
  }
}; 