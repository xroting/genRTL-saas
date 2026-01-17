// 下载 Figma 设计稿图片到本地的脚本
const https = require('https');
const fs = require('fs');
const path = require('path');

// 确保目录存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 下载图片
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ 已下载: ${filepath}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // 删除失败的文件
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    // 读取设计稿数据
    const designData = JSON.parse(fs.readFileSync('figma-design-data.json', 'utf8'));
    
    console.log('📥 开始下载 Figma 设计稿图片...');
    
    // 确保目录存在
    ensureDirectoryExists('public/figma-designs');
    ensureDirectoryExists('public/templates');
    
    for (const component of designData.components) {
      if (component.imageUrl) {
        // 生成文件名
        const fileName = component.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') + '.png';
        
        const filepath = path.join('public/figma-designs', fileName);
        
        console.log(`📡 正在下载: ${component.name} -> ${fileName}`);
        await downloadImage(component.imageUrl, filepath);
        
        // 同时复制到 templates 目录
        const templatePath = path.join('public/templates', fileName);
        fs.copyFileSync(filepath, templatePath);
        console.log(`📋 已复制到模板目录: ${templatePath}`);
      }
    }
    
    // 更新设计稿数据，添加本地文件路径
    const updatedData = {
      ...designData,
      components: designData.components.map(comp => ({
        ...comp,
        localImagePath: comp.imageUrl ? `/figma-designs/${comp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.png` : null
      }))
    };
    
    fs.writeFileSync('figma-design-data-local.json', JSON.stringify(updatedData, null, 2));
    console.log('\\n💾 更新的设计稿数据已保存到 figma-design-data-local.json');
    console.log('🎉 所有图片下载完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();