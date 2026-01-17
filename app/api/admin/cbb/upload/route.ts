// CBB Upload API - 管理员上传 CBB 包文件
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import crypto from "crypto";

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

// Admin 邮箱白名单
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);

/**
 * 验证是否为管理员
 */
async function verifyAdmin(): Promise<{
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

  const isAdmin =
    ADMIN_EMAILS.includes(user.email || "") ||
    user.user_metadata?.role === "admin";

  if (!isAdmin) {
    return { isAdmin: false, userId: user.id, error: "需要管理员权限" };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * 计算文件的 SHA256
 */
function calculateSHA256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * POST - 上传 CBB 包文件
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin();
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.userId ? 403 : 401 }
      );
    }

    // 解析 multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const cbbId = formData.get("cbb_id") as string | null;
    const version = formData.get("version") as string | null;

    if (!file || !cbbId || !version) {
      return NextResponse.json(
        { error: "file, cbb_id, version 参数必填" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = [
      "application/zip",
      "application/x-tar",
      "application/gzip",
      "application/x-gzip",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(zip|tar\.gz|tgz)$/i)) {
      return NextResponse.json(
        { error: "只支持 .zip, .tar.gz, .tgz 格式的文件" },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 100MB）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件大小不能超过 100MB" },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 计算 SHA256
    const sha256 = calculateSHA256(buffer);

    // 构建存储路径
    const extension = file.name.split(".").pop() || "zip";
    const storagePath = `${cbbId}/${version}/${cbbId}-${version}.${extension}`;

    // 上传到 Supabase Storage
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from("cbb-packages")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true, // 允许覆盖
      });

    if (error) {
      console.error("[CBB Upload] Storage error:", error);
      return NextResponse.json(
        { error: `上传失败: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(
      `[CBB Upload] Successfully uploaded ${cbbId}@${version} by admin ${adminCheck.userId}, size: ${file.size}, sha256: ${sha256}`
    );

    return NextResponse.json({
      success: true,
      storage_path: storagePath,
      file_size: file.size,
      sha256,
      content_type: file.type,
    });
  } catch (error) {
    console.error("[CBB Upload] Error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

