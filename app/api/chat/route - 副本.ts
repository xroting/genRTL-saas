import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
import { ProxyAgent } from "undici";

const systemPrompt = `你是一名优秀的FPGA和ASIC数字前端高级工程师，精通Verilog/SystemVerilog HDL语言设计。

## 🚨 重要：代码输出格式（必须严格遵守）

**无论是创建新文件还是修改现有文件，都必须直接输出完整的代码，使用以下格式：**

\`\`\`verilog
src/filename.v
[完整的模块代码]
\`\`\`

**🚨 路径格式要求（极其重要）：**
- ✅ 必须使用相对路径：src/uart.v, src/top.v, lib/utils.v
- ❌ 禁止使用绝对路径：e:\\uart\\src\\uart.v, /home/user/src/uart.v
- ❌ 禁止使用盘符路径：d:/project/src/uart.v

**禁止使用任何工具！** 不要使用read_file、write_file等工具，即使用户要求修改现有文件，也应该直接输出完整的新代码。

## 工作流程

1. 理解用户需求
2. 设计或修改模块  
3. **直接输出完整代码，使用Markdown代码块格式**
4. 格式：三个反引号 + 语言名 + 换行 + 相对路径 + 换行 + 完整代码 + 三个反引号

## 示例格式

\`\`\`verilog
src/counter.v
module counter(
  input wire clk,
  output reg [7:0] count
);
  always @(posedge clk) count <= count + 1;
endmodule
\`\`\`

## 关键要求

- 代码必须完整，可直接使用
- 每个代码块第一行必须是**相对路径**（src/xxx.v）
- 不要使用任何工具
- 直接输出完整代码`;

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

    const { messages, model = "gpt-4o-mini", stream = false, temperature = 0.7, max_tokens = 32768, tools } = requestBody;

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

    // ✅ Add system prompt and few-shot examples
    // 🚨 CRITICAL: Few-shot examples must use RELATIVE paths (src/file.v) NOT absolute paths
    const messagesWithSystem: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      // Few-shot example 1: Create new UART file - 使用相对路径 src/uart.v
      { role: "user", content: "请帮我创建一个UART模块" },
      { role: "assistant", content: "好的，我将为您创建一个UART模块。以下是代码：\n\n```verilog\nsrc/uart.v\nmodule uart(\n  input wire clk,\n  input wire reset,\n  output reg tx\n);\n\nparameter BAUD_RATE = 115200;\nparameter CLK_FREQ = 100000000;\n\nlocalparam DIVISOR = CLK_FREQ / BAUD_RATE;\nreg [15:0] counter;\n\nalways @(posedge clk) begin\n  if (reset) counter <= 0;\n  else counter <= counter + 1;\nend\n\nendmodule\n```\n\n这个UART模块已经包含了基本的波特率分频器。" },
      // Few-shot example 2: Modify existing file - 输出完整代码，使用相对路径
      { role: "user", content: "请将时钟频率改为50MHz" },
      { role: "assistant", content: "好的，我将更新UART模块的时钟频率为50MHz。以下是修改后的完整代码：\n\n```verilog\nsrc/uart.v\nmodule uart(\n  input wire clk,\n  input wire reset,\n  output reg tx\n);\n\nparameter BAUD_RATE = 115200;\nparameter CLK_FREQ = 50000000;  // 已更新为50MHz\n\nlocalparam DIVISOR = CLK_FREQ / BAUD_RATE;\nreg [15:0] counter;\n\nalways @(posedge clk) begin\n  if (reset) counter <= 0;\n  else counter <= counter + 1;\nend\n\nendmodule\n```\n\n时钟频率已更新为50MHz。" },
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
            // DO NOT pass tools - we want LLM to output code directly, not use tools
          });

          console.log("✅ OpenAI stream started");

          // Convert OpenAI stream to SSE format
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                let fullResponse = ''; // Track full response for debugging
                for await (const chunk of streamResponse) {
                  // Log first few chunks to see what's being returned
                  if (chunk.choices[0]?.delta?.content) {
                    fullResponse += chunk.choices[0].delta.content;
                    if (fullResponse.length < 500) {
                      console.log('📝 Response preview:', fullResponse);
                    }
                  }
                  const data = JSON.stringify(chunk);
                  const text = `data: ${data}\n\n`;
                  controller.enqueue(encoder.encode(text));
                }
                console.log('📄 Full response length:', fullResponse.length, 'chars');
                console.log('📄 Has code block:', fullResponse.includes('```'));
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
