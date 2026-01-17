import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
import { ProxyAgent } from "undici";

const systemPrompt = `你是一名优秀的FPGA和ASIC数字前端高级工程师，精通Verilog/SystemVerilog HDL语言设计。

## 核心工作流程

当用户要求修改现有文件时：
1. 先使用read_file工具读取文件内容，了解完整上下文
2. 然后输出完整的修改后代码（不是部分代码）
3. 不要猜测文件内容，必须先读取

当用户要求创建新文件时：
1. 直接输出完整代码
2. 使用合理的文件路径（src/, rtl/, tb/等）

## 代码输出格式

你必须使用Markdown代码块来输出代码，格式如下：

- 开头：三个反引号 + 语言名（如verilog）
- 第一行：文件路径（相对路径，如src/uart.v）
- 后续行：完整的代码内容
- 结尾：三个反引号

关键规则：
- 语言标识符：verilog, systemverilog, python等
- 文件路径：必须是相对路径（src/uart.v, rtl/top.v等）
- 代码内容：必须是完整代码（不是部分代码片段）
- 禁止使用绝对路径（如e:\\\\path\\\\file.v）
- 禁止使用冒号格式（如verilog:src/uart.v）
- 禁止省略文件路径

## 作为genRTL助手的工作要求

1. 遵循业界Verilog/SystemVerilog编码规范
2. 提供清晰的注释和文档
3. 考虑可综合性和时序
4. 使用合适的文件命名规范（如src/module_name.v）
5. 必须严格遵守代码输出格式，否则前端无法正确显示Apply按钮
6. 生成完整、可运行的代码实现，不要省略关键部分
7. 如果任务需要多个步骤，必须完成所有步骤，不要中途停止
8. 修改文件时，必须先使用read_file工具读取文件，然后输出完整的修改后代码
9. 禁止将已输出的代码重复再以确认的方式输出一遍

`;

// Chat API for genRTL AI Assistant
// This endpoint handles chat conversations between the frontend and AI backend

