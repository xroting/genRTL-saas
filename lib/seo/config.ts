/**
 * SEO Configuration for genRTL
 * 包含所有SEO相关的配置，包括域名、元数据、结构化数据等
 */

// 首选域名配置 (根据 SEO_optimism.md 建议使用 www 版本)
export const SITE_CONFIG = {
  // 首选域名 (canonical domain)
  domain: 'www.monna.us',
  url: 'https://www.monna.us',

  // 品牌信息
  name: 'genRTL',
  alternateName: 'Monna',

  // 联系方式
  email: 'support@monna.us',

  // 社交媒体链接 (用于 Organization schema 的 sameAs)
  socialLinks: [
    // 根据实际情况添加
    // 'https://twitter.com/monnaai',
    // 'https://facebook.com/monnaai',
    // 'https://linkedin.com/company/monnaai',
  ],

  // 应用商店链接
  appStoreLinks: [
    // 'https://apps.apple.com/app/monna-ai',
    // 'https://play.google.com/store/apps/details?id=com.monna.ai',
  ],
} as const;

// 默认SEO元数据 (中文)
export const DEFAULT_SEO_ZH = {
  title: 'genRTL - 智能Verilog/SystemVerilog代码生成平台',
  description:
    'genRTL是一款智能硬件设计代码生成平台，通过自然语言描述自动生成高质量的Verilog/SystemVerilog代码，支持多种验证工具和CBB组件复用。',
  keywords:
    'Verilog生成, SystemVerilog, RTL设计, 硬件描述语言, AI代码生成, HDL自动化, 硬件设计工具, FPGA开发',
} as const;

// 默认SEO元数据 (英文)
export const DEFAULT_SEO_EN = {
  title: 'genRTL - Intelligent Verilog/SystemVerilog Code Generator',
  description:
    'genRTL is an intelligent hardware design code generation platform that automatically generates high-quality Verilog/SystemVerilog code from natural language descriptions, supporting multiple verification tools and CBB component reuse.',
  keywords:
    'Verilog generator, SystemVerilog, RTL design, HDL, AI code generation, hardware design automation, FPGA development',
} as const;


// 页面特定的SEO配置
export const PAGE_SEO = {
  home: {
    zh: {
      title: 'genRTL - 智能Verilog/SystemVerilog代码生成平台',
      description: 'genRTL提供专业的硬件设计代码生成服务，支持多种AI模型。无需专业技能，轻松创建高质量的Verilog/SystemVerilog代码。',
    },
    en: {
      title: 'genRTL - Intelligent Verilog/SystemVerilog Code Generator',
      description: 'genRTL offers professional hardware design code generation services with multiple AI models. Create high-quality Verilog/SystemVerilog code easily without extensive expertise.',
    },
  },

  generate: {
    zh: {
      title: 'RTL代码生成中心 - genRTL',
      description: '使用genRTL的代码生成中心，通过GPT-4o、Claude Sonnet等AI模型生成专业的Verilog/SystemVerilog代码。支持Plan、Implement、Repair等多种功能。',
    },
    en: {
      title: 'RTL Code Generation Studio - genRTL',
      description: 'Use genRTL Code Generation Studio to generate professional Verilog/SystemVerilog code with GPT-4o, Claude Sonnet. Supports Plan, Implement, Repair and more.',
    },
  },

  pricing: {
    zh: {
      title: '定价方案 - genRTL',
      description: '查看genRTL的定价方案，选择适合您的套餐。提供免费试用和多种付费方案，满足个人和企业用户的不同需求。',
    },
    en: {
      title: 'Pricing Plans - genRTL',
      description: 'View genRTL pricing plans and choose the right package for you. Free trial and multiple paid plans available for individuals and businesses.',
    },
  },
} as const;

/**
 * 生成 canonical URL
 * @param path - 页面路径 (如 '/generate', '/pricing')
 * @param locale - 语言代码 (如 'zh', 'en')
 */
export function getCanonicalUrl(path: string = '', locale?: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const localePath = locale && locale !== 'zh' ? `/${locale}` : '';
  return `${SITE_CONFIG.url}${localePath}${cleanPath}`;
}

/**
 * 生成 hreflang 标签数据
 * @param path - 页面路径
 */
export function getHreflangLinks(path: string = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return [
    // 中文版本
    {
      hreflang: 'zh-CN',
      href: `${SITE_CONFIG.url}${cleanPath}`,
    },
    // 英文版本
    {
      hreflang: 'en-US',
      href: `${SITE_CONFIG.url}/en${cleanPath}`,
    },
    // x-default (默认语言选择页或自动检测)
    {
      hreflang: 'x-default',
      href: `${SITE_CONFIG.url}${cleanPath}`,
    },
  ];
}

/**
 * 获取页面元数据
 * @param page - 页面标识 ('home', 'generate', 'pricing' 等)
 * @param locale - 语言代码
 */
export function getPageMetadata(page: keyof typeof PAGE_SEO, locale: 'zh' | 'en' = 'zh') {
  return PAGE_SEO[page]?.[locale] || (locale === 'zh' ? DEFAULT_SEO_ZH : DEFAULT_SEO_EN);
}
