import { NextRequest, NextResponse } from "next/server";

// CORS headers for VS Code extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// In-memory store for temporary login sessions
// In production, use Redis or a database
const loginSessions = new Map<string, { token: string; user: any; timestamp: number }>();

// Clean up old sessions (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of loginSessions.entries()) {
    if (now - session.timestamp > 10 * 60 * 1000) {
      loginSessions.delete(sessionId);
    }
  }
}, 60000); // Clean every minute

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, token, user } = await req.json();

    if (!sessionId || !token || !user) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Store the session
    loginSessions.set(sessionId, {
      token,
      user,
      timestamp: Date.now()
    });

    console.log("[LoginSession] Stored session:", sessionId);

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[LoginSession] Store error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" }, 
        { status: 400, headers: corsHeaders }
      );
    }

    const session = loginSessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { headers: corsHeaders }
      );
    }

    // Delete the session after retrieving (one-time use)
    loginSessions.delete(sessionId);
    console.log("[LoginSession] Retrieved and deleted session:", sessionId);

    return NextResponse.json(
      {
        authenticated: true,
        token: session.token,
        user: session.user
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[LoginSession] Retrieve error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

