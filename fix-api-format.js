const fs = require('fs');
const path = require('path');

// 修复API文件格式的脚本
function fixApiFileFormat(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已经是export default格式
    if (content.includes('export default')) {
      console.log(`✅ ${filePath} 已经是正确格式`);
      return;
    }
    
    // 替换module.exports为export default
    if (content.includes('module.exports = async (req, res) => {')) {
      content = content.replace(
        'module.exports = async (req, res) => {',
        'export default async function handler(req, res) {'
      );
      content = content.replace(/};?\s*$/, '}');
      console.log(`🔧 修复 ${filePath}`);
    } else if (content.includes('module.exports = (req, res) => {')) {
      content = content.replace(
        'module.exports = (req, res) => {',
        'export default function handler(req, res) {'
      );
      content = content.replace(/};?\s*$/, '}');
      console.log(`🔧 修复 ${filePath}`);
    } else {
      console.log(`⚠️  ${filePath} 格式未知，跳过`);
      return;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filePath} 修复完成`);
    
  } catch (error) {
    console.error(`❌ 修复 ${filePath} 失败:`, error.message);
  }
}

// 获取所有API文件
const apiDir = path.join(__dirname, 'api');
const apiFiles = fs.readdirSync(apiDir)
  .filter(file => file.endsWith('.js'))
  .map(file => path.join(apiDir, file));

console.log('🔧 开始修复API文件格式...');
console.log(`📁 找到 ${apiFiles.length} 个API文件`);

// 修复所有API文件
apiFiles.forEach(fixApiFileFormat);

console.log('🎉 API文件格式修复完成！'); 