// CORS headers for VS Code webview
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: any[]; // OpenAI tool definitions
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const requestBody: ChatRequest = await req.json();
    console.log("📥 Received chat request:", {
      messageCount: requestBody.messages?.length || 0,
      model: requestBody.model,
      stream: requestBody.stream,
      toolsCount: requestBody.tools?.length || 0, // Log tools count
    });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:172',message:'收到chat请求',data:{toolsCount:requestBody.tools?.length||0,toolNames:requestBody.tools?.map((t:any)=>t.function?.name||t.name)||[],messagesCount:requestBody.messages?.length||0,model:requestBody.model||'default'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    const { messages, model = "gpt-4o-mini", stream = false, temperature = 0.7, max_tokens = 32768, tools } = requestBody;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:185',message:'解析参数',data:{tools:tools||'undefined',toolsType:typeof tools,toolsIsArray:Array.isArray(tools),model},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "messages are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Try to get user from Authorization header (for mobile/extension) or cookie (for web)
    const authHeader = req.headers.get("authorization");
    let user = null;
    let supa;

    if (authHeader?.startsWith("Bearer ")) {
      // Extension/Mobile: use Bearer token
      const token = authHeader.substring(7);
      const { createClient } = await import("@supabase/supabase-js");

      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user: tokenUser } } = await authClient.auth.getUser(token);
      user = tokenUser;

      supa = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    } else {
      // Web: use cookie
      supa = await createSupabaseServer();
      const { data: { user: cookieUser } } = await supa.auth.getUser();
      user = cookieUser;
    }

    // For now, allow unauthenticated users for development
    // In production, you should require authentication
    if (!user) {
      console.log("⚠️ Unauthenticated chat request - allowing for development");
    }

    // Call OpenAI API using official SDK with proxy support
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create OpenAI client with proxy configuration
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    const openaiConfig: any = {
      apiKey: openaiApiKey,
    };

    // Add undici ProxyAgent if proxy is configured (compatible with Node.js fetch)
    if (proxyUrl) {
      console.log("🌐 Using proxy:", proxyUrl);
      const proxyAgent = new ProxyAgent(proxyUrl);
      // Use the dispatcher option for undici-based fetch
      openaiConfig.httpAgent = proxyAgent;
      // @ts-ignore - OpenAI SDK supports custom fetch options
      openaiConfig.fetch = (url: any, init: any) => {
        return fetch(url, {
          ...init,
          // @ts-ignore
          dispatcher: proxyAgent,
        });
      };
    }

    const openai = new OpenAI(openaiConfig);

    console.log("🤖 Calling OpenAI API via SDK with undici ProxyAgent...");

    // ✅ Add system prompt (no few-shot examples, let LLM use tools naturally)
    const messagesWithSystem: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    console.log("✅ System prompt added, total messages:", messagesWithSystem.length);

    // 🔥 Use max_tokens from request, with a reasonable upper limit
    // For gpt-4.1-mini-2025-04-14, max output is 32768 tokens (verified by OpenAI API)
    const safeMaxTokens = Math.min(max_tokens, 32768);
    console.log(`📊 Token limit: requested=${max_tokens}, using=${safeMaxTokens}`);

    // 🔄 Retry configuration for OpenAI API calls
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000; // Start with 2 seconds

    if (stream) {
      // Streaming response using OpenAI SDK
      let lastError: any = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const streamResponse = await openai.chat.completions.create({
            model,
            messages: messagesWithSystem,  // ← Use messages with system prompt
            temperature,
            max_tokens: safeMaxTokens, // Use safe token limit
            stream: true,
            tools: tools || undefined, // Allow LLM to use tools (read_file, etc.)
          });
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:337',message:'调用OpenAI(streaming)',data:{model,toolsPassedToOpenAI:tools||'undefined',toolsCount:tools?.length||0,messagesCount:messagesWithSystem.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
          // #endregion

          console.log("✅ OpenAI stream started");

          // Convert OpenAI stream to SSE format
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                let fullResponse = ''; // Track full response for debugging
                for await (const chunk of streamResponse) {
                  const data = JSON.stringify(chunk);
                  const text = `data: ${data}\n\n`;
                  controller.enqueue(encoder.encode(text));
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              } catch (error) {
                console.error("❌ Stream error:", error);
                controller.error(error);
              }
            },
          });

          return new Response(readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              ...corsHeaders,
            },
          });
        } catch (error: any) {
          lastError = error;
          console.error(`❌ OpenAI API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
          
          // Don't retry on rate limit errors (429) - let the client handle backoff
          if (error.status === 429) {
            console.log("🚫 Rate limit error - not retrying");
            break;
          }
          
          // Don't retry on authentication errors (401, 403)
          if (error.status === 401 || error.status === 403) {
            console.log("🚫 Authentication error - not retrying");
            break;
          }
          
          // Retry on connection errors and 5xx server errors
          const shouldRetry = (
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            (error.status && error.status >= 500)
          );
          
          if (!shouldRetry || attempt === MAX_RETRIES - 1) {
            break;
          }
        }
      }
      
      // All retries failed
      const errorResponse = {
        error: "AI provider error",
        details: lastError?.message || "Unknown error",
        code: lastError?.code || "unknown",
        status: lastError?.status || 500,
      };
      
      return NextResponse.json(
        errorResponse,
        { status: lastError?.status || 500, headers: corsHeaders }
      );
    } else {
      // Non-streaming response using OpenAI SDK
      let lastError: any = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const completion = await openai.chat.completions.create({
            model,
            messages: messagesWithSystem,  // ← Use messages with system prompt
            temperature,
            max_tokens: safeMaxTokens, // Use safe token limit
            // DO NOT pass tools - we want LLM to output code directly, not use tools
          });

          console.log("✅ OpenAI API response received");

          return NextResponse.json({
            id: completion.id,
            choices: completion.choices,
            usage: completion.usage,
            model: completion.model,
          }, { headers: corsHeaders });
        } catch (error: any) {
          lastError = error;
          console.error(`❌ OpenAI API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
          
          // Don't retry on rate limit errors (429) - let the client handle backoff
          if (error.status === 429) {
            console.log("🚫 Rate limit error - not retrying");
            break;
          }
          
          // Don't retry on authentication errors (401, 403)
          if (error.status === 401 || error.status === 403) {
            console.log("🚫 Authentication error - not retrying");
            break;
          }
          
          // Retry on connection errors and 5xx server errors
          const shouldRetry = (
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            (error.status && error.status >= 500)
          );
          
          if (!shouldRetry || attempt === MAX_RETRIES - 1) {
            break;
          }
        }
      }
      
      // All retries failed
      const errorResponse = {
        error: "AI provider error",
        details: lastError?.message || "Unknown error",
        code: lastError?.code || "unknown",
        status: lastError?.status || 500,
      };
      
      return NextResponse.json(
        errorResponse,
        { status: lastError?.status || 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("❌ Error in chat API:", error);
    return NextResponse.json(
      { error: "internal server error", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET method to retrieve chat history (optional)
export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversation_id");

    // For now, return empty history
    // In the future, you can implement conversation storage in Supabase
    return NextResponse.json({
      messages: [],
      conversation_id: conversationId,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
