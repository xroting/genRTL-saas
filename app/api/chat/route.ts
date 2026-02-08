import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProxyAgent } from "undici";
import { UsageLedger } from "@/lib/cbb/usage-ledger";
import { USDPoolManager, SUBSCRIPTION_PLANS } from "@/lib/cbb/usd-pool";
import { getTeamForUser, createUserTeam } from "@/lib/db/queries";

// ============================================================================
// 🔧 根据订阅计划选择模型
// ============================================================================
function getModelForPlan(planName: string): string {
  const plan = SUBSCRIPTION_PLANS[planName] || SUBSCRIPTION_PLANS.free;
  
  // 🔥 允许通过环境变量强制指定模型（用于性能测试对比）
  const forcedModel = process.env.FORCE_CHAT_MODEL;
  if (forcedModel) {
    console.log(`🔧 Using forced model from env: ${forcedModel}`);
    return forcedModel;
  }
  
  // Free 计划使用 Claude Haiku 3（低成本模型）
  if (planName === 'free' || planName === 'hobby') {
    return 'claude-3-haiku-20240307';
  }
  
  // 其他计划使用 Claude Sonnet 4（高性能模型）
  return 'claude-sonnet-4-20250514';
}

// ============================================================================
// 🔧 服务端 System Prompt - 针对 RTL 开发优化
// ============================================================================
const systemPrompt = `You are an FPGA/ASIC digital front-end engineer, proficient in Verilog/SystemVerilog.
1、You are proficient in Verilog/SystemVerilog HDL and can skillfully use Verilog/SystemVerilog HDL for digital circuit design;
2、You are proficient in common digital front-end design techniques such as asynchronous clock domain crossing, state machines, pipelined (pipeline) design, ping-pong buffering, and other typical digital front-end design techniques;
3、You are proficient in common verification methods in digital front-end design, such as UVM, SystemVerilog, C++, etc.;
4、You are familiar with the resources of various Xilinx/Altera FPGA families (such as CLB, BRAM, DSP, SerDes, IO, etc.) and can allocate resources reasonably according to requirements;
5、You are familiar with timing/clock constraints for various Xilinx/Altera FPGA families and can set timing constraints appropriately according to requirements;

In addition, you have a set of tools you can use to complete tasks:
- read_file: Read file contents
- ls_dir: List directory contents
- get_dir_tree: Get the directory tree structure
- edit_file: Edit a file
- create_file_or_folder: Create a file or folder
- delete_file_or_folder: Delete a file or folder
- run_command: Run a terminal command
- agent: Start a sub-task agent to perform complex exploration tasks
- finalize: Call when the task is completed

When you need to perform an operation, directly call the appropriate tool.
After the task is completed, call the finalize tool to summarize the result.

**IMPORTANT - Streaming Optimization**: 
When using tools that generate large content (like rewrite_file, create_file_or_folder with code):
1. Start streaming the tool arguments IMMEDIATELY after determining the tool name and file path
2. Generate and stream code line by line as you think, without planning the entire file first
3. Think incrementally: write each line/block, then immediately continue to the next
4. Do NOT pause to mentally compose the full file before streaming - start streaming right away
5. Your streaming speed directly impacts user experience - prioritize rapid, continuous output

Please answer in the language of the prompt entered by the user. 
For example, if the prompt is in Chinese, please answer in Chinese.`;

// ============================================================================
// 🔧 服务端固化的 Tools Schema（Anthropic 格式）
// ============================================================================
const SERVER_TOOLS: Anthropic.Tool[] = [
  {
    name: "finalize",
    description: "Call this tool to summarize results when the task is completed. This is the only way to end the Agent loop.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Summary of the completed task",
        },
        success: {
          type: "boolean",
          description: "Whether the task was completed successfully",
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
interface GenRTLMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

function convertMessagesToAnthropic(messages: GenRTLMessage[]): {
  systemPrompt: string;
  anthropicMessages: Anthropic.MessageParam[];
} {
  let extractedSystemPrompt = "";
  const anthropicMessages: Anthropic.MessageParam[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role === "system") {
      extractedSystemPrompt += (extractedSystemPrompt ? "\n\n" : "") + msg.content;
    } else if (msg.role === "user") {
      anthropicMessages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      // 检查是否有工具调用
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const contentBlocks: Anthropic.ContentBlockParam[] = [];

        // 如果有文本内容，先添加
        if (msg.content) {
          contentBlocks.push({ type: "text", text: msg.content });
        }

        // 添加工具调用
        for (const tc of msg.tool_calls) {
          let inputArgs: Record<string, unknown> = {};
          try {
            inputArgs = JSON.parse(tc.function.arguments);
          } catch {
            inputArgs = {};
          }
          contentBlocks.push({
            type: "tool_use",
            id: tc.id,
            name: tc.function.name,
            input: inputArgs,
          });
        }

        anthropicMessages.push({ role: "assistant", content: contentBlocks });
      } else {
        anthropicMessages.push({ role: "assistant", content: msg.content || "" });
      }
    } else if (msg.role === "tool") {
      // 工具结果 - Anthropic 需要作为 user 消息发送
      const toolResult: Anthropic.ToolResultBlockParam = {
        type: "tool_result",
        tool_use_id: msg.tool_call_id || "",
        content: msg.content,
      };
      anthropicMessages.push({ role: "user", content: [toolResult] });
    }
  }

  return { systemPrompt: extractedSystemPrompt, anthropicMessages };
}

