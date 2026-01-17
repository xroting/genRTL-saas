import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { origin } = new URL(req.url);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    });

    if (error) {
      console.error("[Auth] Google OAuth error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("[Auth] Unexpected OAuth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

