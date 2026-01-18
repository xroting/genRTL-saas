import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
import { ProxyAgent } from "undici";

// ============================================================================
// 🔧 服务端固化的 System Prompt（不依赖前端传入）
// ============================================================================
const systemPrompt = `你是FPGA/ASIC数字前端工程师，精通Verilog/SystemVerilog。

## 工作模式

你在Agent模式下工作。每次响应必须调用一个工具：
- 需要信息 → 调用 ls_dir / read_file / get_dir_tree
- 需要修改 → 调用 edit_file
- 任务完成 → 调用 finalize（这是唯一的结束方式）

## 重要规则

1. 每次响应必须调用且只调用一个工具
2. 禁止输出纯文本响应（除非通过 finalize 工具）
3. 任务完成时必须调用 finalize 工具，不能直接输出总结

## 工作流程

示例：用户说"给src目录下所有.v文件添加注释"

步骤1: 调用 ls_dir 获取文件列表
步骤2: 调用 read_file(第1个文件)
步骤3: 调用 edit_file(第1个文件)
步骤4: 调用 read_file(第2个文件)
步骤5: 调用 edit_file(第2个文件)
...
最后步骤: 调用 finalize(summary="已完成N个文件的修改")

## edit_file 格式

<<<<<<< ORIGINAL
从read_file精确复制的原始代码
=======
修改后的代码
>>>>>>> UPDATED

## 关键

- 任务完成必须调用 finalize 工具
- 不要输出纯文本，必须调用工具`;

// ============================================================================
// 🔧 服务端固化的 Tools Schema（不依赖前端每轮传入）
// ============================================================================
const SERVER_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "finalize",
      description: "任务完成时调用此工具。这是结束Agent循环的唯一方式。调用后Agent将停止并显示总结。",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "任务完成的总结，例如：'已完成5个文件的修改：file1.v, file2.v, ...'",
          },
          files_modified: {
            type: "array",
            items: { type: "string" },
            description: "修改的文件列表",
          },
          success: {
            type: "boolean",
            description: "任务是否成功完成",
          },
        },
        required: ["summary", "success"],
      },
    },
  },
  // 其他工具由前端传入，这里只定义 finalize
];

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

    const { messages, model = "gpt-4.1", stream = false, temperature = 0.7, max_tokens = 32768, tools } = requestBody;
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:222',message:'SystemPrompt content check',data:{promptLength:systemPrompt.length,hasAgentMode:systemPrompt.includes('Agent模式'),hasToolPriority:systemPrompt.includes('工具优先'),hasExampleWorkflow:systemPrompt.includes('典型工作流程示例'),firstUserMessage:messages[messages.length-1]?.content?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // 🔥 Use max_tokens from request, with a reasonable upper limit
    // For gpt-4.1, max output is 32768 tokens, context window is ~1M tokens (verified by OpenAI API)
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

          // 🎯 结构性修复：
          // 1. 服务端固化工具 schema（SERVER_TOOLS + 前端工具）
          // 2. 全程 tool_choice: "required"（模型必须调用工具）
          // 3. 通过 finalize 工具作为唯一的终止信号
          
          // 合并服务端固化工具 + 前端传入工具
          const mergedTools = [
            ...SERVER_TOOLS,
            ...(tools || []),
          ];
          
          console.log(`📊 Sending request - serverTools: ${SERVER_TOOLS.length}, clientTools: ${tools?.length || 0}, merged: ${mergedTools.length}, messages: ${messagesWithSystem.length}`);

          const streamResponse = await openai.chat.completions.create({
            model,
            messages: messagesWithSystem,
            temperature: 0.1, // 批量任务使用低 temperature
            max_tokens: safeMaxTokens,
            stream: true,
            tools: mergedTools,
            tool_choice: "required", // 🔥 全程强制工具调用，通过 finalize 结束
            parallel_tool_calls: false, // One tool at a time
            // #region agent log
            // Log: Testing tool_choice parameter to limit concurrent tool calls (Hypothesis E)
            // #endregion
          }).catch((error) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:244',message:'OpenAI API Error',data:{errorMessage:error.message,errorCode:error.code,errorType:error.type,model},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'API_ERROR'})}).catch(()=>{});
            // #endregion
            console.error("❌ OpenAI API Error:", error);
            throw error;
          });
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:260',message:'调用OpenAI(required+finalize)',data:{model,mergedToolsCount:mergedTools.length,serverToolsCount:SERVER_TOOLS.length,clientToolsCount:tools?.length||0,messagesCount:messagesWithSystem.length,toolChoice:'required'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FINALIZE'})}).catch(()=>{});
          // #endregion

          console.log("✅ OpenAI stream started");

          // Convert OpenAI stream to SSE format
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                let fullResponse = ''; // Track full response for debugging
                let chunkCount = 0;
                let hasContent = false;
                let hasToolCalls = false;
                for await (const chunk of streamResponse) {
                  chunkCount++;
                  
                  // Track content and tool calls
                  if (chunk.choices[0]?.delta?.content) {
                    hasContent = true;
                  }
                  
                  // Log tool calls for debugging
                  if (chunk.choices[0]?.delta?.tool_calls) {
                    hasToolCalls = true;
                    console.log('🔧 Tool call chunk:', JSON.stringify(chunk.choices[0].delta.tool_calls, null, 2));
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:276',message:'Tool call detected',data:{chunkCount,toolCallsData:chunk.choices[0].delta.tool_calls,toolCallCount:chunk.choices[0].delta.tool_calls.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                  }
                  
                  const data = JSON.stringify(chunk);
                  const text = `data: ${data}\n\n`;
                  controller.enqueue(encoder.encode(text));
                }
                
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/4eeaa7bf-5db4-4a40-89b4-4cbbaffa678d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:288',message:'Stream completed',data:{chunkCount,hasContent,hasToolCalls,model},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'STREAM_COMPLETE'})}).catch(()=>{});
                // #endregion
                
                console.log(`✅ Stream completed, sent ${chunkCount} chunks, hasContent: ${hasContent}, hasToolCalls: ${hasToolCalls}`);
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