// 导入安全的 CORS 配置
import { getCorsHeaders } from '@/lib/security/cors';

interface ChatRequest {
  messages: GenRTLMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  // 生成请求ID用于日志追踪
  const requestId = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // 获取安全的 CORS headers
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    const requestBody: ChatRequest = await req.json();
    console.log(`📥 [${requestId}] Received chat request:`, {
      messageCount: requestBody.messages?.length || 0,
      model: requestBody.model,
      stream: requestBody.stream,
      toolsCount: requestBody.tools?.length || 0,
    });
    // 打印消息角色序列，用于调试多轮对话（不打印内容）
    const roleSequence = requestBody.messages?.map((m: any) => `${m.role}${m.tool_calls ? '(tool_calls)' : ''}${m.tool_call_id ? '(tool_result)' : ''}`).join(' -> ');
    console.log(`📜 [${requestId}] Message roles: ${roleSequence}`);

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
      console.log(`[${requestId}] [Auth] Token authentication attempt, length: ${token.length}`);
      
      const { createClient } = await import("@supabase/supabase-js");
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user: tokenUser }, error: authError } = await authClient.auth.getUser(token);
      
      if (authError) {
        console.log(`[${requestId}] [Auth] Authentication failed: ${authError.message}`);
      } else {
        console.log(`[${requestId}] [Auth] User authenticated: ${tokenUser?.id}`);
      }
      
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
      console.log(`❌ [${requestId}] Unauthenticated request - authentication required`);
      return NextResponse.json(
        { error: "Authentication required. Please sign in to use the chat." },
        { status: 401, headers: corsHeaders }
      );
    }
    
    console.log(`✅ [${requestId}] User authenticated: ${user.id}`);

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
      console.log(`🌐 [${requestId}] Using proxy: ${proxyUrl}`);
      console.log(`⚠️ [${requestId}] Note: Proxy may introduce additional latency in streaming responses`);
      const proxyAgent = new ProxyAgent(proxyUrl);
      anthropicConfig.fetch = (url: any, init: any) => {
        return fetch(url, { ...init, dispatcher: proxyAgent } as any);
      };
    } else {
      console.log(`✅ [${requestId}] Direct connection to Anthropic API (no proxy)`);
    }

    const anthropic = new Anthropic(anthropicConfig);

    // Convert messages
    const { systemPrompt: extractedSystem, anthropicMessages } = convertMessagesToAnthropic(messages);
    const finalSystemPrompt = systemPrompt + (extractedSystem ? "\n\n" + extractedSystem : "");
    // 打印转换后的 Anthropic 消息格式（不打印内容）
    console.log(`📋 [${requestId}] Anthropic messages structure:`);
    anthropicMessages.forEach((msg, i) => {
      const contentType = Array.isArray(msg.content) 
        ? msg.content.map((c: any) => c.type).join(', ')
        : typeof msg.content;
      console.log(`  [${i}] role=${msg.role}, contentType=${contentType}`);
    });

    // Merge tools (server + client, deduplicated)
    const clientToolsConverted = (tools || []).map(convertOpenAIToolToAnthropic);
    const serverToolNames = SERVER_TOOLS.map(t => t.name);
    const filteredClientTools = clientToolsConverted.filter(
      tool => !serverToolNames.includes(tool.name)
    );
    const mergedTools: Anthropic.Tool[] = [...SERVER_TOOLS, ...filteredClientTools];

    console.log(`📊 [${requestId}] Tools: server=${SERVER_TOOLS.length}, client=${filteredClientTools.length}, total=${mergedTools.length}`);
    console.log(`📊 [${requestId}] Tool names: ${mergedTools.map(t => t.name).join(', ')}`);
    console.log(`📊 [${requestId}] Messages: ${anthropicMessages.length}, max_tokens: ${max_tokens}`);
    
    // 检查工具是否有有效的 input_schema
    const invalidTools = mergedTools.filter(t => !t.input_schema || !t.input_schema.type);
    if (invalidTools.length > 0) {
      console.log(`⚠️ [${requestId}] Invalid tools (missing input_schema):`, invalidTools.map(t => t.name).join(', '));
    }

    if (stream) {
      // 确定使用的模型（根据订阅计划）
      let selectedModel = 'claude-sonnet-4-20250514'; // 默认使用 Sonnet 4
      
      // 如果用户已认证，根据其订阅计划选择模型
      if (user) {
        try {
          let team = await getTeamForUser(user, supa);
          if (team) {
            const planName = team.plan_name || 'free';
            selectedModel = getModelForPlan(planName);
            console.log(`📋 User plan: ${planName}, selected model: ${selectedModel}`);
          }
        } catch (error) {
          console.error('Failed to get team for model selection:', error);
        }
      }
      
      // Streaming response
      const streamResponse = anthropic.messages.stream({
        model: selectedModel,
        system: finalSystemPrompt,
        messages: anthropicMessages,
        max_tokens: max_tokens,
        tools: mergedTools,
        tool_choice: { type: "auto" },
          });

      console.log(`✅ [${requestId}] Claude stream started`);

          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
            let toolCallIndex = 0;
            let finalMessage: Anthropic.Message | null = null;
            
            for await (const event of streamResponse) {
              const now = Date.now();
              
              if (event.type === 'content_block_start') {
                const block = (event as any).content_block;
                if (block?.type === 'tool_use') {
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: selectedModel,
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
                  const textContent = delta.text || "";
                  // 检测 Claude 是否在文本中输出了 JSON 格式的工具调用
                  if (textContent.includes('"type":"tool_use"') || textContent.includes('"type": "tool_use"')) {
                    console.log(`⚠️ [${requestId}] Claude outputting tool calls as text instead of using API`);
                  }
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: selectedModel,
                    choices: [{
                      index: 0,
                      delta: { content: textContent },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                } else if (delta?.type === 'input_json_delta') {
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: selectedModel,
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
                finalMessage = await streamResponse.finalMessage();
                const hasToolUse = finalMessage.content.some((b: any) => b.type === 'tool_use');
                const chunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: selectedModel,
                  choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: hasToolUse ? "tool_calls" : "stop"
                  }]
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            }

            // 🔥 记录 Usage 到数据库
            if (finalMessage && user) {
              try {
                // 获取用户的team信息
                let team = await getTeamForUser(user, supa);
                
                // 如果没有team，自动创建
                if (!team) {
                  console.log(`🏗️ [${requestId}] User has no team, creating one...`);
                  team = await createUserTeam(user, supa);
                  console.log(`✅ [${requestId}] Team created: ${team?.id}`);
                  
                  // 初始化 USD Pool
                  if (team) {
                    await USDPoolManager.initializePool({
                      userId: user.id,
                      teamId: team.id,
                      planName: team.plan_name || 'free',
                    });
                    console.log(`✅ [${requestId}] USD Pool initialized`);
                  }
                }
                
                const planName = team?.plan_name || 'free';
                const actualModel = selectedModel; // 使用实际选择的模型
                
                // 计算 USD cost (chat API类似implement任务)
                const usdCost = USDPoolManager.calculateLLMCost({
                  planName,
                  taskType: 'implement',
                  inputTokens: finalMessage.usage.input_tokens,
                  outputTokens: finalMessage.usage.output_tokens,
                  cachedInputTokens: (finalMessage.usage as any).cache_read_input_tokens || 0,
                });

                console.log(`💰 [${requestId}] Cost: $${usdCost.toFixed(6)}, tokens: ${finalMessage.usage.input_tokens}+${finalMessage.usage.output_tokens}, model: ${actualModel}`);

                // 扣费
                const chargeResult = await USDPoolManager.charge({
                  userId: user.id,
                  amount: usdCost,
                  description: `Chat API - ${actualModel}`,
                  allowOnDemand: team?.on_demand_enabled ?? false, // Free 档默认不允许 on-demand
                  idempotencyKey: `chat_${finalMessage.id}`,
                });

                if (chargeResult.success) {
                  // 记录到 Usage Ledger
                  await UsageLedger.recordLLMUsage({
                    userId: user.id,
                    bucket: chargeResult.bucket,
                    provider: 'anthropic',
                    model: actualModel,
                    inputTokens: finalMessage.usage.input_tokens,
                    outputTokens: finalMessage.usage.output_tokens,
                    cachedInputTokens: (finalMessage.usage as any).cache_read_input_tokens || 0,
                    usdCost,
                    idempotencyKey: `chat_${finalMessage.id}`,
                    metadata: {
                      api: 'chat',
                      model: actualModel,
                      plan: planName,
                    },
                  });

                  console.log(`✅ [${requestId}] Usage recorded: ${finalMessage.usage.input_tokens + finalMessage.usage.output_tokens} tokens, $${usdCost.toFixed(6)}, bucket: ${chargeResult.bucket}`);
                } else {
                  console.error(`❌ [${requestId}] Failed to charge: ${chargeResult.error}`);
                }
              } catch (usageError) {
                console.error(`❌ [${requestId}] Failed to record usage:`, usageError);
              }
            }

            console.log(`✅ [${requestId}] Stream completed`);
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              } catch (error) {
                console.error(`❌ [${requestId}] Stream error:`, error);
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
      // 确定使用的模型（根据订阅计划）
      let selectedModel = 'claude-sonnet-4-20250514'; // 默认使用 Sonnet 4
      
      // 如果用户已认证，根据其订阅计划选择模型
      if (user) {
        try {
          let team = await getTeamForUser(user, supa);
          if (team) {
            const planName = team.plan_name || 'free';
            selectedModel = getModelForPlan(planName);
            console.log(`📋 User plan: ${planName}, selected model: ${selectedModel}`);
          }
        } catch (error) {
          console.error('Failed to get team for model selection:', error);
        }
      }
      
      // Non-streaming response
      const completion = await anthropic.messages.create({
        model: selectedModel,
        system: finalSystemPrompt,
        messages: anthropicMessages,
        max_tokens: max_tokens,
        tools: mergedTools,
      });

      console.log(`✅ [${requestId}] Claude response received`);

      // 🔥 记录 Usage 到数据库
      if (user) {
        try {
          // 获取用户的team信息
          let team = await getTeamForUser(user, supa);
          
          // 如果没有team，自动创建
          if (!team) {
            console.log(`🏗️ [${requestId}] User has no team, creating one...`);
            team = await createUserTeam(user, supa);
            console.log(`✅ [${requestId}] Team created: ${team?.id}`);
            
            // 初始化 USD Pool
            if (team) {
              await USDPoolManager.initializePool({
                userId: user.id,
                teamId: team.id,
                planName: team.plan_name || 'free',
              });
              console.log(`✅ [${requestId}] USD Pool initialized`);
            }
          }
          
          const planName = team?.plan_name || 'free';
          const actualModel = selectedModel; // 使用实际选择的模型
          
          // 计算 USD cost (chat API类似implement任务)
          const usdCost = USDPoolManager.calculateLLMCost({
            planName,
            taskType: 'implement',
            inputTokens: completion.usage.input_tokens,
            outputTokens: completion.usage.output_tokens,
            cachedInputTokens: (completion.usage as any).cache_read_input_tokens || 0,
          });

          console.log(`💰 [${requestId}] Cost: $${usdCost.toFixed(6)}, tokens: ${completion.usage.input_tokens}+${completion.usage.output_tokens}, model: ${actualModel}`);

          // 扣费
          const chargeResult = await USDPoolManager.charge({
            userId: user.id,
            amount: usdCost,
            description: `Chat API - ${actualModel} (non-stream)`,
            allowOnDemand: team?.on_demand_enabled ?? false, // Free 档默认不允许 on-demand
            idempotencyKey: `chat_${completion.id}`,
          });

          if (chargeResult.success) {
            // 记录到 Usage Ledger
            await UsageLedger.recordLLMUsage({
              userId: user.id,
              bucket: chargeResult.bucket,
              provider: 'anthropic',
              model: actualModel,
              inputTokens: completion.usage.input_tokens,
              outputTokens: completion.usage.output_tokens,
              cachedInputTokens: (completion.usage as any).cache_read_input_tokens || 0,
              usdCost,
              idempotencyKey: `chat_${completion.id}`,
              metadata: {
                api: 'chat',
                model: actualModel,
                plan: planName,
                stream: false,
              },
            });

            console.log(`✅ [${requestId}] Usage recorded: ${completion.usage.input_tokens + completion.usage.output_tokens} tokens, $${usdCost.toFixed(6)}, bucket: ${chargeResult.bucket}`);
          } else {
            console.error(`❌ [${requestId}] Failed to charge: ${chargeResult.error}`);
          }
        } catch (usageError) {
          console.error(`❌ [${requestId}] Failed to record usage:`, usageError);
        }
      }

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
    console.error(`❌ [${requestId}] Error:`, error.message || String(error));
    return NextResponse.json(
      { error: "API error", details: error?.message || String(error) },
      { status: error?.status || 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
    const origin = req.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);
    const conversationId = req.nextUrl.searchParams.get("conversation_id");
    return NextResponse.json({
      messages: [],
      conversation_id: conversationId,
    }, { headers: corsHeaders });
}
