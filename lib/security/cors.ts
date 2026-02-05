/**
 * CORS 安全配置
 * 限制允许的源域名,防止未授权访问
 */

/**
 * 允许的源域名列表
 * 包括生产域名、预览域名和本地开发
 */
const ALLOWED_ORIGINS = [
  // 生产域名
  'https://www.monna.us',
  'https://monna.us',
  'https://www.genrtl.com',
  'https://genrtl.com',
  
  // Vercel 预览部署域名模式
  /^https:\/\/.*\.vercel\.app$/,
  
  // 本地开发环境
  'http://localhost:3000',
  'http://localhost:3005',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3005',
];

/**
 * 验证请求来源是否在允许列表中
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // 没有 origin header (同源请求或某些客户端)
    return true;
  }

  return ALLOWED_ORIGINS.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    } else if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return false;
  });
}

/**
 * 获取安全的 CORS headers
 * 根据请求来源动态设置 Access-Control-Allow-Origin
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const isAllowed = isOriginAllowed(requestOrigin);
  
  if (isAllowed && requestOrigin) {
    // 如果来源在允许列表中,返回该来源
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin', // 重要：告诉缓存服务器根据 Origin 缓存不同的响应
    };
  }
  
  // 不允许的来源，不返回 CORS headers
  return {};
}

/**
 * 检查请求来源是否被允许
 * 用于在处理请求前进行验证
 */
export function checkCorsOrigin(requestOrigin: string | null): { allowed: boolean; reason?: string } {
  if (!requestOrigin) {
    // 同源请求或某些客户端不发送 Origin header
    return { allowed: true };
  }

  const isAllowed = isOriginAllowed(requestOrigin);
  
  if (!isAllowed) {
    return { 
      allowed: false, 
      reason: `Origin '${requestOrigin}' is not allowed. Please use an authorized domain.`
    };
  }

  return { allowed: true };
}

/**
 * 开发环境专用：允许所有来源
 * ⚠️ 仅用于本地开发，生产环境禁用
 */
export function getDevCorsHeaders(): Record<string, string> {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    throw new Error('Dev CORS headers should not be used in production');
  }

  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * 为 API 路由添加 CORS 支持的辅助函数
 */
export function withCors<T>(
  handler: (request: Request) => Promise<Response>,
  options: { dev?: boolean } = {}
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const origin = request.headers.get('Origin');

    // OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      const headers = options.dev 
        ? getDevCorsHeaders() 
        : getCorsHeaders(origin);
      
      return new Response(null, {
        status: 204,
        headers,
      });
    }

    // 检查来源
    if (!options.dev) {
      const corsCheck = checkCorsOrigin(origin);
      if (!corsCheck.allowed) {
        return new Response(
          JSON.stringify({ error: 'CORS: Origin not allowed', reason: corsCheck.reason }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 执行实际的处理器
    const response = await handler(request);

    // 添加 CORS headers 到响应
    const corsHeaders = options.dev 
      ? getDevCorsHeaders() 
      : getCorsHeaders(origin);
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
