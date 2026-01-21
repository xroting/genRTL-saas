import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProxyAgent } from "undici";

// ============================================================================
// 🔧 服务端 System Prompt - 简洁明了
// ============================================================================
const systemPrompt = `你是FPGA/ASIC数字前端工程师，精通Verilog/SystemVerilog。

你有一系列工具可以使用来完成任务。当需要执行操作时，请直接调用相应的工具。

任务完成后，请调用 finalize 工具来总结结果。`;

// ============================================================================
// 🔧 服务端固化的 Tools Schema（Anthropic 格式）
// ============================================================================
const SERVER_TOOLS: Anthropic.Tool[] = [
  {
    name: "finalize",
    description: "任务完成时调用此工具来总结结果。",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "任务完成的总结",
        },
        success: {
          type: "boolean",
          description: "任务是否成功完成",
        },
      },
      required: ["summary", "success"],
    },
  },
];

// ============================================================================
// 🔄 工具格式转换：OpenAI → Anthropic
// ============================================================================
function convertOpenAIToolToAnthropic(openaiTool: any): Anthropic.Tool {
  const func = openaiTool.function;
  return {
    name: func.name,
    description: func.description || "",
    input_schema: func.parameters || { type: "object", properties: {}, required: [] },
  };
}

// ============================================================================
// 🔄 消息格式转换：genRTL → Anthropic
// ============================================================================
function convertMessagesToAnthropic(messages: ChatMessage[]): { systemPrompt: string; anthropicMessages: Anthropic.MessageParam[] } {
  let extractedSystemPrompt = "";
  const anthropicMessages: Anthropic.MessageParam[] = [];
  
  for (const msg of messages) {
    if (msg.role === "system") {
      extractedSystemPrompt = msg.content;
    } else if (msg.role === "user") {
      anthropicMessages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      anthropicMessages.push({ role: "assistant", content: msg.content });
    }
  }
  
  return { systemPrompt: extractedSystemPrompt, anthropicMessages };
}

// CORS headers
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
  tools?: any[];
}

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
      toolsCount: requestBody.tools?.length || 0,
    });

    const { messages, stream = false, max_tokens = 16384, tools } = requestBody;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "messages are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Authentication check (relaxed for development)
    const authHeader = req.headers.get("authorization");
    let user = null;
    let supa;

    if (authHeader?.startsWith("Bearer ")) {
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
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
    } else {
      supa = await createSupabaseServer();
      const { data: { user: cookieUser } } = await supa.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      console.log("⚠️ Unauthenticated request - allowing for development");
    }

    // Anthropic API setup
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    const anthropicConfig: any = { apiKey: anthropicApiKey };

    if (proxyUrl) {
      console.log("🌐 Using proxy:", proxyUrl);
      const proxyAgent = new ProxyAgent(proxyUrl);
      anthropicConfig.fetch = (url: any, init: any) => {
        return fetch(url, { ...init, dispatcher: proxyAgent } as any);
      };
    }

    const anthropic = new Anthropic(anthropicConfig);

    // Convert messages
    const { systemPrompt: extractedSystem, anthropicMessages } = convertMessagesToAnthropic(messages);
    const finalSystemPrompt = systemPrompt + (extractedSystem ? "\n\n" + extractedSystem : "");

    // Merge tools (server + client, deduplicated)
    const clientToolsConverted = (tools || []).map(convertOpenAIToolToAnthropic);
    const serverToolNames = SERVER_TOOLS.map(t => t.name);
    const filteredClientTools = clientToolsConverted.filter(
      tool => !serverToolNames.includes(tool.name)
    );
    const mergedTools: Anthropic.Tool[] = [...SERVER_TOOLS, ...filteredClientTools];

    console.log(`📊 Tools: server=${SERVER_TOOLS.length}, client=${filteredClientTools.length}, total=${mergedTools.length}`);
    console.log(`📊 Messages: ${anthropicMessages.length}, max_tokens: ${max_tokens}`);

    if (stream) {
      // Streaming response
      const streamResponse = anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        system: finalSystemPrompt,
        messages: anthropicMessages,
        max_tokens: max_tokens,
        tools: mergedTools,
        tool_choice: { type: "auto" },
      });

      console.log("✅ Claude stream started");

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let toolCallIndex = 0;

            for await (const event of streamResponse) {
              if (event.type === 'content_block_start') {
                const block = (event as any).content_block;
                if (block?.type === 'tool_use') {
                  console.log(`🔧 Tool call: ${block.name}`);
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: "claude-sonnet-4-20250514",
                    choices: [{
                      index: 0,
                      delta: {
                        tool_calls: [{
                          index: toolCallIndex,
                          id: block.id,
                          type: "function",
                          function: { name: block.name, arguments: "" }
                        }]
                      },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                } else if (block?.type === 'text') {
                  // Text block start - no action needed
                }
              } else if (event.type === 'content_block_delta') {
                const delta = (event as any).delta;
                
                if (delta?.type === 'text_delta') {
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: "claude-sonnet-4-20250514",
                    choices: [{
                      index: 0,
                      delta: { content: delta.text || "" },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                } else if (delta?.type === 'input_json_delta') {
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: "claude-sonnet-4-20250514",
                    choices: [{
                      index: 0,
                      delta: {
                        tool_calls: [{
                          index: toolCallIndex,
                          function: { arguments: delta.partial_json || "" }
                        }]
                      },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } else if (event.type === 'content_block_stop') {
                toolCallIndex++;
              } else if (event.type === 'message_stop') {
                const finalMessage = await streamResponse.finalMessage();
                const hasToolUse = finalMessage.content.some((b: any) => b.type === 'tool_use');
                const chunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: "claude-sonnet-4-20250514",
                  choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: hasToolUse ? "tool_calls" : "stop"
                  }]
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            }

            console.log("✅ Stream completed");
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
    } else {
      // Non-streaming response
      const completion = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        system: finalSystemPrompt,
        messages: anthropicMessages,
        max_tokens: max_tokens,
        tools: mergedTools,
      });

      console.log("✅ Claude response received");

      const textContent = completion.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

      return NextResponse.json({
        id: completion.id,
        choices: [{
          index: 0,
          message: { role: "assistant", content: textContent },
          finish_reason: completion.stop_reason === "end_turn" ? "stop" : completion.stop_reason,
        }],
        usage: {
          prompt_tokens: completion.usage.input_tokens,
          completion_tokens: completion.usage.output_tokens,
          total_tokens: completion.usage.input_tokens + completion.usage.output_tokens,
        },
        model: completion.model,
      }, { headers: corsHeaders });
    }
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: "API error", details: error?.message || String(error) },
      { status: error?.status || 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversation_id");
  return NextResponse.json({
    messages: [],
    conversation_id: conversationId,
  }, { headers: corsHeaders });
}
