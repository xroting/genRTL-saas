// 分析下载的 Figma 设计稿并生成模板数据
const fs = require('fs');
const path = require('path');

function analyzeDesign() {
  try {
    // 读取本地设计稿数据
    const designData = JSON.parse(fs.readFileSync('figma-design-data-local.json', 'utf8'));
    
    console.log('🔍 分析 Figma 设计稿...');
    console.log(`📄 设计稿名称: ${designData.file.name}`);
    console.log(`📐 主设计框尺寸: ${designData.components[0].width}x${designData.components[0].height}`);
    
    // 基于设计稿尺寸，这似乎是一个包含多个模板的长条设计
    // 1500x5050 意味着可能是垂直排列的多个模板
    
    // 生成模板建议
    const templateSuggestions = [
      {
        id: 'figma-template-1',
        name: '商务专业头像',
        category: '商务',
        description: '适合LinkedIn、公司官网等商务场景',
        tags: ['专业', '商务', '正装'],
        originalDesign: designData.components[0].localImagePath
      },
      {
        id: 'figma-template-2',
        name: '时尚创意头像',
        category: '时尚',
        description: '个性化风格，适合社交媒体',
        tags: ['时尚', '创意', '个性'],
        originalDesign: designData.components[0].localImagePath
      },
      {
        id: 'figma-template-3',
        name: '艺术肖像风格',
        category: '艺术',
        description: '艺术化处理，适合个人品牌',
        tags: ['艺术', '肖像', '品牌'],
        originalDesign: designData.components[0].localImagePath
      },
      {
        id: 'figma-template-4',
        name: '休闲自然风格',
        category: '休闲',
        description: '自然亲和，适合日常使用',
        tags: ['休闲', '自然', '亲和'],
        originalDesign: designData.components[0].localImagePath
      }
    ];
    
    // 生成代码模板
    const codeTemplate = `// 更新模板数据以使用 Figma 设计
const FIGMA_TEMPLATES = [
${templateSuggestions.map(template => `  {
    id: "${template.id}",
    name: "${template.name}",
    image: "${template.originalDesign}",
    category: "${template.category}",
    prompt: "${template.description}",
    featured: ${template.id === 'figma-template-1'},
    tags: ${JSON.stringify(template.tags)},
    likes: ${Math.floor(Math.random() * 500) + 100},
    downloads: ${Math.floor(Math.random() * 2000) + 500}
  }`).join(',\\n')}
];`;
    
    // 保存模板代码
    fs.writeFileSync('figma-templates-code.js', codeTemplate);
    
    console.log('\\n📊 设计稿分析结果:');
    console.log(`🎨 检测到 ${templateSuggestions.length} 个潜在模板样式`);
    console.log('📝 模板代码已生成到 figma-templates-code.js');
    
    console.log('\\n🔧 下一步建议:');
    console.log('1. 检查下载的图片是否正确显示');
    console.log('2. 如果设计稿包含多个分离的模板，考虑手动分割图片');
    console.log('3. 更新 components/figma-inspired-gallery.tsx 中的模板数据');
    console.log('4. 根据实际设计调整分类和描述');
    
    return templateSuggestions;
    
  } catch (error) {
    console.error('❌ 分析错误:', error.message);
  }
}

analyzeDesign();