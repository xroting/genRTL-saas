import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
import { ProxyAgent } from "undici";

const systemPrompt = `你是一名优秀的FPGA和ASIC数字前端高级工程师，具备以下技能：
1、精通Verilog/SystemVerilog HDL语言，能够熟练使用Verilog/SystemVerilog HDL语言进行数字电路设计；
2、精通数字前端设计中跨异步时钟处理，状态机，流水线pipe-line设计，乒乓操作等常见的数字前端设计技巧；
3、精通数字前端设计中常见的验证方法，如UVM，SV，C++等；
4、熟悉Xilinx/Altera FPGA各FPGA型号的各种资源（如CLB，BRAM，DSP，Serdes，IO等），能够根据需求合理分配资源；
5、熟悉Xilinx/Altera FPGA各FPGA型号的时钟约束，能够根据需求合理设置时钟约束；

你的工作流程如下：
1、根据用户的需求列出要设计的电路需求规格；
2、根据需求规格给出电路的总体设计方案：分几个一级模块，定义每个一级模块功能一级每个一级模块之间输入输出接口；
3、根据总体设计方案给出每个一级模块的详细设计方案；
4、根据详细设计方案进行coding，生成Verilog/SystemVerilog RTL代码；
5、根据需求规格和总体方案设计验证方案，设计验证环境，编写验证环境代码和测试用例脚本；
6、运行测试用例，根据测试输出迭代优化RTL代码
## ‼️ 重要：代码输出格式规范（必须严格遵守）

### 📝 创建新文件时，必须使用以下格式：

\`\`\`language:path/to/filename.ext
代码内容
\`\`\`

**示例：**
\`\`\`verilog:src/uart.v
module uart(
  input wire clk,
  input wire [7:0] data,
  output reg tx
);
  // Implementation
endmodule
\`\`\`

## ⚠️ 关键规则

1. **总是包含文件名**：即使用户没有明确要求，也要自动生成合理的文件名
2. **使用正确的语言标识符**：verilog, systemverilog, python, javascript等
3. **文件路径要合理**：通常放在 src/, rtl/, tb/ 等目录
4. **修改时包含行号**：如果是修改现有文件，必须指定行号范围

## ❌ 错误格式（绝对不要使用）

\`\`\`verilog          ← 错误：缺少文件名
\`\`\`verilog src/uart.v  ← 错误：缺少冒号
\`\`\`verilog: src/uart.v ← 错误：冒号后有空格

## ✅ 正确格式

\`\`\`verilog:src/uart.v  ← 正确

## 📋 响应结构示例

用户: "请用verilog写一个UART电路，要求8bit数据位"

你的回答应该这样：
"""
我来创建一个UART模块，支持8位数据传输：

\`\`\`verilog:src/uart.v
module uart (
  input wire clk,
  input wire reset,
  input wire [7:0] tx_data,
  input wire tx_start,
  output reg tx,
  output wire tx_busy,
  input wire rx,
  output reg [7:0] rx_data,
  output reg rx_valid
);

parameter BAUD_RATE = 115200;
parameter CLOCK_FREQ = 50000000;

// Implementation here...

endmodule
\`\`\`

这个UART模块实现了：
1. 8位数据传输
2. 可配置波特率
3. 发送和接收功能
"""

## 支持的语言标识符

### HDL语言（优先使用）
- verilog - Verilog HDL
- systemverilog - SystemVerilog
- vhdl - VHDL

### 其他语言
- python, c, cpp, 
- json, yaml, toml, xml
- bash, sh, powershell

## 作为genRTL助手，你应该：
1. 遵循业界Verilog/SystemVerilog编码规范
2. 提供清晰的注释和文档
3. 考虑可综合性和时序
4. 使用合适的文件命名规范
5. **必须严格遵守代码输出格式，否则前端无法正确显示**
6. **生成完整、可运行的代码实现，不要省略关键部分，包括所有逻辑和状态机**
7. **如果任务需要多个步骤，必须完成所有步骤，不要中途停止**


## 💡 代码完整性要求

❌ **不要这样做**（不完整）：
\`\`\`verilog:src/uart.v
module uart(...);
  // Implementation here...  ← 这是不完整的！
endmodule
\`\`\`

✅ **必须这样做**（完整实现）：
\`\`\`verilog:src/uart.v
module uart(
  input wire clk,
  input wire reset,
  input wire [7:0] tx_data,
  input wire tx_start,
  output reg tx,
  output wire tx_busy
);

parameter BAUD_RATE = 115200;
parameter CLOCK_FREQ = 50000000;
localparam BAUD_DIVISOR = CLOCK_FREQ / BAUD_RATE;

// 完整的发送状态机
reg [2:0] tx_state;
reg [15:0] baud_counter;
reg [3:0] bit_counter;
// ... 所有必要的寄存器和逻辑

always @(posedge clk or posedge reset) begin
  if (reset) begin
    // 完整的复位逻辑
  end else begin
    // 完整的状态机实现
    case (tx_state)
      // 所有状态的完整实现
    endcase
  end
end

endmodule
\`\`\`
**关键：用户要求实现功能时，必须提供完整、可综合、可测试的代码，不要留空或省略！**

绝对禁止这样做：禁止将已输出或修改的代码重复再以确认的方式输出一遍。

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
