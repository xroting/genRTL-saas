import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTeamForUser } from "@/lib/db/queries";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/models - 返回可用的AI模型列表
 * 
 * 根据用户的订阅计划返回不同的模型列表：
 * - Free/Hobby: 仅 Claude Haiku 3
 * - Pro/Ultra: Claude Sonnet 4 + Haiku 3
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📥 Received models list request");

    // Authentication check
    const authHeader = req.headers.get("authorization");
    let user = null;
    let supa;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log(`[Auth Debug] Token received (first 50 chars): ${token.substring(0, 50)}...`);
      
      const { createClient } = await import("@supabase/supabase-js");
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user: tokenUser }, error: authError } = await authClient.auth.getUser(token);
      
      console.log(`[Auth Debug] getUser result: user=${tokenUser ? tokenUser.email : 'null'}, error=${authError ? authError.message : 'none'}`);
      
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

    // 如果用户未登录，返回默认的免费模型列表（避免401无限循环）
    let planName = 'free';
    
    if (user) {
      console.log(`✅ User authenticated: ${user.email}`);
      // 获取用户的team信息以确定订阅计划
      let team = await getTeamForUser(user, supa);
      planName = team?.plan_name || 'free';
    } else {
      console.log("⚠️ Unauthenticated request - returning free tier models");
    }

    console.log(`📋 User plan: ${planName}`);

    // 定义所有可用的模型
    const allModels = [
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        provider: "anthropic",
        description: "Most capable model for complex tasks",
        context_window: 200000,
        max_output_tokens: 16384,
        requires_plan: ["pro", "ultra", "ultra_plus"],
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        provider: "anthropic",
        description: "Balanced performance and speed",
        context_window: 200000,
        max_output_tokens: 8192,
        requires_plan: ["hobby", "pro", "ultra", "ultra_plus"],
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude Haiku 3",
        provider: "anthropic",
        description: "Fast and efficient for simple tasks",
        context_window: 200000,
        max_output_tokens: 4096,
        requires_plan: ["free", "hobby", "pro", "ultra", "ultra_plus"],
      },
    ];

    // 根据用户计划过滤可用模型
    const availableModels = allModels.filter(model => 
      model.requires_plan.includes(planName)
    );

    console.log(`✅ Available models for ${planName}: ${availableModels.length}`);

    return NextResponse.json(
      {
        models: availableModels.map(m => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          description: m.description,
          context_window: m.context_window,
          max_output_tokens: m.max_output_tokens,
        })),
        user_plan: planName,
        authenticated: !!user, // 添加认证状态
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch models", details: error?.message || String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
