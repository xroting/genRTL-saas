import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    // Send OTP to email (Supabase default is 6 digits)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Allow auto-signup if user doesn't exist
        emailRedirectTo: undefined, // Prevent redirect, we only want OTP
      },
    });

    if (error) {
      console.error("[Auth] Send OTP error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[Auth] 6-digit OTP sent successfully to:", email);

    return NextResponse.json({ 
      success: true,
      message: "Verification code sent to your email" 
    });
  } catch (error) {
    console.error("[Auth] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

