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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createSupabaseServer();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Auth] Login error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 401, headers: corsHeaders }
      );
    }

    console.log("[Auth] Login successful:", data.user?.email);

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Auth] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

