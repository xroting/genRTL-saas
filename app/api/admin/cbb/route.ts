// CBB Admin API - 管理员 CBB 包管理
// 用于添加、更新、删除 CBB 包

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CBBRegistry } from "@/lib/cbb";
import type { CBBManifest } from "@/lib/cbb/types";

/**
 * 创建 Service Role Supabase 客户端
 */
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Admin 邮箱白名单（可以从环境变量或数据库配置）
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);

/**
 * 验证是否为管理员
 */
async function verifyAdmin(request: NextRequest): Promise<{
  isAdmin: boolean;
  userId?: string;
  error?: string;
}> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, error: "未授权访问" };
  }

  // 检查是否为管理员
  const isAdmin =
    ADMIN_EMAILS.includes(user.email || "") ||
    user.user_metadata?.role === "admin";

  if (!isAdmin) {
    return { isAdmin: false, userId: user.id, error: "需要管理员权限" };
  }

  return { isAdmin: true, userId: user.id };
}

// CBB Manifest 验证 Schema
const CBBManifestSchema = z.object({
  id: z.string().min(1, "CBB ID 不能为空"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "版本号必须符合语义化版本格式"),
  name: z.string().min(1, "名称不能为空"),
  description: z.string().optional(),
  tags: z.array(z.string()),
  entrypoints: z.object({
    rtl_top: z.string(),
    tb_top: z.string(),
    filelist_rtl: z.string(),
    filelist_tb: z.string(),
  }),
  compat: z.object({
    sv: z.string(),
    simulators: z.array(z.string()),
  }),
  price_usd: z.number().min(0, "价格不能为负数"),
  sha256: z.string().length(64, "SHA256 必须是 64 个字符"),
  author: z.string().optional(),
  license: z.string().optional(),
});

// 创建 CBB 请求 Schema
const CreateCBBRequestSchema = z.object({
  manifest: CBBManifestSchema,
  storage_path: z.string().min(1, "存储路径不能为空"),
  file_size: z.number().positive("文件大小必须为正数"),
  is_public: z.boolean().optional().default(true),
});

// 更新 CBB 请求 Schema
const UpdateCBBRequestSchema = z.object({
  cbb_id: z.string().min(1),
  version: z.string().min(1),
  updates: z.object({
    is_active: z.boolean().optional(),
    is_public: z.boolean().optional(),
    price_usd: z.number().min(0).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

/**
 * GET - 获取 CBB 列表（管理员视图，包含非公开的）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.userId ? 403 : 401 }
      );
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    const includeInactive = searchParams.get("include_inactive") === "true";
    const cbbId = searchParams.get("cbb_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("cbb_registry")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    if (cbbId) {
      query = query.eq("cbb_id", cbbId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("[CBB Admin] Failed to fetch CBBs:", error);
      return NextResponse.json({ error: "获取 CBB 列表失败" }, { status: 500 });
    }

    // 获取总数
    const { count } = await supabase
      .from("cbb_registry")
      .select("*", { count: "exact", head: true })
      .eq("is_active", includeInactive ? undefined : true);

    return NextResponse.json({
      success: true,
      items: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[CBB Admin GET] Error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

/**
 * POST - 创建新的 CBB 包
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.userId ? 403 : 401 }
      );
    }

    // 解析并验证请求体
    const body = await request.json();
    const parseResult = CreateCBBRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "请求参数无效", details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { manifest, storage_path, file_size, is_public } = parseResult.data;

    // 检查是否已存在相同版本
    const existing = await CBBRegistry.getByIdAndVersion(
      manifest.id,
      manifest.version
    );
    if (existing) {
      return NextResponse.json(
        { error: `CBB ${manifest.id}@${manifest.version} 已存在` },
        { status: 409 }
      );
    }

    // 注册 CBB
    const result = await CBBRegistry.register({
      manifest: manifest as CBBManifest,
      storagePath: storage_path,
      fileSize: file_size,
      isPublic: is_public,
    });

    if (!result) {
      return NextResponse.json({ error: "创建 CBB 失败" }, { status: 500 });
    }

    console.log(
      `[CBB Admin] Created CBB: ${manifest.id}@${manifest.version} by admin ${adminCheck.userId}`
    );

    return NextResponse.json({
      success: true,
      cbb: result,
    });
  } catch (error) {
    console.error("[CBB Admin POST] Error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

/**
 * PATCH - 更新 CBB 包
 */
export async function PATCH(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.userId ? 403 : 401 }
      );
    }

    // 解析并验证请求体
    const body = await request.json();
    const parseResult = UpdateCBBRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "请求参数无效", details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { cbb_id, version, updates } = parseResult.data;

    // 检查 CBB 是否存在
    const existing = await CBBRegistry.getByIdAndVersion(cbb_id, version);
    if (!existing) {
      return NextResponse.json(
        { error: `CBB ${cbb_id}@${version} 不存在` },
        { status: 404 }
      );
    }

    const supabase = createServiceClient();

    // 构建更新数据
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active;
    }

    if (updates.is_public !== undefined) {
      updateData.is_public = updates.is_public;
    }

    // 如果需要更新 manifest 中的字段
    if (
      updates.price_usd !== undefined ||
      updates.description !== undefined ||
      updates.tags !== undefined
    ) {
      const manifest = existing.manifest as CBBManifest;
      if (updates.price_usd !== undefined) {
        manifest.price_usd = updates.price_usd;
      }
      if (updates.description !== undefined) {
        manifest.description = updates.description;
      }
      if (updates.tags !== undefined) {
        manifest.tags = updates.tags;
      }
      updateData.manifest = manifest;
    }

    const { data, error } = await supabase
      .from("cbb_registry")
      .update(updateData)
      .eq("cbb_id", cbb_id)
      .eq("version", version)
      .select()
      .single();

    if (error) {
      console.error("[CBB Admin] Failed to update CBB:", error);
      return NextResponse.json({ error: "更新 CBB 失败" }, { status: 500 });
    }

    console.log(
      `[CBB Admin] Updated CBB: ${cbb_id}@${version} by admin ${adminCheck.userId}`
    );

    return NextResponse.json({
      success: true,
      cbb: data,
    });
  } catch (error) {
    console.error("[CBB Admin PATCH] Error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

/**
 * DELETE - 停用 CBB 包（软删除）
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.userId ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cbbId = searchParams.get("cbb_id");
    const version = searchParams.get("version");

    if (!cbbId || !version) {
      return NextResponse.json(
        { error: "cbb_id 和 version 参数必填" },
        { status: 400 }
      );
    }

    // 检查 CBB 是否存在
    const existing = await CBBRegistry.getByIdAndVersion(cbbId, version);
    if (!existing) {
      return NextResponse.json(
        { error: `CBB ${cbbId}@${version} 不存在` },
        { status: 404 }
      );
    }

    // 停用（软删除）
    const success = await CBBRegistry.deactivate(cbbId, version);

    if (!success) {
      return NextResponse.json({ error: "停用 CBB 失败" }, { status: 500 });
    }

    console.log(
      `[CBB Admin] Deactivated CBB: ${cbbId}@${version} by admin ${adminCheck.userId}`
    );

    return NextResponse.json({
      success: true,
      message: `CBB ${cbbId}@${version} 已停用`,
    });
  } catch (error) {
    console.error("[CBB Admin DELETE] Error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

