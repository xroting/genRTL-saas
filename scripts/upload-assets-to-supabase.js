/**
 * 自动上传public/figma-designs到Supabase Storage
 * 
 * 使用方法：
 * 1. 确保已设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
 * 2. 运行: node scripts/upload-assets-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量获取配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aeikybbxoognqgvlgnhb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.error('请在 .env 文件中设置或通过命令行传入');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 配置
const BUCKET_NAME = 'assets';
const LOCAL_DIR = path.join(__dirname, '..', 'public', 'figma-designs');
const UPLOAD_PREFIX = 'figma-designs';

// 统计信息
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
};

/**
 * 创建 bucket（如果不存在）
 */
async function ensureBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`📦 创建 bucket: ${BUCKET_NAME}`);
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 104857600, // 100MB
      });
      
      if (error) throw error;
      console.log(`✅ Bucket创建成功`);
    } else {
      console.log(`✅ Bucket已存在: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.error('❌ 创建bucket失败:', error.message);
    throw error;
  }
}

/**
 * 递归获取目录中的所有文件
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      // 跳过 .ps1 脚本文件
      if (!file.endsWith('.ps1')) {
        fileList.push(filePath);
      } else {
        stats.skipped++;
      }
    }
  });
  
  return fileList;
}

/**
 * 上传单个文件到 Supabase
 */
async function uploadFile(localPath) {
  try {
    // 生成远程路径
    const relativePath = path.relative(LOCAL_DIR, localPath);
    const remotePath = path.join(UPLOAD_PREFIX, relativePath).replace(/\\/g, '/');
    
    // 读取文件
    const fileBuffer = fs.readFileSync(localPath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
    
    // 确定 content-type
    const ext = path.extname(localPath).toLowerCase();
    const contentTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    console.log(`📤 上传: ${remotePath} (${fileSize} MB)`);
    
    // 上传文件
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(remotePath, fileBuffer, {
        contentType,
        upsert: true, // 覆盖已存在的文件
      });
    
    if (error) {
      console.error(`  ❌ 失败: ${error.message}`);
      stats.failed++;
      return false;
    }
    
    console.log(`  ✅ 成功`);
    stats.success++;
    return true;
    
  } catch (error) {
    console.error(`  ❌ 异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 批量上传文件
 */
async function uploadAllFiles() {
  console.log(`\n🔍 扫描目录: ${LOCAL_DIR}\n`);
  
  // 获取所有文件
  const files = getAllFiles(LOCAL_DIR);
  stats.total = files.length;
  
  console.log(`📊 找到 ${stats.total} 个文件 (跳过 ${stats.skipped} 个脚本文件)\n`);
  
  // 按大小排序，先上传小文件
  files.sort((a, b) => {
    const sizeA = fs.statSync(a).size;
    const sizeB = fs.statSync(b).size;
    return sizeA - sizeB;
  });
  
  // 上传文件（控制并发数）
  const CONCURRENCY = 5;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(file => uploadFile(file)));
    
    // 显示进度
    const progress = Math.min(i + CONCURRENCY, files.length);
    const percent = ((progress / files.length) * 100).toFixed(1);
    console.log(`\n📊 进度: ${progress}/${files.length} (${percent}%)\n`);
  }
}

/**
 * 验证上传结果
 */
async function verifyUpload() {
  console.log('\n🔍 验证上传结果...\n');
  
  const testFiles = [
    'figma-designs/portrait/IMAGE-1.jpg',
    'figma-designs/artistic/IMAGE-1.png',
    'figma-designs/monna_logo.png',
  ];
  
  for (const file of testFiles) {
    try {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file);
      
      console.log(`✅ ${file}`);
      console.log(`   URL: ${data.publicUrl}`);
    } catch (error) {
      console.log(`❌ ${file}: ${error.message}`);
    }
  }
  
  console.log('\n📝 更新移动端配置:');
  console.log(`\n// mobile-app/config/api.ts`);
  console.log(`export const API_CONFIG = {`);
  console.log(`  BASE_URL: '${SUPABASE_URL.replace('/storage/v1', '')}',`);
  console.log(`  ASSETS_URL: '${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}',`);
  console.log(`  TIMEOUT: 30000,`);
  console.log(`};\n`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始上传资源到 Supabase Storage\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`📁 本地目录: ${LOCAL_DIR}\n`);
  
  try {
    // 1. 确保 bucket 存在
    await ensureBucket();
    
    // 2. 上传所有文件
    await uploadAllFiles();
    
    // 3. 显示统计
    console.log('\n' + '='.repeat(50));
    console.log('📊 上传完成统计');
    console.log('='.repeat(50));
    console.log(`总计: ${stats.total}`);
    console.log(`成功: ${stats.success} ✅`);
    console.log(`失败: ${stats.failed} ❌`);
    console.log(`跳过: ${stats.skipped} ⏭️`);
    console.log(`成功率: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(50) + '\n');
    
    // 4. 验证上传
    await verifyUpload();
    
    console.log('\n✅ 所有操作完成！\n');
    
  } catch (error) {
    console.error('\n❌ 上传过程出错:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadAllFiles, ensureBucket };

