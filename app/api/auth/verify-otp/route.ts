import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCorsHeaders } from "@/lib/security/cors";

export async function POST(req: NextRequest) {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
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

    return NextResponse.json({
      user: data.user,
      session: data.session,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("[Auth] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

