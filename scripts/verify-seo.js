#!/usr/bin/env node

/**
 * SEO 验证脚本
 * 用于验证 SEO 优化是否正确实施
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证 SEO 实施...\n');

let errors = 0;
let warnings = 0;
let success = 0;

// 检查必需文件是否存在
const requiredFiles = [
  'lib/seo/config.ts',
  'lib/seo/structured-data.ts',
  'app/sitemap.ts',
  'app/robots.ts',
  'components/seo/structured-data.tsx',
];

console.log('📁 检查必需文件...');
requiredFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
    success++;
  } else {
    console.log(`  ❌ 缺失: ${file}`);
    errors++;
  }
});

// 检查 next.config.ts 中的重定向配置
console.log('\n🔄 检查域名重定向配置...');
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf-8');
  if (content.includes('async redirects()')) {
    console.log('  ✅ 重定向配置已设置');
    success++;
  } else {
    console.log('  ⚠️  未找到重定向配置');
    warnings++;
  }

  if (content.includes('async headers()')) {
    console.log('  ✅ 安全头部已配置');
    success++;
  } else {
    console.log('  ❌ 安全头部未配置');
    errors++;
  }
} else {
  console.log('  ❌ next.config.ts 不存在');
  errors++;
}

// 检查主要页面的元数据
console.log('\n📄 检查页面元数据...');
const pagesWithMetadata = [
  'app/layout.tsx',
  'app/generate/layout.tsx',
  'app/(dashboard)/pricing/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/(login)/sign-in/page.tsx',
  'app/(login)/sign-up/page.tsx',
];

pagesWithMetadata.forEach((page) => {
  const pagePath = path.join(process.cwd(), page);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf-8');
    if (content.includes('export const metadata')) {
      console.log(`  ✅ ${page}`);
      success++;
    } else {
      console.log(`  ⚠️  ${page} - 缺少 metadata export`);
      warnings++;
    }
  } else {
    console.log(`  ⚠️  ${page} - 文件不存在`);
    warnings++;
  }
});

// 检查结构化数据实现
console.log('\n🏗️  检查结构化数据...');
const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const content = fs.readFileSync(layoutPath, 'utf-8');

  const checks = [
    { name: 'Organization Schema', pattern: 'getOrganizationSchema' },
    { name: 'WebSite Schema', pattern: 'getWebSiteSchema' },
    { name: 'SoftwareApplication Schema', pattern: 'getSoftwareApplicationSchema' },
    { name: 'JSON-LD Script', pattern: 'application/ld+json' },
  ];

  checks.forEach((check) => {
    if (content.includes(check.pattern)) {
      console.log(`  ✅ ${check.name}`);
      success++;
    } else {
      console.log(`  ❌ ${check.name} 未找到`);
      errors++;
    }
  });
} else {
  console.log('  ❌ app/layout.tsx 不存在');
  errors++;
}

// 检查 SEO 配置
console.log('\n⚙️  检查 SEO 配置...');
const configPath = path.join(process.cwd(), 'lib/seo/config.ts');
if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, 'utf-8');

  const checks = [
    { name: 'SITE_CONFIG', pattern: 'export const SITE_CONFIG' },
    { name: 'DEFAULT_SEO_ZH', pattern: 'export const DEFAULT_SEO_ZH' },
    { name: 'DEFAULT_SEO_EN', pattern: 'export const DEFAULT_SEO_EN' },
    { name: 'getCanonicalUrl 函数', pattern: 'export function getCanonicalUrl' },
    { name: 'getHreflangLinks 函数', pattern: 'export function getHreflangLinks' },
  ];

  checks.forEach((check) => {
    if (content.includes(check.pattern)) {
      console.log(`  ✅ ${check.name}`);
      success++;
    } else {
      console.log(`  ❌ ${check.name} 未找到`);
      errors++;
    }
  });
} else {
  console.log('  ❌ lib/seo/config.ts 不存在');
  errors++;
}

// 总结
console.log('\n' + '='.repeat(50));
console.log('📊 验证总结:');
console.log(`  ✅ 成功: ${success}`);
console.log(`  ⚠️  警告: ${warnings}`);
console.log(`  ❌ 错误: ${errors}`);
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('\n🎉 恭喜! 所有 SEO 优化都已正确实施!');
  console.log('\n📋 下一步:');
  console.log('  1. 在 Google Search Console 验证域名');
  console.log('  2. 提交 sitemap: https://www.monna.us/sitemap.xml');
  console.log('  3. 使用 PageSpeed Insights 测试性能');
  console.log('  4. 使用 Rich Results Test 验证结构化数据');
  console.log('\n详细文档: CHANGELOG.md (2025-11-02 - SEO 优化完整实施)');
} else if (errors === 0) {
  console.log('\n✅ SEO 基础优化已完成，但有一些警告需要注意。');
  console.log('查看上面的警告信息并根据需要修复。');
} else {
  console.log('\n❌ 发现错误，请修复后重新运行验证。');
  process.exit(1);
}

console.log('');
