import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Check if there's a recent login session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sb-access-token");
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    // Return session info
    return NextResponse.json({
      authenticated: true,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("[Auth] Session check error:", error);
    return NextResponse.json({ authenticated: false });
  }
}

