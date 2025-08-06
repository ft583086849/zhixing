// 简单测试API
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API工作正常',
    time: new Date().toISOString(),
    method: req.method 
  });
}