import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createSupabaseServer();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
      },
    });

    if (error) {
      console.error("[Auth] Signup error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("[Auth] Signup successful:", data.user?.email);

    return NextResponse.json(
      {
        user: {
          id: data.user!.id,
          email: data.user!.email,
          name: data.user!.user_metadata?.name || data.user!.email,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
            }
          : null,
        message: data.session
          ? "Account created successfully"
          : "Please check your email to confirm your account",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Auth] Unexpected signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

