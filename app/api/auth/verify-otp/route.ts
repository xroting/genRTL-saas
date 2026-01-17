import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    // Verify OTP - use 'magiclink' type for 6-digit OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "magiclink", // Changed from "email" to "magiclink" for 6-digit OTP
    });

    if (error) {
      console.error("[Auth] Verify OTP error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[Auth] OTP verified successfully for:", email);

    // Enable CORS for VS Code extension
    const response = NextResponse.json({
      user: data.user,
      session: data.session,
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    console.error("[Auth] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

